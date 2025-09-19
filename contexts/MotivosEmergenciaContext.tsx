import React, { createContext, useState, useEffect, useContext } from 'react'

export type MotivoEmergencia = {
  MOTIVO_EMERGENCIA: string
  NOMBRE: string
}

type MotivosEmergenciaContextType = {
  motivosEmergencia: MotivoEmergencia[]
  loading: boolean
  getMotivoEmergenciaNombre: (codigo: string) => string
}

const MotivosEmergenciaContext = createContext<MotivosEmergenciaContextType>({
  motivosEmergencia: [],
  loading: false,
  getMotivoEmergenciaNombre: () => '-',
})

export function MotivosEmergenciaProvider({ children }: { children: React.ReactNode }) {
  const [motivosEmergencia, setMotivosEmergencia] = useState<MotivoEmergencia[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Cargar motivos de emergencia al inicializar
  useEffect(() => {
    if (!initialized) {
      loadMotivosEmergencia()
      setInitialized(true)
    }
  }, [initialized])

  const loadMotivosEmergencia = async () => {
    try {
      setLoading(true)
      console.log('🚨 Cargando motivos de emergencia desde contexto...')
      
      const response = await fetch('/api/motivo-emergencia')
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Motivos de emergencia cargados en contexto:', data)
      
      // Extraer los items de la respuesta
      const motivosData = data.items || data.data || []
      setMotivosEmergencia(motivosData)
      
    } catch (error) {
      console.error('❌ Error al cargar motivos de emergencia en contexto:', error)
      setMotivosEmergencia([])
    } finally {
      setLoading(false)
    }
  }

  const getMotivoEmergenciaNombre = (codigo: string): string => {
    if (!codigo) return '-'
    const clean = String(codigo).trim()
    const found = motivosEmergencia.find(me => me.MOTIVO_EMERGENCIA && me.MOTIVO_EMERGENCIA.trim() === clean)
    return found?.NOMBRE || clean
  }

  return (
    <MotivosEmergenciaContext.Provider value={{ motivosEmergencia, loading, getMotivoEmergenciaNombre }}>
      {children}
    </MotivosEmergenciaContext.Provider>
  )
}

export function useMotivosEmergencia() {
  return useContext(MotivosEmergenciaContext)
}
