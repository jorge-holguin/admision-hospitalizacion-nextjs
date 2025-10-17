"use client"

import { useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReligion } from "@/contexts/filiation/ReligionContext"

interface ReligionSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ReligionSelector({
  value,
  onChange,
  placeholder = "Seleccionar religión...",
  disabled = false
}: ReligionSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  // Usar contexto en lugar de estado local
  const { religiones, loading } = useReligion()

  const filteredReligiones = (religiones || []).filter(r =>
    r?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    r?.religion?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedReligion = (religiones || []).find(r => r?.religion === value)
  const displayValue = selectedReligion 
    ? `(${selectedReligion.religion}) - ${selectedReligion.nombre}`
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
            placeholder="Buscar religión..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Cargando..." : "No se encontraron religiones"}
            </CommandEmpty>
            <CommandGroup>
              {filteredReligiones.map((religion) => {
                const displayText = `(${religion.religion}) - ${religion.nombre}`
                return (
                  <CommandItem
                    key={religion.religion}
                    value={displayText}
                    onSelect={() => {
                      onChange(religion.religion)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === religion.religion ? "opacity-100" : "opacity-0"
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
