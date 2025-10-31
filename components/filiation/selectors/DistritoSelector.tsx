"use client"

import { useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Distrito {
  UBIGEO: string
  DEPARTAMENTO: string
  PROVINCIA: string
  DISTRITO: string
}

interface DistritoSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function DistritoSelector({
  value,
  onChange,
  placeholder = "Buscar distrito...",
  disabled = false
}: DistritoSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [distritos, setDistritos] = useState<Distrito[]>([])
  const [loading, setLoading] = useState(false)

  const searchDistritos = async (filtro: string) => {
    if (!filtro || filtro.length < 2) {
      setDistritos([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/maestro/buscar/ubigeo?filtro=${encodeURIComponent(filtro)}&limite=20`
      )
      if (!response.ok) throw new Error('Error al buscar distritos')
      
      const data = await response.json()
      setDistritos(data || [])
    } catch (error) {
      console.error('Error al buscar distritos:', error)
      setDistritos([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue)
    searchDistritos(searchValue)
  }

  const selectedDistrito = distritos.find(d => d.UBIGEO === value)
  const displayValue = selectedDistrito 
    ? `${selectedDistrito.DISTRITO} - ${selectedDistrito.PROVINCIA} - ${selectedDistrito.DEPARTAMENTO}`
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
            placeholder="Escribe para buscar distrito..." 
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Buscando..." : search.length < 2 ? "Escribe al menos 2 caracteres" : "No se encontraron distritos"}
            </CommandEmpty>
            <CommandGroup>
              {distritos.map((distrito) => {
                const displayText = `${distrito.DISTRITO} - ${distrito.PROVINCIA} - ${distrito.DEPARTAMENTO}`
                return (
                  <CommandItem
                    key={distrito.UBIGEO}
                    value={displayText}
                    onSelect={() => {
                      onChange(distrito.UBIGEO)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === distrito.UBIGEO ? "opacity-100" : "opacity-0"
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
