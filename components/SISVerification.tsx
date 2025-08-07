"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// API del BACKEND
const API_BACKEND_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL;

interface SISVerificationProps {
  patientId: string;
  documento: string;
  className?: string;
  buttonSize?: "default" | "sm" | "lg" | "icon";
  onVerificationComplete?: (result: SISVerificationResult) => void;
}

export interface SISVerificationResult {
  patientId: string;
  result: string | null;
  isSuccess: boolean | null;
}

export function SISVerification({ 
  patientId, 
  documento, 
  className = "", 
  buttonSize = "sm",
  onVerificationComplete 
}: SISVerificationProps) {
  const { toast } = useToast();
  
  // Estado para manejar la verificación SIS
  const [verificationState, setVerificationState] = useState<{
    isLoading: boolean;
    patientId: string | null;
    result: string | null;
    isSuccess: boolean | null;
  }>({
    isLoading: false,
    patientId: null,
    result: null,
    isSuccess: null
  });

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

    setVerificationState({
      isLoading: true,
      patientId: patientId,
      result: null,
      isSuccess: null
    });

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
        })
      });

      if (!response.ok) {
        throw new Error(`Error en la consulta: ${response.status}`);
      }

      const data = await response.json();
      const resultado = data.resultado;
      
      const newState = {
        isLoading: false,
        patientId: patientId,
        result: resultado,
        isSuccess: resultado === "DATOS EXITOSOS"
      };
      
      setVerificationState(newState);

      // Notificar al componente padre si se proporciona la función de callback
      if (onVerificationComplete) {
        onVerificationComplete({
          patientId: patientId,
          result: resultado,
          isSuccess: resultado === "DATOS EXITOSOS"
        });
      }

      // Mostrar toast con el resultado
      if (resultado === "DATOS EXITOSOS") {
        toast({
          title: "SIS Activo",
          description: "El paciente cuenta con SIS activo",
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
    } catch (error: any) {
      console.error('Error al verificar SIS:', error);
      
      // Determinar si es un error 500 (servicio inactivo)
      const is500Error = error.message && error.message.includes('500');
      const errorMessage = is500Error 
        ? "Error en la consulta: El servicio de la API del SIS está inactivo" 
        : "Error en la consulta";
      
      const errorState = {
        isLoading: false,
        patientId: patientId,
        result: errorMessage,
        isSuccess: false
      };
      
      setVerificationState(errorState);
      
      // Notificar al componente padre si se proporciona la función de callback
      if (onVerificationComplete) {
        onVerificationComplete({
          patientId: patientId,
          result: errorMessage,
          isSuccess: false
        });
      }
      
      // Mostrar mensaje específico según el tipo de error
      if (is500Error) {
        toast({
          title: "Servicio SIS Inactivo",
          description: "El servicio externo de verificación SIS está temporalmente inactivo. El sistema está funcionando correctamente, pero no puede conectarse al servicio SIS.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo conectar con el servicio de verificación SIS",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <Button 
        variant="outline" 
        size={buttonSize} 
        className="border-green-500 text-green-600 hover:bg-green-50" 
        onClick={handleVerifySIS}
        disabled={verificationState.isLoading}
      >
        {verificationState.isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" /> Verificar SIS
          </>
        )}
      </Button>
      
      {/* Mostrar resultado de verificación SIS */}
      {verificationState.result && !verificationState.isLoading && (
        <Alert className={verificationState.isSuccess ? 
          "bg-green-50 border-green-200 text-green-800" : 
          "bg-red-50 border-red-200 text-red-800"}
        >
          <CheckCircle className={`h-4 w-4 ${verificationState.isSuccess ? "text-green-600" : "text-red-600"}`} />
          <AlertTitle>{verificationState.isSuccess ? "SIS Activo" : "SIS No Activo"}</AlertTitle>
          <AlertDescription>
            {verificationState.isSuccess ? 
              "El paciente cuenta con SIS activo" : 
              "No se encontró afiliación SIS para el DNI consultado"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
