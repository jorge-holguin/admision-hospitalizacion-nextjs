"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { useSegurosCita } from '@/contexts/SegurosCitaContext'
import { Seguro } from '@/services/citas/seguroService'

interface TipoSeguroSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  initialValue?: string
}

export function TipoSeguroSelector({ 
  value, 
  onChange, 
  label = "Tipo de Seguro",
  placeholder = "Seleccionar tipo de seguro...",
  required = false,
  initialValue
}: TipoSeguroSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  // Use context instead of local state and API calls
  const { seguros: items, loading: isLoading } = useSegurosCita()
  

  // Establecer valor inicial cuando se cargan los datos
  useEffect(() => {
    if (initialValue && !value && items && items.length > 0) {
      onChange(initialValue)
    }
  }, [initialValue, value, items, onChange])

  const buildDisplayText = (seguro: Seguro) => {
    if (!seguro || !seguro.Seguro?.trim() || !seguro.Nombre?.trim()) {
      return 'Seguro inválido'
    }
    return `${seguro.Seguro.trim()} - ${seguro.Nombre.trim()}`
  }

  const getSelectedText = () => {
    if (!value) return placeholder
    if (!items || items.length === 0) return placeholder
    const selected = items.find(item => item && (item.Seguro === value || item.Seguro?.trim() === value))
    return selected ? buildDisplayText(selected) : placeholder
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            <span className="truncate">
              {isLoading ? "Cargando..." : getSelectedText()}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar tipo de seguro..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No se encontraron tipos de seguro.</CommandEmpty>
              <CommandGroup>
                {(items || [])
                  .filter((seguro) => {
                    // Validar que las propiedades existan y tengan contenido después del trim
                    if (!seguro || !seguro.Seguro?.trim() || !seguro.Nombre?.trim()) {
                      return false
                    }
                    const searchTerm = search.toLowerCase()
                    return (
                      seguro.Seguro.trim().toLowerCase().includes(searchTerm) ||
                      seguro.Nombre.trim().toLowerCase().includes(searchTerm)
                    )
                  })
                  .map((seguro, idx) => {
                    const displayText = buildDisplayText(seguro)
                    return (
                      <CommandItem
                        key={`${seguro.Seguro}-${idx}`}
                        value={displayText}
                        onSelect={() => {
                          onChange(seguro.Seguro)
                          setOpen(false)
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${value === seguro.Seguro ? "opacity-100" : "opacity-0"}`} />
                        {displayText}
                      </CommandItem>
                    )
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
