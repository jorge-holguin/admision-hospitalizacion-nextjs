"use client"

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CuentaValidationResult } from '@/services/hospitalizacion/cuentaValidationService'

interface FuaStatusAlertProps {
  patientId: string
  insuranceCode?: string
}

export default function FuaStatusAlert({ patientId, insuranceCode }: FuaStatusAlertProps) {
  const [loading, setLoading] = useState(true)
  const [validationResult, setValidationResult] = useState<CuentaValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shouldShow, setShouldShow] = useState(false)

  // Códigos de seguro que requieren validación
  const sisInsuranceCodes = ['20', '21', '22', '23', '24', '25']
  const paganteSoatCodes = ['0', '00', '02']

  useEffect(() => {
    if (!insuranceCode) {
      setShouldShow(false)
      setLoading(false)
      return
    }

    const trimmedCode = insuranceCode.trim()
    const isSIS = sisInsuranceCodes.includes(trimmedCode)
    const isPaganteSoat = paganteSoatCodes.includes(trimmedCode)
    
    // Solo mostrar validación para SIS, no para PAGANTE/SOAT
    if (!isSIS) {
      setShouldShow(false)
      setLoading(false)
      return
    }
    
    setShouldShow(true)
    
    const validateAccount = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/cuenta/validate?patientId=${patientId}&tipoSeguro=${trimmedCode}`)
        
        if (!response.ok) {
          throw new Error('Error al validar la cuenta')
        }
        
        const data = await response.json()
        setValidationResult(data)
      } catch (err) {
        console.error('Error al validar cuenta:', err)
        setError('No se pudo validar la cuenta')
      } finally {
        setLoading(false)
      }
    }

    validateAccount()
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

  // Mostrar alerta según el resultado de la validación
  if (!validationResult) {
    return null
  }

  // Para SIS: mostrar estado de cuenta y FUA
  if (validationResult.tipoValidacion === 'SIS') {
    return validationResult.isValid ? (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700">Cuenta SIS Válida</AlertTitle>
        <AlertDescription className="text-green-600">
          {validationResult.message}
          {validationResult.cuentaId && <div className="mt-1">Cuenta ID: {validationResult.cuentaId}</div>}
          {validationResult.fuaId && <div>FUA ID: {validationResult.fuaId}</div>}
        </AlertDescription>
      </Alert>
    ) : (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Validación SIS Fallida</AlertTitle>
        <AlertDescription>
          {validationResult.message}
          {validationResult.cuentaId && <div className="mt-1">Cuenta ID: {validationResult.cuentaId}</div>}
        </AlertDescription>
      </Alert>
    )
  }

  // Para PAGANTE/SOAT: mostrar solo estado de cuenta
  return validationResult.isValid ? (
    <Alert className="border-blue-500 bg-blue-50">
      <Info className="h-4 w-4 text-blue-500" />
      <AlertTitle className="text-blue-700">Cuenta Válida</AlertTitle>
      <AlertDescription className="text-blue-600">
        {validationResult.message}
        {validationResult.cuentaId && <div className="mt-1">Cuenta ID: {validationResult.cuentaId}</div>}
      </AlertDescription>
    </Alert>
  ) : (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Cuenta No Válida</AlertTitle>
      <AlertDescription>
        {validationResult.message}
      </AlertDescription>
    </Alert>
  )
}
