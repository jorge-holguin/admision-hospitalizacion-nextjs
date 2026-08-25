import React, { createContext, useState, useEffect, useContext } from 'react'
import { origenHospitalizacionService } from '@/services/hospitalizacion/origenHospitalizacionService'

export type OrigenHospitalizacion = {
  ORIGEN: string
  NOMBRE: string
  ACTIVO?: number
}

type OrigenHospitalizacionContextType = {
  origenes: OrigenHospitalizacion[]
  loading: boolean
  getOrigenNombre: (codigo: string) => string
}

const OrigenHospitalizacionContext = createContext<OrigenHospitalizacionContextType>({
  origenes: [],
  loading: false,
  getOrigenNombre: () => '-',
})

export function OrigenHospitalizacionProvider({ children }: { children: React.ReactNode }) {
  const [origenes, setOrigenes] = useState<OrigenHospitalizacion[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Cargar orígenes de hospitalización al inicializar
  useEffect(() => {
    if (!initialized) {
      loadOrigenes()
      setInitialized(true)
    }
  }, [initialized])

  const loadOrigenes = async () => {
    try {
      setLoading(true)

      const items = await origenHospitalizacionService.findAll({ take: 100 })

      const origenesData: OrigenHospitalizacion[] = items.map((item: any) => ({
        ORIGEN: item.ORIGEN || item.origen || '',
        NOMBRE: item.NOMBRE || item.NOM_CONSULTORIO || item.NOM_MEDICO || item.nombre || '',
        ACTIVO: item.ACTIVO ?? item.activo ?? 1
      }))

      setOrigenes(origenesData)

    } catch (error) {
      console.error('❌ Error al cargar orígenes de hospitalización en contexto:', error)
      // Datos de fallback en caso de error
      const fallbackData = [
        { ORIGEN: 'EM', NOMBRE: 'Emergencia' },
        { ORIGEN: 'CE', NOMBRE: 'Consulta Externa' },
        { ORIGEN: 'RN', NOMBRE: 'Recién Nacido' }
      ];
      setOrigenes(fallbackData)
    } finally {
      setLoading(false)
    }
  }

  const getOrigenNombre = (codigo: string): string => {
    if (!codigo) return '-'
    const clean = String(codigo).trim()
    
    // Buscar primero una coincidencia exacta
    let found = origenes.find(origen => origen.ORIGEN && origen.ORIGEN.trim() === clean)
    
    // Si no se encuentra, buscar ignorando espacios en blanco
    if (!found) {
      found = origenes.find(origen => {
        if (!origen.ORIGEN) return false;
        // Eliminar todos los espacios para comparación
        const origenTrimmed = origen.ORIGEN.replace(/\s+/g, '');
        const codeTrimmed = clean.replace(/\s+/g, '');
        return origenTrimmed === codeTrimmed;
      });
    }
    
    return found?.NOMBRE || clean
  }

  return (
    <OrigenHospitalizacionContext.Provider value={{ origenes, loading, getOrigenNombre }}>
      {children}
    </OrigenHospitalizacionContext.Provider>
  )
}

export function useOrigenHospitalizacion() {
  return useContext(OrigenHospitalizacionContext)
}
