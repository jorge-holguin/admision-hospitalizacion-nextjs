"use client"

import { useState, useEffect } from "react"
import { useReferencia } from "@/contexts/ReferenciaContext"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Search, Loader2, AlertCircle, CheckCircle2, Edit3 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

interface ReferenciaSelectorProps {
  numeroDocumento: string
  tipoDocumento: string // 1:DNI, 2:CE, 3:PASS, 4:DIE, 5:S/DO
  especialidadCodigo?: string // Código de especialidad para filtrar
  value?: string // idReferencia seleccionado
  onChange?: (referencia: {
    idReferencia: string
    numeroReferencia: string
    codigoestablecimientoOrigen: string
    establecimientoOrigen: string
    especialidad: string
    codigoEspecialidad: string
    codigoEstado?: string
    skipRefconSync?: boolean
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
  const [manualMode, setManualMode] = useState(false)
  const [manualReferencia, setManualReferencia] = useState('')
  const [manualConfirmed, setManualConfirmed] = useState(false)
  const [open, setOpen] = useState(true); // <- abierto por defecto

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
      setManualMode(false)
      // No limpiar manualReferencia para que se vea el valor guardado
      setManualConfirmed(false)
    }
  }, [value])

  const handleBuscar = async () => {
    if (!numeroDocumento || !tipoDocumento) {
      return
    }

    // Si estaba en modo manual, cerrarlo al buscar referencias
    if (manualMode) {
      setManualMode(false)
    }


    // Limpiar selección anterior al buscar nuevas referencias
    setSelectedReferencia(null)
    if (onChange) {
      onChange({
        idReferencia: '',
        numeroReferencia: '',
        codigoestablecimientoOrigen: '',
        establecimientoOrigen: '',
        especialidad: '',
        codigoEspecialidad: '',
        codigoEstado: '',
        skipRefconSync: false
      })
    }

    await consultarReferencias({
      numerodocumento: numeroDocumento,
      tipodocumento: tipoDocumento,
      especialidadCodigo
    })

    // Marcar que ya se buscó y abrir el listado de referencias
    setHasSearched(true)
    setOpen(true)
  }

  const handleManualSubmit = () => {
    if (!manualReferencia.trim()) {
      return
    }


    // Notificar al componente padre con datos manuales
    if (onChange) {
      onChange({
        idReferencia: `manual-${Date.now()}`, // ID temporal para modo manual
        numeroReferencia: manualReferencia,
        codigoestablecimientoOrigen: '', // Se llenará desde el campo Establecimiento
        establecimientoOrigen: 'Ingreso Manual',
        especialidad: '',
        codigoEspecialidad: especialidadCodigo || '',
        codigoEstado: 'manual',
        skipRefconSync: true // Ingreso manual no sincroniza con REFCON
      })
    }

    // Mostrar confirmación visual
    setManualConfirmed(true)
    
    // Toast de éxito
    toast({
      title: "✅ Referencia Manual Registrada",
      description: `Número de referencia: ${manualReferencia}`,
      className: "bg-green-50 border-green-200 text-green-800",
      duration: 4000
    })

    // Mantener el valor visible y colapsar después de 2 segundos
    setTimeout(() => {
      setManualMode(false)
    }, 2000)
  }

  const handleSelectReferencia = (idReferencia: string) => {
    const referenciaSeleccionada = referencias.find(
      ref => ref.data.idReferencia === idReferencia
    )

    if (referenciaSeleccionada) {
      const refData = referenciaSeleccionada.data
      setSelectedReferencia(refData)

      // Notificar cambios al componente padre
      if (onChange) {
        // Determinar si debe omitir sincronización con REFCON (estados 5 y 7)
        const shouldSkipRefconSync = refData.codigoEstado === '5' || refData.codigoEstado === '7'
        
        onChange({
          idReferencia: refData.idReferencia,
          numeroReferencia: refData.numeroReferencia,
          codigoestablecimientoOrigen: refData.codigoestablecimientoOrigen,
          establecimientoOrigen: refData.establecimientoOrigen,
          especialidad: refData.especialidad,
          codigoEspecialidad: refData.codigoEspecialidad,
          codigoEstado: refData.codigoEstado,
          skipRefconSync: shouldSkipRefconSync
        })
      }

      // Notificar cambio de EESS
      if (onEessChange) {
        onEessChange(refData.codigoestablecimientoOrigen)
      }
    }
  }

  // Utilidad para ordenar por fecha (descendente)
  const parseFecha = (fecha: string): number => {
    if (!fecha) return 0
    
    // Formato DD-MM-YYYY (usado por REFCON)
    if (fecha.includes('-') && fecha.split('-').length === 3) {
      const parts = fecha.split('-')
      // Si el primer elemento tiene 4 dígitos, es YYYY-MM-DD
      if (parts[0].length === 4) {
        const d = new Date(fecha)
        return d.getTime()
      }
      // Si no, es DD-MM-YYYY
      const [day, month, year] = parts
      const d = new Date(Number(year), Number(month) - 1, Number(day))
      return d.getTime()
    }
    
    // Formato DD/MM/YYYY
    if (fecha.includes('/')) {
      const [day, month, year] = fecha.split('/')
      const d = new Date(Number(year), Number(month) - 1, Number(day))
      return d.getTime()
    }
    
    // Intentar parseo directo
    const d = new Date(fecha)
    return Number.isNaN(d.getTime()) ? 0 : d.getTime()
  }

  // Ordenar referencias por fecha descendente (más recientes primero)
  const sortedReferencias = [...referencias].sort((a, b) => {
    const fa = parseFecha(a.data.fechaEnvio)
    const fb = parseFecha(b.data.fechaEnvio)
    return fb - fa // descendente (más recientes arriba)
  })

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
      <Label className="text-sm font-medium text-gray-700">
        Referencia <span className="text-red-500">*</span>
      </Label>
      
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleBuscar}
          disabled={disabled || isLoading || !numeroDocumento || !tipoDocumento}
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white h-10"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Buscar Referencias
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // Al entrar en modo manual, cerrar el listado de referencias
            setOpen(false)
            setManualMode(!manualMode)
          }}
          disabled={disabled}
          className="flex flex-wrap items-center gap-2 border-gray-900 text-gray-900 hover:bg-gray-100 h-10 px-4"
        >
          <Edit3 className="h-4 w-4" />
          Manual
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-wrap items-center justify-center p-4 border rounded-lg bg-gray-50">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">Consultando referencias...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && !manualMode && (
        error.includes("6000|") ? (
          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-sm text-amber-800 font-medium">
              El usuario no tiene referencias activas.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <span>{error}</span>
            </AlertDescription>
          </Alert>
        )
      )}

      {/* Modo de ingreso manual */}
      {manualMode && (
        <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-gray-800">
              Ingreso Manual de Referencia
            </Label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-700">
              Número de Referencia <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Ej: 6211-00044"
              value={manualReferencia}
              onChange={(e) => setManualReferencia(e.target.value)}
              className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
            />
            <p className="text-xs text-gray-500 italic">
              El establecimiento se llenará automáticamente en el campo de abajo
            </p>
          </div>

          <Button
            type="button"
            onClick={handleManualSubmit}
            disabled={!manualReferencia.trim() || manualConfirmed}
            className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white font-medium"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirmar Referencia Manual
          </Button>

          {manualConfirmed && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                Referencia manual registrada: <strong>{manualReferencia}</strong>
              </AlertDescription>
            </Alert>
          )}

          {!manualConfirmed && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs text-yellow-700">
                Esta referencia se registrará como ingreso manual. Asegúrese de verificar los datos.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Modo Manual: Mostrar Input simple con el valor manual */}
      {value && value.startsWith('manual-') && manualReferencia && (
        <div className="space-y-2">
          <Input
            value={`Referencia Manual: ${manualReferencia}`}
            readOnly
            className="h-10 bg-green-50 border-green-300 text-green-800 font-medium cursor-default"
            disabled={disabled}
          />
        </div>
      )}

      {/* Modo Búsqueda: Mostrar Select con información completa */}
      {!isLoading && !error && hasSearched && referencias.length > 0 && !value?.startsWith('manual-') && (
        <div className="space-y-2">
          <Select
            value={value || ''}
            onValueChange={handleSelectReferencia}
            disabled={disabled}
            open={open}
            onOpenChange={setOpen}
          >
            <SelectTrigger className="w-full h-auto min-h-[40px]">
              {selectedReferencia ? (
                <div className="flex flex-wrap items-center gap-2 py-1 text-left w-full">
                  <span className="text-xs font-bold uppercase bg-green-100 text-green-700 px-2 py-1 rounded">
                    {selectedReferencia.estado}
                  </span>
                  <span className="font-semibold text-sm">
                    {selectedReferencia.numeroReferencia}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600 flex-1 truncate">
                    {selectedReferencia.descUpsDestino}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedReferencia.fechaEnvio}
                  </span>
                </div>
              ) : (
                <SelectValue placeholder="Seleccione una referencia..." />
              )}
      </SelectTrigger>
      <SelectContent className="max-h-[240px]">
              {sortedReferencias.map((ref) => {
                const data = ref.data
                const estado = data.estado?.toUpperCase() || ''
                
                // Mapeo de colores por código de estado REFCON
                const getEstadoColor = (codigoEstado: string, estado: string) => {
                  switch(codigoEstado) {
                    case '2': // PENDIENTE
                      return { bgColor: '#8A0016', labelColor: '#FFFFFF', selectable: false, label: 'Pendiente', skipRefconSync: false }
                    case '3': // ACEPTADO
                      return { bgColor: '#E6F7EB', labelColor: '#12AC26', selectable: true, label: 'Aceptada', skipRefconSync: false }
                    case '4': // RECHAZADO
                      return { bgColor: '#6A6A6A', labelColor: '#FFFFFF', selectable: false, label: 'Rechazada', skipRefconSync: false }
                    case '5': // PACIENTE RECIBIDO - SELECCIONABLE pero NO sincronizar con REFCON
                      return { bgColor: '#1D73E5', labelColor: '#FFFFFF', selectable: true, label: 'Recibido', skipRefconSync: true }
                    case '7': // PACIENTE CITADO - SELECCIONABLE pero NO sincronizar con REFCON
                      return { bgColor: '#8A4BAF', labelColor: '#FFFFFF', selectable: true, label: 'Citado', skipRefconSync: true }
                    case '8': // CONTRAREFERIDO
                      return { bgColor: '#D1B21F', labelColor: '#000000', selectable: false, label: 'Contrareferido', skipRefconSync: false }
                    case '9': // OBSERVADO
                      return { bgColor: '#F4A33B', labelColor: '#000000', selectable: false, label: 'Observada', skipRefconSync: false }
                    case '6': // DE BAJA (asumiendo código 6)
                      return { bgColor: '#4D4D4D', labelColor: '#FFFFFF', selectable: false, label: 'De Baja', skipRefconSync: false }
                    default:
                      return { bgColor: '#9CA3AF', labelColor: '#111827', selectable: false, label: estado || 'Desconocido', skipRefconSync: false }
                  }
                }
                
                const estadoColor = getEstadoColor(data.codigoEstado || '', estado)
                
                return (
                  <SelectItem 
                    key={data.idReferencia} 
                    value={data.idReferencia}
                    disabled={!estadoColor.selectable}
                    className={estadoColor.selectable ? "cursor-pointer" : "cursor-not-allowed opacity-75"}
                    style={{
                      color: 'black',
                      fontWeight: 500
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2 py-2 px-1 ">
                      <span
                        className="text-xs font-bold uppercase px-2 py-1 rounded"
                        style={{
                          backgroundColor: estadoColor.bgColor,
                          color: estadoColor.labelColor || '#000000'
                        }}
                      >
                        {estadoColor.label}
                      </span>
                      <span className="font-bold text-black text-sm">
                        {data.numeroReferencia}
                      </span>
                      <span className="text-black/70 mx-1">•</span>
                      <span className="text-sm flex-1 truncate text-black/90">
                        {data.descUpsDestino}
                      </span>
                      <span className="text-xs text-black/70">
                        {data.fechaEnvio}
                      </span>
                      {!estadoColor.selectable && (
                        <span className="text-xs bg-black/20 px-2 py-0.5 rounded font-medium">
                          Solo info
                        </span>
                      )}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {/* Información completa de referencia seleccionada */}
          {selectedReferencia && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-xs space-y-1">
                <div className="font-semibold">✅ Referencia Seleccionada:</div>
                <div><strong>N° Referencia:</strong> {selectedReferencia.numeroReferencia}</div>
                <div><strong>EESS Origen:</strong> {selectedReferencia.codigoestablecimientoOrigen} - {selectedReferencia.establecimientoOrigen}</div>
                <div><strong>Destino:</strong> {selectedReferencia.descUpsDestino}</div>
                <div><strong>Fecha:</strong> {selectedReferencia.fechaEnvio}</div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Sin resultados - solo mostrar si se buscó y no hay referencias */}
      {!isLoading && !error && hasSearched && referencias.length === 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-xs text-yellow-700">
            No se encontraron referencias para este documento
          </AlertDescription>
        </Alert>
      )}

      {/* Mensaje cuando aún no se ha buscado */}
      {!hasSearched && !isLoading && !error && !manualMode && (
        <p className="text-xs text-gray-500">
          Use "Buscar Referencias" para consultar referencias en REFCON o "Manual" para ingresar una referencia manual.
        </p>
      )}
    </div>
  )
}
