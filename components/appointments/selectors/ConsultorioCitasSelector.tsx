'use client'

import React, { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"

interface ConsultorioItem {
  CONSULTORIO: string
  NOMBRE: string
  ESPECIALIDAD?: string
  ACTIVO?: string
}

// Interfaz para la respuesta de la API buscar/nombreConsultorio
interface ConsultorioSearchItem {
  consultorio: string
  nombreConsultorio: string
  especialidad?: string
}

interface ConsultorioCitasSelectorProps {
  label?: string
  value: string | "all"
  onChange: (value: string | "all") => void
  onConsultorioDataChange?: (data: ConsultorioItem | null) => void  // Nuevo callback para pasar datos completos
  className?: string
  selectedDate?: Date  // Fecha seleccionada para buscar consultorios
  turno?: string  // Turno seleccionado (M, T o ALL)
  estado?: string  // Estado de cita (1 = NO OTORGADO, etc.)
}

export function ConsultorioCitasSelector({ label = "Consultorio", value, onChange, onConsultorioDataChange, className = "", selectedDate, turno = "ALL", estado = "1" }: ConsultorioCitasSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<ConsultorioItem[]>([])
  const [searchItems, setSearchItems] = useState<ConsultorioSearchItem[]>([])
  const [loading, setLoading] = useState(false)

  // Buscar consultorios por nombre usando la nueva API
  const searchByName = async (searchTerm: string, signal?: AbortSignal) => {
    if (!selectedDate || !searchTerm || searchTerm.length < 2) {
      setSearchItems([])
      return
    }
    
    try {
      setLoading(true)
      const dateStr = selectedDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011'
      
      // Construir URL con parámetros condicionales
      const params = new URLSearchParams()
      params.set('desde', dateStr)
      params.set('hasta', dateStr)
      params.set('consultorio', searchTerm)
      
      // Solo agregar turnoConsulta si no es ALL
      if (turno !== 'ALL') {
        const turnoConsulta = turno === 'MAÑANA' ? 'M' : 'T'
        params.set('turnoConsulta', turnoConsulta)
      }
      
      // Solo agregar estado si no es 'all' y no está vacío
      if (estado && estado !== 'all' && estado !== '') {
        params.set('estado', estado)
      }
      
      params.set('page', '0')
      params.set('size', '20')
      
      const url = `${apiUrl}/cita/buscar/nombreConsultorio?${params.toString()}`
      
      console.log('🔍 ConsultorioCitasSelector: Buscando por nombre:', url)
      const res = await fetch(url, { signal })
      if (!res.ok) {
        console.warn('⚠️ ConsultorioCitasSelector: Error al buscar:', res.status)
        return
      }
      const data = await res.json()
      console.log('✅ ConsultorioCitasSelector: Resultados:', data)
      
      // Extraer consultorios únicos de los resultados
      const consultoriosMap = new Map<string, ConsultorioSearchItem>()
      if (Array.isArray(data?.content)) {
        data.content.forEach((item: any) => {
          if (item.consultorio && !consultoriosMap.has(item.consultorio.trim())) {
            consultoriosMap.set(item.consultorio.trim(), {
              consultorio: item.consultorio.trim(),
              nombreConsultorio: item.consultorioNombre?.trim() || item.nombreConsultorio?.trim() || item.consultorio.trim(),
              especialidad: item.especialidad?.trim()
            })
          }
        })
      } else if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.consultorio && !consultoriosMap.has(item.consultorio.trim())) {
            consultoriosMap.set(item.consultorio.trim(), {
              consultorio: item.consultorio.trim(),
              nombreConsultorio: item.consultorioNombre?.trim() || item.nombreConsultorio?.trim() || item.consultorio.trim(),
              especialidad: item.especialidad?.trim()
            })
          }
        })
      }
      
      setSearchItems(Array.from(consultoriosMap.values()))
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('❌ ConsultorioCitasSelector: Error:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const load = async (q: string, signal?: AbortSignal) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/master-tables/consultorios/search?tipo=C&search=${encodeURIComponent(q)}`, { signal })
      if (!res.ok) return
      const data = await res.json()
      setItems(Array.isArray(data?.items) ? data.items : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const ctrl = new AbortController()
    
    // Si hay selectedDate y texto de búsqueda, usar la API de búsqueda por nombre
    if (selectedDate && search.length >= 2) {
      const t = setTimeout(() => searchByName(search, ctrl.signal), 300)
      return () => {
        clearTimeout(t)
        ctrl.abort()
      }
    }
    
    // Si no hay búsqueda o no hay fecha, cargar lista tradicional
    const t = setTimeout(() => load(search, ctrl.signal), 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [open, search, selectedDate, turno, estado])

  // No carga inicial para evitar duplicados en StrictMode; se carga al abrir

  const display = useMemo(() => {
    if (value === "all" || !value) return "Seleccionar consultorio..."
    
    // Buscar en resultados de búsqueda por nombre
    const foundSearch = searchItems.find(i => i.consultorio === value)
    if (foundSearch) {
      return foundSearch.nombreConsultorio
    }
    
    // Fallback a lista tradicional
    const found = items.find(i => i.CONSULTORIO === value)
    return found ? `${found.CONSULTORIO} - ${found.NOMBRE}` : value
  }, [value, items, searchItems])

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
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Buscar consultorio..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading && <div className="px-3 py-2 text-sm text-gray-500">Cargando...</div>}
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onChange("all")
                    onConsultorioDataChange?.(null)  // Limpiar datos cuando se selecciona "Todos"
                    setOpen(false)
                  }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === "all" ? "opacity-100" : "opacity-0"}`} />
                  Todos los consultorios
                </CommandItem>
                {/* Mostrar resultados de búsqueda por nombre si hay */}
                {selectedDate && search.length >= 2 && searchItems.map((c) => (
                  <CommandItem
                    key={`search-${c.consultorio}`}
                    value={c.nombreConsultorio}
                    onSelect={() => {
                      onChange(c.consultorio)
                      onConsultorioDataChange?.({
                        CONSULTORIO: c.consultorio,
                        NOMBRE: c.nombreConsultorio,
                        ESPECIALIDAD: c.especialidad
                      })
                      setOpen(false)
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${value === c.consultorio ? "opacity-100" : "opacity-0"}`} />
                    {c.nombreConsultorio}
                  </CommandItem>
                ))}
                {/* Fallback: mostrar lista tradicional si no hay búsqueda activa */}
                {(!selectedDate || search.length < 2) && items
                  .filter(c => c.NOMBRE?.toLowerCase().includes(search.toLowerCase()) || c.CONSULTORIO?.toLowerCase().includes(search.toLowerCase()))
                  .map((c) => (
                  <CommandItem
                    key={`${c.CONSULTORIO}-${c.NOMBRE}`}
                    value={`${c.CONSULTORIO} ${c.NOMBRE}`}
                    onSelect={() => {
                      onChange(c.CONSULTORIO) // Enviar el código en lugar del nombre
                      onConsultorioDataChange?.(c)  // Pasar el objeto completo con ESPECIALIDAD
                      setOpen(false)
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${value === c.CONSULTORIO ? "opacity-100" : "opacity-0"}`} />
                    {c.CONSULTORIO} - {c.NOMBRE}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandEmpty>No se encontraron consultorios</CommandEmpty>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
