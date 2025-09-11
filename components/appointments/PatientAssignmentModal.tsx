"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PatientInfoCardAppointment } from "@/components/appointments/PatientInfoCardAppointment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User, Stethoscope } from "lucide-react"
import { TipoCitaSelector } from "@/components/appointments/TipoCitaSelector"
import { TipoSeguroSelector } from "@/components/appointments/TipoSeguroSelector"
import { EntidadSisSelector } from "@/components/appointments/EntidadSisSelector"
import { Input } from "@/components/ui/input"

interface Patient {
  HISTORIA: string
  NOMBRES: string
  NOMBRE?: string
  PATERNO?: string
  MATERNO?: string
  SEXO: string
  DOCUMENTO: string
  TIPO_DOCUMENTO?: string
  FECHA_NACIMIENTO: string
  EDAD?: string
  ESTADO_CIVIL?: string
  DIRECCION: string
  DISTRITO: string
  Distrito_Dir?: string
  TELEFONO1?: string
  TELEFONO2?: string
  SEGURO?: string
  NOMBRE_SEGURO?: string
  RELIGION?: string
  DESRELIGION?: string
  Nombre_Localidad?: string
  LOCALIDAD?: string
  STRING_FOTO?: string
  PACIENTE?: string
}

interface Appointment {
  id: string
  fecha: string
  hora: string
  consultorio: string
  consultorioNombre?: string
  medico: string
  medicoNombre?: string
  estado: string
}

interface TipoCita {
  Tipo_cita: string
  Nombre: string
}

interface Seguro {
  Seguro: string
  Nombre: string
  CREA_CUENTA: string
}

interface PatientAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient | null
  appointment: Appointment | null
  onAssign: (assignmentData: any) => void
}

export function PatientAssignmentModal({ 
  isOpen, 
  onClose, 
  patient, 
  appointment, 
  onAssign 
}: PatientAssignmentModalProps) {
  const [tiposCita, setTiposCita] = useState<TipoCita[]>([])
  const [seguros, setSeguros] = useState<Seguro[]>([])
  const [selectedTipoCita, setSelectedTipoCita] = useState("")
  const [selectedSeguro, setSelectedSeguro] = useState("")
  const [selectedEntidadSis, setSelectedEntidadSis] = useState("")
  const [referencia, setReferencia] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Console.log para rastrear datos del appointment cuando se abre el modal
  useEffect(() => {
    if (isOpen && appointment) {
      console.log('🔍 PatientAssignmentModal - Datos del appointment recibidos:', {
        consultorio: appointment.consultorio,
        consultorioNombre: appointment.consultorioNombre,
        medico: appointment.medico,
        medicoNombre: appointment.medicoNombre,
        appointmentCompleto: appointment
      })
    }
  }, [isOpen, appointment])

  useEffect(() => {
    if (isOpen) {
      loadTiposCita()
      loadSeguros()
    }
  }, [isOpen])

  const loadTiposCita = async () => {
    try {
      const response = await fetch('/api/tipo-cita')
      if (response.ok) {
        const data = await response.json()
        setTiposCita(data)
      }
    } catch (error) {
      console.error('Error loading tipos de cita:', error)
    }
  }

  const loadSeguros = async () => {
    try {
      const response = await fetch('/api/seguros')
      if (response.ok) {
        const data = await response.json()
        setSeguros(data)
      }
    } catch (error) {
      console.error('Error loading seguros:', error)
    }
  }

  const handleAssign = async () => {
    if (!selectedTipoCita || !selectedSeguro) {
      return
    }

    setIsLoading(true)
    
    const assignmentData = {
      patientId: patient?.HC,
      appointmentId: appointment?.id,
      tipoCita: selectedTipoCita,
      seguro: selectedSeguro,
      entidadSis: selectedEntidadSis,
      referencia,
      patient,
      appointment
    }

    try {
      await onAssign(assignmentData)
      onClose()
    } catch (error) {
      console.error('Error assigning patient:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedTipoCita("")
    setSelectedSeguro("")
    setSelectedEntidadSis("")
    setReferencia("")
  }

  const isSisSeguro = () => {
    const sisSegurosCodes = ['20', '21', '22', '23', '24', '25']
    return sisSegurosCodes.includes(selectedSeguro?.toString().trim())
  }

  useEffect(() => {
    if (!isSisSeguro()) {
      setSelectedEntidadSis("")
      setReferencia("")
    }
  }, [selectedSeguro])

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  if (!patient || !appointment) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="patient-assignment-description">
        <DialogHeader>
          <DialogTitle className="text-blue-800 font-semibold">
            Confirmar Asignación de Paciente
          </DialogTitle>
          <Label className="text-lg font-semibold text-gray-700 mb-4">
              Información del Paciente
            </Label>
        </DialogHeader>
        
        {/* Contenido dividido en 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Izquierda */}
          <div className="flex flex-col h-full">
            <PatientInfoCardAppointment 
              patient={patient}
              className="h-full"
            />
          </div>

          {/* Derecha */}
          <div className="flex flex-col h-full space-y-6">
            {/* Info de la cita */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Información de la Cita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Fecha</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{appointment.fecha}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Hora</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{appointment.hora}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Consultorio</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {(() => {
                          const displayText = appointment.consultorioNombre 
                            ? `${appointment.consultorio} - ${appointment.consultorioNombre}`
                            : appointment.consultorio;
                          console.log('🏥 Mostrando consultorio:', displayText);
                          return displayText;
                        })()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Médico</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Stethoscope className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {(() => {
                          const displayText = appointment.medicoNombre 
                            ? `${appointment.medico} - ${appointment.medicoNombre}`
                            : appointment.medico;
                          console.log('👨‍⚕️ Mostrando médico:', displayText);
                          return displayText;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos de asignación */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Datos de Asignación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TipoCitaSelector
                  value={selectedTipoCita}
                  onChange={setSelectedTipoCita}
                  required={true}
                />

                <TipoSeguroSelector
                  value={selectedSeguro}
                  onChange={setSelectedSeguro}
                  required={true}
                />

                {isSisSeguro() && (
                  <>
                    <EntidadSisSelector
                      value={selectedEntidadSis}
                      onChange={setSelectedEntidadSis}
                      required={true}
                    />
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Referencia <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="Ingrese número de referencia..."
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botones fuera del grid */}
        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={
              !selectedTipoCita || 
              !selectedSeguro || 
              (isSisSeguro() && (!selectedEntidadSis || !referencia.trim())) ||
              isLoading
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Asignando..." : "Confirmar Asignación"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
