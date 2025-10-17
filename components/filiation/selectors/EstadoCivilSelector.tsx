"use client"

import { useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEstadoCivil } from "@/contexts/filiation/EstadoCivilContext"

interface EstadoCivilSelectorProps {
  value: string
  onChange: (value: string, reniec?: string | null) => void
  placeholder?: string
  disabled?: boolean
}

export function EstadoCivilSelector({
  value,
  onChange,
  placeholder = "Seleccionar estado civil...",
  disabled = false
}: EstadoCivilSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  // Usar contexto en lugar de estado local
  const { estadosCiviles, loading } = useEstadoCivil()

  const filteredEstadosCiviles = (estadosCiviles || []).filter(ec =>
    ec?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    ec?.estadoCivil?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedEstadoCivil = (estadosCiviles || []).find(ec => ec?.estadoCivil?.trim() === value)
  const displayValue = selectedEstadoCivil 
    ? `(${selectedEstadoCivil.estadoCivil.trim()}) - ${selectedEstadoCivil.nombre}`
    : value || placeholder

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
            placeholder="Buscar estado civil..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Cargando..." : "No se encontraron estados civiles"}
            </CommandEmpty>
            <CommandGroup>
              {filteredEstadosCiviles.map((estadoCivil) => {
                const displayText = `(${estadoCivil.estadoCivil.trim()}) - ${estadoCivil.nombre}`
                return (
                  <CommandItem
                    key={estadoCivil.estadoCivil}
                    value={displayText}
                    onSelect={() => {
                      onChange(estadoCivil.estadoCivil.trim(), estadoCivil.reniec)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === estadoCivil.estadoCivil.trim() ? "opacity-100" : "opacity-0"
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
