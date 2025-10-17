"use client"

import { useState, useEffect } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePais } from "@/contexts/filiation/PaisContext"

interface PaisSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function PaisSelector({
  value,
  onChange,
  placeholder = "Buscar país...",
  disabled = false
}: PaisSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [initialLoaded, setInitialLoaded] = useState(false)
  
  // Usar contexto para búsqueda dinámica
  const { paises, loading, searchPaises } = usePais()

  // Cargar país inicial si hay un value (ej: "146" de RENIEC)
  useEffect(() => {
    if (value && !initialLoaded && paises.length === 0) {
      // Si el valor es "146", buscar "PERU"
      if (value === "146") {
        searchPaises("PERU")
      }
      setInitialLoaded(true)
    }
  }, [value, initialLoaded, paises.length])

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue)
    searchPaises(searchValue)
  }

  const selectedPais = (paises || []).find(p => p?.pais === value)
  const displayValue = selectedPais 
    ? `(${selectedPais.pais}) - ${selectedPais.nombre}`
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
            placeholder="Escribe para buscar país..." 
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Buscando..." : search.length < 2 ? "Escribe al menos 2 caracteres" : "No se encontraron países"}
            </CommandEmpty>
            <CommandGroup>
              {paises.map((pais) => {
                const displayText = `(${pais.pais}) - ${pais.nombre}`
                return (
                  <CommandItem
                    key={pais.pais}
                    value={displayText}
                    onSelect={() => {
                      onChange(pais.pais)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === pais.pais ? "opacity-100" : "opacity-0"
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
