import React, { createContext, useState, useEffect, useContext } from 'react'
import { motivoEmergenciaService } from '@/services/emergencia/motivoEmergenciaService'

export type MotivoEmergencia = {
  MOTIVO_EMERGENCIA: string
  NOMBRE: string
}

type MotivosEmergenciaContextType = {
  motivosEmergencia: MotivoEmergencia[]
  loading: boolean
  getMotivoEmergenciaNombre: (codigo: string) => string
}

const MotivosEmergenciaContext = createContext<MotivosEmergenciaContextType>({
  motivosEmergencia: [],
  loading: false,
  getMotivoEmergenciaNombre: () => '-',
})

function getItemCode(item: any): string {
  if (item === null || item === undefined) return ''
  const code =
    item.codigo !== undefined && item.codigo !== null && String(item.codigo).trim() !== ''
      ? item.codigo
      : item.CODIGO !== undefined && item.CODIGO !== null && String(item.CODIGO).trim() !== ''
      ? item.CODIGO
      : item.motivoEmergencia !== undefined && item.motivoEmergencia !== null && String(item.motivoEmergencia).trim() !== ''
      ? item.motivoEmergencia
      : item.MOTIVO_EMERGENCIA !== undefined && item.MOTIVO_EMERGENCIA !== null && String(item.MOTIVO_EMERGENCIA).trim() !== ''
      ? item.MOTIVO_EMERGENCIA
      : ''
  return String(code).trim()
}

function getItemName(item: any): string {
  if (item === null || item === undefined) return ''
  const name =
    item.nombre !== undefined && item.nombre !== null && String(item.nombre).trim() !== ''
      ? item.nombre
      : item.NOMBRE !== undefined && item.NOMBRE !== null && String(item.NOMBRE).trim() !== ''
      ? item.NOMBRE
      : ''
  return String(name).trim()
}

export function MotivosEmergenciaProvider({ children }: { children: React.ReactNode }) {
  const [motivosEmergencia, setMotivosEmergencia] = useState<MotivoEmergencia[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar motivos de emergencia cada vez que el provider se monta
  useEffect(() => {
    const loadMotivosEmergencia = async () => {
      try {
        setLoading(true)        const items = await motivoEmergenciaService.findAll()

        const motivosData: MotivoEmergencia[] = items.map((item: any) => ({
          MOTIVO_EMERGENCIA: getItemCode(item),
          NOMBRE: getItemName(item),
        }))        if (motivosData.length > 0) {        }
        setMotivosEmergencia(motivosData)

      } catch (error) {
        console.error('❌ Error al cargar motivos de emergencia en contexto:', error)
        setMotivosEmergencia([])
      } finally {
        setLoading(false)
      }
    }

    loadMotivosEmergencia()
  }, [])

  const getMotivoEmergenciaNombre = (codigo: string): string => {
    if (!codigo) return '-'
    const clean = String(codigo).trim()
    const found = motivosEmergencia.find((me) => me.MOTIVO_EMERGENCIA && me.MOTIVO_EMERGENCIA.trim() === clean)
    return found?.NOMBRE || clean
  }

  return (
    <MotivosEmergenciaContext.Provider value={{ motivosEmergencia, loading, getMotivoEmergenciaNombre }}>
      {children}
    </MotivosEmergenciaContext.Provider>
  )
}

export function useMotivosEmergencia() {
  return useContext(MotivosEmergenciaContext)
}
