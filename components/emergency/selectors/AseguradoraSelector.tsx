"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface EmpresaSeguro {
  EMPRESA: string
  NOMBRE: string
  ACTIVO?: string
}

interface AseguradoraSelectorProps {
  value: string
  onChange: (value: string, data?: EmpresaSeguro) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  initialValue?: string
}

export function AseguradoraSelector({
  value,
  onChange,
  label = "Aseguradora",
  placeholder = "Seleccionar aseguradora...",
  required = false,
  disabled = false,
  initialValue
}: AseguradoraSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<EmpresaSeguro[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<EmpresaSeguro | null>(null)

  // Cargar todas las empresas de seguro al montar
  const loadEmpresas = useCallback(async (searchTerm?: string) => {
    setIsLoading(true)
    try {
      const url = searchTerm 
        ? `/api/emergency/empresas-seguro?search=${encodeURIComponent(searchTerm)}`
        : '/api/emergency/empresas-seguro'
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.ok && result.data) {
        setItems(result.data)
      }
    } catch (error) {
      console.error('Error cargando empresas de seguro:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar empresas al abrir el popover
  useEffect(() => {
    if (open && items.length === 0) {
      loadEmpresas()
    }
  }, [open, items.length, loadEmpresas])

  // Cargar empresa por ID inicial
  useEffect(() => {
    const loadInitialValue = async () => {
      if (initialValue && !selectedItem) {
        try {
          const response = await fetch(`/api/emergency/empresas-seguro/${initialValue}`)
          const result = await response.json()
          if (result.ok && result.data) {
            setSelectedItem(result.data)
          }
        } catch (error) {
          console.error('Error cargando empresa inicial:', error)
        }
      }
    }
    loadInitialValue()
  }, [initialValue, selectedItem])

  // Buscar cuando cambia el texto de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search.length >= 2) {
        loadEmpresas(search)
      } else if (search.length === 0 && open) {
        loadEmpresas()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [search, open, loadEmpresas])

  const buildDisplayText = (empresa: EmpresaSeguro) => {
    if (!empresa || !empresa.EMPRESA?.trim() || !empresa.NOMBRE?.trim()) {
      return 'Aseguradora inválida'
    }
    return `(${empresa.EMPRESA.trim()}) - ${empresa.NOMBRE.trim()}`
  }

  const getSelectedText = () => {
    if (!value) return placeholder
    if (selectedItem) return buildDisplayText(selectedItem)
    
    // Buscar en items cargados
    const found = items.find(item => item.EMPRESA?.trim() === value?.trim())
    if (found) {
      setSelectedItem(found)
      return buildDisplayText(found)
    }
    
    return placeholder
  }

  const handleSelect = (empresa: EmpresaSeguro) => {
    setSelectedItem(empresa)
    onChange(empresa.EMPRESA?.trim() || '', empresa)
    setOpen(false)
    setSearch("")
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
            disabled={disabled || isLoading}
          >
            {isLoading && !open ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </span>
            ) : (
              getSelectedText()
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar aseguradora..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No se encontraron aseguradoras.</CommandEmpty>
                  <CommandGroup>
                    {items.map((empresa, idx) => {
                      const displayText = buildDisplayText(empresa)
                      const empresaId = empresa.EMPRESA?.trim() || ''
                      return (
                        <CommandItem
                          key={`${empresaId}-${idx}`}
                          value={displayText}
                          onSelect={() => handleSelect(empresa)}
                          className="font-normal"
                        >
                          <Check className={`mr-2 h-4 w-4 ${value === empresaId ? "opacity-100" : "opacity-0"}`} />
                          <span className="font-normal">{displayText}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
