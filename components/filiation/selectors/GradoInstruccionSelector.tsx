"use client"

import { useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGradoInstruccion } from "@/contexts/filiation/GradoInstruccionContext"

interface GradoInstruccionSelectorProps {
  value: string
  onChange: (value: string, reniec?: string | null) => void
  placeholder?: string
  disabled?: boolean
}

export function GradoInstruccionSelector({
  value,
  onChange,
  placeholder = "Buscar grado de instrucción...",
  disabled = false
}: GradoInstruccionSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  // Usar contexto en lugar de estado local
  const { gradosInstruccion, loading } = useGradoInstruccion()

  // Filtrar localmente
  const filteredGrados = (gradosInstruccion || []).filter(g =>
    g?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    g?.gradoInstruccion?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedGrado = (gradosInstruccion || []).find(g => g?.gradoInstruccion === value)
  const displayValue = selectedGrado 
    ? `(${selectedGrado.gradoInstruccion}) - ${selectedGrado.nombre}`
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
            placeholder="Buscar grado de instrucción..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Cargando..." : "No se encontraron grados"}
            </CommandEmpty>
            <CommandGroup>
              {filteredGrados.map((grado, index) => {
                const displayText = `(${grado.gradoInstruccion}) - ${grado.nombre}`
                return (
                  <CommandItem
                    key={`${grado.gradoInstruccion}-${index}`}
                    value={displayText}
                    onSelect={() => {
                      onChange(grado.gradoInstruccion, grado.reniec)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === grado.gradoInstruccion ? "opacity-100" : "opacity-0"
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
