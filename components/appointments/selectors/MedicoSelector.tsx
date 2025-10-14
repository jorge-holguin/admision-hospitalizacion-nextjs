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
}

interface MedicoSelectorProps {
  label?: string
  value: string | "all"
  onChange: (value: string | "all") => void
  className?: string
  // consultorio is intentionally ignored to keep this selector independent
  consultorio?: string | "all"
}

function buildNombre(m: MedicoItem): string {
  if (m.NOMBRE && m.NOMBRE.trim().length > 0) return m.NOMBRE
  const nombres = [m.NOMBRES, m.APATERNO, m.AMATERNO].filter(Boolean).join(" ").trim()
  if (nombres.length > 0) return nombres
  return m.MEDICO ?? ""
}

export function MedicoSelector({ label = "Médico", value, onChange, className = "", consultorio = "all" }: MedicoSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<MedicoItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = async (q: string, signal?: AbortSignal) => {
    try {
      setLoading(true)
      const qs = new URLSearchParams()
      if (q) qs.set("search", q)
      const res = await fetch(`/api/master-tables/medicos/search?${qs.toString()}` , { signal })
      if (!res.ok) return
      const data = await res.json()
      const list: MedicoItem[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
      setItems(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const ctrl = new AbortController()
    const t = setTimeout(() => load(search, ctrl.signal), 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [open, search])

  // No carga inicial para evitar duplicados causados por StrictMode; se carga al abrir

  const display = useMemo(() => {
    if (value === "all" || !value) return "Seleccionar médico..."
    const found = items.find(m => m.MEDICO === value)
    return found ? `${found.MEDICO} - ${buildNombre(found)}` : value
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
                {items
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
