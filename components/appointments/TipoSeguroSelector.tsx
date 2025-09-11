"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface TipoSeguro {
  Seguro: string
  Nombre: string
  CREA_CUENTA: string
}

interface TipoSeguroSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
}

export function TipoSeguroSelector({ 
  value, 
  onChange, 
  label = "Tipo de Seguro",
  placeholder = "Seleccionar tipo de seguro...",
  required = false
}: TipoSeguroSelectorProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<TipoSeguro[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadTiposSeguros()
  }, [])

  const loadTiposSeguros = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/seguros')
      if (response.ok) {
        const data = await response.json()
        setItems(data || [])
      }
    } catch (error) {
      console.error('Error loading tipos de seguro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const buildDisplayText = (tipoSeguro: TipoSeguro) => {
    return `${tipoSeguro.Seguro} - ${tipoSeguro.Nombre}`
  }

  const getSelectedText = () => {
    if (!value) return placeholder
    const selected = items.find(item => item.Seguro === value)
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
                      tipoSeguro.Seguro.toLowerCase().includes(searchTerm) ||
                      tipoSeguro.Nombre.toLowerCase().includes(searchTerm)
                    )
                  })
                  .map((tipoSeguro, idx) => {
                    const displayText = buildDisplayText(tipoSeguro)
                    return (
                      <CommandItem
                        key={`${tipoSeguro.Seguro}-${idx}`}
                        value={displayText}
                        onSelect={() => {
                          onChange(tipoSeguro.Seguro)
                          setOpen(false)
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${value === tipoSeguro.Seguro ? "opacity-100" : "opacity-0"}`} />
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
