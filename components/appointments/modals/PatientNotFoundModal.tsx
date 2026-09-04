"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertCircle, UserPlus, RefreshCw, XCircle } from "lucide-react"

interface ReservaData {
  codigo: string
  nombres: string
  numeroDocumento: string
  especialidadNombre: string
}

interface PatientNotFoundModalProps {
  reserva: ReservaData | null
  motivoDenegacion: string
  onMotivoDenegacionChange: (value: string) => void
  onCrearHistoriaClinica: () => void
  onDenegar: () => void
  onCancel: () => void
  isLoadingReniec?: boolean
  isDenegando: boolean
}

export function PatientNotFoundModal({
  reserva,
  motivoDenegacion,
  onMotivoDenegacionChange,
  onCrearHistoriaClinica,
  onDenegar,
  onCancel,
  isLoadingReniec = false,
  isDenegando
}: PatientNotFoundModalProps) {
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          Paciente No Encontrado
        </DialogTitle>
        <DialogDescription className="text-base pt-2">
          No se encontró información del paciente asociado a este DNI en el sistema.
        </DialogDescription>
      </DialogHeader>
      
      {reserva && (
        <div className="space-y-6">
          {/* Información de la solicitud */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-red-900">Datos de la Solicitud:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Código:</span>
                <span className="font-medium text-red-700">{reserva.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paciente:</span>
                <span className="font-medium">{reserva.nombres}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Documento:</span>
                <span className="font-medium">{reserva.numeroDocumento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Especialidad:</span>
                <span className="font-medium">{reserva.especialidadNombre}</span>
              </div>
            </div>
          </div>

          {/* Botón principal: Crear Historia Clínica */}
          <div className="flex flex-col items-center gap-3 py-4 border-y border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Cree la historia clínica del paciente para continuar con la asignación de cita
            </p>
            <Button
              onClick={onCrearHistoriaClinica}
              disabled={isLoadingReniec || isDenegando}
              size="lg"
              className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 flex flex-wrap items-center justify-center gap-2"
            >
              {isLoadingReniec ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Consultando RENIEC...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Crear Historia Clínica
                </>
              )}
            </Button>
          </div>

          {/* Sección de denegación (colapsable/opcional) */}
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-700">
                  <XCircle className="h-4 w-4" />
                  <span>¿Desea denegar la solicitud?</span>
                </div>
                <svg 
                  className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            
            <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Motivo de Denegación <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="Ingrese el motivo por el cual se deniega la solicitud (ej: Paciente no registrado en el sistema)..."
                  value={motivoDenegacion}
                  onChange={(e) => onMotivoDenegacionChange(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 text-right">
                  {motivoDenegacion.length}/500 caracteres
                </div>
              </div>
              
              <Button
                onClick={onDenegar}
                disabled={!motivoDenegacion.trim() || isDenegando || isLoadingReniec}
                variant="destructive"
                className="w-full"
              >
                {isDenegando ? "Denegando..." : "Confirmar Denegación"}
              </Button>
            </div>
          </details>
        </div>
      )}

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isDenegando || isLoadingReniec}
          className="w-full"
        >
          Cancelar
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
