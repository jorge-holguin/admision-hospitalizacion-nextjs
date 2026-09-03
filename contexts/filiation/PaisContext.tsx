"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface Pais {
  pais: string
  nombre: string
  activo: number
}

interface PaisContextType {
  paises: Pais[]
  loading: boolean
  error: string | null
  searchPaises: (nombre: string) => Promise<void>
}

const PaisContext = createContext<PaisContextType | undefined>(undefined)

export function PaisProvider({ children }: { children: ReactNode }) {
  const [paises, setPaises] = useState<Pais[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_CITAS_MASTER_URL

  const searchPaises = async (nombre: string) => {
    if (!nombre || nombre.length < 2) {
      setPaises([])
      return
    }

    try {
      setLoading(true)
      console.log('🔍 PaisContext: Buscando países:', `${API_BASE_URL}/maestro/pais/buscar?nombre=${nombre}&limite=20`)
      const response = await fetch(`${API_BASE_URL}/maestro/pais/buscar?nombre=${encodeURIComponent(nombre)}&limite=20`)
      
      if (!response.ok) throw new Error('Error al buscar países')
      
      const data = await response.json()
      console.log('✅ PaisContext: Países encontrados:', data?.length || 0, 'registros')
      setPaises(data || [])
      setError(null)
    } catch (err) {
      console.error('❌ Error al buscar países:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setPaises([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <PaisContext.Provider value={{ paises, loading, error, searchPaises }}>
      {children}
    </PaisContext.Provider>
  )
}

export function usePais() {
  const context = useContext(PaisContext)
  if (context === undefined) {
    throw new Error('usePais must be used within a PaisProvider')
  }
  return context
}
