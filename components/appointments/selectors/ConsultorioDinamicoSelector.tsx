'use client'

import React, { useEffect, useMemo, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown, Check, Loader2 } from "lucide-react"

interface ConsultorioDisponible {
  consultorio: string
  consultorioNombre: string
  especialidad?: string
}

interface ConsultorioDinamicoSelectorProps {
  label?: string
  value: string | "all"
  onChange: (value: string | "all") => void
  onConsultorioDataChange?: (data: { CONSULTORIO: string; NOMBRE: string; ESPECIALIDAD?: string } | null) => void
  onFreeTextSearch?: (searchText: string) => void  // Callback para búsqueda por texto libre
  className?: string
  selectedDate: Date
  turno?: string
  estado?: string
}

/**
 * Selector de consultorios que carga dinámicamente los consultorios 
 * que tienen citas disponibles para la fecha seleccionada.
 * 
 * Usa el endpoint: /api/cita/buscar/nombreConsultorio?desde=...&hasta=...
 * (sin el parámetro consultorio para obtener todos)
 */
export function ConsultorioDinamicoSelector({ 
  label = "Consultorio", 
  value, 
  onChange, 
  onConsultorioDataChange,
  onFreeTextSearch, 
  className = "", 
  selectedDate,
  turno = "ALL",
  estado = "1"
}: ConsultorioDinamicoSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [consultorios, setConsultorios] = useState<ConsultorioDisponible[]>([])
  const [loading, setLoading] = useState(false)
  const [loadedForDate, setLoadedForDate] = useState<string | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastFreeTextSearch, setLastFreeTextSearch] = useState<string | null>(null)

  // Formatear fecha como dd/MM/yyyy
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Cargar consultorios disponibles para la fecha
  const loadConsultorios = useCallback(async (signal?: AbortSignal) => {
    const dateStr = formatDate(selectedDate)
    
    // Evitar recargar si ya cargamos para esta fecha
    if (loadedForDate === dateStr && consultorios.length > 0) {
      return
    }
    
    try {
      setLoading(true)
      const apiUrl = import.meta.env.VITE_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011'
      
      const params = new URLSearchParams()
      params.set('desde', dateStr)
      params.set('hasta', dateStr)
      
      // Solo agregar turnoConsulta si no es ALL
      if (turno !== 'ALL') {
        const turnoConsulta = turno === 'MAÑANA' ? 'M' : 'T'
        params.set('turnoConsulta', turnoConsulta)
      }
      
      // Solo agregar estado si no es 'all'
      if (estado && estado !== 'all') {
        params.set('estado', estado)
      }
      
      params.set('page', '0')
      params.set('size', '500') // Obtener suficientes para extraer consultorios únicos
      
      // NO incluir el parámetro 'consultorio' para obtener todas las citas del día
      const url = `${apiUrl}/cita/buscar/nombreConsultorio?${params.toString()}`
      const res = await fetch(url, { signal })
      
      if (!res.ok) {
        setConsultorios([])
        return
      }
      
      const data = await res.json()
      
      // Extraer consultorios únicos de los resultados
      const consultoriosMap = new Map<string, ConsultorioDisponible>()
      const list = Array.isArray(data?.content) ? data.content : 
                   Array.isArray(data) ? data : []
      
      list.forEach((item: any) => {
        const consultorioCode = item.consultorio?.trim()
        if (consultorioCode && !consultoriosMap.has(consultorioCode)) {
          consultoriosMap.set(consultorioCode, {
            consultorio: consultorioCode,
            consultorioNombre: item.consultorioNombre?.trim() || item.nombreConsultorio?.trim() || consultorioCode,
            especialidad: item.especialidad?.trim() || item.especialidadSolicitud?.trim()
          })
        }
      })
      
      // Ordenar alfabéticamente por nombre
      const sortedConsultorios = Array.from(consultoriosMap.values())
        .sort((a, b) => a.consultorioNombre.localeCompare(b.consultorioNombre))
      setConsultorios(sortedConsultorios)
      setLoadedForDate(dateStr)
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('❌ ConsultorioDinamicoSelector: Error:', error)
      }
      setConsultorios([])
    } finally {
      setLoading(false)
    }
  }, [selectedDate, turno, estado, loadedForDate, consultorios.length])

  // Cargar al abrir el popover o cuando cambia la fecha
  useEffect(() => {
    if (!open) return
    
    const ctrl = new AbortController()
    loadConsultorios(ctrl.signal)
    
    return () => ctrl.abort()
  }, [open, loadConsultorios])

  // Recargar cuando cambia la fecha, turno o estado
  useEffect(() => {
    const dateStr = formatDate(selectedDate)
    if (loadedForDate !== dateStr) {
      setLoadedForDate(null) // Forzar recarga
    }
  }, [selectedDate, turno, estado])

  // Debounce para búsqueda por texto libre - solo ejecutar una vez por búsqueda
  useEffect(() => {
    // Limpiar timer anterior
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Si el search está vacío, no hacer nada
    if (!search || search.trim().length === 0) {
      return
    }

    // Si el search coincide exactamente con un consultorio de la lista, no activar búsqueda libre
    const exactMatch = consultorios.some(c => 
      c.consultorioNombre.toLowerCase() === search.toLowerCase() ||
      c.consultorio.toLowerCase() === search.toLowerCase()
    )
    if (exactMatch) {
      return
    }

    // Si ya hicimos esta búsqueda antes, no repetir
    if (lastFreeTextSearch === search.trim()) {
      return
    }

    // Configurar nuevo timer para búsqueda por texto libre
    const timer = setTimeout(() => {
      if (onFreeTextSearch) {
        onFreeTextSearch(search)
        setLastFreeTextSearch(search.trim()) // Guardar que ya hicimos esta búsqueda
      }
    }, 500) // 500ms de debounce solo al inicio

    setDebounceTimer(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [search, consultorios, onFreeTextSearch, lastFreeTextSearch])

  // Filtrar consultorios por búsqueda
  const filteredConsultorios = useMemo(() => {
    if (!search) return consultorios
    const searchLower = search.toLowerCase()
    return consultorios.filter(c => 
      c.consultorioNombre.toLowerCase().includes(searchLower) ||
      c.consultorio.toLowerCase().includes(searchLower)
    )
  }, [consultorios, search])

  // Texto a mostrar en el botón
  const display = useMemo(() => {
    if (value === "all" || !value) return "Todos los consultorios"
    const found = consultorios.find(c => c.consultorio === value)
    return found ? found.consultorioNombre : value
  }, [value, consultorios])

  return (
    <div className={className}>
      {label && <Label className="text-sm font-semibold text-gray-700">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate block text-left max-w-[calc(100%-1.5rem)]">{display}</span>
            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder='Buscar consultorio (ej: "PSICO" para todos los de psicología)...' 
              value={search}
              onValueChange={setSearch}
            />
            {search && search.trim().length > 0 && (
              <div className="px-3 py-1.5 text-xs text-gray-500 border-b">
                💡 Escribe y espera para buscar todos los consultorios que contengan "{search}"
              </div>
            )}
            <CommandList>
              {loading && (
                <div className="px-3 py-2 text-sm text-gray-500 flex flex-wrap items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando consultorios...
                </div>
              )}
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onChange("all")
                    onConsultorioDataChange?.(null)
                    setSearch("")  // Limpiar campo de búsqueda
                    setLastFreeTextSearch(null)  // Resetear búsqueda libre
                    setOpen(false)
                  }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === "all" ? "opacity-100" : "opacity-0"}`} />
                  Todos los consultorios
                </CommandItem>
                {filteredConsultorios.map((c) => (
                  <CommandItem
                    key={c.consultorio}
                    value={c.consultorioNombre}
                    onSelect={() => {
                      onChange(c.consultorio)
                      onConsultorioDataChange?.({
                        CONSULTORIO: c.consultorio,
                        NOMBRE: c.consultorioNombre,
                        ESPECIALIDAD: c.especialidad
                      })
                      setSearch(c.consultorioNombre)  // Autocompletar con el nombre completo
                      setLastFreeTextSearch(null)  // Resetear búsqueda libre
                      setOpen(false)
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${value === c.consultorio ? "opacity-100" : "opacity-0"}`} />
                    {c.consultorioNombre}
                  </CommandItem>
                ))}
              </CommandGroup>
              {!loading && filteredConsultorios.length === 0 && (
                <CommandEmpty>
                  {consultorios.length === 0 
                    ? "No hay consultorios con citas para esta fecha"
                    : "No se encontraron consultorios"
                  }
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
