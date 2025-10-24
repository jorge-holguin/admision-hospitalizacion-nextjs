"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ConsultorioCitasSelector } from "../selectors/ConsultorioCitasSelector"
import { MedicoSelector } from "../selectors/MedicoSelector"
import { TurnoSelector } from "../selectors/TurnoSelector"
import { CalendarClock, User, MapPin, Clock, CreditCard, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface RescheduleAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
  onConfirm: (data: any) => Promise<void>
}

export function RescheduleAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onConfirm
}: RescheduleAppointmentModalProps) {
  // Nueva cita - campos editables
  const [nuevaFecha, setNuevaFecha] = useState<string>("")
  const [nuevoConsultorio, setNuevoConsultorio] = useState<string>("")
  const [nuevoMedico, setNuevoMedico] = useState<string>("")
  const [nuevoTurno, setNuevoTurno] = useState<string>("")
  const [nuevoNumero, setNuevoNumero] = useState<string>("")
  const [nuevaHora, setNuevaHora] = useState<string>("")
  
  // Pago/FUA
  const [boleta, setBoleta] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [canReschedule, setCanReschedule] = useState(false)

  // Verificar si tiene PAGOID válido
  useEffect(() => {
    if (appointment) {
      const pagoId = appointment.pagoId || appointment.PAGOID || (appointment as any).pagoId || (appointment as any).PAGOID
      setCanReschedule(Boolean(pagoId))
      
      // Si tiene pagoId, hacer llamada al endpoint para obtener boleta (implementar más tarde)
      if (pagoId) {
        // TODO: Llamar endpoint para obtener boleta basado en PAGOID
        setBoleta("") // Por ahora vacío hasta que se implemente el endpoint
      }
    }
  }, [appointment])

  const handleConfirm = async () => {
    if (!canReschedule) {
      toast({
        title: "Error",
        description: "No se puede reprogramar esta cita. No tiene un PAGOID válido.",
        variant: "destructive"
      })
      return
    }

    if (!nuevaFecha || !nuevoConsultorio || !nuevoMedico || !nuevoTurno) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      await onConfirm({
        fecha: nuevaFecha,
        consultorio: nuevoConsultorio,
        medico: nuevoMedico,
        turno: nuevoTurno,
        numero: nuevoNumero,
        hora: nuevaHora,
        boleta: boleta
      })
      
      // Reset form
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error al reprogramar cita:', error)
      toast({
        title: "Error",
        description: "Error al reprogramar la cita. Intente nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setNuevaFecha("")
    setNuevoConsultorio("")
    setNuevoMedico("")
    setNuevoTurno("")
    setNuevoNumero("")
    setNuevaHora("")
    setBoleta("")
  }

  const handleCancel = () => {
    resetForm()
    onClose()
  }

  if (!appointment) return null

  const pagoId = appointment.pagoId || appointment.PAGOID || (appointment as any).pagoId || (appointment as any).PAGOID

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-800 flex items-center">
            <CalendarClock className="mr-2 h-5 w-5" />
            Reprogramar Cita
          </DialogTitle>
          <DialogDescription>
            ID de Cita: <span className="font-semibold text-blue-600">{appointment.id}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Alerta de PAGOID si no es válido */}
        {!canReschedule && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 font-medium text-sm">
              No se puede reprogramar esta cita. No tiene un PAGOID válido.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Sección 1: Información de Pago/FUA */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Información de Pago/FUA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">PAGOID</Label>
                <Input
                  value={pagoId || 'No disponible'}
                  disabled
                  className={`mt-1 text-sm h-8 ${pagoId ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Número de Boleta</Label>
                <Input
                  value={boleta}
                  onChange={(e) => setBoleta(e.target.value)}
                  disabled={!canReschedule}
                  placeholder="Se obtendrá automáticamente"
                  className="mt-1 text-sm h-8"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Sección 2: Cita Original - Solo lectura */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Cita Original</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-md">
              <div>
                <Label className="text-xs font-medium text-gray-600">Consultorio</Label>
                <p className="text-sm font-medium text-gray-800">
                  {appointment.consultorioNombre || appointment.consultorio || 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Fecha</Label>
                <p className="text-sm font-medium text-gray-800">
                  {appointment.fecha || 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Turno / Hora</Label>
                <p className="text-sm font-medium text-gray-800">
                  {appointment.turno || 'N/A'} - {appointment.hora || 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Médico</Label>
                <p className="text-sm font-medium text-gray-800">
                  {appointment.medicoNombre || appointment.medico || 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Número</Label>
                <p className="text-sm font-medium text-gray-800">
                  {appointment.numero || 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Paciente</Label>
                <p className="text-sm font-medium text-gray-800">
                  {appointment.paciente || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sección 3: Nueva Cita - Editable */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Nueva Cita</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Nueva Fecha <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  disabled={!canReschedule}
                  className="mt-1 text-sm h-8"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Consultorio <span className="text-red-500">*</span>
                </Label>
                <ConsultorioCitasSelector
                  label=""
                  value={nuevoConsultorio}
                  onChange={setNuevoConsultorio}
                  // TODO: Implementar cálculo de número y hora cuando cambien consultorio y turno
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Turno <span className="text-red-500">*</span>
                </Label>
                <TurnoSelector
                  label=""
                  value={nuevoTurno}
                  onChange={setNuevoTurno}
                  // TODO: Implementar cálculo de número y hora cuando cambien consultorio y turno
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Médico <span className="text-red-500">*</span>
                </Label>
                <MedicoSelector
                  label=""
                  value={nuevoMedico}
                  onChange={setNuevoMedico}
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600">Número de Cita</Label>
                <Input
                  value={nuevoNumero}
                  onChange={(e) => setNuevoNumero(e.target.value)}
                  disabled={!canReschedule}
                  placeholder="Se calculará automáticamente"
                  className="mt-1 text-sm h-8"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600">Hora</Label>
                <Input
                  type="time"
                  value={nuevaHora}
                  onChange={(e) => setNuevaHora(e.target.value)}
                  disabled={!canReschedule}
                  placeholder="Se calculará automáticamente"
                  className="mt-1 text-sm h-8"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canReschedule || !nuevaFecha || !nuevoConsultorio || !nuevoMedico || !nuevoTurno || isLoading}
            className="px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reprogramando...
              </>
            ) : (
              'Reprogramar Cita'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
