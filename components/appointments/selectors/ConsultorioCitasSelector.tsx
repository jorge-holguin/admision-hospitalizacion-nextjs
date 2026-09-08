'use client'

import React, { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"
import { consultorioServerService } from "@/services/master-tables/consultorioService"

interface ConsultorioItem {
  CONSULTORIO: string
  NOMBRE: string
  ESPECIALIDAD?: string
  ACTIVO?: string
  TIPO?: string
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
  const [loading, setLoading] = useState(false)

  const load = async (q: string, signal?: AbortSignal): Promise<ConsultorioItem[]> => {
    try {
      setLoading(true)
      const result = await consultorioServerService.getConsultorios(1, 100, { tipo: ['C', 'D'], search: q })
      if (signal?.aborted) return []
      const mapped = result.data.map((item: any) => ({
        CONSULTORIO: String(item.CONSULTORIO || item.consultorio || '').trim(),
        NOMBRE: String(item.NOMBRE || item.nombre || '').trim(),
        ESPECIALIDAD: item.ESPECIALIDAD || item.especialidad,
        ACTIVO: item.ACTIVO ?? item.activo,
        TIPO: item.TIPO || item.tipo,
      }))
      setItems(mapped)
      return mapped
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error('Error cargando consultorios:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const ctrl = new AbortController()
    
    // Cargar lista de consultorios desde master-tables
    const t = setTimeout(() => load(search, ctrl.signal), 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [open, search])

  // Load selected value on mount so the display shows "code - name" before opening
  useEffect(() => {
    if (value === 'all' || !value) return
    const ctrl = new AbortController()
    load(value.trim(), ctrl.signal).then((loaded) => {
      const found = loaded.find(i => i.CONSULTORIO === value)
      if (found && onConsultorioDataChange) {
        onConsultorioDataChange(found)
      }
    })
    return () => ctrl.abort()
  }, [value])

  // No carga inicial para evitar duplicados en StrictMode; se carga al abrir

  const display = useMemo(() => {
    if (value === "all" || !value) return "Seleccionar consultorio..."
    
    const found = items.find(i => i.CONSULTORIO === value)
    return found ? `${found.CONSULTORIO} - ${found.NOMBRE}` : value
  }, [value, items])

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
                    onConsultorioDataChange?.(null)
                    setOpen(false)
                  }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === "all" ? "opacity-100" : "opacity-0"}`} />
                  Todos los consultorios
                </CommandItem>
                {items
                  .filter(c => c.NOMBRE?.toLowerCase().includes(search.toLowerCase()) || c.CONSULTORIO?.toLowerCase().includes(search.toLowerCase()))
                  .map((c) => (
                  <CommandItem
                    key={`${c.CONSULTORIO}-${c.NOMBRE}`}
                    value={`${c.CONSULTORIO} ${c.NOMBRE}`}
                    onSelect={() => {
                      onChange(c.CONSULTORIO)
                      onConsultorioDataChange?.(c)
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
