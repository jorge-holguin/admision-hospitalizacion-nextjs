"use client"

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react'

// Estructura de la respuesta de la API
interface ReferenciaData {
  codigoEstado: string
  estado: string
  idReferencia: string
  numeroReferencia: string
  fechaEnvio: string
  upsOrigen: string
  descUpsOrigen: string
  upsDestino: string
  descUpsDestino: string
  codigoestablecimientoOrigen: string
  establecimientoOrigen: string
  tipoDocumento: string
  numeroDocumento: string
  codigoEspecialidad: string
  especialidad: string
}

interface Referencia {
  rownum: string
  data: ReferenciaData
}

interface ReferenciaAPIResponse {
  codigo: string
  mensaje: string
  datos: {
    paginas: number
    porPagina: string
    total: number
    datos: Referencia[]
  }
}

// Estado del contexto
interface ReferenciaContextState {
  referencias: Referencia[]
  isLoading: boolean
  error: string | null
  selectedReferencia: ReferenciaData | null
  consultarReferencias: (params: {
    numerodocumento: string
    tipodocumento: string
    especialidadCodigo?: string
  }) => Promise<void>
  setSelectedReferencia: (ref: ReferenciaData | null) => void
  clearReferencias: () => void
}

const ReferenciaContext = createContext<ReferenciaContextState | undefined>(undefined)

const API_REFCON_URL = process.env.NEXT_PUBLIC_API_REFCON_URL || 'http://192.168.0.31:9011/api'
const ESTABLECIMIENTO_DESTINO = '5947' // Hospital Jose Agurto Tello

export function ReferenciaProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [referencias, setReferencias] = useState<Referencia[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedReferencia, setSelectedReferencia] = useState<ReferenciaData | null>(null)

  const consultarReferencias = async (params: {
    numerodocumento: string
    tipodocumento: string
    especialidadCodigo?: string
  }) => {
    setIsLoading(true)
    setError(null)

    console.log('🔍 Consultando referencias:', {
      numerodocumento: params.numerodocumento,
      tipodocumento: params.tipodocumento,
      especialidadCodigo: params.especialidadCodigo
    })

    try {
      // Crear AbortController para timeout de 5 segundos
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${API_REFCON_URL}/referencia/consultar-referencias`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          establecimientoDestino: ESTABLECIMIENTO_DESTINO,
          limite: "10",
          numerodocumento: params.numerodocumento,
          pagina: "1",
          tipodocumento: params.tipodocumento
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Siempre intentar leer el cuerpo JSON, incluso si el status HTTP es 4xx/5xx,
      // porque el servicio REFCON envía "codigo" y "mensaje" útiles (6000, 9000, etc.)
      const data: ReferenciaAPIResponse = await response.json()

      console.log('📋 Respuesta de API de referencias:', data)

      if (data.codigo === '0000' && data.datos?.datos) {
        // Mostrar todas las referencias (ACEPTADAS, CITADAS, PENDIENTES)
        console.log(`✅ Referencias encontradas: ${data.datos.datos.length}`)

        setReferencias(data.datos.datos)

        if (data.datos.datos.length === 0) {
          setError('No se encontraron referencias para este documento')
        }
      } else if (data.codigo === '6000') {
        // Error específico: No existe registros (sin referencias activas)
        setReferencias([])
        setError(`${data.codigo}|${data.mensaje || 'No existe registros'}`)
      } else if (data.codigo === '9000') {
        // Error de servicio REFCON
        setReferencias([])
        setError('Error del servicio REFCON. Intente nuevamente más tarde.')
      } else {
        setReferencias([])
        // Si vino un HTTP 400/500 sin código conocido, mostrar detalle básico
        setError(data.mensaje || `Error al consultar referencias (código ${data.codigo ?? 'desconocido'})`)
      }
    } catch (err) {
      console.error('❌ Error al consultar referencias:', err)
      
      // Detectar timeout
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Tiempo de espera agotado (5 segundos). El servicio REFCON no responde.')
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
      
      setReferencias([])
    } finally {
      setIsLoading(false)
    }
  }

  const clearReferencias = () => {
    setReferencias([])
    setSelectedReferencia(null)
    setError(null)
  }

  const value = useMemo(() => ({
    referencias,
    isLoading,
    error,
    selectedReferencia,
    consultarReferencias,
    setSelectedReferencia,
    clearReferencias
  }), [referencias, isLoading, error, selectedReferencia])

  return (
    <ReferenciaContext.Provider value={value}>
      {children}
    </ReferenciaContext.Provider>
  )
}

export function useReferencia() {
  const context = useContext(ReferenciaContext)
  if (context === undefined) {
    throw new Error('useReferencia must be used within a ReferenciaProvider')
  }
  return context
}
