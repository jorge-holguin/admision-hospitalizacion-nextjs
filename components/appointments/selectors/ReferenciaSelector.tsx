"use client"

import { useState, useEffect } from "react"
import { useReferencia } from "@/contexts/ReferenciaContext"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, Loader2, AlertCircle, CheckCircle2, FileText } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReferenciaSelectorProps {
  numeroDocumento: string
  tipoDocumento: string // "1" para DNI, "2" para CE
  especialidadCodigo?: string // Código de especialidad para filtrar
  value?: string // idReferencia seleccionado
  onChange?: (referencia: {
    idReferencia: string
    numeroReferencia: string
    codigoestablecimientoOrigen: string
    establecimientoOrigen: string
    especialidad: string
    codigoEspecialidad: string
  }) => void
  onEessChange?: (codigoEess: string) => void
  disabled?: boolean
}

export function ReferenciaSelector({
  numeroDocumento,
  tipoDocumento,
  especialidadCodigo,
  value,
  onChange,
  onEessChange,
  disabled = false
}: Readonly<ReferenciaSelectorProps>) {
  const {
    referencias,
    isLoading,
    error,
    selectedReferencia,
    consultarReferencias,
    setSelectedReferencia
  } = useReferencia()

  const [hasSearched, setHasSearched] = useState(false)

  // Auto-buscar cuando cambian los parámetros clave
  useEffect(() => {
    if (numeroDocumento && tipoDocumento && !hasSearched) {
      handleBuscar()
    }
  }, [numeroDocumento, tipoDocumento, especialidadCodigo])

  // Resetear hasSearched cuando value se limpia (indica que el modal se cerró)
  useEffect(() => {
    if (!value) {
      setHasSearched(false)
    }
  }, [value])

  const handleBuscar = async () => {
    if (!numeroDocumento || !tipoDocumento) {
      return
    }

    console.log('🔍 Buscando referencias para:', {
      numeroDocumento,
      tipoDocumento,
      especialidadCodigo
    })

    // Limpiar selección anterior al buscar nuevas referencias
    setSelectedReferencia(null)
    if (onChange) {
      onChange({
        idReferencia: '',
        numeroReferencia: '',
        codigoestablecimientoOrigen: '',
        establecimientoOrigen: '',
        especialidad: '',
        codigoEspecialidad: ''
      })
    }

    await consultarReferencias({
      numerodocumento: numeroDocumento,
      tipodocumento: tipoDocumento,
      especialidadCodigo
    })

    setHasSearched(true)
  }

  const handleSelectReferencia = (idReferencia: string) => {
    const referenciaSeleccionada = referencias.find(
      ref => ref.data.idReferencia === idReferencia
    )

    if (referenciaSeleccionada) {
      const refData = referenciaSeleccionada.data
      setSelectedReferencia(refData)

      console.log('✅ Referencia seleccionada:', {
        idReferencia: refData.idReferencia,
        numeroReferencia: refData.numeroReferencia,
        eessOrigen: refData.codigoestablecimientoOrigen,
        establecimiento: refData.establecimientoOrigen
      })

      // Notificar cambios al componente padre
      if (onChange) {
        onChange({
          idReferencia: refData.idReferencia,
          numeroReferencia: refData.numeroReferencia,
          codigoestablecimientoOrigen: refData.codigoestablecimientoOrigen,
          establecimientoOrigen: refData.establecimientoOrigen,
          especialidad: refData.especialidad,
          codigoEspecialidad: refData.codigoEspecialidad
        })
      }

      // Notificar cambio de EESS
      if (onEessChange) {
        onEessChange(refData.codigoestablecimientoOrigen)
      }
    }
  }

  // Si no hay documento o tipo, mostrar mensaje
  if (!numeroDocumento || !tipoDocumento) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Referencia <span className="text-red-500">*</span>
        </Label>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Se requiere documento del paciente para consultar referencias
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Referencia <span className="text-red-500">*</span>
        </Label>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleBuscar}
          disabled={isLoading || disabled}
          className="h-8"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="h-3 w-3 mr-1" />
              Buscar Referencias
            </>
          )}
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">Consultando referencias...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Referencias encontradas */}
      {!isLoading && !error && hasSearched && referencias.length > 0 && (
        <div className="space-y-2">
          <Select
            value={value || ''}
            onValueChange={handleSelectReferencia}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione una referencia..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {referencias.map((ref) => {
                const data = ref.data
                return (
                  <SelectItem 
                    key={data.idReferencia} 
                    value={data.idReferencia}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {data.estado}
                      </span>
                      <span className="font-semibold text-blue-700">
                        {data.numeroReferencia}
                      </span>
                      <span className="text-gray-400">--</span>
                      <span className="text-gray-700 text-sm flex-1 truncate">
                        {data.descUpsDestino}
                      </span>
                      <span className="text-xs text-gray-500">
                        📅 {data.fechaEnvio}
                      </span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {/* Información de referencia seleccionada */}
          {selectedReferencia && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-xs">
                <div><strong>Referencia:</strong> {selectedReferencia.numeroReferencia} | <strong>EESS:</strong> {selectedReferencia.codigoestablecimientoOrigen} - {selectedReferencia.establecimientoOrigen}</div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Sin resultados - solo mostrar si se buscó y no hay referencias */}
      {!isLoading && !error && hasSearched && referencias.length === 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            No se encontraron referencias aceptadas para este paciente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
