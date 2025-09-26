"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { useConsultorios } from '@/contexts/ConsultoriosContext'

interface ConsultorioEmergencySelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  initialValue?: string
}

export function ConsultorioEmergencySelector({
  value,
  onChange,
  label = "Consultorio",
  placeholder = "Seleccionar consultorio...",
  required = false,
  initialValue
}: ConsultorioEmergencySelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  // Usar contexto en lugar de estado local
  const { consultorios: items, loading: isLoading } = useConsultorios()

  // Ya no necesitamos cargar consultorios porque usamos el contexto
  const loadConsultorios = async (searchTerm: string = "") => {
    console.log('🚨 loadConsultorios llamado - usando contexto en su lugar');
    console.log('🏥 Consultorios disponibles desde contexto:', items?.length || 0);
  }

  // Ya no necesitamos cargar consultorios porque usamos el contexto
  useEffect(() => {
    console.log('🏥 Consultorios disponibles desde contexto:', items?.length || 0);
  }, [items])

  // Establecer valor inicial cuando se cargan los datos
  useEffect(() => {
    if (initialValue && !value && items && items.length > 0) {
      onChange(initialValue)
    }
  }, [initialValue, value, items, onChange])

  const buildDisplayText = (consultorio: any) => {
    if (!consultorio || !consultorio.CONSULTORIO?.trim() || !consultorio.NOMBRE?.trim()) {
      return 'Consultorio inválido'
    }
    return `${consultorio.CONSULTORIO.trim()} - ${consultorio.NOMBRE.trim()}`
  }

  const getSelectedText = () => {
    if (!value) return placeholder
    if (!items || items.length === 0) return placeholder
    const selected = items.find(item => item && (item.CONSULTORIO === value || item.CONSULTORIO?.trim() === value))
    return selected ? buildDisplayText(selected) : placeholder
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-700">
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
              placeholder="Buscar consultorio..." 
              value={search}
              onValueChange={(value) => {
                setSearch(value)
                // Ya no hacemos llamadas a la API porque usamos el contexto
                // El filtrado se hace localmente
              }}
            />
            <CommandList>
              <CommandEmpty>No se encontraron consultorios.</CommandEmpty>
              <CommandGroup>
                {(items || [])
                  .filter((consultorio) => {
                    if (!consultorio || !consultorio.CONSULTORIO?.trim() || !consultorio.NOMBRE?.trim()) {
                      return false
                    }
                    const searchTerm = search.toLowerCase()
                    return (
                      consultorio.CONSULTORIO.trim().toLowerCase().includes(searchTerm) ||
                      consultorio.NOMBRE.trim().toLowerCase().includes(searchTerm)
                    )
                  })
                  .map((consultorio, idx) => {
                    const displayText = buildDisplayText(consultorio)
                    return (
                      <CommandItem
                        key={`${consultorio.CONSULTORIO}-${idx}`}
                        value={displayText}
                        onSelect={() => {
                          onChange(consultorio.CONSULTORIO)
                          setOpen(false)
                        }}
                        className="font-normal" // Quitar negrita
                      >
                        <Check className={`mr-2 h-4 w-4 ${value === consultorio.CONSULTORIO ? "opacity-100" : "opacity-0"}`} />
                        <span className="font-normal">{displayText}</span>
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
