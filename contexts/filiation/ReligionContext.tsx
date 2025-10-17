"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Religion {
  religion: string
  nombre: string
}

interface ReligionContextType {
  religiones: Religion[]
  loading: boolean
  error: string | null
}

const ReligionContext = createContext<ReligionContextType | undefined>(undefined)

export function ReligionProvider({ children }: { children: ReactNode }) {
  const [religiones, setReligiones] = useState<Religion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL

  useEffect(() => {
    loadReligiones()
  }, [])

  const loadReligiones = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/maestro/religion/obtener-todos`)
      
      if (!response.ok) throw new Error('Error al cargar religiones')
      
      const data = await response.json()
      setReligiones(data || [])
      setError(null)
    } catch (err) {
      console.error('Error al cargar religiones:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setReligiones([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <ReligionContext.Provider value={{ religiones, loading, error }}>
      {children}
    </ReligionContext.Provider>
  )
}

export function useReligion() {
  const context = useContext(ReligionContext)
  if (context === undefined) {
    throw new Error('useReligion must be used within a ReligionProvider')
  }
  return context
}
