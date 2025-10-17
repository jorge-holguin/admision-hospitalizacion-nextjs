"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Ocupacion {
  ocupacion: string
  nombre: string
  activo: number
}

interface OcupacionContextType {
  ocupaciones: Ocupacion[]
  loading: boolean
  error: string | null
}

const OcupacionContext = createContext<OcupacionContextType | undefined>(undefined)

export function OcupacionProvider({ children }: { children: ReactNode }) {
  const [ocupaciones, setOcupaciones] = useState<Ocupacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL

  useEffect(() => {
    loadOcupaciones()
  }, [])

  const loadOcupaciones = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/maestro/ocupacion/obtener-todos`)
      
      if (!response.ok) throw new Error('Error al cargar ocupaciones')
      
      const data = await response.json()
      setOcupaciones(data || [])
      setError(null)
    } catch (err) {
      console.error('Error al cargar ocupaciones:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setOcupaciones([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <OcupacionContext.Provider value={{ ocupaciones, loading, error }}>
      {children}
    </OcupacionContext.Provider>
  )
}

export function useOcupacion() {
  const context = useContext(OcupacionContext)
  if (context === undefined) {
    throw new Error('useOcupacion must be used within a OcupacionProvider')
  }
  return context
}
