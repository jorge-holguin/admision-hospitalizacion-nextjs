import React, { createContext, useState, useContext, useCallback } from 'react'

export type ConsultorioInfo = {
  CONSULTORIO: string
  NOMBRE: string
}

type ConsultoriosContextType = {
  consultorios: ConsultorioInfo[]
  consultoriosHospitalizacion: ConsultorioInfo[]
  loading: boolean
  loadingHospitalizacion: boolean
  getConsultorioNombre: (codigo: string) => string
  getConsultorioHospitalizacionNombre: (codigo: string) => string
  loadConsultoriosEmergencia: () => Promise<void>
  loadConsultoriosHospitalizacion: () => Promise<void>
}

const ConsultoriosContext = createContext<ConsultoriosContextType>({
  consultorios: [],
  consultoriosHospitalizacion: [],
  loading: false,
  loadingHospitalizacion: false,
  getConsultorioNombre: () => '-',
  getConsultorioHospitalizacionNombre: () => '-',
  loadConsultoriosEmergencia: async () => {},
  loadConsultoriosHospitalizacion: async () => {},
})

export function ConsultoriosProvider({ children }: { children: React.ReactNode }) {
  const [consultorios, setConsultorios] = useState<ConsultorioInfo[]>([])
  const [consultoriosHospitalizacion, setConsultoriosHospitalizacion] = useState<ConsultorioInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingHospitalizacion, setLoadingHospitalizacion] = useState(false)

  // ❌ REMOVIDO: Ya no cargamos automáticamente consultorios de emergencia
  // Los consultorios se cargan bajo demanda cuando se necesitan:
  // - Emergencia: llama a loadConsultoriosEmergencia() cuando abre el modal
  // - Hospitalización: llama a loadConsultoriosHospitalizacion() cuando abre el modal

  const loadConsultoriosEmergencia = useCallback(async () => {
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
  }, [])

  const loadConsultoriosHospitalizacion = useCallback(async () => {
    try {
      setLoadingHospitalizacion(true)
      console.log('🏥 Cargando consultorios de hospitalización desde contexto...')
      
      const response = await fetch('/api/consultorio?tipo=H')
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Consultorios de hospitalización cargados en contexto:', data)
      
      // Extraer los items de la respuesta
      const consultoriosData = data.items || data.data || []
      setConsultoriosHospitalizacion(consultoriosData)
      
    } catch (error) {
      console.error('❌ Error al cargar consultorios de hospitalización en contexto:', error)
      setConsultoriosHospitalizacion([])
    } finally {
      setLoadingHospitalizacion(false)
    }
  }, [])

  const getConsultorioNombre = useCallback((codigo: string): string => {
    if (!codigo) return '-'
    const clean = String(codigo).trim()
    const found = consultorios.find(c => c.CONSULTORIO && c.CONSULTORIO.trim() === clean)
    return found?.NOMBRE || clean
  }, [consultorios])

  const getConsultorioHospitalizacionNombre = useCallback((codigo: string): string => {
    if (!codigo) return '-'
    const clean = String(codigo).trim()
    const found = consultoriosHospitalizacion.find(c => c.CONSULTORIO && c.CONSULTORIO.trim() === clean)
    return found?.NOMBRE || clean
  }, [consultoriosHospitalizacion])

  return (
    <ConsultoriosContext.Provider value={{ 
      consultorios, 
      consultoriosHospitalizacion,
      loading, 
      loadingHospitalizacion,
      getConsultorioNombre,
      getConsultorioHospitalizacionNombre,
      loadConsultoriosEmergencia,
      loadConsultoriosHospitalizacion
    }}>
      {children}
    </ConsultoriosContext.Provider>
  )
}

export function useConsultorios() {
  return useContext(ConsultoriosContext)
}
