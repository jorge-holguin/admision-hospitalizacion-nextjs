"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { useConsultorios } from '@/contexts/ConsultoriosContext'
import { cn } from '@/lib/utils'

interface ConsultorioSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  initialValue?: string
  tipo?: 'E' | 'H' | 'all' // E = Emergencia, H = Hospitalización, all = Todos
  className?: string
}

export function ConsultorioSelector({
  value,
  onChange,
  label = "Consultorio",
  placeholder = "Seleccionar consultorio...",
  required = false,
  initialValue,
  tipo = 'all',
  className
}: ConsultorioSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  const { consultorios, loading, getConsultorioNombre } = useConsultorios()

  // Filtrar consultorios por tipo si se especifica
  const filteredConsultorios = consultorios.filter(consultorio => {
    if (tipo === 'all') return true
    // Aquí puedes agregar lógica para filtrar por tipo
    // Por ejemplo, si tienes un campo TIPO en tus consultorios
    return true // Por ahora devuelve todos
  })

  // Filtrar por búsqueda
  const searchFilteredConsultorios = filteredConsultorios.filter(consultorio =>
    (consultorio.NOMBRE || '').toLowerCase().includes(search.toLowerCase()) ||
    (consultorio.CONSULTORIO || '').toLowerCase().includes(search.toLowerCase())
  )

  // Establecer valor inicial
  useEffect(() => {
    if (initialValue && !value) {
      onChange(initialValue)
    }
  }, [initialValue, value, onChange])

  const selectedConsultorio = consultorios.find(c => c.CONSULTORIO === value)

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="consultorio-selector">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="consultorio-selector"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {loading ? (
              "Cargando consultorios..."
            ) : selectedConsultorio ? (
              <span className="font-normal">
                {selectedConsultorio.NOMBRE || selectedConsultorio.CONSULTORIO}
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
              placeholder="Buscar consultorio..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? "Cargando..." : "No se encontraron consultorios."}
              </CommandEmpty>
              <CommandGroup>
                {searchFilteredConsultorios.map((consultorio) => (
                  <CommandItem
                    key={consultorio.CONSULTORIO}
                    value={consultorio.CONSULTORIO}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                      setSearch("")
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === consultorio.CONSULTORIO ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-normal">
                      {consultorio.NOMBRE || consultorio.CONSULTORIO}
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
