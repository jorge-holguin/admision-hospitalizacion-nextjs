"use client"

import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface EntidadSis {
  ENTIDADSIS: string
  NOMBRE: string
}

interface EntidadSisSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
}

export function EntidadSisSelector({ 
  value, 
  onChange, 
  label = "Establecimiento",
  placeholder = "Seleccionar establecimiento...",
  required = false
}: EntidadSisSelectorProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<EntidadSis[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    loadEntidadesIniciales()
  }, [])

  const loadEntidadesIniciales = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/citas/entidad-sis?limit=20')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setItems(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading entidades SIS iniciales:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchEntidades = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      loadEntidadesIniciales()
      setHasSearched(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/citas/entidad-sis?search=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setItems(data.data || [])
          setHasSearched(true)
        }
      }
    } catch (error) {
      console.error('Error searching entidades SIS:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue)
    // Debounce la búsqueda
    const timeoutId = setTimeout(() => {
      searchEntidades(searchValue)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }

  const buildDisplayText = (entidad: EntidadSis) => {
    return `${entidad.ENTIDADSIS} - ${entidad.NOMBRE}`
  }

  const getSelectedText = () => {
    if (!value) return placeholder
    const selected = items.find(item => item.ENTIDADSIS === value)
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
              placeholder="Buscar por código o nombre..." 
              value={search}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              <CommandEmpty>
                {hasSearched ? "No se encontraron establecimientos con ese criterio." : "Escriba para buscar establecimientos."}
              </CommandEmpty>
              <CommandGroup>
                {items.map((entidad, idx) => {
                    const displayText = buildDisplayText(entidad)
                    return (
                      <CommandItem
                        key={`${entidad.ENTIDADSIS}-${idx}`}
                        value={displayText}
                        onSelect={() => {
                          onChange(entidad.ENTIDADSIS)
                          setOpen(false)
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${value === entidad.ENTIDADSIS ? "opacity-100" : "opacity-0"}`} />
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
