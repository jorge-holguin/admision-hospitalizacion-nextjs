"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, ShieldCheck, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { consultarSIS } from "@/services/sisService"
import { cn } from '@/lib/utils'

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
}: SISVerificationProps) {
  const { toast } = useToast();
  
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
      isSuccess: null,
      isServerError: false
    });

    // Abrir el modal de inmediato para mostrar progreso
    setIsDialogOpen(true);
    try {
      // Usar el servicio existente que lee VITE_API_CITAS_MASTER_URL
      const sisResult = await consultarSIS(documento);
      const data = sisResult.data;
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
            <DialogTitle className={cn('flex items-center gap-2', getTitleClass(verificationState))}>
              {getTitleIcon(verificationState)}
              {renderSISDialogTitle(verificationState)}
            </DialogTitle>
            <DialogDescription>{renderSISDialogDescription(verificationState)}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {renderSISDialogContent(verificationState)}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getTitleIcon(state: SISVerificationState) {
  if (state.isLoading) return <Loader2 className="h-5 w-5 animate-spin text-green-500" />
  if (state.isServerError) return <XCircle className="h-5 w-5 text-red-500" />
  if (state.isSuccess) return <ShieldCheck className="h-5 w-5 text-green-500" />
  return <AlertCircle className="h-5 w-5 text-amber-500" />
}

function getTitleClass(state: SISVerificationState) {
  if (state.isServerError) return 'text-red-600'
  if (state.isSuccess) return 'text-green-600'
  if (state.isLoading) return 'text-foreground'
  return 'text-amber-600'
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
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-green-500" />
        <p className="text-sm text-muted-foreground">Consultando afiliación SIS...</p>
      </div>
    )
  }

  if (state.isSuccess) {
    return (
      <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-900 space-y-2">
        {state.contrato && (
          <div className="flex justify-between gap-2">
            <span className="font-medium text-green-800 whitespace-nowrap">N° Afiliación:</span>
            <span className="text-right">{state.contrato}</span>
          </div>
        )}
        {state.descTipoSeguro && (
          <div className="flex justify-between gap-2">
            <span className="font-medium text-green-800 whitespace-nowrap">Tipo de Seguro:</span>
            <span className="text-right">{state.descTipoSeguro}</span>
          </div>
        )}
        {state.eess && (
          <div className="flex justify-between gap-2">
            <span className="font-medium text-green-800 whitespace-nowrap">EESS:</span>
            <span className="text-right">{state.eess}</span>
          </div>
        )}
        {state.descEESS && (
          <div className="flex justify-between gap-2">
            <span className="font-medium text-green-800 whitespace-nowrap">Centro de Salud:</span>
            <span className="text-right">{state.descEESS}</span>
          </div>
        )}
        {state.idPlan && (
          <div className="flex justify-between gap-2">
            <span className="font-medium text-green-800 whitespace-nowrap">Plan:</span>
            <span className="text-right">{formatSISPlan(state.idPlan)}</span>
          </div>
        )}
      </div>
    )
  }

  if (state.isServerError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-6 text-center text-sm text-red-900">
        <XCircle className="h-10 w-10 text-red-500" />
        <p className="font-medium">No se pudo conectar con el servidor del SIS.</p>
        <p className="text-red-700">{state.result}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 p-6 text-center text-sm text-amber-900">
      <AlertCircle className="h-10 w-10 text-amber-500" />
      <p className="font-medium">No se encontró afiliación SIS activa.</p>
      <p className="text-amber-700">{state.result || "No se encontró afiliación SIS para el documento consultado"}</p>
    </div>
  )
}

function formatSISPlan(idPlan?: string) {
  if (idPlan === "1") return "PEAS"
  if (idPlan === "3") return "PEAS + PLANES COMPLEMENTARIOS"
  return idPlan
}
