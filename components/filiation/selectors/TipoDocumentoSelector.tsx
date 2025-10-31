"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTipoDocumento } from "@/contexts/filiation/TipoDocumentoContext"
import { Loader2 } from "lucide-react"

interface TipoDocumentoSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function TipoDocumentoSelector({ value, onChange, disabled }: TipoDocumentoSelectorProps) {
  const { tiposDocumento, isLoading, error } = useTipoDocumento()

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
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccione tipo" />
      </SelectTrigger>
      <SelectContent>
        {tiposDocumento.map((tipo) => (
          <SelectItem key={tipo.tipoDocumento} value={tipo.tipoDocumento.trim()}>
            {tipo.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
