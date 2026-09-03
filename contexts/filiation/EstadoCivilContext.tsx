"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface EstadoCivil {
  estadoCivil: string
  nombre: string
  activo: number
  reniec: string | null
}

interface EstadoCivilContextType {
  estadosCiviles: EstadoCivil[]
  loading: boolean
  error: string | null
}

const EstadoCivilContext = createContext<EstadoCivilContextType | undefined>(undefined)

export function EstadoCivilProvider({ children }: { children: ReactNode }) {
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_CITAS_MASTER_URL

  useEffect(() => {
    loadEstadosCiviles()
  }, [])

  const loadEstadosCiviles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/maestro/estado-civil/obtener-todos`)
      
      if (!response.ok) throw new Error('Error al cargar estados civiles')
      
      const data = await response.json()
      setEstadosCiviles(data || [])
      setError(null)
    } catch (err) {
      console.error('Error al cargar estados civiles:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setEstadosCiviles([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <EstadoCivilContext.Provider value={{ estadosCiviles, loading, error }}>
      {children}
    </EstadoCivilContext.Provider>
  )
}

export function useEstadoCivil() {
  const context = useContext(EstadoCivilContext)
  if (context === undefined) {
    throw new Error('useEstadoCivil must be used within a EstadoCivilProvider')
  }
  return context
}
