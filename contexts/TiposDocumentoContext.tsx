import React, { createContext, useState, useEffect, useContext } from 'react'

export type TipoDocumento = {
  TIPO_DOCUMENTO: string
  NOMBRE: string
}

type TiposDocumentoContextType = {
  tiposDocumento: TipoDocumento[]
  loading: boolean
  getTipoDocumentoNombre: (codigo: string) => string
}

const TiposDocumentoContext = createContext<TiposDocumentoContextType>({
  tiposDocumento: [],
  loading: false,
  getTipoDocumentoNombre: () => '-',
})

export function TiposDocumentoProvider({ children }: { children: React.ReactNode }) {
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Cargar tipos de documento al inicializar
  useEffect(() => {
    if (!initialized) {
      loadTiposDocumento()
      setInitialized(true)
    }
  }, [initialized])

  const loadTiposDocumento = async () => {
    try {
      setLoading(true)
      console.log('🔍 Cargando tipos de documento desde contexto...')
      
      const response = await fetch('/api/tipo-documento')
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Tipos de documento cargados en contexto:', data)
      
      // Extraer los items de la respuesta
      const tiposDocumentoData = data.items || data.data || []
      setTiposDocumento(tiposDocumentoData)
      
    } catch (error) {
      console.error('❌ Error al cargar tipos de documento en contexto:', error)
      setTiposDocumento([])
    } finally {
      setLoading(false)
    }
  }

  const getTipoDocumentoNombre = (codigo: string): string => {
    if (!codigo) return '-'
    const clean = String(codigo).trim()
    const found = tiposDocumento.find(td => td.TIPO_DOCUMENTO && td.TIPO_DOCUMENTO.trim() === clean)
    return found?.NOMBRE || clean
  }

  return (
    <TiposDocumentoContext.Provider value={{ tiposDocumento, loading, getTipoDocumentoNombre }}>
      {children}
    </TiposDocumentoContext.Provider>
  )
}

export function useTiposDocumento() {
  return useContext(TiposDocumentoContext)
}
