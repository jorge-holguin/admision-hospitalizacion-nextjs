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

interface Pais {
  pais: string
  nombre: string
  activo: number
  codigo: string
  cdc: string
}

export function PaisSelector({
  value,
  onChange,
  placeholder = "Buscar país...",
  disabled = false
}: PaisSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedPaisData, setSelectedPaisData] = useState<Pais | null>(null)
  
  // Usar contexto para búsqueda dinámica
  const { paises, loading, searchPaises } = usePais()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL

  // ✅ Cargar datos del país seleccionado para mostrar "código - nombre"
  useEffect(() => {
    const loadSelectedPaisData = async () => {
      if (value?.trim()) {
        try {
          console.log(`🔍 Cargando datos del país seleccionado: ${value.trim()}`)
          const response = await fetch(
            `${API_BASE_URL}/maestro/pais/${value.trim()}`
          )
          
          if (response.ok) {
            const data: Pais = await response.json()
            console.log(`✅ Datos del país cargados:`, data)
            setSelectedPaisData(data)
          }
        } catch (error) {
          console.error('❌ Error al cargar datos del país:', error)
        }
      }
    }
    
    loadSelectedPaisData()
  }, [value, API_BASE_URL])

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue)
    searchPaises(searchValue)
  }

  // ✅ Mostrar "código - nombre" usando datos cargados o de la búsqueda
  const selectedPais = (paises || []).find(p => p?.pais === value)
  const displayValue = selectedPais 
    ? `${selectedPais.pais} - ${selectedPais.nombre}`
    : selectedPaisData
    ? `${selectedPaisData.pais} - ${selectedPaisData.nombre}`
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
                const displayText = `${pais.pais} - ${pais.nombre}`
                return (
                  <CommandItem
                    key={pais.pais}
                    value={displayText}
                    onSelect={() => {
                      onChange(pais.pais)
                      setOpen(false)
                      setSearch("")
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
