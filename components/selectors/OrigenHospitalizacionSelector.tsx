"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { useOrigenHospitalizacion } from '@/contexts/OrigenHospitalizacionContext'
import { cn } from '@/lib/utils'

interface OrigenHospitalizacionSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  initialValue?: string
  className?: string
  onOrigenChange?: (origen: string) => void // Callback para notificar cambios
}

export function OrigenHospitalizacionSelector({
  value,
  onChange,
  label = "Origen de Hospitalización",
  placeholder = "Seleccionar origen...",
  required = false,
  initialValue,
  className,
  onOrigenChange
}: OrigenHospitalizacionSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  const { origenes, loading, getOrigenNombre } = useOrigenHospitalizacion()

  // Filtrar por búsqueda
  const searchFilteredOrigenes = origenes.filter(origen =>
    origen.NOMBRE?.toLowerCase().includes(search.toLowerCase()) ||
    origen.ORIGEN?.toLowerCase().includes(search.toLowerCase())
  )

  // Establecer valor inicial
  useEffect(() => {
    if (initialValue && !value) {
      onChange(initialValue)
    }
  }, [initialValue, value, onChange])

  // Notificar cambios de origen
  useEffect(() => {
    if (onOrigenChange && value) {
      onOrigenChange(value)
    }
  }, [value, onOrigenChange])

  const selectedOrigen = origenes.find(o => o.ORIGEN === value)

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="origen-selector">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="origen-selector"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {loading ? (
              "Cargando orígenes..."
            ) : selectedOrigen ? (
              <span className="font-normal">
                {selectedOrigen.NOMBRE}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar origen..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? "Cargando..." : "No se encontraron orígenes."}
              </CommandEmpty>
              <CommandGroup>
                {searchFilteredOrigenes.map((origen) => (
                  <CommandItem
                    key={origen.ORIGEN}
                    value={origen.ORIGEN}
                    onSelect={(currentValue) => {
                      const newValue = currentValue === value ? "" : currentValue
                      onChange(newValue)
                      setOpen(false)
                      setSearch("")
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === origen.ORIGEN ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-normal">
                      <span className="font-medium">{origen.ORIGEN}</span> - {origen.NOMBRE}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
