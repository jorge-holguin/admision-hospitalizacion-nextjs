import React, { createContext, useState, useEffect, useContext } from 'react'

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
      console.log('🚪 Cargando formas de ingreso desde contexto...')
      
      const response = await fetch('/api/emergency/admission-types')
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Formas de ingreso cargadas en contexto:', data)
      
      // Extraer los items de la respuesta
      const formasData = data.items || data.data || []
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
