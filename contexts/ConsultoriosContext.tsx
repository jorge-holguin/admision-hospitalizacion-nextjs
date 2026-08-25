import React, { createContext, useState, useContext, useCallback } from 'react'
import { consultorioServerService } from '@/services/master-tables/consultorioService'

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
      
      const result = await consultorioServerService.getConsultorios(1, 100, { tipo: 'E' })
      const consultoriosData = result.data.map((item: any) => ({
        CONSULTORIO: String(item.CONSULTORIO || item.consultorio || ''),
        NOMBRE: String(item.NOMBRE || item.nombre || ''),
      }))
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
      
      const result = await consultorioServerService.getConsultorios(1, 100, { tipo: 'H' })
      const consultoriosData = result.data.map((item: any) => ({
        CONSULTORIO: String(item.CONSULTORIO || item.consultorio || ''),
        NOMBRE: String(item.NOMBRE || item.nombre || ''),
      }))
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
