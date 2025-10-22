"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TipoDocumento {
  tipoDocumento: string
  nombre: string
  activo: number
}

interface TipoDocumentoSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function TipoDocumentoSelector({
  value,
  onChange,
  placeholder = "Seleccione tipo de documento",
  disabled = false
}: TipoDocumentoSelectorProps) {
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTiposDocumento()
  }, [])

  const loadTiposDocumento = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BACKEND_URL}/maestro/tipoDocumento`)
      if (!response.ok) {
        throw new Error('Error al cargar tipos de documento')
      }
      const data = await response.json()
      // Filtrar solo los activos y excluir "*Ninguno"
      const activos = data.filter((tipo: TipoDocumento) => 
        tipo.activo === 1 && tipo.tipoDocumento.trim() !== '0'
      )
      setTiposDocumento(activos)
    } catch (error) {
      console.error('Error al cargar tipos de documento:', error)
      setTiposDocumento([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Cargando..." : placeholder} />
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
