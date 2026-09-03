"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { consultarSIS } from "@/services/sisService"

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
  contrato?: string;
  descEESS?: string;
  eess?: string;
  idPlan?: string;
  descTipoSeguro?: string;
}

interface SISVerificationState extends SISVerificationResult {
  isLoading: boolean;
  isServerError?: boolean;
}

export function SISVerification({ 
  patientId, 
  documento, 
  className = "", 
  buttonSize = "sm",
  onVerificationComplete 
}: SISVerificationProps) {  const { toast } = useToast();
  
  // Estado para almacenar el resultado de la verificación
  const [verificationState, setVerificationState] = useState<SISVerificationState>({
    isLoading: false,
    patientId: patientId,
    result: null,
    isSuccess: null,
    isServerError: false
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Función para verificar SIS
  const handleVerifySIS = async () => {    if (!documento) {
      console.warn('🛡️ [SISVerification] documento is empty/missing');
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
      isSuccess: null,
      isServerError: false
    });

    // Abrir el modal de inmediato para mostrar progreso
    setIsDialogOpen(true);    try {      // Usar el servicio existente que lee NEXT_PUBLIC_API_BACKEND_URL / NEXT_PUBLIC_API_CITAS_MASTER_URL
      const sisResult = await consultarSIS(documento);      const data = sisResult.data;
      const resultado = (data?.resultado || sisResult.error || '').trim();

      const trimField = (value?: string | null) => (value ? value.trim() : undefined);

      const isServerError = !sisResult.success && (
        sisResult.error === 'El servicio de verificación SIS no responde' ||
        /failed to fetch|networkerror|conexión|conectar|timeout/i.test(sisResult.error || '')
      );

      const newState = {
        isLoading: false,
        patientId: patientId,
        result: resultado,
        isSuccess: sisResult.success && !!data,
        isServerError,
        contrato: trimField(data?.contrato),
        descEESS: trimField(data?.descEESS),
        eess: trimField(data?.eess),
        idPlan: trimField(data?.idPlan),
        descTipoSeguro: trimField(data?.descTipoSeguro)
      };

      setVerificationState(newState);

      // Notificar al componente padre si se proporciona la función de callback
      if (onVerificationComplete) {
        onVerificationComplete({
          patientId: patientId,
          result: resultado,
          isSuccess: newState.isSuccess,
          contrato: newState.contrato,
          descEESS: newState.descEESS,
          eess: newState.eess,
          idPlan: newState.idPlan,
          descTipoSeguro: newState.descTipoSeguro
        });
      }

      // Mostrar toast con el resultado
      if (newState.isSuccess) {
        toast({
          title: "SIS Activo",
          description: (
            <div className="space-y-1">
              {newState.contrato && (
                <p className="text-xs"><span className="font-medium">N° Afiliación:</span> {newState.contrato}</p>
              )}
              {newState.descTipoSeguro && (
                <p className="text-xs"><span className="font-medium">Tipo:</span> {newState.descTipoSeguro}</p>
              )}
            </div>
          ),
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
    } catch (error: any) {
      console.error('🛡️ [SISVerification] unexpected error:', error);

      const errorMessage = error.message || "Error en la consulta";

      const errorState = {
        isLoading: false,
        patientId: patientId,
        result: errorMessage,
        isSuccess: false,
        isServerError: true
      };

      setVerificationState(errorState);

      if (onVerificationComplete) {
        onVerificationComplete({
          patientId: patientId,
          result: errorMessage,
          isSuccess: false
        });
      }

      toast({
        title: "Error",
        description: "No se pudo conectar con el servicio de verificación SIS",
        variant: "destructive"
      });
      setIsDialogOpen(true);
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{renderSISDialogTitle(verificationState)}</DialogTitle>
            <DialogDescription>{renderSISDialogDescription(verificationState)}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {renderSISDialogContent(verificationState)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function renderSISDialogTitle(state: SISVerificationState) {
  if (state.isLoading) return "Verificando SIS"
  if (state.isServerError) return "Error de Conexión"
  if (state.isSuccess) return "SIS Activo"
  return "SIS No Activo"
}

function renderSISDialogDescription(state: SISVerificationState) {
  if (state.isLoading) return "Consultando afiliación SIS, por favor espere..."
  if (state.isServerError) return "No se pudo conectar con el servidor del SIS. El servicio puede estar temporalmente inactivo."
  if (state.isSuccess) return "El paciente cuenta con afiliación SIS activa."
  return "No se encontró afiliación SIS para el documento consultado."
}

function renderSISDialogContent(state: SISVerificationState) {
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (state.isSuccess) {
    return (
      <div className="space-y-3 rounded-lg bg-green-50 p-4 text-sm text-green-900">
        {state.contrato && (
          <p><span className="font-medium">N° Afiliación:</span> {state.contrato}</p>
        )}
        {state.descTipoSeguro && (
          <p><span className="font-medium">Tipo de Seguro:</span> {state.descTipoSeguro}</p>
        )}
        {state.eess && (
          <p><span className="font-medium">EESS:</span> {state.eess}</p>
        )}
        {state.descEESS && (
          <p><span className="font-medium">Centro de Salud:</span> {state.descEESS}</p>
        )}
        {state.idPlan && (
          <p><span className="font-medium">Plan:</span> {formatSISPlan(state.idPlan)}</p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-900">
      <p>{state.result || "No se encontró afiliación SIS para el documento consultado"}</p>
    </div>
  )
}

function formatSISPlan(idPlan?: string) {
  if (idPlan === "1") return "PEAS"
  if (idPlan === "3") return "PEAS + PLANES COMPLEMENTARIOS"
  return idPlan
}
