import { useState, useEffect } from 'react'
import { medicoServerService } from '@/services/master-tables/medicoService'

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
        
        const data = await medicoServerService.searchMedicos()
        setMedicos(data)
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