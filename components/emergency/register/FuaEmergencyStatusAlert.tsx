"use client"

import { useEffect, useState, useRef } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface AccountEmergencyStatusAlertProps {
  patientId: string
  insuranceCode?: string
  onValidationChange?: (isValid: boolean) => void
}

// Cache global para evitar múltiples llamadas a la API de cuenta
const accountCache = new Map<string, { cuentaId: string | null; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export default function FuaEmergencyStatusAlert({
  patientId,
  insuranceCode,
  onValidationChange
}: AccountEmergencyStatusAlertProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const hasExecutedRef = useRef(false)

  const requiredSisInsuranceCodes = ["20", "21", "22", "23", "24", "25"]

  // Función para obtener cuenta desde cache o API
  const getCachedAccount = async (patientId: string) => {
    const cached = accountCache.get(patientId)
    const now = Date.now()
    
    // Si hay cache válido, usarlo
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`Usando cuenta desde cache para paciente: ${patientId}`)
      return cached.cuentaId
    }
    
    // Si no hay cache o expiró, hacer llamada a API
    console.log(`Buscando cuenta activa para paciente: ${patientId}`)
    try {
      const response = await fetch(`/api/cuenta/${patientId}`)
      if (!response.ok) throw new Error("No se pudo obtener la cuenta")
      const data = await response.json()
      
      const cuentaId = data?.success && data?.data?.cuentaId ? data.data.cuentaId : null
      
      // Guardar en cache
      accountCache.set(patientId, { cuentaId, timestamp: now })
      
      if (!cuentaId) {
        console.log(`No se encontró cuenta activa para paciente ${patientId}`)
      }
      
      return cuentaId
    } catch (error) {
      console.error("Error al obtener cuenta:", error)
      return null
    }
  }

  useEffect(() => {
    // Evitar ejecuciones múltiples
    if (hasExecutedRef.current) return
    
    const code = insuranceCode?.trim() || ""

    // Si no requiere validación, no mostrar nada y notificar que la validación pasó
    if (!requiredSisInsuranceCodes.includes(code)) {
      onValidationChange?.(true)
      return
    }

    // Solo ejecutar la validación de cuenta para seguros SIS (20-25)
    console.log(`Ejecutando validación de cuenta para seguro SIS: ${code}`)
    hasExecutedRef.current = true

    const checkAccount = async () => {
      try {
        // Verificar cuenta usando cache
        const cuentaId = await getCachedAccount(patientId)
        
        if (!cuentaId) {
          setError("No se encontró una cuenta activa para este paciente.")
          onValidationChange?.(false)
          return
        }
        
        setAccountId(cuentaId)
        onValidationChange?.(true)
      } catch (error) {
        console.error("Error en validación de cuenta:", error)
        setError("Error al verificar el estado de la cuenta.")
        onValidationChange?.(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccount()
  }, [patientId, insuranceCode]) // Removed onValidationChange to prevent unnecessary re-runs

  // Si no aplica validación, no renderizar nada
  if (!requiredSisInsuranceCodes.includes(insuranceCode?.trim() || "")) {
    return null
  }

  if (loading) {
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
