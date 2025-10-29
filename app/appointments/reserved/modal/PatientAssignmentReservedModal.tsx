"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PatientInfoCardAppointment } from "../../../../components/appointments/patient/PatientInfoCardAppointment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User, Stethoscope, CheckCircle, ArrowLeft, XCircle, AlertTriangle, Edit } from "lucide-react"
import { TipoCitaSelector } from "../../../../components/appointments/selectors/TipoCitaSelector"
import { TipoSeguroSelector } from "../../../../components/appointments/selectors/TipoSeguroSelector"
import { EntidadSisSelector } from "../../../../components/appointments/selectors/EntidadSisSelector"
import { useTipoCita } from "@/contexts/TipoCitaContext"
import { useSegurosCita } from "@/contexts/SegurosCitaContext"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SimpleSISVerification } from "../../../../components/appointments/patient/SimpleSISVerification"
import { toast } from "@/components/ui/use-toast"
import { extractDocumentFromToken } from "@/utils/jwtUtils"
import { convertTo12HourFormat } from "@/utils/timeUtils"
import { PatientEditModal } from "@/components/filiation/modals/PatientEditModal"

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
  codigo: string
  citaId: string
  idSolicitudCita?: number
  fecha: string
  hora: string
  especialidad: string
  especialidadNombre?: string
  medico: string
  medicoNombre?: string
  estado: string
  tipoCita?: string | null  // ✅ Tipo de cita
  especialidadInterconsulta?: string | null  // ✅ Especialidad de interconsulta
  observacionPaciente?: string | null  // ✅ Observaciones del paciente
}

interface TipoCita {
  Tipo_cita: string
  Nombre: string
}

interface Seguro {
  Seguro: string
  Nombre: string
}

interface PatientAssignmentReservedModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient | null
  appointment: Appointment | null
  onApprove: (assignmentData: any) => void
  onDeny: (motivo: string) => void
  onObserve: (motivo: string) => void
  onSuccess?: (citaId: string) => void
  onBack?: () => void
  searchType?: 'document' | 'name'
}

// Modal para solicitar motivo
interface MotivoModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (motivo: string) => void
  title: string
  action: string
  isLoading: boolean
}

function MotivoModal({ isOpen, onClose, onConfirm, title, action, isLoading }: MotivoModalProps) {
  const [motivo, setMotivo] = useState("")

  const handleConfirm = () => {
    if (motivo.trim()) {
      onConfirm(motivo.trim())
    } else {
      toast({
        title: "Campo requerido",
        description: "Debe ingresar un motivo",
        variant: "destructive"
      })
    }
  }

  const handleClose = () => {
    setMotivo("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Motivo <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder={`Ingrese el motivo por el cual se ${action.toLowerCase()} la solicitud...`}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {motivo.length}/500 caracteres
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!motivo.trim() || isLoading}
            variant={action === "DENEGAR" ? "destructive" : "default"}
            className={action === "OBSERVAR" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
          >
            {isLoading ? "Procesando..." : `Confirmar ${action}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PatientAssignmentReservedModal({ 
  isOpen, 
  onClose, 
  patient, 
  appointment, 
  onApprove,
  onDeny,
  onObserve,
  onSuccess,
  onBack,
  searchType = 'document'
}: PatientAssignmentReservedModalProps) {

  // ✅ Debug: Verificar datos recibidos
  useEffect(() => {
    console.log('🔍 Datos recibidos en modal:', {
      patient: patient ? { HISTORIA: patient.HISTORIA, NOMBRES: patient.NOMBRES } : null,
      appointment: appointment ? {
        codigo: appointment.codigo,
        tipoCita: appointment.tipoCita,
        especialidadInterconsulta: appointment.especialidadInterconsulta,
        observacionPaciente: appointment.observacionPaciente,
        fecha: appointment.fecha,
        especialidadNombre: appointment.especialidadNombre
      } : null
    })

    // ✅ Debug adicional: verificar si los campos existen pero son undefined/null
    if (appointment) {
      console.log('📋 Campos individuales del appointment:')
      console.log('   - tipoCita:', appointment.tipoCita, typeof appointment.tipoCita)
      console.log('   - especialidadInterconsulta:', appointment.especialidadInterconsulta, typeof appointment.especialidadInterconsulta)
      console.log('   - observacionPaciente:', appointment.observacionPaciente, typeof appointment.observacionPaciente)
    }
  }, [appointment, patient])

  // Use contexts instead of local state for tipos de cita and seguros
  const { tiposCita } = useTipoCita()
  const { seguros } = useSegurosCita()
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
  
  const [selectedTipoCita, setSelectedTipoCita] = useState("")
  const [selectedSeguro, setSelectedSeguro] = useState("")
  const [selectedEntidadSis, setSelectedEntidadSis] = useState("")
  const [referencia, setReferencia] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [sisVerificationResult, setSisVerificationResult] = useState<any>(null)
  
  // Estados para modales de motivo
  const [showMotivoModal, setShowMotivoModal] = useState(false)
  const [motivoAction, setMotivoAction] = useState<"DENEGAR" | "OBSERVAR">("DENEGAR")
  const [motivoLoading, setMotivoLoading] = useState(false)
  
  // Estados para modal de error
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorDialogData, setErrorDialogData] = useState<{title: string, message: string, type: 'warning' | 'error'}>({title: '', message: '', type: 'error'})

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTipoCita("")
      setSelectedSeguro(patient?.SEGURO || "")
      setSelectedEntidadSis("")
      setReferencia("")
      setShowSuccess(false)
      setSisVerificationResult(null)
    }
  }, [isOpen, patient])

  const isSisSeguro = () => {
    if (!selectedSeguro || !seguros) return false
    // Asumimos que SIS es el seguro con código '21' o nombre que contenga 'SIS'
    const seguro = seguros.find(s => s.Seguro === selectedSeguro)
    return seguro?.Seguro === '21' || seguro?.Nombre?.toUpperCase().includes('SIS') || false
  }

  const handleApprove = async () => {
    if (!patient || !appointment) return

    setIsLoading(true)
    try {
      // Preparar el cuerpo de la solicitud según el formato requerido
      const currentDate = new Date();
      const usuarioApellido = extractDocumentFromToken();
      
      const requestBody = {
        fechaOtorga: currentDate.toISOString(),
        tipoCita: selectedTipoCita,
        tipoPaciente: 'C',
        paciente: patient?.PACIENTE || '',
        nombre: patient?.NOMBRES || `${patient?.PATERNO || ''} ${patient?.MATERNO || ''} ${patient?.NOMBRE || ''}`.trim(),
        seguro: selectedSeguro,
        estado: '2', // Estado asignado
        horaOtorga: `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`,
        usuario: usuarioApellido,
        numRef: referencia || '',
        entidadSis: selectedEntidadSis || ''
      }
      
      console.log('📤 Enviando solicitud de asignación:', requestBody)
      
      // 1. Construir la URL usando la variable de entorno para asignar cita
      const apiUrl = `${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/cita/${appointment.citaId}/asignar`;
      console.log('🔗 URL de asignación:', apiUrl);
      
      // 2. Realizar la solicitud PUT para asignar la cita
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 409 && responseData.message) {
          // Error de conflicto - Mostrar dialog grande y visible
          const isYaAsignada = responseData.message.includes('ya fue asignada') || responseData.message.includes('ya asignada')
          const isSolicitudPendiente = responseData.message.includes('solicitud pendiente')
          
          setErrorDialogData({
            title: isYaAsignada ? '⚠️ Cita Ya Asignada' : isSolicitudPendiente ? '⚠️ Cita Reservada' : '⚠️ Conflicto',
            message: responseData.message,
            type: 'warning'
          })
          setShowErrorDialog(true)
          return
        }
        
        // Otros errores
        const errorMessage = responseData.message || `Error al asignar paciente: ${response.status} ${response.statusText}`
        setErrorDialogData({
          title: '❌ Error en la Asignación',
          message: errorMessage,
          type: 'error'
        })
        setShowErrorDialog(true)
        return
      }
      
      console.log('✅ Asignación exitosa:', responseData)
      
/*       // ===== LÓGICA ESPECIAL PARA SEGUROS '05' y '13' =====
      const seguroTrimmed = selectedSeguro.trim()
      if (seguroTrimmed === '05' || seguroTrimmed === '13') {
        console.log(`💰 Seguro ${seguroTrimmed} detectado - Procesando FECHA_PAGO y ARCHIVO_MOV...`)
        
        try {
          // 1. Actualizar FECHA_PAGO de la cita
          console.log('📅 Paso 1: Actualizando FECHA_PAGO...')
          const fechaActual = new Date()
          const updateFechaPagoResponse = await fetch(`/api/appointments/${appointment.citaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              FECHA_PAGO: fechaActual.toISOString(),
              USUARIOR: usuarioApellido
            })
          })
          
          if (!updateFechaPagoResponse.ok) {
            console.warn('⚠️ No se pudo actualizar FECHA_PAGO:', updateFechaPagoResponse.status)
          } else {
            console.log('✅ FECHA_PAGO actualizada')
          }
          
          // 2. Consultar datos completos de la cita desde la API
          console.log('🔍 Paso 2: Consultando datos completos de la cita...')
          const citaResponse = await fetch(`${apiBaseUrl}/cita/${appointment.citaId}`)
          
          if (!citaResponse.ok) {
            throw new Error(`Error al consultar cita: ${citaResponse.status}`)
          }
          
          const citaData = await citaResponse.json()
          console.log('📄 Datos de cita obtenidos:', citaData)
          
          // 3. Crear registro en ARCHIVO_MOV
          console.log('📝 Paso 3: Creando registro en ARCHIVO_MOV...')
          
          const archivoMovData = {
            ID_CITA: citaData.citaId || appointment.citaId,
            PACIENTE: citaData.paciente || patient?.PACIENTE || '',
            HISTORIA: (citaData.historia || patient?.HISTORIA || '').trim(),
            NOMBRES: (citaData.nombre || patient?.NOMBRES || '').trim(),
            FECHA: citaData.fecha ? new Date(citaData.fecha) : fechaActual,
            HORA: citaData.hora ? convertTo12HourFormat(citaData.hora) : convertTo12HourFormat(currentDate.toTimeString().substring(0, 5)),
            ORIGEN: 'CE',
            CONSULTORIO: (citaData.consultorio || '').padEnd(6, ' '),
            TURNO: (citaData.turnoConsulta || 'M').padEnd(2, ' '),
            MOTIVO: '01',
            ESTADO: '1',
            SEGURO: (citaData.seguro || selectedSeguro).padEnd(3, ' '),
            MEDICO: citaData.medico || '',
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
      // ===== FIN LÓGICA ESPECIAL ===== */
      
      // 3. Llamar a la API de reservas para marcar la solicitud como "CITAR"
      if (appointment.idSolicitudCita) {
        const reservasApiUrl = `${process.env.NEXT_PUBLIC_API_RESERVAS_URL}/solicitudes/${appointment.idSolicitudCita}/citar?usuarioAsigna=${usuarioApellido}`;
        console.log('🔗 URL de reservas (citar):', reservasApiUrl);
        
        const reservasResponse = await fetch(reservasApiUrl, {
          method: 'PUT',
          headers: {
            'accept': '*/*'
          }
        })
        
        if (!reservasResponse.ok) {
          console.warn(`⚠️ Advertencia al actualizar solicitud de reserva: ${reservasResponse.status} ${reservasResponse.statusText}`)
          // No lanzamos error aquí porque la cita ya fue asignada exitosamente
        } else {
          const reservasData = await reservasResponse.json()
          console.log('✅ Solicitud de reserva actualizada a CITAR:', reservasData)
        }
      } else {
        console.warn('⚠️ No se encontró idSolicitudCita, no se puede actualizar el estado de la reserva')
      }
      
      // Notificar al componente padre sobre la asignación exitosa
      const assignmentData = {
        ...requestBody,
        appointmentId: appointment.citaId,
        success: true,
        responseData
      }

      await onApprove(assignmentData)
      
      // Mostrar modal de éxito primero
      setShowSuccess(true)
      
      // Mostrar toast de éxito
      toast({
        title: "¡Asignación Exitosa!",
        description: `La cita ha sido asignada correctamente al paciente ${patient.NOMBRES}`,
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 5000
      })
      
      // Cerrar después de 3 segundos
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
        if (onSuccess) {
          onSuccess(appointment.citaId)
        }
      }, 3000)
    } catch (error: any) {
      console.error('Error al aprobar:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la solicitud. Intente nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDenyClick = () => {
    setMotivoAction("DENEGAR")
    setShowMotivoModal(true)
  }

  const handleMotivoConfirm = async (motivo: string) => {
    setMotivoLoading(true)
    try {
      await onDeny(motivo)
      
      // Cerrar modal de motivo
      setShowMotivoModal(false)
      
      // Mostrar toast de éxito con mayor duración
      toast({
        title: "✅ Solicitud Denegada",
        description: "La solicitud ha sido denegada correctamente",
        className: "bg-orange-50 border-orange-200 text-orange-800",
        duration: 5000
      })
      
      // Esperar un momento antes de cerrar para que se vea el toast
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error al denegar:', error)
      toast({
        title: "Error",
        description: "No se pudo denegar la solicitud",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setMotivoLoading(false)
    }
  }

  if (!patient || !appointment) return null

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Solicitud Aprobada!
            </h3>
            <p className="text-gray-600">
              La solicitud ha sido procesada correctamente
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <DialogTitle className="text-xl font-semibold text-blue-600">
                  Confirmar Asignación de Paciente
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Información del Paciente
                </p>
              </div>
            </div>
       
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda: Información del paciente */}
            <div className="space-y-4 flex flex-col">
              <PatientInfoCardAppointment patient={patient} className="flex-1" />
            </div>

            {/* Columna derecha: Información de la cita y datos de asignación */}
            <div className="space-y-4 flex flex-col">
              {/* Información de la cita */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Información de la Cita
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Información básica de fecha y hora */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Fecha</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {appointment.fecha}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Hora</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {appointment.hora}
                      </div>
                    </div>
                  </div>

                  {/* Información médica */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Especialidad</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Stethoscope className="h-4 w-4 text-gray-400" />
                        {appointment.especialidadNombre || appointment.especialidad}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Médico</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        {appointment.medicoNombre || appointment.medico}
                      </div>
                    </div>
                  </div>

                  {/* ✅ Tipo de Cita y Especialidad de Interconsulta en la misma fila */}
                  {appointment.tipoCita && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Tipo de Cita</Label>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{appointment.tipoCita}</span>
                        </div>
                      </div>
                      {appointment.tipoCita === 'INTERCONSULTA' && appointment.especialidadInterconsulta && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Especialidad de Interconsulta</Label>
                          <div className="flex items-center gap-2 text-sm">
                            <Stethoscope className="h-4 w-4 text-blue-400" />
                            <span className="font-medium text-blue-600">{appointment.especialidadInterconsulta}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ✅ Observaciones del Paciente */}
                  {(appointment.tipoCita === 'INTERCONSULTA' || appointment.observacionPaciente) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Observaciones del Paciente</Label>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-gray-700">{appointment.observacionPaciente || '-'}</p>
                      </div>
                    </div>
                  )}
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
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Referencia <span className="text-red-500">*</span>
                          </Label>
                     {/*      <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implementar modal para ver imagen de referencia
                              toast({
                                title: "Funcionalidad pendiente",
                                description: "El modal para ver la imagen de referencia será implementado próximamente",
                              })
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver imagen de la referencia
                          </Button> */}
                        </div>
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

          {/* Botones de acción - Solo Aprobar y Denegar */}
          <div className="flex justify-center gap-4 pt-6 border-t">
            <Button 
              onClick={handleApprove}
              disabled={
                !selectedTipoCita || 
                !selectedSeguro || 
                (isSisSeguro() && (!selectedEntidadSis || !referencia.trim())) ||
                isLoading
              }
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-6 text-base min-w-[160px] shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              {isLoading ? "Aprobando..." : "Aprobar Solicitud"}
            </Button>
            
            <Button 
              onClick={handleDenyClick}
              disabled={isLoading}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-6 text-base min-w-[160px] shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <XCircle className="h-5 w-5 mr-2" />
              {isLoading ? "Procesando..." : "Denegar Solicitud"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para solicitar motivo */}
      <MotivoModal
        isOpen={showMotivoModal}
        onClose={() => setShowMotivoModal(false)}
        onConfirm={handleMotivoConfirm}
        title={motivoAction === "DENEGAR" ? "Denegar Solicitud" : "Observar Solicitud"}
        action={motivoAction}
        isLoading={motivoLoading}
      />
      
      {/* Dialog de Error/Advertencia */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-xl ${errorDialogData.type === 'warning' ? 'text-orange-600' : 'text-red-600'}`}>
              {errorDialogData.type === 'warning' ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <XCircle className="h-6 w-6" />
              )}
              {errorDialogData.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className={`p-6 rounded-lg ${errorDialogData.type === 'warning' ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-base ${errorDialogData.type === 'warning' ? 'text-orange-800' : 'text-red-800'}`}>
              {errorDialogData.message}
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              onClick={() => setShowErrorDialog(false)}
              className={errorDialogData.type === 'warning' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
