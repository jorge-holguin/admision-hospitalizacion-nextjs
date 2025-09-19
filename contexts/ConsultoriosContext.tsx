import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'

export type ConsultorioInfo = {
  CONSULTORIO: string
  NOMBRE: string
}

type ConsultoriosContextType = {
  consultorios: ConsultorioInfo[]
  loading: boolean
  getConsultorioNombre: (codigo: string) => string
}

const ConsultoriosContext = createContext<ConsultoriosContextType>({
  consultorios: [],
  loading: false,
  getConsultorioNombre: () => '-',
})

export function ConsultoriosProvider({ children }: { children: React.ReactNode }) {
  const [consultorios, setConsultorios] = useState<ConsultorioInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Cargar consultorios de emergencia al inicializar
  useEffect(() => {
    if (!initialized) {
      loadConsultoriosEmergencia()
      setInitialized(true)
    }
  }, [initialized])

  const loadConsultoriosEmergencia = async () => {
    try {
      setLoading(true)
      console.log('🏥 Cargando consultorios de emergencia desde contexto...')
      
      const response = await fetch('/api/consultorio?tipo=E')
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Consultorios de emergencia cargados en contexto:', data)
      
      // Extraer los items de la respuesta
      const consultoriosData = data.items || data.data || []
      setConsultorios(consultoriosData)
      
    } catch (error) {
      console.error('❌ Error al cargar consultorios de emergencia en contexto:', error)
      setConsultorios([])
    } finally {
      setLoading(false)
    }
  }

  const getConsultorioNombre = useCallback((codigo: string): string => {
    if (!codigo) return '-'
    const clean = String(codigo).trim()
    const found = consultorios.find(c => c.CONSULTORIO && c.CONSULTORIO.trim() === clean)
    return found?.NOMBRE || clean
  }, [consultorios])

  return (
    <ConsultoriosContext.Provider value={{ consultorios, loading, getConsultorioNombre }}>
      {children}
    </ConsultoriosContext.Provider>
  )
}

export function useConsultorios() {
  return useContext(ConsultoriosContext)
}
