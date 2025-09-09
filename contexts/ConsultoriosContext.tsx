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

  useEffect(() => {
    const fetchConsultorios = async () => {
      if (initialized) return
      try {
        setLoading(true)
        // Traer consultorios tipo C (citas) sin filtro para precargar
        const res = await fetch('/api/consultorio?tipo=C&search=')
        if (res.ok) {
          const data = await res.json()
          const items: ConsultorioInfo[] = Array.isArray(data?.items) ? data.items : []
          setConsultorios(items)
        }
      } catch (e) {
        console.error('Error al cargar consultorios:', e)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }
    fetchConsultorios()
  }, [initialized])

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
