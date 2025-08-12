"use client"

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { FuaCheckResult } from '@/services/fuaService'
import { Skeleton } from '@/components/ui/skeleton'

interface FuaStatusAlertProps {
  patientId: string
  insuranceCode?: string
}

export default function FuaStatusAlert({ patientId, insuranceCode }: FuaStatusAlertProps) {
  const [loading, setLoading] = useState(true)
  const [hasFua, setHasFua] = useState(false)
  const [fuaId, setFuaId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shouldShow, setShouldShow] = useState(false)

  // Códigos de seguro que requieren validación FUA (SIS)
  const requiredFuaInsuranceCodes = ['20', '21', '22', '23', '24', '25']

  useEffect(() => {
    // Verificar si el código de seguro requiere validación FUA (con trim para eliminar espacios)
    const requiresFuaValidation = insuranceCode && requiredFuaInsuranceCodes.includes(insuranceCode.trim())
    
    // Si no requiere validación FUA, no mostrar nada
    if (!requiresFuaValidation) {
      setShouldShow(false)
      setLoading(false)
      return
    }
    
    setShouldShow(true)
    
    const checkFuaStatus = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/fua/check?patientId=${patientId}`)
        
        if (!response.ok) {
          throw new Error('Error al verificar el estado del FUA')
        }
        
        const data = await response.json()
        setHasFua(data.hasFua)
        setFuaId(data.fuaId)
      } catch (err) {
        console.error('Error al verificar FUA:', err)
        setError('No se pudo verificar el estado del FUA')
      } finally {
        setLoading(false)
      }
    }

    if (requiresFuaValidation) {
      checkFuaStatus()
    }
  }, [patientId, insuranceCode])

  // Si no se debe mostrar, no renderizar nada
  if (!shouldShow) {
    return null
  }

  // Mostrar skeleton mientras carga
  if (loading) {
    return (
      <div className="w-full p-4 space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
      </div>
    )
  }

  // Mostrar error si ocurre
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Mostrar alerta según el estado del FUA
  return hasFua ? (
    <Alert className="border-green-500 bg-green-50">
      <CheckCircle2 className="h-4 w-4 text-green-500" />
      <AlertTitle className="text-green-700">FUA Activo Detectado</AlertTitle>
      <AlertDescription className="text-green-600">
        Se ha detectado un FUA activo en las últimas 3 horas. FUA ID: {fuaId}
      </AlertDescription>
    </Alert>
  ) : (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>FUA No Detectado</AlertTitle>
      <AlertDescription>
        No se ha detectado un FUA activo en las últimas 3 horas. Por favor, genere un FUA antes de continuar.
      </AlertDescription>
    </Alert>
  )
}
