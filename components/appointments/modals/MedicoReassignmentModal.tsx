"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MedicoSelector } from "../selectors/MedicoSelector"
import { ConsultorioCitasSelector } from "../selectors/ConsultorioCitasSelector"
import { TurnoSelector } from "../selectors/TurnoSelector"
import { Loader2, Calendar, Clock, MapPin, User } from "lucide-react"

interface MedicoReassignmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
  onConfirm: (data: { medicoOrigen: string, medicoDestino: string, consultorio: string, turno: string, fecha: string, motivo: string }) => Promise<void>
}

export function MedicoReassignmentModal({
  isOpen,
  onClose,
  appointment,
  onConfirm
}: MedicoReassignmentModalProps) {
  const [medicoOrigen, setMedicoOrigen] = useState<string>("")
  const [medicoDestino, setMedicoDestino] = useState<string>("")
  const [consultorio, setConsultorio] = useState<string>("")
  const [turno, setTurno] = useState<string>("")
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0])
  const [motivo, setMotivo] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (!medicoOrigen || !medicoDestino || !consultorio || !turno || !fecha || !motivo.trim()) {
      return
    }

    try {
      setIsLoading(true)
      await onConfirm({
        medicoOrigen,
        medicoDestino,
        consultorio,
        turno,
        fecha,
        motivo: motivo.trim()
      })
      
      // Reset form
      setMedicoOrigen("")
      setMedicoDestino("")
      setConsultorio("")
      setTurno("")
      setFecha(new Date().toISOString().split('T')[0])
      setMotivo("")
      onClose()
    } catch (error) {
      console.error('Error al reasignar médico:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setMedicoOrigen("")
    setMedicoDestino("")
    setConsultorio("")
    setTurno("")
    setFecha(new Date().toISOString().split('T')[0])
    setMotivo("")
    onClose()
  }

  // Modal works without appointment for bulk reassignment

  // Format date and time
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A'
    return timeStr
  }

  const getTurnoText = (turno: string) => {
    if (turno === 'M') return 'Mañana'
    if (turno === 'T') return 'Tarde'
    return turno || 'N/A'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-800 flex items-center">
            <User className="mr-2 h-5 w-5" />
            Reasignar Médico
          </DialogTitle>
          <DialogDescription>
            Complete los datos para reasignar el médico de esta cita
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de la Cita */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-4">Información de la Cita</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Médico Actual</Label>
                <MedicoSelector
                  label=""
                  value={medicoOrigen}
                  onChange={setMedicoOrigen}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                <Input
                  type="date"
                  value={fecha}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Consultorio</Label>
                <ConsultorioCitasSelector
                  label=""
                  value={consultorio}
                  onChange={setConsultorio}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Turno</Label>
                <TurnoSelector
                  label=""
                  value={turno}
                  onChange={setTurno}
                />
              </div>
            </div>
          </div>

          {/* Médico de Reemplazo */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">
              Médico de Reemplazo <span className="text-red-500">*</span>
            </Label>
            <MedicoSelector
              label=""
              value={medicoDestino}
              onChange={setMedicoDestino}
            />
          </div>

          {/* Motivo de la Reasignación */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">
              Motivo de la Reasignación <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Ingrese el motivo de la reasignación del médico..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4">
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
              disabled={!medicoOrigen || !medicoDestino || !consultorio || !turno || !fecha || !motivo.trim() || isLoading}
              className="px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Reasignación'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
