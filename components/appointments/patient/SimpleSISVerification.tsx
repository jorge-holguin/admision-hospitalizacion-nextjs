"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

// API del BACKEND
const API_BACKEND_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL;

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

  // Verificación automática cuando autoVerify es true
  useEffect(() => {
    if (autoVerify && documento) {
      console.log('🔄 Verificación SIS automática iniciada para documento:', documento)
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
      // Crear un AbortController para el timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos
      
      try {
        // Determinar el tipo de documento: 9 dígitos = Carné de Extranjería (tipo "3"), sino DNI (tipo "1")
        const tipoDocumento = documento.length === 9 ? "3" : "1";
        console.log(`📋 Verificando SIS - Documento: ${documento} (${documento.length} dígitos) - Tipo: ${tipoDocumento === "3" ? "Carné de Extranjería" : "DNI"}`);
        
        const response = await fetch(`${API_BACKEND_URL}/sis/validar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            intOpcion: "1",
            strTipoDocumento: tipoDocumento,
            strNroDocumento: documento,
            strTipoFormato: "2",
            strNroContrato: documento
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Error en la consulta: ${response.status}`);
        }

        const data = await response.json();
        const resultado = data.resultado;
        
        const result = {
          isSuccess: resultado === "DATOS EXITOSOS",
          eess: data.eess,
          descEESS: data.descEESS
        };
        
        setVerificationResult(result);

        // Notificar al componente padre
        if (onVerificationComplete) {
          onVerificationComplete(result);
        }

        // Mostrar toast con el resultado simplificado (solo si no es automático)
        if (!isAutomatic) {
          if (resultado === "DATOS EXITOSOS") {
            toast({
              title: "SIS Activo",
              description: "Verificación exitosa",
              variant: "default",
              className: "bg-green-50 border-green-200 text-green-800"
            });
          } else {
            toast({
              title: "SIS No Activo",
              description: "No se encontró afiliación SIS para el DNI consultado",
              variant: "destructive"
            });
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Verificar si fue un timeout
        if (fetchError.name === 'AbortError') {
          console.error('⏱️ Timeout al consultar SIS (5 segundos)');
          
          const result = {
            isSuccess: false,
            isServerError: true
          };
          
          setVerificationResult(result);
          
          if (onVerificationComplete) {
            onVerificationComplete(result);
          }
          
          if (!isAutomatic) {
            toast({
              title: "Error",
              description: "El servicio de verificación SIS no responde",
              variant: "destructive"
            });
          }
          
          return;
        }
        
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Error al verificar SIS:', error);
      
      // Determinar si es un error 500 (servicio inactivo)
      const is500Error = error.message && error.message.includes('500');
      
      const result = {
        isSuccess: false,
        isServerError: true
      };
      
      setVerificationResult(result);
      
      // Notificar al componente padre
      if (onVerificationComplete) {
        onVerificationComplete(result);
      }
      
      // Mostrar mensaje de error (solo si no es automático)
      if (!isAutomatic) {
        toast({
          title: "Error",
          description: is500Error 
            ? "El servicio de verificación SIS está temporalmente inactivo" 
            : "No se pudo conectar con el servicio de verificación SIS",
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
            {verificationResult.isServerError ? (
              <span>⚠️ Problemas con el servidor del SIS</span>
            ) : verificationResult.isSuccess ? (
              <span>✅ <strong>SIS validado exitosamente</strong> </span>
            ) : (
              <span>❌ SIS no válido - No se encontró afiliación SIS</span>
            )}
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
          className="border-green-500 text-green-600 hover:bg-green-50" 
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
