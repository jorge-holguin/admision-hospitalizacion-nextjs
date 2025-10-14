"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Seguro {
  Seguro: string
  Nombre: string
  CREA_CUENTA: string
}

interface SeguroContextType {
  seguros: Seguro[]
  loading: boolean
  error: string | null
  refetch: () => void
}

const SeguroContext = createContext<SeguroContextType | undefined>(undefined)

interface SeguroProviderProps {
  children: ReactNode
}

export function SeguroProvider({ children }: SeguroProviderProps) {
  const [seguros, setSeguros] = useState<Seguro[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSeguros = async () => {
    if (loading) return // Prevent multiple simultaneous calls
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/utils/insurances')
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setSeguros(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error loading seguros:', err)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchSeguros()
  }

  useEffect(() => {
    fetchSeguros()
  }, [])

  const value: SeguroContextType = {
    seguros,
    loading,
    error,
    refetch
  }

  return (
    <SeguroContext.Provider value={value}>
      {children}
    </SeguroContext.Provider>
  )
}

export function useSeguro(): SeguroContextType {
  const context = useContext(SeguroContext)
  if (context === undefined) {
    throw new Error('useSeguro must be used within a SeguroProvider')
  }
  return context
}
