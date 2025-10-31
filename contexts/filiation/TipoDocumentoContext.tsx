"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface TipoDocumento {
  tipoDocumento: string
  nombre: string
  activo: number
  tipoLabo: number
  tipoRef: number
  tipoSis: string
  tipoCdc: string | null
}

interface TipoDocumentoContextType {
  tiposDocumento: TipoDocumento[]
  isLoading: boolean
  error: string | null
  getTipoDocumentoByCode: (code: string) => TipoDocumento | undefined
}

const TipoDocumentoContext = createContext<TipoDocumentoContextType | undefined>(undefined)

export function TipoDocumentoProvider({ children }: { children: ReactNode }) {
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTiposDocumento = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/maestro/tipoDocumento`)
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('✅ TipoDocumentoContext: Tipos de documento cargados:', data.length)
        
        // Filtrar solo los activos
        const activos = data.filter((tipo: TipoDocumento) => tipo.activo === 1)
        setTiposDocumento(activos)
        setIsLoading(false)
      } catch (err) {
        console.error('❌ TipoDocumentoContext: Error al cargar tipos de documento:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setIsLoading(false)
      }
    }

    fetchTiposDocumento()
  }, [])

  const getTipoDocumentoByCode = (code: string): TipoDocumento | undefined => {
    // Normalizar código (trim y uppercase)
    const normalizedCode = code?.trim().toUpperCase()
    return tiposDocumento.find(tipo => tipo.tipoDocumento.trim().toUpperCase() === normalizedCode)
  }

  return (
    <TipoDocumentoContext.Provider value={{ tiposDocumento, isLoading, error, getTipoDocumentoByCode }}>
      {children}
    </TipoDocumentoContext.Provider>
  )
}

export function useTipoDocumento() {
  const context = useContext(TipoDocumentoContext)
  if (context === undefined) {
    throw new Error('useTipoDocumento must be used within a TipoDocumentoProvider')
  }
  return context
}
