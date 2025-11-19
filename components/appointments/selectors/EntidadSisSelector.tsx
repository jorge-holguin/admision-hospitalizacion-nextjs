"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
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
  initialValue?: string
  sisEstablecimiento?: {
    codigo: string
    nombre: string
  }
}

export function EntidadSisSelector({ 
  value, 
  onChange, 
  label = "Establecimiento",
  placeholder = "Seleccionar establecimiento...",
  required = false,
  initialValue,
  sisEstablecimiento
}: EntidadSisSelectorProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<EntidadSis[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    loadEntidadesIniciales()
  }, [])

  // Efecto para manejar el valor inicial
  useEffect(() => {
    if (initialValue && !value) {
      onChange(initialValue)
    }
  }, [initialValue, value, onChange])

  // Refs para trackear el último código procesado y la función onChange
  const lastProcessedCode = useRef<string | null>(null)
  const onChangeRef = useRef(onChange)
  
  // Mantener onChangeRef actualizado
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Resetear lastProcessedCode cuando value se limpia
  useEffect(() => {
    if (!value && lastProcessedCode.current) {
      console.log('🏥 EntidadSisSelector: Reseteando lastProcessedCode (value limpiado)')
      lastProcessedCode.current = null
    }
  }, [value])

  // Efecto para manejar el establecimiento SIS
  useEffect(() => {
    if (sisEstablecimiento?.codigo) {
      // Solo actualizar si el código cambió o si es la primera vez
      if (lastProcessedCode.current !== sisEstablecimiento.codigo) {
        console.log('🏥 EntidadSisSelector: Actualizando establecimiento:', sisEstablecimiento)
        lastProcessedCode.current = sisEstablecimiento.codigo
        
        // Actualizar automáticamente con el nuevo código
        onChangeRef.current(sisEstablecimiento.codigo)
        
        // Agregar a items si no existe (usando callback para evitar dependencia de items)
        setItems(prevItems => {
          const existeEnItems = prevItems.some(item => item.ENTIDADSIS === sisEstablecimiento.codigo)
          if (!existeEnItems) {
            console.log('🏥 EntidadSisSelector: Agregando establecimiento a items:', sisEstablecimiento)
            return [
              {
                ENTIDADSIS: sisEstablecimiento.codigo,
                NOMBRE: sisEstablecimiento.nombre || ''
              },
              ...prevItems
            ]
          }
          return prevItems
        })
      } else {
        // El código es el mismo pero podría haber llegado el nombre actualizado
        if (sisEstablecimiento.nombre) {
          setItems(prevItems => {
            let changed = false
            const updated = prevItems.map(item => {
              if (item.ENTIDADSIS === sisEstablecimiento.codigo && item.NOMBRE !== (sisEstablecimiento.nombre || '')) {
                changed = true
                return { ...item, NOMBRE: sisEstablecimiento.nombre || '' }
              }
              return item
            })
            return changed ? updated : prevItems
          })
        }
      }
    } else if (!sisEstablecimiento && lastProcessedCode.current) {
      // Si sisEstablecimiento se limpia, resetear el tracking
      console.log('🏥 EntidadSisSelector: Reseteando lastProcessedCode (sisEstablecimiento limpiado)')
      lastProcessedCode.current = null
    }
  }, [sisEstablecimiento?.codigo, sisEstablecimiento?.nombre])

  const loadEntidadesIniciales = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/appointments/sis-entities?limit=20')
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
      const response = await fetch(`/api/appointments/sis-entities?search=${encodeURIComponent(searchTerm)}`)
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
    return `EESS: ${entidad.ENTIDADSIS} - ${entidad.NOMBRE}`
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
