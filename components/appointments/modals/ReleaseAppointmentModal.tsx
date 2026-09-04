import React, { memo, useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ReleaseAppointmentModalProps {
  isOpen: boolean
  appointmentId: string | undefined
  onClose: () => void
  onConfirm: (appointmentId: string, motivo: string) => void
}

const ReleaseAppointmentModal = memo(function ReleaseAppointmentModal({
  isOpen,
  appointmentId,
  onClose,
  onConfirm
}: ReleaseAppointmentModalProps) {
  const [motivo, setMotivo] = useState('')
  
  // Limpiar motivo cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setMotivo('')
    }
  }, [isOpen])
  
  const handleConfirm = () => {
    if (appointmentId && motivo.trim()) {
      onConfirm(appointmentId, motivo)
      setMotivo('')
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose()
        setMotivo('')
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-blue-800 font-semibold">Liberar Cita</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Está seguro que desea liberar la cita <strong>{appointmentId}</strong>?
          </p>
          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer y la cita quedará disponible para otros pacientes.
          </p>
          
          {/* Campo de motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo-liberar" className="text-sm font-medium text-gray-700">
              Motivo <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="motivo-liberar"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ingrese el motivo por el cual está liberando la cita..."
              className="w-full min-h-[100px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-xs text-gray-500">
              {motivo.length}/500 caracteres
            </p>
          </div>
          
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => {
              onClose()
              setMotivo('')
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirm}
              disabled={!appointmentId || !motivo.trim()}
            >
              Liberar Cita
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

export default ReleaseAppointmentModal
