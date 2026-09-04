"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { consultarSIS } from "@/services/sisService"


interface SimpleSISVerificationProps {
  patientId: string;
  documento: string;
  className?: string;
  onVerificationComplete?: (result: SimpleSISVerificationResult) => void;
  autoVerify?: boolean; // Nuevo: Verificar automáticamente al montar
  showButton?: boolean; // Nuevo: Mostrar o no el botón (por defecto true)
}

export interface SimpleSISVerificationResult {
  isSuccess: boolean;
  isServerError?: boolean;
  eess?: string;
  descEESS?: string;
  manualOverride?: boolean; // Indica que el usuario decidió continuar sin validación
}

export function SimpleSISVerification({ 
  patientId, 
  documento, 
  className = "", 
  onVerificationComplete,
  autoVerify = false,
  showButton = true
}: SimpleSISVerificationProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<SimpleSISVerificationResult | null>(null);

  const handleContinueWithoutValidation = () => {
    const result: SimpleSISVerificationResult = {
      isSuccess: false,
      isServerError: true,
      manualOverride: true
    }
    setVerificationResult(result)
    if (onVerificationComplete) {
      onVerificationComplete(result)
    }
    toast({
      title: "Continuar sin validación",
      description: "Se registrará la cita sin validación SIS",
      variant: "default",
      className: "bg-orange-50 border-orange-200 text-orange-800"
    })
  }

  // Verificación automática cuando autoVerify es true
  useEffect(() => {
    if (autoVerify && documento) {
      handleVerifySIS(true) // true indica que es automática
    }
  }, [autoVerify, documento])
  
  // Función para verificar SIS
  const handleVerifySIS = async (isAutomatic = false) => {
    if (!documento) {
      toast({
        title: "Error",
        description: "No se encontró número de documento para este paciente",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setVerificationResult(null);

    try {
      const sisResult = await consultarSIS(documento);      const data = sisResult.data;
      const resultado = (data?.resultado || sisResult.error || '').trim();

      const trimField = (value?: string | null) => (value ? value.trim() : undefined);

      const isServerError = !sisResult.success && (
        sisResult.error === 'El servicio de verificación SIS no responde' ||
        /failed to fetch|networkerror|conexión|conectar|timeout/i.test(sisResult.error || '')
      );

      const result: SimpleSISVerificationResult = {
        isSuccess: sisResult.success && !!data,
        isServerError,
        eess: trimField(data?.eess),
        descEESS: trimField(data?.descEESS)
      };

      setVerificationResult(result);

      // Notificar al componente padre
      if (onVerificationComplete) {
        onVerificationComplete(result);
      }

      // Mostrar toast con el resultado simplificado (solo si no es automático)
      if (!isAutomatic) {
        if (result.isSuccess) {
          toast({
            title: "SIS Activo",
            description: "Verificación exitosa",
            variant: "default",
            className: "bg-green-50 border-green-200 text-green-800"
          });
        } else {
          toast({
            title: isServerError ? "Error de Conexión" : "SIS No Activo",
            description: resultado || "No se encontró afiliación SIS para el documento consultado",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error('Error al verificar SIS:', error);

      const result: SimpleSISVerificationResult = {
        isSuccess: false,
        isServerError: true
      };

      setVerificationResult(result);

      if (onVerificationComplete) {
        onVerificationComplete(result);
      }

      // Mostrar mensaje de error (solo si no es automático)
      if (!isAutomatic) {
        toast({
          title: "Error",
          description: "No se pudo conectar con el servicio de verificación SIS",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Alert de estado de verificación - Mostrar arriba */}
      {verificationResult && !isLoading && (
        <Alert 
          variant={verificationResult.isServerError ? "destructive" : verificationResult.isSuccess ? "default" : "destructive"}
          className={verificationResult.isSuccess ? "bg-green-50 border-green-200" : verificationResult.isServerError ? "bg-orange-50 border-orange-200" : ""}
        >
          {verificationResult.isServerError ? (
            <AlertCircle className="h-4 w-4" />
          ) : verificationResult.isSuccess ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription className={verificationResult.isSuccess ? "text-green-800" : verificationResult.isServerError ? "text-orange-800" : ""}>
            <div className="flex flex-wrap items-center justify-between">
              <span>
                {verificationResult.manualOverride ? (
                  <span>⚠️ Continuando sin validación SIS</span>
                ) : verificationResult.isServerError ? (
                  <span>⚠️ Problemas con el servidor del SIS</span>
                ) : verificationResult.isSuccess ? (
                  <span>✅ <strong>SIS validado exitosamente</strong> </span>
                ) : (
                  <span>❌ SIS no válido - No se encontró afiliación SIS</span>
                )}
              </span>
              {verificationResult.isServerError && !verificationResult.manualOverride && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleContinueWithoutValidation}
                  className="ml-2 h-7 text-xs border-orange-400 text-orange-700 hover:bg-orange-100"
                >
                  Continuar sin validación
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <Alert className="bg-blue-50 border-blue-200">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800">
            Verificando afiliación SIS...
          </AlertDescription>
        </Alert>
      )}

      {/* Botón de verificación manual (opcional) */}
      {showButton && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-center border-green-500 text-green-600 hover:bg-green-50" 
          onClick={() => handleVerifySIS(false)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" /> Verificar SIS
            </>
          )}
        </Button>
      )}
    </div>
  );
}
