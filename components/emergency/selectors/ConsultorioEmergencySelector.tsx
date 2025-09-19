"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

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
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Función para cargar consultorios de emergencia
  const loadConsultorios = async (searchTerm: string = "") => {
    try {
      setIsLoading(true)
      console.log('🏥 Cargando consultorios de emergencia...')
      
      const response = await fetch(`/api/consultorio?tipo=E&search=${encodeURIComponent(searchTerm)}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Consultorios de emergencia cargados:', data)
      
      // Extraer los items de la respuesta
      const consultorios = data.items || data.data || []
      setItems(consultorios)
      
    } catch (error) {
      console.error('❌ Error al cargar consultorios de emergencia:', error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar consultorios al montar el componente
  useEffect(() => {
    loadConsultorios()
  }, [])

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
                // Buscar en tiempo real cuando el usuario escribe
                if (value.length > 2 || value.length === 0) {
                  loadConsultorios(value)
                }
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
                      >
                        <Check className={`mr-2 h-4 w-4 ${value === consultorio.CONSULTORIO ? "opacity-100" : "opacity-0"}`} />
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
