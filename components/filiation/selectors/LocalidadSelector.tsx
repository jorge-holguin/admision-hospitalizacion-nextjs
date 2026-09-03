"use client"

import { useState, useEffect } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Localidad {
  localidad: string
  nombre: string
  activo: number
  ubigeo: string
}

interface LocalidadSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function LocalidadSelector({
  value,
  onChange,
  placeholder = "Buscar localidad...",
  disabled = false
}: LocalidadSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [localidades, setLocalidades] = useState<Localidad[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLocalidadData, setSelectedLocalidadData] = useState<Localidad | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_CITAS_MASTER_URL

  // ✅ Cargar datos de la localidad seleccionada para mostrar "código - nombre"
  useEffect(() => {
    const loadSelectedLocalidadData = async () => {
      if (value && value.trim()) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/maestro/localidad/${value.trim()}`
          )
          
          if (response.ok) {
            const data: Localidad = await response.json()
            setSelectedLocalidadData(data)
          }
        } catch (error) {
          console.error('❌ Error al cargar datos de la localidad:', error)
        }
      }
    }
    
    loadSelectedLocalidadData()
  }, [value, API_BASE_URL])

  const searchLocalidades = async (filtro: string) => {
    if (!filtro || filtro.length < 2) {
      setLocalidades([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/maestro/localidad/buscar?filtro=${encodeURIComponent(filtro)}&limite=20`
      )
      if (!response.ok) throw new Error('Error al buscar localidades')
      
      const data = await response.json()
      setLocalidades(data || [])
    } catch (error) {
      console.error('Error al buscar localidades:', error)
      setLocalidades([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue)
    searchLocalidades(searchValue)
  }

  // ✅ Mostrar "código - nombre" usando datos cargados o de la búsqueda
  const selectedLocalidad = localidades.find(l => l.localidad === value)
  const displayValue = selectedLocalidad 
    ? `${selectedLocalidad.localidad} - ${selectedLocalidad.nombre}`
    : selectedLocalidadData
    ? `${selectedLocalidadData.localidad} - ${selectedLocalidadData.nombre}`
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
            placeholder="Escribe para buscar localidad..." 
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Buscando..." : search.length < 2 ? "Escribe al menos 2 caracteres" : "No se encontraron localidades"}
            </CommandEmpty>
            <CommandGroup>
              {localidades.map((localidad) => {
                const displayText = `${localidad.localidad} - ${localidad.nombre}`
                return (
                  <CommandItem
                    key={localidad.localidad}
                    value={displayText}
                    onSelect={() => {
                      onChange(localidad.localidad)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === localidad.localidad ? "opacity-100" : "opacity-0"
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
