import { useState, useEffect } from 'react'

interface Medico {
  MEDICO: string
  NOMBRE: string
}

export function useMedicos() {
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMedicos = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/master-tables/medicos/search')
        
        if (!response.ok) {
          throw new Error(`Error fetching medicos: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success && Array.isArray(data.data)) {
          setMedicos(data.data)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('Error loading medicos:', err)
        setError(err instanceof Error ? err.message : 'Unknown error loading medicos')
        setMedicos([])
      } finally {
        setLoading(false)
      }
    }

    fetchMedicos()
  }, [])

  return {
    medicos,
    loading,
    error,
    refetch: () => {
      setLoading(true)
      setError(null)
      // Re-trigger the effect
    }
  }
}