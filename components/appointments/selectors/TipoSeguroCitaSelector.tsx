"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { useSegurosCita } from '@/contexts/SegurosCitaContext'

interface TipoSeguro {
  SEGURO: string
  NOMBRE: string
}

interface TipoSeguroCitaSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  initialValue?: string
}

export function TipoSeguroCitaSelector({ 
  value, 
  onChange, 
  label = "Tipo de Seguro",
  placeholder = "Seleccionar tipo de seguro...",
  required = false,
  initialValue
}: TipoSeguroCitaSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  // Use context instead of local state and API calls
  const { seguros: items, loading: isLoading } = useSegurosCita()

  // Establecer valor inicial cuando se cargan los datos
  useEffect(() => {
    if (initialValue && !value && items.length > 0) {
      onChange(initialValue)
    }
  }, [initialValue, value, items, onChange])

  const buildDisplayText = (tipoSeguro: TipoSeguro) => {
    return `${tipoSeguro.SEGURO} - ${tipoSeguro.NOMBRE}`
  }

  const getSelectedText = () => {
    if (!value) return placeholder
    const selected = items.find(item => item.SEGURO === value)
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
                {items
                  .filter((tipoSeguro) => {
                    const searchTerm = search.toLowerCase()
                    return (
                      (tipoSeguro.SEGURO || '').toLowerCase().includes(searchTerm) ||
                      (tipoSeguro.NOMBRE || '').toLowerCase().includes(searchTerm)
                    )
                  })
                  .map((tipoSeguro, idx) => {
                    const displayText = buildDisplayText(tipoSeguro)
                    return (
                      <CommandItem
                        key={`${tipoSeguro.SEGURO}-${idx}`}
                        value={displayText}
                        onSelect={() => {
                          onChange(tipoSeguro.SEGURO)
                          setOpen(false)
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${value === tipoSeguro.SEGURO ? "opacity-100" : "opacity-0"}`} />
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
