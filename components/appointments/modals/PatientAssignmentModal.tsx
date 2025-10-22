"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PatientInfoCardAppointment } from "../patient/PatientInfoCardAppointment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User, Stethoscope, CheckCircle, ArrowLeft, Printer } from "lucide-react"
import { TipoCitaSelector } from "../selectors/TipoCitaSelector"
import { TipoSeguroSelector } from "../selectors/TipoSeguroSelector"
import { EntidadSisSelector } from "../selectors/EntidadSisSelector"
import { useTipoCita } from "@/contexts/TipoCitaContext"
import { useSegurosCita } from "@/contexts/SegurosCitaContext"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog"
import { SimpleSISVerification } from "../patient/SimpleSISVerification"
import { toast } from "@/components/ui/use-toast"
import { imprimirCita, CitaDto, formatDateToDDMMYYYY, formatDateTimeToDDMMYYYY } from "@/services/appointments/printService"
import { extractNombreCompletoFromToken, extractDocumentFromToken } from "@/utils/jwtUtils"
import { convertTo12HourFormat } from "@/utils/timeUtils"

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
  onSuccess?: (citaId: string) => void
  onBack?: () => void
  searchType?: 'document' | 'name'
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL

export function PatientAssignmentModal({ 
  isOpen, 
  onClose, 
  patient, 
  appointment, 
  onAssign,
  onSuccess,
  onBack,
  searchType = 'document'
}: PatientAssignmentModalProps) {
  // Use contexts instead of local state for tipos de cita and seguros
  const { tiposCita } = useTipoCita()
  const { seguros } = useSegurosCita()
  
  const [selectedTipoCita, setSelectedTipoCita] = useState("")
  const [selectedSeguro, setSelectedSeguro] = useState("")
  const [selectedEntidadSis, setSelectedEntidadSis] = useState("")
  const [referencia, setReferencia] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [assignedCitaId, setAssignedCitaId] = useState<string | null>(null)
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false)
  const [pendingPrintCitaId, setPendingPrintCitaId] = useState<string | null>(null)
  const [sisVerificationResult, setSisVerificationResult] = useState<any>(null)
  const [enhancedPatient, setEnhancedPatient] = useState<Patient | null>(null)
  const [isLoadingPatientData, setIsLoadingPatientData] = useState(false)
  
  // Estados para el AlertDialog de error
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [errorTitle, setErrorTitle] = useState<string>('Error')

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
      // Si es búsqueda por nombre, cargar datos adicionales del paciente
      if (searchType === 'name' && patient) {
        // Usar PACIENTE si está disponible, de lo contrario usar HISTORIA
        const idToUse = patient.PACIENTE || patient.HISTORIA
        if (idToUse) {
          loadEnhancedPatientData(idToUse)
        } else {
          console.warn('⚠️ No se encontró ID de paciente válido para cargar datos adicionales')
          setEnhancedPatient(patient)
        }
      } else {
        setEnhancedPatient(patient)
      }
    }
  }, [isOpen, patient, searchType])

  const loadEnhancedPatientData = async (pacienteId: string) => {
    if (!pacienteId) return
    
    setIsLoadingPatientData(true)
    try {
      console.log('🔍 Cargando datos adicionales para paciente ID:', pacienteId)
      const response = await fetch(`${apiBaseUrl}/cita/paciente-foto/${pacienteId}`)
      
      if (response.ok) {
        const additionalData = await response.json()
        console.log('📋 Datos adicionales recibidos:', additionalData)
        
        // Combinar datos originales con datos adicionales
        const enhancedPatientData: Patient = {
          ...patient!,
          // Sobrescribir con datos más completos de la API
          NOMBRES: additionalData.nombres || patient!.NOMBRES,
          STRING_FOTO: additionalData.stringFoto || patient!.STRING_FOTO,
          ESTADO_CIVIL: additionalData.estadoCivil || patient!.ESTADO_CIVIL,
          FECHA_NACIMIENTO: additionalData.fechaNacimiento ? 
            new Date(additionalData.fechaNacimiento).toISOString().split('T')[0] : 
            patient!.FECHA_NACIMIENTO,
          EDAD: additionalData.edad || patient!.EDAD
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
      
      // Obtener el DNI del usuario desde el JWT
      const usuarioDni = extractDocumentFromToken() || 'SISTEMA'
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
      // No mostrar error al usuario ya que la asignación fue exitosa
    }
  }

  const handleAssign = async () => {
    if (!selectedTipoCita || !selectedSeguro || !appointment?.id) {
      return
    }

    setIsLoading(true)
    
    try {
      // Obtener el DNI del usuario desde el JWT
      const usuarioDni = extractDocumentFromToken() || 'SISTEMA'
      
      // Preparar el cuerpo de la solicitud según el formato requerido
      const currentDate = new Date();
      const requestBody = {
        fechaOtorga: currentDate.toISOString(),
        tipoPaciente: selectedTipoCita,
        paciente: patient?.PACIENTE || '',
        nombre: patient?.NOMBRES || `${patient?.PATERNO || ''} ${patient?.MATERNO || ''} ${patient?.NOMBRE || ''}`.trim(),
        seguro: selectedSeguro,
        estado: '2', // Estado asignado
        horaOtorga: `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`,
        usuario: usuarioDni,
        numRef: referencia || '',
        entidadSis: selectedEntidadSis || ''
      }
      
      console.log('📤 Enviando solicitud de asignación:', requestBody)
      
      // Construir la URL usando la variable de entorno
      const apiUrl = `${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/cita/${appointment.id}/asignar`;
      console.log('🔗 URL de asignación:', apiUrl);
      
      // Realizar la solicitud PUT
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const responseData = await response.json()
      
      // Verificar si hay un error
      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 409 && responseData.message) {
          // Error de conflicto - Cita con solicitud pendiente
          setErrorTitle("⚠️ Cita No Disponible")
          setErrorMessage(responseData.message)
          setShowErrorDialog(true)
          return
        }
        
        // Otros errores
        const errorMsg = responseData.message || `Error al asignar paciente: ${response.status} ${response.statusText}`
        setErrorTitle("Error en la Asignación")
        setErrorMessage(errorMsg)
        setShowErrorDialog(true)
        return
      }
      
      console.log('✅ Asignación exitosa:', responseData)
      
      /* ===== LÓGICA ESPECIAL PARA SEGUROS '05' y '13' (COMENTADA - Ahora se maneja en backend) =====
      const seguroTrimmed = selectedSeguro.trim()
      if (seguroTrimmed === '05' || seguroTrimmed === '13') {
        console.log(`💰 Seguro ${seguroTrimmed} detectado - Procesando FECHA_PAGO y ARCHIVO_MOV...`)
        
        try {
          // 1. Actualizar FECHA_PAGO de la cita
          console.log('📅 Paso 1: Actualizando FECHA_PAGO...')
          const fechaActual = new Date()
          const updateFechaPagoResponse = await fetch(`/api/appointments/${appointment.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              FECHA_PAGO: fechaActual.toISOString(),
              USUARIOR: usuarioDni
            })
          })
          
          if (!updateFechaPagoResponse.ok) {
            console.warn('⚠️ No se pudo actualizar FECHA_PAGO:', updateFechaPagoResponse.status)
          } else {
            console.log('✅ FECHA_PAGO actualizada')
          }
          
          // 2. Consultar datos completos de la cita desde la API
          console.log('🔍 Paso 2: Consultando datos completos de la cita...')
          const citaResponse = await fetch(`${apiBaseUrl}/cita/${appointment.id}`)
          
          if (!citaResponse.ok) {
            throw new Error(`Error al consultar cita: ${citaResponse.status}`)
          }
          
          const citaData = await citaResponse.json()
          console.log('📄 Datos de cita obtenidos:', citaData)
          
          // 3. Crear registro en ARCHIVO_MOV
          console.log('📝 Paso 3: Creando registro en ARCHIVO_MOV...')
          
          const archivoMovData = {
            ID_CITA: citaData.citaId || appointment.id,
            PACIENTE: citaData.paciente || patient?.PACIENTE || '',
            HISTORIA: (citaData.historia || patient?.HISTORIA || '').trim(),
            NOMBRES: (citaData.nombre || patient?.NOMBRES || '').trim(),
            FECHA: citaData.fecha ? new Date(citaData.fecha) : fechaActual,
            HORA: citaData.hora ? convertTo12HourFormat(citaData.hora) : convertTo12HourFormat(currentDate.toTimeString().substring(0, 5)),
            ORIGEN: 'CE',
            CONSULTORIO: (citaData.consultorio || appointment.consultorio || '').padEnd(6, ' '),
            TURNO: (citaData.turnoConsulta || 'M').padEnd(2, ' '),
            MOTIVO: '01',
            ESTADO: '1',
            SEGURO: (citaData.seguro || selectedSeguro).padEnd(3, ' '),
            MEDICO: citaData.medico || appointment.medico || '',
            NUMERO: citaData.numero || '01',
            FECHA_PAGO: fechaActual,
            TIPO_CITA: citaData.tipoCita || 'C',
            EST_PAC: '1',
            TIPO_PACIENTE: citaData.tipoPaciente || 'C',
         }
          
          console.log('📤 Datos para ARCHIVO_MOV:', archivoMovData)
          
          const archivoMovResponse = await fetch('/api/appointments/archivo-mov', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(archivoMovData)
          })
          
          if (!archivoMovResponse.ok) {
            const errorData = await archivoMovResponse.json()
            // Si ya existe (409), solo advertir, no fallar
            if (archivoMovResponse.status === 409) {
              console.warn('⚠️ ARCHIVO_MOV ya existe para esta cita')
            } else {
              console.error('❌ Error al crear ARCHIVO_MOV:', errorData)
            }
          } else {
            console.log('✅ ARCHIVO_MOV creado exitosamente')
          }
        } catch (archivoMovError) {
          console.error('❌ Error en proceso de ARCHIVO_MOV:', archivoMovError)
          // No bloqueamos el flujo principal, solo logueamos el error
        }
      }
      ===== FIN LÓGICA ESPECIAL ===== */
      
      // Mostrar toast de éxito
      toast({
        title: "¡Asignación Exitosa!",
        description: `La cita ha sido asignada correctamente al paciente ${patient?.NOMBRES || patient?.NOMBRE || ''}`,
        className: "bg-green-50 border-green-200 text-green-800"
      })
      
      // Mostrar mensaje de éxito
      setAssignedCitaId(appointment.id)
      setShowSuccess(true)
      
      // Notificar al componente padre sobre la asignación exitosa
      const assignmentData = {
        ...requestBody,
        appointmentId: appointment.id,
        success: true,
        responseData
      }
      
      await onAssign(assignmentData)
      
      // Preguntar si desea imprimir el ticket
      setPendingPrintCitaId(appointment.id)
      setShowPrintConfirmation(true)
    } catch (error: any) {
      console.error('❌ Error al asignar paciente:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el paciente. Intente nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedTipoCita("")
    setSelectedSeguro("")
    setSelectedEntidadSis("")
    setReferencia("")
    setShowSuccess(false)
    setAssignedCitaId("")
    setSisVerificationResult(null)
    setEnhancedPatient(null)
    setIsLoadingPatientData(false)
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
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="patient-assignment-description">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2 hover:bg-gray-100"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <DialogTitle className="text-blue-800 font-semibold">
                Confirmar Asignación de Paciente
              </DialogTitle>
              <Label className="text-lg font-semibold text-gray-700 mb-4">
                Información del Paciente
              </Label>
            </div>
          </div>
        </DialogHeader>
        
        {/* Mensaje de éxito */}
        {showSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ¡Cita asignada exitosamente! ID de la cita: <strong>{assignedCitaId}</strong>
              <br />
              Redirigiendo en unos segundos...
            </AlertDescription>
          </Alert>
        )}
        
        {/* Contenido dividido en 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Izquierda */}
          <div className="flex flex-col h-full">
            {isLoadingPatientData ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Cargando información completa del paciente...</p>
                </CardContent>
              </Card>
            ) : (
              <PatientInfoCardAppointment 
                patient={enhancedPatient || patient!}
                className="h-full"
              />
            )}
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
                  initialValue={patient?.SEGURO}
                />

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

      {/* Diálogo de confirmación de impresión */}
      <Dialog open={showPrintConfirmation} onOpenChange={setShowPrintConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-blue-600" />
              Imprimir Ticket de Cita
            </DialogTitle>
            <DialogDescription>
              La cita ha sido asignada exitosamente. ¿Desea imprimir el ticket de la cita?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={async () => {
                setShowPrintConfirmation(false)
                setShowSuccess(false)
                onClose()
                if (onSuccess && pendingPrintCitaId) {
                  onSuccess(pendingPrintCitaId)
                }
              }}
            >
              No, gracias
            </Button>
            <Button
              onClick={async () => {
                setShowPrintConfirmation(false)
                if (pendingPrintCitaId) {
                  try {
                    await imprimirCitaAsignada(pendingPrintCitaId)
                    toast({
                      title: "Impresión enviada",
                      description: "El ticket de la cita se está imprimiendo",
                      className: "bg-green-50 border-green-200 text-green-800"
                    })
                  } catch (printError) {
                    console.error('Error al imprimir cita:', printError)
                    toast({
                      title: "Error al imprimir",
                      description: "No se pudo imprimir el ticket. Intente nuevamente desde la lista de citas.",
                      variant: "destructive"
                    })
                  }
                }
                setShowSuccess(false)
                onClose()
                if (onSuccess && pendingPrintCitaId) {
                  onSuccess(pendingPrintCitaId)
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Sí, imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>

    {/* AlertDialog para mostrar errores de manera prominente */}
    <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            {errorTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700 whitespace-pre-line">
            {errorMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={() => setShowErrorDialog(false)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
