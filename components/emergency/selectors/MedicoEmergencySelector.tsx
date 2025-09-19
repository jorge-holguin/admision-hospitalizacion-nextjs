"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { useMedicos } from '@/hooks/useMedicos'

interface MedicoEmergencySelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  initialValue?: string
}

export function MedicoEmergencySelector({
  value,
  onChange,
  label = "Médico",
  placeholder = "Seleccionar médico...",
  required = false,
  initialValue
}: MedicoEmergencySelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  const { medicos: items, loading: isLoading } = useMedicos()

  // Establecer valor inicial cuando se cargan los datos
  useEffect(() => {
    if (initialValue && !value && items && items.length > 0) {
      onChange(initialValue)
    }
  }, [initialValue, value, items, onChange])

  const buildDisplayText = (medico: any) => {
    if (!medico || !medico.MEDICO?.trim() || !medico.NOMBRE?.trim()) {
      return 'Médico inválido'
    }
    return `${medico.MEDICO.trim()} - ${medico.NOMBRE.trim()}`
  }

  const getSelectedText = () => {
    if (!value) return placeholder
    if (!items || items.length === 0) return placeholder
    const selected = items.find(item => item && (item.MEDICO === value || item.MEDICO?.trim() === value))
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
            {isLoading ? "Cargando..." : getSelectedText()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar médico..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No se encontraron médicos.</CommandEmpty>
              <CommandGroup>
                {(items || [])
                  .filter((medico) => {
                    if (!medico || !medico.MEDICO?.trim() || !medico.NOMBRE?.trim()) {
                      return false
                    }
                    const searchTerm = search.toLowerCase()
                    return (
                      medico.MEDICO.trim().toLowerCase().includes(searchTerm) ||
                      medico.NOMBRE.trim().toLowerCase().includes(searchTerm)
                    )
                  })
                  .map((medico, idx) => {
                    const displayText = buildDisplayText(medico)
                    return (
                      <CommandItem
                        key={`${medico.MEDICO}-${idx}`}
                        value={displayText}
                        onSelect={() => {
                          onChange(medico.MEDICO)
                          setOpen(false)
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${value === medico.MEDICO ? "opacity-100" : "opacity-0"}`} />
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
