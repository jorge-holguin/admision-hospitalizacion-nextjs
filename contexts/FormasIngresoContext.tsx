import React, { createContext, useState, useEffect, useContext } from 'react'
import { formaIngresoService } from '@/services/emergencia/formaIngresoService'

export type FormaIngreso = {
  FORMA_INGRESO: string
  NOMBRE: string
}

type FormasIngresoContextType = {
  formasIngreso: FormaIngreso[]
  loading: boolean
  getFormaIngresoNombre: (codigo: string) => string
}

const FormasIngresoContext = createContext<FormasIngresoContextType>({
  formasIngreso: [],
  loading: false,
  getFormaIngresoNombre: () => '-',
})

export function FormasIngresoProvider({ children }: { children: React.ReactNode }) {
  const [formasIngreso, setFormasIngreso] = useState<FormaIngreso[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Cargar formas de ingreso al inicializar
  useEffect(() => {
    if (!initialized) {
      loadFormasIngreso()
      setInitialized(true)
    }
  }, [initialized])

  const loadFormasIngreso = async () => {
    try {
      setLoading(true)

      console.log('🚑 [FormasIngresoContext] fetching formas de ingreso')
      const items = await formaIngresoService.findAll()

      const formasData: FormaIngreso[] = items.map((item: any) => ({
        FORMA_INGRESO: item.codigo || item.formaIngreso || item.FORMA_INGRESO || '',
        NOMBRE: item.nombre || item.NOMBRE || ''
      }))

      console.log('🚑 [FormasIngresoContext] items count', formasData.length)
      setFormasIngreso(formasData)

    } catch (error) {
      console.error('❌ Error al cargar formas de ingreso en contexto:', error)
      setFormasIngreso([])
    } finally {
      setLoading(false)
    }
  }

  const getFormaIngresoNombre = (codigo: string): string => {
    if (!codigo) return '-'
    const clean = String(codigo).trim()
    const found = formasIngreso.find(fi => fi.FORMA_INGRESO && fi.FORMA_INGRESO.trim() === clean)
    return found?.NOMBRE || clean
  }

  return (
    <FormasIngresoContext.Provider value={{ formasIngreso, loading, getFormaIngresoNombre }}>
      {children}
    </FormasIngresoContext.Provider>
  )
}

export function useFormasIngreso() {
  return useContext(FormasIngresoContext)
}
