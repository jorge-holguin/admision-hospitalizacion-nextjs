"use client"

import { useEffect, useState, useRef } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useEmergencyAccount } from "@/contexts/EmergencyAccountContext"

interface AccountEmergencyStatusAlertProps {
  patientId: string
  insuranceCode?: string
  onValidationChange?: (isValid: boolean) => void
}

// Ya no necesitamos el cache local porque usamos el contexto

export default function FuaEmergencyStatusAlert({
  patientId,
  insuranceCode,
  onValidationChange
}: AccountEmergencyStatusAlertProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const lastCheckedRef = useRef<string | null>(null)

  const requiredSisInsuranceCodes = ["20", "21", "22", "23", "24", "25"]

  // Usar el contexto de cuentas de emergencia
  const { fetchEmergencyAccount, isLoading: isLoadingAccountState } = useEmergencyAccount()

  useEffect(() => {
    const code = (insuranceCode || "").trim()
    const fetchKey = `${patientId}_${code}`

    // Si no requiere validación, limpiar estado y notificar que la validación pasó
    if (!requiredSisInsuranceCodes.includes(code)) {
      setError(null)
      setAccountId(null)
      setLoading(false)
      onValidationChange?.(true)
      lastCheckedRef.current = fetchKey
      return
    }

    // Evitar consultas duplicadas para la misma combinación paciente/seguro
    if (lastCheckedRef.current === fetchKey) return
    lastCheckedRef.current = fetchKey

    // Solo ejecutar la validación de cuenta para seguros SIS (20-25)
    const checkAccount = async () => {
      try {
        setLoading(true)
        // Verificar cuenta usando el contexto de emergencia con el endpoint buscar-por-seguro
        const accountData = await fetchEmergencyAccount(patientId, code)

        if (!accountData?.cuentaId) {
          setError("No se encontró una cuenta activa para este paciente.")
          onValidationChange?.(false)
          return
        }

        setAccountId(accountData.cuentaId)
        onValidationChange?.(true)
      } catch (error) {
        setError("Error al verificar el estado de la cuenta.")
        onValidationChange?.(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccount()
  }, [patientId, insuranceCode, fetchEmergencyAccount, onValidationChange])

  // Si no aplica validación, no renderizar nada
  if (!requiredSisInsuranceCodes.includes(insuranceCode?.trim() || "")) {
    return null
  }

  // Usar el estado de carga del contexto o el estado local
  const isLoading = loading || (patientId ? isLoadingAccountState[patientId] || false : false)
  
  if (isLoading) {
    return (
      <div className="w-full p-4 space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Validación de Cuenta</AlertTitle>
        <AlertDescription>
          {error} Para pacientes SIS es obligatorio tener una cuenta activa antes de continuar.
        </AlertDescription>
      </Alert>
    )
  }

  // Solo mostrar éxito si tenemos accountId
  if (accountId) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700">Cuenta Activa Detectada</AlertTitle>
        <AlertDescription className="text-green-600">
          Se encontró una cuenta activa (ID: {accountId}). Puede continuar con el registro.
        </AlertDescription>
      </Alert>
    )
  }

  // Si llegamos aquí, aún estamos cargando o no hay datos válidos
  return null
}
