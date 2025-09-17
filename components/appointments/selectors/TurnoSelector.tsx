"use client"

import React, { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface TurnoOption {
  value: string
  label: string
  horario: string
}

const TURNO_OPTIONS: TurnoOption[] = [
  { value: "MAÑANA", label: "Mañana", horario: "08:00 - 12:00" },
  { value: "TARDE", label: "Tarde", horario: "14:00 - 18:00" }
]

interface TurnoSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
}

export function TurnoSelector({ 
  value, 
  onChange, 
  label = "Turno",
  placeholder = "Seleccionar turno...",
  required = false
}: TurnoSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const buildDisplayText = (turno: TurnoOption) => {
    return `${turno.label} - ${turno.horario}`
  }

  const getSelectedText = () => {
    if (!value) return placeholder
    const selected = TURNO_OPTIONS.find(item => item.value === value)
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
          >
            <span className="truncate">
              {getSelectedText()}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar turno..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No se encontraron turnos.</CommandEmpty>
              <CommandGroup>
                {TURNO_OPTIONS
                  .filter((turno) => {
                    const searchTerm = search.toLowerCase()
                    return (
                      turno.label.toLowerCase().includes(searchTerm) ||
                      turno.horario.toLowerCase().includes(searchTerm)
                    )
                  })
                  .map((turno, idx) => {
                    const displayText = buildDisplayText(turno)
                    return (
                      <CommandItem
                        key={`${turno.value}-${idx}`}
                        value={displayText}
                        onSelect={() => {
                          onChange(turno.value)
                          setOpen(false)
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${value === turno.value ? "opacity-100" : "opacity-0"}`} />
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
