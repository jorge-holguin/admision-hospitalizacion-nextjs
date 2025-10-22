"use client"

import { useState, useEffect } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Ubigeo {
  ubigeo: string
  distrito: string
  provincia: string
  departamento: string
  activo: number
  auxiliar: string
  ubigeoreniec: string
}

interface UbigeoSelectorProps {
  value: string
  onChange: (value: string, ubigeoreniec?: string) => void
  placeholder?: string
  disabled?: boolean
  ubigeoReniecInitial?: string // Código ubigeo RENIEC inicial (ej: 090202, 140112)
}

export function UbigeoSelector({
  value,
  onChange,
  placeholder = "Buscar distrito...",
  disabled = false,
  ubigeoReniecInitial
}: UbigeoSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [ubigeos, setUbigeos] = useState<Ubigeo[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [selectedUbigeoData, setSelectedUbigeoData] = useState<Ubigeo | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL

  // Cargar datos del ubigeo seleccionado para mostrar "código - nombre"
  useEffect(() => {
    const loadSelectedUbigeoData = async () => {
      if (value && value.trim().length >= 6 && /^\d+/.test(value.trim())) {
        try {
          console.log(`🔍 Cargando datos del ubigeo seleccionado: ${value.trim()}`)
          const response = await fetch(
            `${API_BASE_URL}/maestro/ubigeo/${value.trim()}`
          )
          
          if (response.ok) {
            const data: Ubigeo = await response.json()
            console.log(`✅ Datos del ubigeo cargados:`, data)
            setSelectedUbigeoData(data)
          }
        } catch (error) {
          console.error('❌ Error al cargar datos del ubigeo:', error)
        }
      }
    }
    
    loadSelectedUbigeoData()
  }, [value, API_BASE_URL])

  // Cargar ubigeo desde RENIEC si se proporciona el código inicial
  useEffect(() => {
    // Si hay código RENIEC y NO se ha cargado inicialmente
    // O si el valor actual NO es un código de ubigeo válido (7 caracteres numéricos)
    const isValidUbigeoCode = value && value.length === 7 && /^\d+/.test(value.trim())
    
    if (ubigeoReniecInitial && !initialLoaded && !isValidUbigeoCode) {
      console.log(`🔄 Cargando ubigeo desde RENIEC porque valor actual no es código válido: "${value}"`)
      loadUbigeoFromReniec(ubigeoReniecInitial)
    }
  }, [ubigeoReniecInitial, initialLoaded, value])

  const loadUbigeoFromReniec = async (ubigeoReniecCode: string) => {
    console.log(`🗺️ Cargando ubigeo desde RENIEC: ${ubigeoReniecCode}`)
    setLoading(true)
    try {
      // Llamar directamente a la API externa (CORS habilitado)
      const response = await fetch(
        `${API_BASE_URL}/maestro/ubigeo/reniec/${ubigeoReniecCode}`
      )
      if (!response.ok) throw new Error('Error al cargar ubigeo desde RENIEC')
      
      const data: Ubigeo = await response.json()
      console.log(`✅ Ubigeo cargado desde RENIEC:`, data)
      console.log(`   - ubigeo: "${data.ubigeo}" (length: ${data.ubigeo?.length})`)
      console.log(`   - distrito: "${data.distrito}"`)
      console.log(`   - ubigeoreniec: "${data.ubigeoreniec}"`)
      
      if (data?.ubigeo && data?.distrito) {
        // Actualizar el valor con ubigeo (7 caracteres) - NO hacer trim, mantener espacios
        console.log(`✅ Llamando onChange con ubigeo: "${data.ubigeo}" (length: ${data.ubigeo.length})`)
        onChange(data.ubigeo, data.ubigeoreniec)
        setInitialLoaded(true)
      }
    } catch (error) {
      console.error('❌ Error al cargar ubigeo desde RENIEC:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUbigeos = async (filtro: string) => {
    if (!filtro || filtro.length < 2) {
      setUbigeos([])
      return
    }

    setLoading(true)
    try {
      // ✅ Detectar si el filtro es un código numérico (ubigeo)
      const isNumericCode = /^\d+$/.test(filtro.trim())
      
      let resultData: Ubigeo[] = []
      
      if (isNumericCode && filtro.trim().length >= 6) {
        // ✅ Buscar por código de ubigeo usando endpoint directo
        console.log(`🔍 Buscando ubigeo por código: ${filtro}`)
        const response = await fetch(
          `${API_BASE_URL}/maestro/ubigeo/${filtro.trim()}`
        )
        
        if (response.ok) {
          const ubigeoData: Ubigeo = await response.json()
          console.log(`✅ Ubigeo encontrado por código:`, ubigeoData)
          resultData = [ubigeoData] // Convertir a array
        } else {
          console.warn(`⚠️ No se encontró ubigeo con código: ${filtro}`)
          resultData = []
        }
      } else {
        // ✅ Buscar por nombre usando endpoint de búsqueda
        console.log(`🔍 Buscando ubigeos por nombre: ${filtro}`)
        const response = await fetch(
          `${API_BASE_URL}/maestro/ubigeo/buscar?filtro=${encodeURIComponent(filtro)}`
        )
        
        if (!response.ok) throw new Error('Error al buscar ubigeos')
        
        const data = await response.json()
        console.log(`✅ Ubigeos encontrados por nombre:`, data?.length || 0)
        resultData = data || []
      }
      
      setUbigeos(resultData)
    } catch (error) {
      console.error('❌ Error al buscar ubigeos:', error)
      setUbigeos([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue)
    searchUbigeos(searchValue)
  }

  // ✅ Mostrar "código - nombre" usando datos cargados o de la búsqueda
  const selectedUbigeo = ubigeos.find(u => u.ubigeo.trim() === value.trim())
  const displayValue = selectedUbigeo 
    ? `${selectedUbigeo.ubigeo.trim()} - ${selectedUbigeo.distrito}`
    : selectedUbigeoData
    ? `${selectedUbigeoData.ubigeo.trim()} - ${selectedUbigeoData.distrito}`
    : value ? value.trim() : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Escribe para buscar distrito..." 
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Buscando..." : search.length < 2 ? "Escribe al menos 2 caracteres" : "No se encontraron distritos"}
            </CommandEmpty>
            <CommandGroup>
              {ubigeos.map((ubigeo) => {
                const displayText = `${ubigeo.ubigeo.trim()} - ${ubigeo.distrito}`
                return (
                  <CommandItem
                    key={ubigeo.ubigeo}
                    value={displayText}
                    onSelect={() => {
                      // NO hacer trim - mantener los 7 caracteres exactos
                      onChange(ubigeo.ubigeo, ubigeo.ubigeoreniec)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.trim() === ubigeo.ubigeo.trim() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-normal">{displayText}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
