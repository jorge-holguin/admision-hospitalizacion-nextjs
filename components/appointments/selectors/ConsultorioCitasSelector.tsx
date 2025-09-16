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
}

interface ConsultorioCitasSelectorProps {
  label?: string
  value: string | "all"
  onChange: (value: string | "all") => void
  className?: string
}

export function ConsultorioCitasSelector({ label = "Consultorio", value, onChange, className = "" }: ConsultorioCitasSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<ConsultorioItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = async (q: string, signal?: AbortSignal) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/consultorio?tipo=C&search=${encodeURIComponent(q)}`, { signal })
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
    const t = setTimeout(() => load(search, ctrl.signal), 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [open, search])

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
                      onChange(c.CONSULTORIO) // Enviar el código en lugar del nombre
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
