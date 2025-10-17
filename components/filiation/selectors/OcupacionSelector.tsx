"use client"

import { useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOcupacion } from "@/contexts/filiation/OcupacionContext"

interface OcupacionSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function OcupacionSelector({
  value,
  onChange,
  placeholder = "Buscar ocupación...",
  disabled = false
}: OcupacionSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  // Usar contexto en lugar de estado local
  const { ocupaciones, loading } = useOcupacion()

  const filteredOcupaciones = (ocupaciones || []).filter(o =>
    o?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    o?.ocupacion?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOcupacion = (ocupaciones || []).find(o => o?.ocupacion?.trim() === value)
  const displayValue = selectedOcupacion 
    ? `(${selectedOcupacion.ocupacion.trim()}) - ${selectedOcupacion.nombre}`
    : value ? `(${value})` : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar ocupación..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Cargando..." : "No se encontraron ocupaciones"}
            </CommandEmpty>
            <CommandGroup>
              {filteredOcupaciones.map((ocupacion, index) => {
                const displayText = `(${ocupacion.ocupacion.trim()}) - ${ocupacion.nombre}`
                return (
                  <CommandItem
                    key={`${ocupacion.ocupacion}-${index}`}
                    value={displayText}
                    onSelect={() => {
                      onChange(ocupacion.ocupacion.trim())
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === ocupacion.ocupacion ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-normal">{displayText}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
