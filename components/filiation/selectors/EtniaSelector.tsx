"use client"

import { useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEtnia } from "@/contexts/filiation/EtniaContext"

interface EtniaSelectorProps {
  value: string
  onChange: (value: string, description?: string) => void
  placeholder?: string
  disabled?: boolean
}

export function EtniaSelector({
  value,
  onChange,
  placeholder = "Seleccionar etnia...",
  disabled = false
}: EtniaSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  // Usar contexto en lugar de estado local
  const { etnias, loading } = useEtnia()

  // Filtrar etnias solo si hay búsqueda, sino mostrar todas
  const filteredEtnias = search 
    ? (etnias || []).filter(e =>
        e?.etPueInd?.toLowerCase().includes(search.toLowerCase()) ||
        e?.codEtnia?.toLowerCase().includes(search.toLowerCase())
      )
    : (etnias || [])
  
  const selectedEtnia = (etnias || []).find(e => e?.codEtnia === value)
  const displayValue = selectedEtnia 
    ? `${selectedEtnia.codEtnia} - ${selectedEtnia.etPueInd}`
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
            placeholder="Buscar etnia..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Cargando..." : "No se encontraron etnias"}
            </CommandEmpty>
            <CommandGroup>
              {filteredEtnias.map((etnia,index) => {
                const displayText = `${etnia.codEtnia} - ${etnia.etPueInd}`
                return (
                  <CommandItem
                    key={`${etnia.codEtnia}-${index}`}
                    value={displayText}
                    onSelect={() => {
                      onChange(etnia.codEtnia, etnia.etPueInd)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === etnia.codEtnia ? "opacity-100" : "opacity-0"
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
