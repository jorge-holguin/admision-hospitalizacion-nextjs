"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Etnia {
  codEtnia: string
  etPueInd: string
  activo: number
}

interface EtniaContextType {
  etnias: Etnia[]
  loading: boolean
  error: string | null
}

const EtniaContext = createContext<EtniaContextType | undefined>(undefined)

export function EtniaProvider({ children }: { children: ReactNode }) {
  const [etnias, setEtnias] = useState<Etnia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_CITAS_MASTER_URL

  useEffect(() => {
    loadEtnias()
  }, [])

  const loadEtnias = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/maestro/etnia/obtener-todos`)
      
      if (!response.ok) throw new Error('Error al cargar etnias')
      
      const data = await response.json()
      setEtnias(data || [])
      setError(null)
    } catch (err) {
      console.error('❌ Error al cargar etnias:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setEtnias([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <EtniaContext.Provider value={{ etnias, loading, error }}>
      {children}
    </EtniaContext.Provider>
  )
}

export function useEtnia() {
  const context = useContext(EtniaContext)
  if (context === undefined) {
    throw new Error('useEtnia must be used within a EtniaProvider')
  }
  return context
}
