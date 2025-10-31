"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PatientInfoCardAppointment } from "../patient/PatientInfoCardAppointment"
import { PatientPendingAppointmentsModal, type PendingAppointment } from "../patient/PatientPendingAppointmentsModal"
import { ConsultorioCitasSelector } from "../selectors/ConsultorioCitasSelector"
import { MedicoSelector } from "../selectors/MedicoSelector"
import { TipoCitaSelector } from "../selectors/TipoCitaSelector"
import { TipoSeguroSelector } from "../selectors/TipoSeguroSelector"
import { TurnoSelector } from "../selectors/TurnoSelector"
import { ArrowLeft, Loader2, CheckCircle, Edit } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { PatientEditModal } from "@/components/filiation/modals/PatientEditModal"
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
  const [createdAppointment, setCreatedAppointment] = useState<any>(null)
  const [showPatientEditModal, setShowPatientEditModal] = useState(false)
  const [isLoadingFullPatient, setIsLoadingFullPatient] = useState(false)
  const [fullPatientData, setFullPatientData] = useState<any>(null)
  const [refreshedPatient, setRefreshedPatient] = useState<any>(null)
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([])
  const [consultorioNombreSel, setConsultorioNombreSel] = useState<string>("")
  
  // Form fields
  const [fecha, setFecha] = useState<string>("")
  const [consultorio, setConsultorio] = useState<string>("")
  const [medico, setMedico] = useState<string>("")
  const [turno, setTurno] = useState<string>("")
  const [tipoCita, setTipoCita] = useState<string>("")
  const [tipoSeguro, setTipoSeguro] = useState<string>("")
  const [observacion, setObservacion] = useState<string>("")
  const [referencia, setReferencia] = useState<string>("")
  const [selectedEntidadSis, setSelectedEntidadSis] = useState<string>("")
  const [sisVerificationResult, setSisVerificationResult] = useState<any>(null)
  const [especialidadConsultorio, setEspecialidadConsultorio] = useState<string | null>(null)

  // Get API base URL from environment
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://localhost:8080/api'

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && patient) {
      // Set today's date
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      setFecha(todayString)
      
      // Set default seguro from patient data
      if (patient.SEGURO) {
        console.log('📋 Estableciendo seguro desde paciente:', patient.SEGURO)
        setTipoSeguro(patient.SEGURO)
      } else {
        console.warn('⚠️ Paciente no tiene SEGURO definido:', patient)
      }
      
      // Reset other fields
      setConsultorio("")
      setMedico("")
      setTurno("")
      setTipoCita("")
      setObservacion("")
      setReferencia("")
      setSelectedEntidadSis("")
      setSisVerificationResult(null)
      setShowSuccess(false)
      setCreatedAppointment(null)
    }
  }, [isOpen, patient])

  // Actualizar tipo de seguro cuando se recarga el paciente
  useEffect(() => {
    if (refreshedPatient && refreshedPatient.SEGURO) {
      console.log('🔄 Actualizando tipo de seguro desde paciente recargado:', refreshedPatient.SEGURO)
      setTipoSeguro(refreshedPatient.SEGURO)
    }
  }, [refreshedPatient])

  // Limpiar campos SIS cuando no es seguro SIS
  useEffect(() => {
    if (!isSisSeguro()) {
      setSelectedEntidadSis("")
      setReferencia("")
      setSisVerificationResult(null)
    }
  }, [tipoSeguro])

  // Function to check if selected insurance is SIS
  const isSisSeguro = () => {
    const sisSegurosCodes = ['20', '21', '22', '23', '24', '25']
    const isSis = sisSegurosCodes.includes(tipoSeguro?.toString().trim())
    console.log('🔍 isSisSeguro check:', { tipoSeguro, tipoSeguroTrimmed: tipoSeguro?.toString().trim(), isSis, sisSegurosCodes })
    return isSis
  }

  // Función para cargar datos completos del paciente
  const loadFullPatientData = async (pacienteId: string) => {
    try {
      setIsLoadingFullPatient(true)
      console.log('🔄 Cargando datos completos del paciente:', pacienteId)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
      const response = await fetch(`${apiUrl}/historia-clinica/pacientes/${pacienteId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del paciente')
      }
      
      const data = await response.json()
      console.log('✅ Datos completos del paciente cargados:', data)
      setFullPatientData(data)
    } catch (error) {
      console.error('❌ Error al cargar datos del paciente:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos completos del paciente",
        variant: "destructive"
      })
    } finally {
      setIsLoadingFullPatient(false)
    }
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
        turnoConsulta: turno === 'MAÑANA' ? 'M' : 'T',
        paciente: patient.HISTORIA || patient.PACIENTE,
        nombre: patient.NOMBRES || patient.NOMBRE || '',
        observacion: observacion || '',
        seguro: tipoSeguro,
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
      
      // Guardar datos de la cita creada
      setCreatedAppointment(responseData)
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
      setCreatedAppointment(null)
    }
    onClose()
  }

  if (!patient) return null

  // Detectar coincidencias para mostrar advertencia en cabecera
  const hasConsultorioMatch = pendingAppointments?.some((apt) => {
    const curr = consultorioNombreSel?.trim().toLowerCase()
    const other = apt.consultorioNombre?.trim().toLowerCase()
    return curr && other && curr === other
  })

  const hasEspecialidadMatch = pendingAppointments?.some((apt) => {
    const currEspecialidad = especialidadConsultorio?.trim().toLowerCase()
    if (!currEspecialidad) return false
    
    // Comparar con el campo 'especialidad' (código) de las citas pendientes
    const matchCodigo = apt.especialidad?.trim().toLowerCase() === currEspecialidad
    
    return matchCodigo
  })

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
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
            {createdAppointment && (
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-green-800 text-lg mb-3">
                  Información de la Cita Creada
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Número:</span> {createdAppointment.numero || 'N/A'}</div>
                  <div><span className="font-medium">Fecha:</span> {createdAppointment.fecha ? new Date(createdAppointment.fecha).toLocaleDateString('es-PE') : 'N/A'}</div>
                  <div><span className="font-medium">Hora:</span> {createdAppointment.hora || 'N/A'}</div>
                  <div><span className="font-medium">Turno:</span> {createdAppointment.turnoConsulta === 'M' ? 'MAÑANA' : 'TARDE'}</div>
                  <div><span className="font-medium">Consultorio:</span> {createdAppointment.consultorio || 'N/A'}</div>
                  <div><span className="font-medium">Especialidad:</span> {createdAppointment.especialidad || 'N/A'}</div>
                  <div><span className="font-medium">Médico:</span> {createdAppointment.medico || 'N/A'}</div>
                  <div className="col-span-2"><span className="font-medium">Paciente:</span> {createdAppointment.nombre || patient.NOMBRES}</div>
                  {createdAppointment.observacion && (
                    <div className="col-span-2"><span className="font-medium">Observación:</span> {createdAppointment.observacion}</div>
                  )}
                </div>
              </div>
            )}
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
      <DialogContent
        className="max-w-6xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
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

        {(hasConsultorioMatch || hasEspecialidadMatch) && (
          <div className="mb-4">
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-orange-800">
              {hasConsultorioMatch && hasEspecialidadMatch && (
                <>⚠️ Este paciente tiene una cita pendiente en el mismo consultorio y especialidad.</>
              )}
              {!hasEspecialidadMatch && hasConsultorioMatch && (
                <>⚠️ Este paciente tiene una cita pendiente en el mismo consultorio.</>
              )}
              {!hasConsultorioMatch && hasEspecialidadMatch && (
                <>⚠️ Este paciente tiene una cita pendiente en la misma especialidad.</>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Info Card - Left Side */}
          <div className="lg:col-span-1 flex flex-col space-y-3">
            <PatientInfoCardAppointment 
              patient={refreshedPatient || patient}
              className="flex-1"
            />
            
            <Button
              variant="outline"
              onClick={async () => {
                console.log('🔘 Click en Actualizar Historia Clínica')
                console.log('   - patient:', patient)
                console.log('   - patient?.PACIENTE:', patient?.PACIENTE)
                console.log('   - patient?.HISTORIA:', patient?.HISTORIA)
                
                const pacienteId = patient?.PACIENTE || patient?.HISTORIA
                console.log('   - pacienteId seleccionado:', pacienteId)
                
                if (pacienteId) {
                  await loadFullPatientData(pacienteId)
                  console.log('✅ Abriendo modal de edición')
                  setShowPatientEditModal(true)
                } else {
                  console.error('❌ No se encontró pacienteId')
                  toast({
                    title: "Error",
                    description: "No se pudo identificar al paciente",
                    variant: "destructive"
                  })
                }
              }}
              disabled={isLoadingFullPatient}
              className="w-full justify-center px-6 py-2.5 h-11 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 relative z-10 mt-4"
            >
              {isLoadingFullPatient ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Cargando...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Actualizar Historia Clínica
                </>
              )}
            </Button>
          </div>
          
          {/* Appointment Form - Right Side */}
          <div className="lg:col-span-1 flex flex-col">
            <Card className="flex-1">
              <CardContent className="p-6 space-y-6">
                {/* Información de la Cita */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    Información de la Cita
                  </h3>
                  
                  {/* Fecha (solo lectura) */}
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                      <Input
                        type="date"
                        value={fecha}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Consultorio */}
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Consultorio <span className="text-red-500">*</span>
                      </Label>
                      <ConsultorioCitasSelector
                        label=""
                        value={consultorio}
                        onChange={setConsultorio}
                        onConsultorioDataChange={(data) => {
                          console.log('🏭 Consultorio seleccionado:', data)
                          if (data && data.ESPECIALIDAD) {
                            console.log('👨‍⚕️ Especialidad del consultorio:', data.ESPECIALIDAD)
                            setEspecialidadConsultorio(data.ESPECIALIDAD)
                            if (data.NOMBRE) setConsultorioNombreSel(data.NOMBRE)
                          } else {
                            setEspecialidadConsultorio(null)
                            setConsultorioNombreSel("")
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Médico */}
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Médico <span className="text-red-500">*</span>
                      </Label>
                      <MedicoSelector
                        label=""
                        value={medico}
                        onChange={setMedico}
                        especialidad={especialidadConsultorio}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Turno */}
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

                  {/* Botón para ver citas pendientes del paciente */}
                  {patient?.PACIENTE && (
                    <div className="mt-4">
                      <PatientPendingAppointmentsModal
                        pacienteId={patient.PACIENTE}
                        currentConsultorio={consultorioNombreSel}
                        currentEspecialidad={especialidadConsultorio || undefined}
                        limite={5}
                        highlight={hasConsultorioMatch || hasEspecialidadMatch}
                        onAppointmentsLoaded={setPendingAppointments}
                      />
                    </div>
                  )}
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
                          if (result.isSuccess) {
                            // ✅ Cambiar tipo de cita a "D" (Demanda) cuando SIS es exitoso
                            setTipoCita('D')
                            console.log('✅ SIS verificado exitosamente - Tipo de cita establecido a DEMANDA')
                            
                            if (result.eess) {
                              // Hacer trim a los ceros del código de establecimiento
                              const trimmedEess = result.eess.replace(/^0+/, '') || result.eess
                              // Asegurar que se actualice el estado inmediatamente
                              setSelectedEntidadSis(trimmedEess)
                              
                              // Forzar un retraso para asegurar que el estado se actualice
                              setTimeout(() => {
                                console.log('Establecimiento autocompletado:', trimmedEess)
                              }, 100)
                            }
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

            {/* Botón para ver citas pendientes del paciente - removido desde aquí, ahora está dentro de la tarjeta de info */}
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
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
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

      {/* Modal de edición de paciente */}
      {showPatientEditModal && fullPatientData && (
        <Dialog open={showPatientEditModal} onOpenChange={(open) => {
          if (!open) {
            setShowPatientEditModal(false)
            setFullPatientData(null)
          }
        }}>
          <PatientEditModal
            patient={fullPatientData}
            onCancel={() => {
              setShowPatientEditModal(false)
              setFullPatientData(null)
            }}
          onSuccess={async () => {
            setShowPatientEditModal(false)
            setFullPatientData(null)
            
            // Recargar datos del paciente
            const pacienteId = patient?.PACIENTE || patient?.HISTORIA
            if (pacienteId) {
              try {
                console.log('🔄 Recargando datos del paciente:', pacienteId)
                const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
                const response = await fetch(`${apiUrl}/historia-clinica/pacientes/${pacienteId}`)
                
                if (response.ok) {
                  const data = await response.json()
                  console.log('✅ Datos del paciente recargados:', data)
                  
                  // Mapear los datos al formato esperado por PatientInfoCardAppointment
                  const mappedPatient = {
                    ...patient, // Mantener campos originales
                    HISTORIA: data.historia || patient.HISTORIA,
                    NOMBRES: data.nombres ? `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''} ${data.nombres || ''}`.trim() : patient.NOMBRES,
                    NOMBRE: data.nombres || patient.NOMBRE,
                    PATERNO: data.apellidoPaterno || patient.PATERNO,
                    MATERNO: data.apellidoMaterno || patient.MATERNO,
                    SEXO: data.sexo || patient.SEXO,
                    DOCUMENTO: data.numeroDocumento || patient.DOCUMENTO,
                    TIPO_DOCUMENTO: data.tipoDocumento || patient.TIPO_DOCUMENTO,
                    FECHA_NACIMIENTO: data.fechaNacimiento || patient.FECHA_NACIMIENTO,
                    EDAD: data.edad || patient.EDAD,
                    // Estado Civil: puede venir como objeto { estadoCivil, nombre } o como string
                    ESTADO_CIVIL: (data.estadoCivil?.estadoCivil?.trim && data.estadoCivil?.estadoCivil?.trim()) || data.estadoCivil || patient.ESTADO_CIVIL,
                    DIRECCION: data.direccion || patient.DIRECCION,
                    DISTRITO: data.distrito || patient.DISTRITO,
                    Distrito_Dir: data.distritoNacimiento || data.Distrito_Dir || patient.Distrito_Dir,
                    TELEFONO1: data.telefono || patient.TELEFONO1,
                    CORREO: data.correo || patient.CORREO,
                    // Seguro: puede venir como objeto {seguro, nombre} o como string
                    SEGURO: data.seguro?.seguro?.trim() || data.seguro || patient.SEGURO,
                    NOMBRE_SEGURO: data.seguro?.nombre || data.nombreSeguro || patient.NOMBRE_SEGURO,
                    STRING_FOTO: data.foto || patient.STRING_FOTO,
                    PACIENTE: data.paciente || patient.PACIENTE
                  }
                  
                  console.log('✅ Paciente mapeado:', mappedPatient)
                  setRefreshedPatient(mappedPatient)
                } else {
                  console.error('❌ Error al recargar datos del paciente')
                }
              } catch (error) {
                console.error('❌ Error al recargar datos del paciente:', error)
              }
            }
            
            toast({
              title: "Éxito",
              description: "Historia clínica actualizada correctamente",
            })
          }}
          />
        </Dialog>
      )}
    </Dialog>
  )
}
