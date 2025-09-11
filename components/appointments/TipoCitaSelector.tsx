"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface TipoCita {
  Tipo_cita: string
  Nombre: string
}

interface TipoCitaSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
}

export function TipoCitaSelector({ 
  value, 
  onChange, 
  label = "Tipo de Cita",
  placeholder = "Seleccionar tipo de cita...",
  required = false
}: TipoCitaSelectorProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<TipoCita[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadTiposCita()
  }, [])

  const loadTiposCita = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tipo-cita')
      if (response.ok) {
        const data = await response.json()
        setItems(data || [])
      }
    } catch (error) {
      console.error('Error loading tipos de cita:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const buildDisplayText = (tipoCita: TipoCita) => {
    return `${tipoCita.Tipo_cita} - ${tipoCita.Nombre}`
  }

  const getSelectedText = () => {
    if (!value) return placeholder
    const selected = items.find(item => item.Tipo_cita === value)
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
              placeholder="Buscar tipo de cita..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No se encontraron tipos de cita.</CommandEmpty>
              <CommandGroup>
                {items
                  .filter((tipoCita) => {
                    const searchTerm = search.toLowerCase()
                    return (
                      tipoCita.Tipo_cita.toLowerCase().includes(searchTerm) ||
                      tipoCita.Nombre.toLowerCase().includes(searchTerm)
                    )
                  })
                  .map((tipoCita, idx) => {
                    const displayText = buildDisplayText(tipoCita)
                    return (
                      <CommandItem
                        key={`${tipoCita.Tipo_cita}-${idx}`}
                        value={displayText}
                        onSelect={() => {
                          onChange(tipoCita.Tipo_cita)
                          setOpen(false)
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${value === tipoCita.Tipo_cita ? "opacity-100" : "opacity-0"}`} />
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
