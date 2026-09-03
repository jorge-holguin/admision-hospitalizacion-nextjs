"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface GradoInstruccion {
  gradoInstruccion: string
  nombre: string
  activo: number
  reniec: string | null
  cdc: string
}

interface GradoInstruccionContextType {
  gradosInstruccion: GradoInstruccion[]
  loading: boolean
  error: string | null
}

const GradoInstruccionContext = createContext<GradoInstruccionContextType | undefined>(undefined)

export function GradoInstruccionProvider({ children }: { children: ReactNode }) {
  const [gradosInstruccion, setGradosInstruccion] = useState<GradoInstruccion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_CITAS_MASTER_URL

  useEffect(() => {
    loadGradosInstruccion()
  }, [])

  const loadGradosInstruccion = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/maestro/grado-instruccion/buscar?limite=50`)
      
      if (!response.ok) throw new Error('Error al cargar grados de instrucción')
      
      const data = await response.json()
      setGradosInstruccion(data || [])
      setError(null)
    } catch (err) {
      console.error('Error al cargar grados de instrucción:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setGradosInstruccion([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <GradoInstruccionContext.Provider value={{ gradosInstruccion, loading, error }}>
      {children}
    </GradoInstruccionContext.Provider>
  )
}

export function useGradoInstruccion() {
  const context = useContext(GradoInstruccionContext)
  if (context === undefined) {
    throw new Error('useGradoInstruccion must be used within a GradoInstruccionProvider')
  }
  return context
}
