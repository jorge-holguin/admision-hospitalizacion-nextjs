"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTipoDocumento } from "@/contexts/filiation/TipoDocumentoContext"
import { Loader2 } from "lucide-react"
import { useMemo } from "react"

interface TipoDocumentoSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  excludeCodes?: string[]
}

export function TipoDocumentoSelector({ value, onChange, disabled, excludeCodes }: TipoDocumentoSelectorProps) {
  const { tiposDocumento, isLoading, error } = useTipoDocumento()

  const tiposFiltrados = useMemo(() => {
    if (!excludeCodes?.length) return tiposDocumento
    const excluir = new Set(excludeCodes.map(c => c.trim().toUpperCase()))
    return tiposDocumento.filter(tipo => !excluir.has(tipo.tipoDocumento.trim().toUpperCase()))
  }, [tiposDocumento, excludeCodes])

  // Normalizar el valor para comparación (trim y manejar casos especiales)
  const normalizedValue = useMemo(() => {
    if (!value) return ''
    const trimmed = value.trim().toUpperCase()
    // Mapear valores comunes a códigos del sistema
    if (trimmed === 'DNI') return 'D'
    if (trimmed === 'CARNET DE EXTRANJERÍA' || trimmed === 'CARNET DE EXTRANJERIA') return 'CE'
    if (trimmed === 'PASAPORTE') return 'PP'
    return trimmed
  }, [value])

  // Encontrar el valor que coincide en la lista
  const selectedValue = useMemo(() => {
    if (!normalizedValue || tiposFiltrados.length === 0) return ''

    const found = tiposFiltrados.find(tipo => {
      const tipoCode = tipo.tipoDocumento.trim().toUpperCase()
      return tipoCode === normalizedValue
    })

    return found ? found.tipoDocumento.trim() : ''
  }, [normalizedValue, tiposFiltrados])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-10 border rounded-md bg-gray-50">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Cargando...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-10 border rounded-md bg-red-50 text-red-600 text-sm">
        Error al cargar tipos de documento
      </div>
    )
  }

  return (
    <Select value={selectedValue} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccione tipo" />
      </SelectTrigger>
      <SelectContent>
        {tiposFiltrados.map((tipo) => (
          <SelectItem key={tipo.tipoDocumento} value={tipo.tipoDocumento.trim()}>
            {/* Limpiar asterisco del nombre "*Ninguno" */}
            {tipo.nombre.replace(/^\*/, '')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
