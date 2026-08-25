"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Seguro, seguroService } from '@/services/citas/seguroService'

interface SegurosCitaContextType {
  seguros: Seguro[]
  loading: boolean
  error: string | null
  refreshSeguros: () => Promise<void>
}

const SegurosCitaContext = createContext<SegurosCitaContextType | undefined>(undefined)

export function useSegurosCita() {
  const context = useContext(SegurosCitaContext)
  if (context === undefined) {
    throw new Error('useSegurosCita must be used within a SegurosCitaProvider')
  }
  return context
}

interface SegurosCitaProviderProps {
  children: ReactNode
  codCita?: string
}

export function SegurosCitaProvider({ children, codCita = '1' }: SegurosCitaProviderProps) {
  const [seguros, setSeguros] = useState<Seguro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSeguros = async () => {
    try {
      setLoading(true)
      setError(null)

      const data: Seguro[] = await seguroService.getSegurosByCodCita(codCita)

      setSeguros(data)
    } catch (err) {
      console.error('Error loading seguros:', err)
      setError(err instanceof Error ? err.message : 'Unknown error loading seguros')
      setSeguros([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeguros()
  }, [codCita])

  const refreshSeguros = async () => {
    await fetchSeguros()
  }

  const value = {
    seguros,
    loading,
    error,
    refreshSeguros
  }

  return (
    <SegurosCitaContext.Provider value={value}>
      {children}
    </SegurosCitaContext.Provider>
  )
}
