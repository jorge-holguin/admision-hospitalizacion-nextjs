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
import { SimpleSISVerification } from "../patient/SimpleSISVerification"
import { EntidadSisSelector } from "../selectors/EntidadSisSelector"
import { extractDocumentFromToken, extractNombreCompletoFromToken } from "@/utils/jwtUtils"
import { imprimirCita, CitaDto, formatDateToDDMMYYYY, formatDateTimeToDDMMYYYY } from "@/services/appointments/printService"

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
  const [observacion, setObservacion] = useState<string>("")
  const [referencia, setReferencia] = useState<string>("")
  const [selectedEntidadSis, setSelectedEntidadSis] = useState<string>("")
  const [sisVerificationResult, setSisVerificationResult] = useState<any>(null)

  // Get API base URL from environment
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://localhost:8080/api'

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
      setObservacion("")
      setReferencia("")
      setSelectedEntidadSis("")
      setSisVerificationResult(null)
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

  // Function to check if selected insurance is SIS
  const isSisSeguro = () => {
    const sisTypes = ['20', '21', '22', '23', '24', '25', '01']
    return sisTypes.includes(tipoSeguro)
  }

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

    // Validate SIS specific fields
    if (isSisSeguro() && (!selectedEntidadSis || !referencia)) {
      toast({
        title: "Campos SIS requeridos",
        description: "Para seguros SIS, debe completar la entidad SIS y número de referencia",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Get user from JWT token
      const usuario = extractDocumentFromToken()
      
      // Prepare request body
      const requestBody = {
        consultorio: consultorio,
        medico: medico,
        fecha: new Date(fecha).toISOString(),
        hora: hora,
        turnoConsulta: turno === 'MAÑANA' ? 'M' : 'T',
        paciente: patient.HISTORIA || patient.PACIENTE,
        nombre: patient.NOMBRES || patient.NOMBRE || '',
        observacion: observacion || '',
        seguro: tipoSeguro,
        numero: numero,
        numRef: referencia || '',
        entidadSis: selectedEntidadSis || ''
      }
      
      console.log('🚀 Enviando cita adicional:', requestBody)
      
      // Call the API
      const response = await fetch(`${apiBaseUrl}/adicional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'usuario': usuario
        },
        body: JSON.stringify(requestBody)
      })
      
      // Intentar parsear la respuesta
      let responseData
      try {
        responseData = await response.json()
      } catch (e) {
        responseData = await response.text()
      }
      
      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 409 && responseData.message) {
          // Error de conflicto - Cita con solicitud pendiente
          toast({
            title: "Cita No Disponible",
            description: responseData.message,
            variant: "destructive"
          })
          return
        }
        
        // Otros errores
        const errorMessage = responseData.message || `Error al crear la cita: ${response.status}`
        toast({
          title: "Error al Crear Cita",
          description: errorMessage,
          variant: "destructive"
        })
        return
      }
      
      console.log('✅ Respuesta de la API:', responseData)
      
      // Extraer el ID de la cita creada de la respuesta
      const citaId = responseData.citaId || responseData.id || responseData.data?.citaId || null
      
      // Show success
      const mockId = citaId || `CITA-${Date.now()}`
      setAppointmentId(mockId)
      setShowSuccess(true)
      
      toast({
        title: "¡Cita Creada Exitosamente!",
        description: `La cita adicional ha sido asignada correctamente al paciente ${patient.NOMBRES || patient.NOMBRE}`,
        className: "bg-green-50 border-green-200 text-green-800"
      })
      
      // Imprimir la cita automáticamente si tenemos el ID
      if (citaId) {
        try {
          await imprimirCitaAsignada(citaId)
        } catch (printError) {
          console.error('Error al imprimir cita:', printError)
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error creating additional appointment:', error)
      toast({
        title: "Error",
        description: error.message || "Hubo un error al crear la cita adicional. Intente nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const imprimirCitaAsignada = async (citaId: string) => {
    try {
      console.log('🖨️ Obteniendo datos de la cita para imprimir:', citaId)
      
      // Obtener datos completos de la cita
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/cita/${citaId}`)
      
      if (!response.ok) {
        throw new Error('No se pudo obtener los datos de la cita')
      }
      
      const citaData = await response.json()
      console.log('📋 Datos de cita recibidos para impresión:', citaData)
      
      // Obtener el operador desde el JWT
      const operador = extractNombreCompletoFromToken() || 'OPERADOR'
      
      // Formatear turno
      const turnoConsulta = citaData.turnoConsulta || ''
      const turnoFormateado = turnoConsulta.trim().toUpperCase() === 'M' ? 'Mañana' : 
                              turnoConsulta.trim().toUpperCase() === 'T' ? 'Tarde' : turnoConsulta
      
      // Construir el DTO para impresión con fechas formateadas
      const citaDto: CitaDto = {
        numero: citaData.citaId || citaId,
        numeroAtencion: citaData.numero || '',
        paciente: citaData.nombre || '',
        consultorio: citaData.consultorioNombre || '',
        medico: citaData.medicoNombre || '',
        diaAtencion: formatDateToDDMMYYYY(citaData.fecha || new Date().toISOString()),
        turno: turnoFormateado,
        hora: citaData.hora || '',
        historiaClinica: citaData.historia ? String(citaData.historia).trim() : null,
        emitidoEl: formatDateTimeToDDMMYYYY(new Date().toISOString()),
        operador: operador,
        seguro: citaData.seguroNombre || 'PAGANTE'
      }
      
      console.log('🖨️ Enviando cita a imprimir:', citaDto)
      await imprimirCita(citaDto)
      
      console.log('✅ Cita enviada a imprimir correctamente')
    } catch (error) {
      console.error('❌ Error al imprimir cita:', error)
      // No mostrar error al usuario ya que la creación fue exitosa
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
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Observación
                      </Label>
                      <Input
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        placeholder="Ingrese observaciones..."
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Verificación SIS - Solo mostrar si el seguro seleccionado es SIS */}
                  {isSisSeguro() && (
                    <div className="mt-4">
                      <SimpleSISVerification
                        patientId={patient.HISTORIA}
                        documento={patient.DOCUMENTO}
                        onVerificationComplete={(result) => {
                          setSisVerificationResult(result)
                          if (result.isSuccess && result.eess) {
                            // Hacer trim a los ceros del código de establecimiento
                            const trimmedEess = result.eess.replace(/^0+/, '') || result.eess
                            // Asegurar que se actualice el estado inmediatamente
                            setSelectedEntidadSis(trimmedEess)
                            
                            // Forzar un retraso para asegurar que el estado se actualice
                            setTimeout(() => {
                              console.log('Establecimiento autocompletado:', trimmedEess)
                            }, 100)
                          }
                        }}
                      />
                    </div>
                  )}

                  {isSisSeguro() && (
                    <>
                      <EntidadSisSelector
                        key={sisVerificationResult?.eess || 'entidad-sis-selector'} // Reset cuando cambia verificación SIS
                        value={selectedEntidadSis}
                        onChange={setSelectedEntidadSis}
                        required={true}
                        sisEstablecimiento={sisVerificationResult?.isSuccess ? {
                          codigo: sisVerificationResult.eess?.replace(/^0+/, '') || '',
                          nombre: sisVerificationResult.descEESS || ''
                        } : undefined}
                      />
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Referencia <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="Ingrese número de referencia..."
                          value={referencia}
                          onChange={(e) => setReferencia(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
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
            disabled={isLoading || !consultorio || !medico || !turno || !tipoCita || !tipoSeguro || (isSisSeguro() && (!selectedEntidadSis || !referencia))}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Confirmar Cita Adicional'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
