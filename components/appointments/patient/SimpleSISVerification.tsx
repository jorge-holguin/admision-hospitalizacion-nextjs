"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// API del BACKEND
const API_BACKEND_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL;

interface SimpleSISVerificationProps {
  patientId: string;
  documento: string;
  className?: string;
  onVerificationComplete?: (result: SimpleSISVerificationResult) => void;
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
  onVerificationComplete 
}: SimpleSISVerificationProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<SimpleSISVerificationResult | null>(null);
  
  // Función para verificar SIS
  const handleVerifySIS = async () => {
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
        const response = await fetch(`${API_BACKEND_URL}/sis/validar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            intOpcion: "1",
            strTipoDocumento: "1",
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

        // Mostrar toast con el resultado simplificado
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
          
          toast({
            title: "Error",
            description: "El servicio de verificación SIS no responde",
            variant: "destructive"
          });
          
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
      
      // Mostrar mensaje de error
      toast({
        title: "Error",
        description: is500Error 
          ? "El servicio de verificación SIS está temporalmente inactivo" 
          : "No se pudo conectar con el servicio de verificación SIS",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        className="border-green-500 text-green-600 hover:bg-green-50" 
        onClick={handleVerifySIS}
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
      
      {/* Mensaje simplificado de estado SIS */}
      {verificationResult && !isLoading && (
        <div className="text-sm">
          {verificationResult.isServerError ? (
            <div className="text-orange-600">
              ⚠️ Problemas con el servidor del SIS
            </div>
          ) : verificationResult.isSuccess ? (
            <div className="text-green-600">
              ✅ SIS válido - Establecimiento: {verificationResult.eess?.replace(/^0+/, '') || verificationResult.eess} - {verificationResult.descEESS}
            </div>
          ) : (
            <div className="text-red-600">
              ❌ SIS no válido
            </div>
          )}
        </div>
      )}
    </div>
  );
}
