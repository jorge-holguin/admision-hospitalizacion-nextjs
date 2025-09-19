"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PatientInfoCardAppointment } from "../patient/PatientInfoCardAppointment"
import { ConsultorioCitasSelector } from "../selectors/ConsultorioCitasSelector"
import { MedicoSelector } from "../selectors/MedicoSelector"
import { TipoCitaSelector } from "../selectors/TipoCitaSelector"
import { TipoSeguroSelector } from "../selectors/TipoSeguroSelector"
import { TurnoSelector } from "../selectors/TurnoSelector"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AdditionalAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  patient: any
}

export function AdditionalAppointmentModal({
  isOpen,
  onClose,
  onBack,
  patient
}: AdditionalAppointmentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [appointmentId, setAppointmentId] = useState<string>("")
  const [isLoadingPatientData, setIsLoadingPatientData] = useState(false)
  const [enhancedPatient, setEnhancedPatient] = useState<any>(null)
  
  // Form fields
  const [fecha, setFecha] = useState<string>("")
  const [numero, setNumero] = useState<string>("")
  const [hora, setHora] = useState<string>("")
  const [consultorio, setConsultorio] = useState<string>("")
  const [medico, setMedico] = useState<string>("")
  const [turno, setTurno] = useState<string>("")
  const [tipoCita, setTipoCita] = useState<string>("")
  const [tipoSeguro, setTipoSeguro] = useState<string>("")

  // Get API base URL from environment
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_CITAS_URL || 'http://localhost:8080/api'

  const loadEnhancedPatientData = async (pacienteId: string) => {
    if (!pacienteId) return
    
    setIsLoadingPatientData(true)
    try {
      console.log('🔍 Cargando datos adicionales para paciente ID:', pacienteId)
      const response = await fetch(`${apiBaseUrl}/paciente-foto/${pacienteId}`)
      
      if (response.ok) {
        const additionalData = await response.json()
        console.log('📋 Datos adicionales recibidos:', additionalData)
        
        // Combinar datos originales con datos adicionales
        const enhancedPatientData = {
          ...patient,
          // Sobrescribir con datos más completos de la API
          NOMBRES: additionalData.nombres || patient?.NOMBRES,
          STRING_FOTO: additionalData.stringFoto || patient?.STRING_FOTO,
          ESTADO_CIVIL: additionalData.estadoCivil || patient?.ESTADO_CIVIL,
          FECHA_NACIMIENTO: additionalData.fechaNacimiento ? 
            new Date(additionalData.fechaNacimiento).toISOString().split('T')[0] : 
            patient?.FECHA_NACIMIENTO,
          EDAD: additionalData.edad || patient?.EDAD
        }
        
        setEnhancedPatient(enhancedPatientData)
        console.log('✅ Datos del paciente mejorados:', enhancedPatientData)
      } else {
        console.warn('⚠️ No se pudieron cargar datos adicionales, usando datos originales')
        setEnhancedPatient(patient)
      }
    } catch (error) {
      console.error('❌ Error cargando datos adicionales:', error)
      setEnhancedPatient(patient)
    } finally {
      setIsLoadingPatientData(false)
    }
  }

  // Load enhanced patient data when modal opens
  useEffect(() => {
    if (isOpen && patient) {
      // Load enhanced patient data
      const pacienteId = patient.PACIENTE || patient.HISTORIA
      if (pacienteId) {
        loadEnhancedPatientData(pacienteId)
      } else {
        setEnhancedPatient(patient)
      }
    }
  }, [isOpen, patient])

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && patient) {
      // Set today's date
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      setFecha(todayString)
      
      // Set default seguro from patient data
      if (patient.SEGURO) {
        setTipoSeguro(patient.SEGURO)
      }
      
      // Reset other fields
      setNumero("")
      setHora("")
      setConsultorio("")
      setMedico("")
      setTurno("")
      setTipoCita("")
      setShowSuccess(false)
      setAppointmentId("")
    }
  }, [isOpen, patient])

  // Validate Turno + Consultorio to generate Numero and Hora
  useEffect(() => {
    if (turno && consultorio) {
      // Simulate validation logic - in real app this would be an API call
      const generateAppointmentDetails = () => {
        // Generate a random number for demonstration
        const randomNum = Math.floor(Math.random() * 100) + 1
        setNumero(randomNum.toString().padStart(3, '0'))
        
        // Generate time based on turno
        if (turno === 'MAÑANA') {
          const hour = Math.floor(Math.random() * 4) + 8 // 8-11 AM
          const minute = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, 45
          setHora(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
        } else if (turno === 'TARDE') {
          const hour = Math.floor(Math.random() * 4) + 14 // 2-5 PM
          const minute = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, 45
          setHora(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
        }
      }
      
      generateAppointmentDetails()
    } else {
      setNumero("")
      setHora("")
    }
  }, [turno, consultorio])

  const handleSave = async () => {
    // Validate required fields
    if (!consultorio || !medico || !turno || !tipoCita || !tipoSeguro) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate a mock appointment ID
      const mockId = `CITA-${Date.now()}`
      setAppointmentId(mockId)
      setShowSuccess(true)
      
      toast({
        title: "¡Éxito!",
        description: `Cita adicional creada exitosamente. ID: ${mockId}`,
        variant: "default"
      })
      
    } catch (error) {
      console.error('Error creating additional appointment:', error)
      toast({
        title: "Error",
        description: "Hubo un error al crear la cita adicional",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (showSuccess) {
      // Reset form and close
      setShowSuccess(false)
      setAppointmentId("")
    }
    onClose()
  }

  if (!patient) return null

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-700 flex items-center justify-center">
              <CheckCircle className="mr-2 h-6 w-6" />
              ¡Cita Creada Exitosamente!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-gray-700">
              La cita adicional ha sido guardada correctamente.
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-semibold text-green-800">
                ID de la Cita: {appointmentId}
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mr-2 p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            Confirmar Asignación de Paciente - Información del Paciente
          </DialogTitle>
          <DialogDescription>
            Complete los datos para crear una cita adicional
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Info Card - Left Side */}
          <div className="lg:col-span-1">
            <PatientInfoCardAppointment 
              patient={enhancedPatient || patient}
              className="h-full"
            />
          </div>

          {/* Appointment Form - Right Side */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardContent className="p-4 space-y-6">
                {/* Información de la Cita */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    Información de la Cita
                  </h3>
                  
                  {/* First Row: Fecha, Numero */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
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
                      <Label className="text-sm font-medium text-gray-700">Número</Label>
                      <Input
                        value={numero}
                        disabled
                        placeholder="Auto-generado"
                        className="bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Second Row: Hora */}
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Hora</Label>
                      <Input
                        value={hora}
                        disabled
                        placeholder="Auto-generada"
                        className="bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Third Row: Consultorio */}
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Consultorio <span className="text-red-500">*</span>
                      </Label>
                      <ConsultorioCitasSelector
                        label=""
                        value={consultorio}
                        onChange={setConsultorio}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Fourth Row: Médico */}
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Médico <span className="text-red-500">*</span>
                      </Label>
                      <MedicoSelector
                        label=""
                        value={medico}
                        onChange={setMedico}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Fifth Row: Turno */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Turno <span className="text-red-500">*</span>
                      </Label>
                      <TurnoSelector
                        label=""
                        value={turno}
                        onChange={setTurno}
                      />
                    </div>
                  </div>
                </div>

                {/* Datos de Asignación */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">Datos de Asignación</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Tipo de Cita <span className="text-red-500">*</span>
                      </Label>
                      <TipoCitaSelector
                        label=""
                        value={tipoCita}
                        onChange={setTipoCita}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Tipo de Seguro <span className="text-red-500">*</span>
                      </Label>
                      <TipoSeguroSelector
                        label=""
                        value={tipoSeguro}
                        onChange={setTipoSeguro}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons - Below both panels */}
        <div className="flex justify-end space-x-3 pt-6 mt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !consultorio || !medico || !turno || !tipoCita || !tipoSeguro}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Confirmar Asignación'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
