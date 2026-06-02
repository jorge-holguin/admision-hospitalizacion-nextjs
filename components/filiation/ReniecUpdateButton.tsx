"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle } from "lucide-react"
import { useReniec } from "@/hooks/useReniec"
import { toast } from "@/hooks/use-toast"

interface ReniecUpdateButtonProps {
  dni: string
  onSuccess: (data: any) => void
  disabled?: boolean
  className?: string
}

export function ReniecUpdateButton({
  dni,
  onSuccess,
  disabled = false,
  className = "",
}: ReniecUpdateButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [wasUsed, setWasUsed] = useState(false)
  const { consultarReniec } = useReniec()

  const handleClick = async () => {
    if (!dni || dni.trim().length !== 8) {
      toast({
        title: "Validación",
        description: "Ingrese un DNI válido de 8 dígitos",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const result = await consultarReniec(dni.trim())

      if (result.success && result.data) {
        if ((result as any).degraded) {
          setWasUsed(true)
          toast({
            title: "⚠️ RENIEC sin datos",
            description:
              "El servicio de RENIEC respondió sin datos útiles. Continúe completando la información manualmente.",
            variant: "default",
          })
        } else {
          setWasUsed(true)
          onSuccess(result.data)
        }
      } else {
        toast({
          title: "⚠️ No se pudo consultar RENIEC",
          description:
            result.error || "Intente nuevamente más tarde o complete los datos manualmente.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron obtener los datos de RENIEC",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || wasUsed || disabled}
      variant="outline"
      className={`border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Consultando RENIEC...
        </>
      ) : wasUsed ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Datos Actualizados desde RENIEC
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar con Datos de RENIEC
        </>
      )}
    </Button>
  )
}
