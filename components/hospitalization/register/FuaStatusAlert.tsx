"use client"

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CuentaValidationResult } from '@/services/hospitalizacion/cuentaValidationService'
import { usePatientAccount } from '@/contexts/PatientAccountContext'

interface FuaStatusAlertProps {
  patientId: string
  insuranceCode?: string
}

export default function FuaStatusAlert({ patientId, insuranceCode }: FuaStatusAlertProps) {
  // Usar contexto para evitar llamadas API duplicadas
  const { fetchPatientAccountBySeguro, isLoading, errors } = usePatientAccount();
  
  const [validationResult, setValidationResult] = useState<CuentaValidationResult | null>(null)
  const [shouldShow, setShouldShow] = useState(false)
  
  // Estados derivados del contexto
  const loading = isLoading[patientId] || false;
  const error = errors[patientId] || null;

  // Códigos de seguro que requieren validación
  const sisInsuranceCodes = ['20', '21', '22', '23', '24', '25']
  const paganteSoatCodes = ['0', '00', '02']

  useEffect(() => {
    if (!insuranceCode) {
      setShouldShow(false)
      return
    }

    const trimmedCode = insuranceCode.trim()
    const isSIS = sisInsuranceCodes.includes(trimmedCode)
    const isPaganteSoat = paganteSoatCodes.includes(trimmedCode)
    
    // Solo mostrar validación para SIS, no para PAGANTE/SOAT
    if (!isSIS) {
      setShouldShow(false)
      return
    }
    
    setShouldShow(true)
    
    const validateAccount = async () => {
      try {
        console.log('🏥 Validando cuenta usando contexto para:', patientId, trimmedCode)
        
        // Usar contexto en lugar de llamada directa
        const accountData = await fetchPatientAccountBySeguro(patientId, trimmedCode)
        
        // Simular el formato de validación esperado
        const validationData: CuentaValidationResult = {
          isValid: !!accountData,
          cuentaId: accountData?.cuentaId || null,
          fuaId: null, // No disponible desde el contexto
          message: accountData ? 'Cuenta válida encontrada' : 'No se encontró cuenta válida',
          tipoValidacion: 'SIS'
        }
        
        setValidationResult(validationData)
      } catch (err) {
        console.error('Error al validar cuenta usando contexto:', err)
        setValidationResult({
          isValid: false,
          cuentaId: null,
          fuaId: null,
          message: 'Error al validar la cuenta',
          tipoValidacion: 'SIS'
        })
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
