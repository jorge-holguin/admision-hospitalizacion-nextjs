import React, { createContext, useState, useEffect, useContext } from 'react'

export type Diagnostico = {
  CODIGO: string
  DESCRIPCION: string
  ACTIVO?: number
}

type DiagnosticosContextType = {
  diagnosticos: Diagnostico[]
  loading: boolean
  getDiagnosticoDescripcion: (codigo: string) => string
  loadDiagnosticosByOrigen: (origen: string) => Promise<void>
}

const DiagnosticosContext = createContext<DiagnosticosContextType>({
  diagnosticos: [],
  loading: false,
  getDiagnosticoDescripcion: () => '-',
  loadDiagnosticosByOrigen: async () => {},
})

export function DiagnosticosProvider({ children }: { children: React.ReactNode }) {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Cargar diagnósticos generales al inicializar
  useEffect(() => {
    if (!initialized) {
      loadDiagnosticos()
      setInitialized(true)
    }
  }, [initialized])

  const loadDiagnosticos = async (origen?: string) => {
    try {
      setLoading(true)
      console.log('🩺 Cargando diagnósticos desde contexto...', origen ? `para origen: ${origen}` : '')
      
      const url = origen 
        ? `/api/hospitalization/diagnostics?origen=${origen}`
        : '/api/hospitalization/diagnostics'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Diagnósticos cargados en contexto:', data)
      
      // Extraer los items de la respuesta
      const diagnosticosData = Array.isArray(data) ? data : (data.items || data.data || [])
      console.log('🩺 Datos procesados de diagnósticos:', diagnosticosData)
      setDiagnosticos(diagnosticosData)
      
    } catch (error) {
      console.error('❌ Error al cargar diagnósticos en contexto:', error)
      // Datos de fallback en caso de error
      const fallbackData = [
        { CODIGO: 'Z00.0', DESCRIPCION: 'Examen médico general' },
        { CODIGO: 'Z51.1', DESCRIPCION: 'Sesión de quimioterapia' },
        { CODIGO: 'I10', DESCRIPCION: 'Hipertensión esencial' }
      ];
      console.log('🩺 Usando datos de fallback para diagnósticos')
      setDiagnosticos(fallbackData)
    } finally {
      setLoading(false)
    }
  }

  const loadDiagnosticosByOrigen = async (origen: string) => {
    await loadDiagnosticos(origen)
  }

  const getDiagnosticoDescripcion = (codigo: string): string => {
    if (!codigo) return '-'
    const clean = String(codigo).trim()
    
    // Buscar primero una coincidencia exacta
    let found = diagnosticos.find(diag => diag.CODIGO && diag.CODIGO.trim() === clean)
    
    // Si no se encuentra, buscar ignorando espacios en blanco
    if (!found) {
      found = diagnosticos.find(diag => {
        if (!diag.CODIGO) return false;
        // Eliminar todos los espacios para comparación
        const diagTrimmed = diag.CODIGO.replace(/\s+/g, '');
        const codeTrimmed = clean.replace(/\s+/g, '');
        return diagTrimmed === codeTrimmed;
      });
    }
    
    return found?.DESCRIPCION || clean
  }

  return (
    <DiagnosticosContext.Provider value={{ 
      diagnosticos, 
      loading, 
      getDiagnosticoDescripcion,
      loadDiagnosticosByOrigen
    }}>
      {children}
    </DiagnosticosContext.Provider>
  )
}

export function useDiagnosticos() {
  return useContext(DiagnosticosContext)
}
