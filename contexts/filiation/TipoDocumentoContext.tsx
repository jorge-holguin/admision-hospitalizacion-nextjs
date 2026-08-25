"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { API_ENDPOINTS } from '@/lib/api-config'

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
        const response = await fetch(API_ENDPOINTS.utils.documentTypes)
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        
        // Filtrar solo los activos y ordenar: DNI primero, Ninguno al final
        const activos = data
          .filter((tipo: TipoDocumento) => tipo.activo === 1)
          .sort((a: TipoDocumento, b: TipoDocumento) => {
            const codeA = a.tipoDocumento.trim()
            const codeB = b.tipoDocumento.trim()
            // DNI primero
            if (codeA === 'D') return -1
            if (codeB === 'D') return 1
            // Ninguno (0) al final
            if (codeA === '0') return 1
            if (codeB === '0') return -1
            // El resto alfabéticamente por nombre
            return a.nombre.localeCompare(b.nombre)
          })
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
