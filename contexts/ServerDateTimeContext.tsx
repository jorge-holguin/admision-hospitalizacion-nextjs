import React, { createContext, useState, useEffect, useContext } from 'react'

type ServerDateTime = {
  date: string
  time: string
}

type ServerDateTimeContextType = {
  serverDateTime: ServerDateTime
  loading: boolean
  refreshDateTime: () => Promise<ServerDateTime>
}

const ServerDateTimeContext = createContext<ServerDateTimeContextType>({
  serverDateTime: { date: '', time: '' },
  loading: false,
  refreshDateTime: async () => ({ date: '', time: '' })
})

export function ServerDateTimeProvider({ children }: { children: React.ReactNode }) {
  const [serverDateTime, setServerDateTime] = useState<ServerDateTime>({ date: '', time: '' })
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Cargar fecha y hora al inicializar
  useEffect(() => {
    if (!initialized) {
      fetchServerDateTime()
      setInitialized(true)
    }
  }, [initialized])

  const fetchServerDateTime = async (): Promise<ServerDateTime> => {
    try {
      setLoading(true)
      console.log('🕒 Obteniendo fecha y hora del servidor...')
      
      const response = await fetch('/api/utils/datetime')
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Fecha y hora del servidor obtenidas:', data)
      
      const dateTime = {
        date: data.date || '',
        time: data.time || ''
      }
      
      setServerDateTime(dateTime)
      return dateTime
      
    } catch (error) {
      console.error('❌ Error al obtener fecha y hora del servidor:', error)
      
      // Fallback a fecha y hora local
      const now = new Date()
      const localDate = now.toISOString().split('T')[0] // formato YYYY-MM-DD
      const localTime = now.toTimeString().substring(0, 5) // formato HH:MM
      
      const fallbackDateTime = {
        date: localDate,
        time: localTime
      }
      
      setServerDateTime(fallbackDateTime)
      return fallbackDateTime
      
    } finally {
      setLoading(false)
    }
  }

  return (
    <ServerDateTimeContext.Provider value={{ 
      serverDateTime, 
      loading, 
      refreshDateTime: fetchServerDateTime 
    }}>
      {children}
    </ServerDateTimeContext.Provider>
  )
}

export function useServerDateTime() {
  return useContext(ServerDateTimeContext)
}
