"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"

interface MedicoItem {
  MEDICO?: string
  NOMBRE?: string
  NOMBRES?: string
  APATERNO?: string
  AMATERNO?: string
  ESPECIALIDAD?: string
}

// Interfaz para la respuesta de la API medicos-consultorios
interface MedicoConsultorioItem {
  medico: string
  nombreMedico: string
  consultorio: string
  nombreConsultorio: string
}

interface MedicoSelectorProps {
  label?: string
  value: string | "all"
  onChange: (value: string | "all", consultorio?: string) => void
  className?: string
  // consultorio is intentionally ignored to keep this selector independent
  consultorio?: string | "all"
  especialidad?: string | null  // Filtrar médicos por especialidad del consultorio
  availableMedicos?: Array<{codigo: string, nombre: string}>  // Lista filtrada de médicos disponibles
  selectedDate?: Date  // Fecha seleccionada para filtrar médicos-consultorios
}

function buildNombre(m: MedicoItem): string {
  if (m.NOMBRE && m.NOMBRE.trim().length > 0) return m.NOMBRE
  const nombres = [m.NOMBRES, m.APATERNO, m.AMATERNO].filter(Boolean).join(" ").trim()
  if (nombres.length > 0) return nombres
  return m.MEDICO ?? ""
}

export function MedicoSelector({ label = "Médico", value, onChange, className = "", consultorio = "all", especialidad, availableMedicos, selectedDate }: MedicoSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<MedicoItem[]>([])
  const [medicoConsultorioItems, setMedicoConsultorioItems] = useState<MedicoConsultorioItem[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar médicos desde la nueva API medicos-consultorios
  const loadMedicosConsultorios = async (fecha: Date, signal?: AbortSignal) => {
    try {
      setLoading(true)
      const dateStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011'
      const url = `${apiUrl}/cita/medicos-consultorios?desde=${encodeURIComponent(dateStr)}&hasta=${encodeURIComponent(dateStr)}`
      
      console.log('🔍 MedicoSelector: Cargando médicos-consultorios:', url)
      const res = await fetch(url, { signal })
      if (!res.ok) {
        console.warn('⚠️ MedicoSelector: Error al cargar médicos-consultorios:', res.status)
        return
      }
      const data: MedicoConsultorioItem[] = await res.json()
      console.log('✅ MedicoSelector: Médicos-consultorios cargados:', data.length)
      setMedicoConsultorioItems(data)
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('❌ MedicoSelector: Error:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const load = async (q: string, signal?: AbortSignal) => {
    try {
      setLoading(true)
      const qs = new URLSearchParams()
      if (q) qs.set("search", q)
      if (especialidad) qs.set("especialidad", especialidad)  // Filtrar por especialidad si existe
      const res = await fetch(`/api/master-tables/medicos/search?${qs.toString()}` , { signal })
      if (!res.ok) return
      const data = await res.json()
      const list: MedicoItem[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
      setItems(list)
    } finally {
      setLoading(false)
    }
  }

  // Si se proporciona selectedDate, usar la nueva API medicos-consultorios
  useEffect(() => {
    if (selectedDate) {
      const ctrl = new AbortController()
      loadMedicosConsultorios(selectedDate, ctrl.signal)
      return () => {
        ctrl.abort()
      }
    }
  }, [selectedDate])

  // Si se proporciona availableMedicos, usar esa lista en lugar de cargar desde API
  useEffect(() => {
    // Si tenemos selectedDate, usamos la API de medicos-consultorios
    if (selectedDate) return
    
    if (availableMedicos && availableMedicos.length > 0) {
      // Convertir la lista de médicos disponibles al formato MedicoItem
      const medicoItems: MedicoItem[] = availableMedicos.map(m => ({
        MEDICO: m.codigo,
        NOMBRE: m.nombre
      }))
      setItems(medicoItems)
      return
    }
    
    // Si no hay availableMedicos, cargar desde API como antes
    if (!open) return
    const ctrl = new AbortController()
    const t = setTimeout(() => load(search, ctrl.signal), 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [open, search, especialidad, availableMedicos, selectedDate])  // Recargar cuando cambie especialidad o availableMedicos

  // No carga inicial para evitar duplicados causados por StrictMode; se carga al abrir

  const display = useMemo(() => {
    if (value === "all" || !value) return "Seleccionar médico..."
    
    // Si usamos la API de medicos-consultorios
    if (selectedDate && medicoConsultorioItems.length > 0) {
      const found = medicoConsultorioItems.find(m => m.medico?.trim() === value?.trim())
      if (found) {
        return `${found.nombreMedico?.trim()} - ${found.nombreConsultorio?.trim()}`
      }
    }
    
    // Fallback a la lista de items tradicional
    const found = items.find(m => m.MEDICO === value)
    return found ? `${found.MEDICO} - ${buildNombre(found)}` : value
  }, [value, items, medicoConsultorioItems, selectedDate])

  return (
    <div className={className}>
      {label && <Label className="text-sm font-semibold text-gray-700">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between mt-1"
          >
            <span className="truncate block text-left max-w-[calc(100%-1.5rem)]">{display}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar médico..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading && <div className="px-3 py-2 text-sm text-gray-500">Cargando...</div>}
              <CommandEmpty>No se encontraron médicos</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onChange("all")
                    setOpen(false)
                  }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === "all" ? "opacity-100" : "opacity-0"}`} />
                  Todos los médicos
                </CommandItem>
                {/* Si usamos la API de medicos-consultorios */}
                {selectedDate && medicoConsultorioItems
                  .filter((m) => {
                    const searchLower = search.toLowerCase()
                    return m.nombreMedico?.toLowerCase().includes(searchLower) || 
                           m.nombreConsultorio?.toLowerCase().includes(searchLower) ||
                           m.medico?.toLowerCase().includes(searchLower)
                  })
                  .map((m, idx) => {
                    const codigo = m.medico?.trim() || ''
                    const displayText = `${m.nombreMedico?.trim()} - ${m.nombreConsultorio?.trim()}`
                    return (
                      <CommandItem
                        key={`${codigo}-${m.consultorio}-${idx}`}
                        value={displayText}
                        onSelect={() => {
                          onChange(codigo, m.consultorio?.trim()) // Enviar código y consultorio
                          setOpen(false)
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${value === codigo ? "opacity-100" : "opacity-0"}`} />
                        {displayText}
                      </CommandItem>
                    )
                  })}
                {/* Fallback: usar items tradicionales si no hay selectedDate */}
                {!selectedDate && items
                  .filter((m) => {
                    const nombre = buildNombre(m)
                    const codigo = m.MEDICO || ''
                    return nombre.toLowerCase().includes(search.toLowerCase()) || 
                           codigo.toLowerCase().includes(search.toLowerCase())
                  })
                  .map((m, idx) => {
                    const nombre = buildNombre(m)
                    const codigo = m.MEDICO || ''
                    return (
                      <CommandItem
                        key={`${codigo}-${idx}`}
                        value={`${codigo} ${nombre}`}
                        onSelect={() => {
                          onChange(codigo) // Enviar el código en lugar del nombre
                          setOpen(false)
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${value === codigo ? "opacity-100" : "opacity-0"}`} />
                        {codigo} - {nombre}
                      </CommandItem>
                    )
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
