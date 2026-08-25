"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { getAllEmpresasSeguro, type EmpresaSeguro as EmpresaSeguroApi } from '@/services/emergencia/empresaSeguroApiService'

// Tipo proveniente del servicio Spring Boot
type EmpresaSeguro = EmpresaSeguroApi

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
  const loadedRef = useRef(false)

  // Cargar todas las empresas de seguro desde Spring Boot una sola vez
  const loadEmpresas = useCallback(async () => {
    if (loadedRef.current) return
    loadedRef.current = true
    setIsLoading(true)
    try {
      const all = await getAllEmpresasSeguro()
      setItems(all)
    } catch (error) {
      console.error('Error cargando empresas de seguro:', error)
      loadedRef.current = false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar empresas al abrir el popover
  useEffect(() => {
    if (open && !loadedRef.current) {
      loadEmpresas()
    }
  }, [open, loadEmpresas])

  // Cargar empresa por ID inicial
  useEffect(() => {
    const loadInitialValue = async () => {
      if (!initialValue || selectedItem) return
      if (!loadedRef.current) {
        await loadEmpresas()
      }
      const found = items.find(item => item.EMPRESA?.trim() === initialValue.trim())
      if (found) setSelectedItem(found)
    }
    loadInitialValue()
  }, [initialValue, selectedItem, items, loadEmpresas])

  // Filtrar empresas según el texto de búsqueda (cliente)
  const filteredItems = useMemo(() => {
    if (!search) return items
    const query = search.toLowerCase()
    return items.filter(item =>
      item.EMPRESA?.toLowerCase().includes(query) ||
      item.NOMBRE?.toLowerCase().includes(query)
    )
  }, [items, search])

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
    if (found) return buildDisplayText(found)
    
    return value ? `(${value})` : placeholder
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
          <Command shouldFilter={false}>
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
                    {filteredItems.map((empresa, idx) => {
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
