"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { API_ENDPOINTS } from '@/lib/api-config'

interface TipoCita {
  Tipo_cita: string
  Nombre: string
}

interface TipoCitaContextType {
  tiposCita: TipoCita[]
  loading: boolean
  error: string | null
  refetch: () => void
}

const TipoCitaContext = createContext<TipoCitaContextType | undefined>(undefined)

interface TipoCitaProviderProps {
  children: ReactNode
}

export function TipoCitaProvider({ children }: TipoCitaProviderProps) {
  const [tiposCita, setTiposCita] = useState<TipoCita[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTiposCita = async () => {
    if (loading) return // Prevent multiple simultaneous calls
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(API_ENDPOINTS.citas.tipos)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setTiposCita(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error loading tipos de cita:', err)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchTiposCita()
  }

  useEffect(() => {
    fetchTiposCita()
  }, [])

  const value: TipoCitaContextType = {
    tiposCita,
    loading,
    error,
    refetch
  }

  return (
    <TipoCitaContext.Provider value={value}>
      {children}
    </TipoCitaContext.Provider>
  )
}

export function useTipoCita(): TipoCitaContextType {
  const context = useContext(TipoCitaContext)
  if (context === undefined) {
    throw new Error('useTipoCita must be used within a TipoCitaProvider')
  }
  return context
}
