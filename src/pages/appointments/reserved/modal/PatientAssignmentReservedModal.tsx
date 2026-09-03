"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PatientInfoCardAppointment } from "@/components/appointments/patient/PatientInfoCardAppointment"
import { PatientPendingAppointmentsModal, type PendingAppointment } from "@/components/appointments/patient/PatientPendingAppointmentsModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User, Stethoscope, CheckCircle, ArrowLeft, XCircle, AlertTriangle } from "lucide-react"
import { TipoCitaSelector } from "@/components/appointments/selectors/TipoCitaSelector"
import { TipoSeguroSelector } from "@/components/appointments/selectors/TipoSeguroSelector"
import { EntidadSisSelector } from "@/components/appointments/selectors/EntidadSisSelector"
import { ReferenciaSelector } from "@/components/appointments/selectors/ReferenciaSelector"
import { useTipoCita } from "@/contexts/TipoCitaContext"
import { useSegurosCita } from "@/contexts/SegurosCitaContext"
import { ReferenciaProvider } from "@/contexts/ReferenciaContext"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SimpleSISVerification } from "@/components/appointments/patient/SimpleSISVerification"
import { toast } from "@/components/ui/use-toast"
import { extractDocumentFromToken } from '@/utils/jwtUtils'
import { datetimeService } from '@/services/datetimeService'
import { sincronizarCitaConRefcon, obtenerDatosCitaRefcon, esSeguroSIS, actualizarEstadoRefcon } from "@/services/appointments/refconSyncService"
import { obtenerEntidadSISPorCodigo } from "@/services/appointments/sisEntitiesService"
import { convertTo12HourFormat } from "@/utils/timeUtils"
import { UpdateClinicalHistoryButton } from "@/components/appointments/patient/UpdateClinicalHistoryButton"

// const FHIR_BASE_URL = import.meta.env.VITE_API_FHIR_URL || 'http://192.168.0.252:9015'


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
  CORREO?: string
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
  consultorio?: string
  consultorioNombre?: string
  tipoCita?: string | null
  especialidadInterconsulta?: string | null
  observacionPaciente?: string | null
  observacion?: string | null
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

// Componente interno
function PatientAssignmentReservedModalContent({ 
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

  // Use contexts instead of local state for tipos de cita and seguros
  const { tiposCita } = useTipoCita()
  const { seguros } = useSegurosCita()
  
  const apiBaseUrl = import.meta.env.VITE_API_CITAS_MASTER_URL
  
  const [selectedTipoCita, setSelectedTipoCita] = useState("")
  const [selectedSeguro, setSelectedSeguro] = useState("")
  const [selectedEntidadSis, setSelectedEntidadSis] = useState("")
  const [referencia, setReferencia] = useState("")
  const [referenciaIdSeleccionada, setReferenciaIdSeleccionada] = useState("")
  const [eessOrigenReferencia, setEessOrigenReferencia] = useState("")
  const [eessNombreOrigen, setEessNombreOrigen] = useState("")
  const [skipRefconSync, setSkipRefconSync] = useState(false) // Flag para omitir sincronización con REFCON (estados 5, 7, manual)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [pendingAssignmentData, setPendingAssignmentData] = useState<any>(null) // Datos para notificar al padre después de confirmar
  
  // Estados para el resultado de sincronización REFCON
  const [refconSyncSuccess, setRefconSyncSuccess] = useState(false)
  const [refconSyncError, setRefconSyncError] = useState<string | null>(null)
  // const [fhirSyncResult, setFhirSyncResult] = useState<{ ok: boolean; scusUuid?: string; message?: string } | null>(null)
  const [sisVerificationResult, setSisVerificationResult] = useState<any>(null)
  const [refreshedPatient, setRefreshedPatient] = useState<any>(null)
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([])
  
  // Estados para modales de motivo
  const [showMotivoModal, setShowMotivoModal] = useState(false)
  const [motivoAction, setMotivoAction] = useState<"DENEGAR" | "OBSERVAR">("DENEGAR")
  const [motivoLoading, setMotivoLoading] = useState(false)
  
  // Estados para modal de error
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorDialogData, setErrorDialogData] = useState<{title: string, message: string, type: 'warning' | 'error'}>({title: '', message: '', type: 'error'})
  
  // Estado para el dialog de confirmación de conflicto de horario
  const [showTimeConflictDialog, setShowTimeConflictDialog] = useState(false)
  
  // Estado para el dialog de confirmación de especialidad duplicada (advertencia de responsabilidad)
  const [showEspecialidadConflictDialog, setShowEspecialidadConflictDialog] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTipoCita("")
      setSelectedSeguro(patient?.SEGURO || "")
      setSelectedEntidadSis("")
      setReferencia("")
      setReferenciaIdSeleccionada("")
      setEessOrigenReferencia("")
      setEessNombreOrigen("")
      setSkipRefconSync(false)
      setShowSuccess(false)
      setSisVerificationResult(null)
      setRefconSyncSuccess(false)
      setRefconSyncError(null)
      // setFhirSyncResult(null)
      setPendingAssignmentData(null)
    }
  }, [isOpen, patient])

  // Determinar si hay coincidencias con citas pendientes
  const hasConsultorioMatch = pendingAppointments?.some((apt) => {
    const currCodigo = appointment?.consultorio?.trim()
    const otherCodigo = apt.consultorio?.trim()
    
    return currCodigo && otherCodigo && 
           currCodigo.toLowerCase() === otherCodigo.toLowerCase()
  })
  
  const hasEspecialidadMatch = pendingAppointments?.some((apt) => {
    const currCodigo = appointment?.especialidad?.trim()?.toLowerCase()
    if (!currCodigo) return false
    
    const otherCodigo = apt.especialidad?.trim()?.toLowerCase()
    return otherCodigo === currCodigo
  })

  // Validar ventana de 3 horas entre citas
  const validateTimeWindow = (): { isValid: boolean; conflictingAppointment?: any; message?: string } => {
    if (!appointment?.fecha || !appointment?.hora || pendingAppointments.length === 0) {
      return { isValid: true }
    }

    // Parsear fecha y hora de la cita actual
    let currentDate: Date
    if (appointment.fecha.includes('/')) {
      const [day, month, year] = appointment.fecha.split('/')
      currentDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    } else if (appointment.fecha.includes('-')) {
      currentDate = new Date(appointment.fecha)
    } else {
      return { isValid: true }
    }

    const [currentHours, currentMinutes] = appointment.hora.split(':').map(Number)
    currentDate.setHours(currentHours, currentMinutes || 0, 0, 0)

    // Verificar cada cita pendiente
    for (const apt of pendingAppointments) {
      if (!apt.fecha || !apt.hora) continue

      // Parsear fecha de la cita pendiente
      let aptDate: Date
      if (apt.fecha.includes('/')) {
        const [day, month, year] = apt.fecha.split('/')
        aptDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      } else if (apt.fecha.includes('-')) {
        // ✅ Manejar formato ISO con timestamp (ej: "2025-12-10 00:00:00" o "2025-12-10T00:00:00")
        const fechaClean = apt.fecha.split(' ')[0].split('T')[0] // Obtener solo YYYY-MM-DD
        aptDate = new Date(fechaClean + 'T00:00:00')
      } else {
        continue
      }

      // Parsear hora de la cita pendiente
      const [hours, minutes] = apt.hora.split(':').map(Number)
      aptDate.setHours(hours, minutes || 0, 0, 0)

      // ✅ Verificar si es el MISMO DÍA antes de validar conflicto de horario
      const isSameDay = currentDate.toDateString() === aptDate.toDateString()
      
      if (!isSameDay) {
        // Si NO es el mismo día, no hay conflicto posible
        continue
      }

      // Calcular diferencia en horas (solo si es el mismo día)
      const diffMs = Math.abs(currentDate.getTime() - aptDate.getTime())
      const diffHours = diffMs / (1000 * 60 * 60)

      // Si la diferencia es menor a 3 horas, hay conflicto
      if (diffHours < 3) {
        return {
          isValid: false,
          conflictingAppointment: apt,
          message: `⚠️ El paciente tiene una cita programada el ${apt.fecha} a las ${apt.hora}. Los horarios se cruzarían. Debe haber al menos 3 horas de diferencia entre citas para evitar conflictos.`
        }
      }
    }

    return { isValid: true }
  }

  const timeValidation = validateTimeWindow()

  const isSisSeguro = () => {
    if (!selectedSeguro || !seguros) return false
    // Asumimos que SIS es el seguro con código '21' o nombre que contenga 'SIS'
    const seguro = seguros.find(s => s.Seguro === selectedSeguro)
    return seguro?.Seguro === '21' || seguro?.Nombre?.toUpperCase().includes('SIS') || false
  }


  const handleApprove = async () => {
    if (!patient || !appointment) return
    
    // ⚠️ VALIDACIÓN CRÍTICA: Verificar dobles citas antes de continuar
    if (hasConsultorioMatch) {
      console.error('❌ INTENTO DE APROBAR CITA CON CONSULTORIO DUPLICADO BLOQUEADO')
      toast({
        title: "⛔ Doble Cita Detectada",
        description: "El paciente ya tiene una cita pendiente en este mismo consultorio. No se puede aprobar esta solicitud para evitar dobles citas.",
        variant: "destructive",
        duration: 8000
      })
      return
    }
    

    setIsLoading(true)
    try {
      // Preparar el cuerpo de la solicitud según el formato requerido
      const usuarioApellido = extractDocumentFromToken();
      
      // Obtener fecha y hora del servidor para evitar desfase de zona horaria
      const serverDateTime = await datetimeService.getCurrentDateTime();
      
      // Determinar si la referencia es manual o de REFCON
      const esReferenciaManual = referenciaIdSeleccionada?.startsWith('manual-')
      
      const requestBody = {
        fechaOtorga: `${serverDateTime.date}T${serverDateTime.time}:00`,
        tipoCita: selectedTipoCita,
        tipoPaciente: 'C',
        paciente: patient?.PACIENTE || '',
        nombre: patient?.NOMBRES || `${patient?.PATERNO || ''} ${patient?.MATERNO || ''} ${patient?.NOMBRE || ''}`.trim(),
        seguro: selectedSeguro,
        estado: '1', // ATENCION_CITA se crea con estado 1; la cita cambia a estado 2
        horaOtorga: serverDateTime.time,
        usuario: usuarioApellido,
        numRef: referencia || '',
        entidadSis: eessOrigenReferencia || selectedEntidadSis || '',
        // Campos REFCON
        idRefcon: esReferenciaManual ? 0 : (referenciaIdSeleccionada ? parseInt(referenciaIdSeleccionada) || 0 : 0),
        // recibidoRefcon: 0=manual, 1=pendiente sync (fallido), 2=synced OK (por defecto), 3=reutilizada (estado 5 o 7)
        // Inicialmente asumimos éxito (2), solo cambiamos a 1 si REFCON falla
        recibidoRefcon: esReferenciaManual ? 0 : (skipRefconSync ? 3 : 2)
      }
      
      // 1. Construir la URL usando la variable de entorno para asignar cita
      const apiUrl = `${import.meta.env.VITE_API_CITAS_MASTER_URL}/cita/${appointment.citaId}/asignar`;
      
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
      
      // Lógica especial para seguros '05' y '13' eliminada: ahora se maneja en backend Spring.
      
      // 3. Llamar a la API de reservas para marcar la solicitud como "CITAR"
      if (appointment.idSolicitudCita) {
        const reservasApiUrl = `${import.meta.env.VITE_API_RESERVAS_URL}/solicitudes/${appointment.idSolicitudCita}/citar?usuarioAsigna=${usuarioApellido}`;
        
        const reservasResponse = await fetch(reservasApiUrl, {
          method: 'PUT',
          headers: {
            'accept': '*/*'
          }
        })
        
        if (!reservasResponse.ok) {
          console.warn(`⚠️ Advertencia al actualizar solicitud de reserva: ${reservasResponse.status} ${reservasResponse.statusText}`)
        }
      }
      
      // Guardar datos de asignación para notificar al padre DESPUÉS de que el usuario confirme
      const assignmentData = {
        ...requestBody,
        appointmentId: appointment.citaId,
        success: true,
        responseData
      }
      setPendingAssignmentData(assignmentData)
      
      // Sincronizar con REFCON solo si hay referencia Y es seguro SIS Y NO es referencia manual Y NO es estado 5 o 7
      const esReferenciaManualSync = referenciaIdSeleccionada?.startsWith('manual-')
      
      if (referenciaIdSeleccionada && appointment && esSeguroSIS(selectedSeguro) && !esReferenciaManualSync && !skipRefconSync) {
        try {
          // 1. Obtener datos de la cita desde REFCON
          const citaRefconResult = await obtenerDatosCitaRefcon(appointment.citaId, usuarioApellido)
          
          if (!citaRefconResult.success || !citaRefconResult.data) {
            console.warn('⚠️ No se pudieron obtener datos de REFCON:', citaRefconResult.error)
            return
          }
          
          const datosRefcon = citaRefconResult.data
          
          // 2. Construir payload con datos obtenidos + idReferencia
          const refconPayload = {
            codUnicoDestino: datosRefcon.codUnicoDestino || "00005947",
            idReferencia: referenciaIdSeleccionada, // Este viene de la selección del usuario
            datosCita: datosRefcon.datosCita || {},
            datosMedico: datosRefcon.datosMedico || {},
            personalRegistra: datosRefcon.personalRegistra || {}
          }
          
          // 3. Sincronizar con REFCON
          const syncResult = await sincronizarCitaConRefcon(refconPayload)
          if (syncResult.success) {
            setRefconSyncSuccess(true)
            setRefconSyncError(null)
            // Estado REFCON 2 ya fue establecido al asignar la cita, no se requiere actualización
          } else {
            console.warn(' Error al sincronizar con REFCON (no crítico):', syncResult.error)
            setRefconSyncSuccess(false)
            setRefconSyncError(syncResult.error || 'Error desconocido al sincronizar con REFCON')
            
            // Actualizar estado REFCON a 1 (API consultada, pendiente) porque la sincronización falló
            await actualizarEstadoRefcon(appointment.citaId, 1)
          }
        } catch (refconError) {
          console.error('❌ Error al sincronizar con REFCON:', refconError)
          setRefconSyncSuccess(false)
          setRefconSyncError(refconError instanceof Error ? refconError.message : 'Error desconocido')
          
          // Actualizar estado REFCON a 1 por error
          try {
            await actualizarEstadoRefcon(appointment.citaId, 1)
          } catch (updateError) {
            // Silenciar error de actualización REFCON
          }
        }
      }
      
      // Registrar paciente en RENHICE/FHIR (deshabilitado temporalmente)
      // const pacienteIdFhir = patient?.PACIENTE || patient?.HISTORIA
      // if (pacienteIdFhir) {
      //   try {
      //     const fhirUrl = `${FHIR_BASE_URL}/api/fhir/ips/pacientes/${pacienteIdFhir}/registrar`
      //     const fhirRes = await fetch(
      //       fhirUrl,
      //       { method: 'POST', headers: { 'accept': 'application/json' } }
      //     )
      //     const fhirData = await fhirRes.json()
      //     setFhirSyncResult({
      //       ok: fhirData.ok === true,
      //       scusUuid: fhirData.data?.scusUuid,
      //       message: fhirData.message,
      //     })
      //   } catch {
      //     setFhirSyncResult({ ok: false, message: 'No se pudo conectar con el servicio FHIR' })
      //   }
      // }

      // Mostrar modal de éxito
      setShowSuccess(true)
      
      // Mostrar toast de éxito (solo informativo, el cierre será manual con el botón del dialog)
      toast({
        title: "¡Asignación Exitosa!",
        description: `La cita ha sido asignada correctamente al paciente ${patient.NOMBRES}`,
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 5000
      })
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
          <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                ¡Solicitud Aprobada!
              </h3>
              <p className="text-gray-600 mt-1">
                La solicitud de reserva ha sido aprobada y la cita fue asignada correctamente.
              </p>
            </div>

            {/* Información básica de la cita asignada */}
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 text-left space-y-1 text-sm">
              <p className="font-semibold text-green-800 mb-1">Información de la Cita Asignada</p>
              <p><span className="font-medium">Paciente:</span> {patient.NOMBRES}</p>
              <p><span className="font-medium">Consultorio:</span> {(appointment as any)?.consultorioNombre || (appointment as any)?.consultorio || 'N/A'}</p>
              <p><span className="font-medium">Médico:</span> {(appointment as any)?.medicoNombre || appointment.medico || 'N/A'}</p>
              <p><span className="font-medium">Fecha:</span> {(appointment as any)?.fecha || 'N/A'}</p>
              <p><span className="font-medium">Hora:</span> {(appointment as any)?.hora || 'N/A'}</p>
            </div>

            {/* Resultado de sincronización con REFCON */}
            {refconSyncSuccess && (
              <div className="w-full bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm text-left">
                <p className="font-semibold mb-1">Sincronización con REFCON</p>
                <p>✅ La cita fue registrada exitosamente en el sistema de referencias (REFCON).</p>
              </div>
            )}

            {!refconSyncSuccess && refconSyncError && (
              <div className="w-full bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-3 text-sm text-left space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Sincronización con REFCON incompleta
                </p>
                <p>
                  ✅ La cita fue asignada correctamente en el sistema local, pero REFCON devolvió un error y no se pudo registrar allí.
                </p>
                <p className="text-xs text-orange-900">
                  Por favor, informe al área responsable para que realicen la sincronización manual.
                </p>
                <details className="text-xs text-orange-900 mt-1">
                  <summary className="cursor-pointer hover:text-orange-700">Ver detalles técnicos del error</summary>
                  <pre className="mt-2 p-2 bg-orange-100 rounded overflow-auto max-h-32 whitespace-pre-wrap">
                    {refconSyncError}
                  </pre>
                </details>
              </div>
            )}

            {/* Sincronización RENHICE/FHIR deshabilitada temporalmente
            {fhirSyncResult?.ok && (
              <div className="w-full bg-teal-50 border border-teal-200 text-teal-800 rounded-lg p-3 text-sm text-left">
                <p className="font-semibold mb-1 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Sincronización RENHICE</p>
                <p>Paciente registrado correctamente en RENHICE.{fhirSyncResult.scusUuid ? ` SCUS UUID: ${fhirSyncResult.scusUuid}` : ''}</p>
              </div>
            )}
            {fhirSyncResult !== null && !fhirSyncResult.ok && (
              <div className="w-full bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-3 text-sm text-left">
                <p className="font-semibold flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Sincronización RENHICE</p>
                <p>{fhirSyncResult.message || 'No se pudo sincronizar con RENHICE'}</p>
              </div>
            )}
            */}

            <Button
              onClick={async () => {
                // Notificar al padre sobre la asignación exitosa
                if (pendingAssignmentData) {
                  await onApprove(pendingAssignmentData)
                }
                
                // Limpiar estados
                setShowSuccess(false)
                setRefconSyncSuccess(false)
                setRefconSyncError(null)
                setPendingAssignmentData(null)
                
                // Cerrar modal
                onClose()
                
                // Callback de éxito
                if (onSuccess) {
                  onSuccess(appointment.citaId)
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col">
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
          <div className="flex-1 overflow-y-auto min-h-0">
          {/* Advertencias */}
          <div className="space-y-3 mb-4">
            {(hasConsultorioMatch || hasEspecialidadMatch) && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertDescription className="text-orange-800">
                  {hasConsultorioMatch && hasEspecialidadMatch && (
                    <>⚠️ Este paciente tiene una cita pendiente en el mismo consultorio y especialidad.</>
                  )}
                  {!hasEspecialidadMatch && hasConsultorioMatch && (
                    <>⚠️ Este paciente tiene una cita pendiente en el mismo consultorio.</>
                  )}
                  {!hasConsultorioMatch && hasEspecialidadMatch && (
                    <>⚠️ Este paciente tiene una cita pendiente en la misma especialidad.</>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {!timeValidation.isValid && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">⛔ Conflicto de horario</p>
                    <p className="text-sm mt-1">{timeValidation.message}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda: Información del paciente */}
            <div className="space-y-3 flex flex-col">
              <PatientInfoCardAppointment patient={refreshedPatient || patient} className="flex-1" />
              <UpdateClinicalHistoryButton
                patient={patient}
                onPatientUpdated={(updated) => setRefreshedPatient(updated)}
              />
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
                        <Label className="text-sm font-medium text-gray-600">Tipo de Cita segun Reserva</Label>
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
                  {patient?.PACIENTE && (
                    <PatientPendingAppointmentsModal
                      pacienteId={patient.PACIENTE}
                      currentConsultorio={appointment?.consultorio}
                      currentEspecialidad={appointment?.especialidad}
                      limite={25}
                      highlight={hasConsultorioMatch || hasEspecialidadMatch}
                      onAppointmentsLoaded={setPendingAppointments}
                      timeConflict={timeValidation}
                    />
                  )}
                  
                  {/* ⛔ ALERTA CRÍTICA: Doble cita detectada */}
                  {hasConsultorioMatch && (
                    <Alert className="bg-red-100 border-red-500 border-2 mt-4">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <AlertDescription className="text-red-800 font-semibold">
                        <div className="flex flex-col gap-1">
                          <span className="text-base">⛔ DOBLE CITA DETECTADA</span>
                          <span className="text-sm font-normal">
                            El paciente ya tiene una cita pendiente en este mismo consultorio. 
                            No se puede aprobar esta solicitud para evitar dobles citas.
                          </span>
                        </div>
                      </AlertDescription>
                    </Alert>
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

                  {/* Verificación SIS - Automática cuando se selecciona un seguro SIS */}
                  {isSisSeguro() && (
                    <div className="mt-4">
                      <SimpleSISVerification
                        patientId={patient.HISTORIA}
                        documento={patient.DOCUMENTO}
                        autoVerify={true}
                        showButton={true}
                        onVerificationComplete={(result) => {
                          setSisVerificationResult(result)
                          if (result.isSuccess) {
                            // ✅ Cambiar tipo de cita a "D" (Demanda) cuando SIS es exitoso
                            setSelectedTipoCita('D')
                            
                            if (result.eess) {
                              // Hacer trim a los ceros del código de establecimiento
                              const trimmedEess = result.eess.replace(/^0+/, '') || result.eess
                              setSelectedEntidadSis(trimmedEess)
                            }
                          }
                        }}
                      />
                    </div>
                  )}

                  {isSisSeguro() && (
                    <>
                      <ReferenciaSelector
                        numeroDocumento={patient?.DOCUMENTO || ''}
                        tipoDocumento={
                          patient?.TIPO_DOCUMENTO === 'CE' || patient?.TIPO_DOCUMENTO === 'C' ? '2' : '1'
                        }
                        especialidadCodigo={appointment?.especialidad}
                        value={referenciaIdSeleccionada}
                        onChange={async (refData) => {
                          setReferencia(refData.numeroReferencia)
                          setReferenciaIdSeleccionada(refData.idReferencia)
                          
                          // Guardar flag de sincronización con REFCON
                          setSkipRefconSync(refData.skipRefconSync || false)
                          
                          // Obtener nombre de la entidad SIS desde la API
                          if (refData.codigoestablecimientoOrigen) {
                            setEessOrigenReferencia(refData.codigoestablecimientoOrigen)
                            
                            const result = await obtenerEntidadSISPorCodigo(refData.codigoestablecimientoOrigen)
                            if (result.success && result.data) {
                              setEessNombreOrigen(result.data.NOMBRE)
                            } else {
                              setEessNombreOrigen(refData.establecimientoOrigen || 'Establecimiento de origen')
                            }
                          } else {
                            setEessNombreOrigen(refData.establecimientoOrigen || '')
                            setEessOrigenReferencia('')
                          }
                        }}
                        onEessChange={(eess) => {
                          setEessOrigenReferencia(eess)
                        }}
                      />
                      <EntidadSisSelector
                        value={selectedEntidadSis}
                        onChange={setSelectedEntidadSis}
                        required={true}
                        sisEstablecimiento={
                          eessOrigenReferencia ? {
                            codigo: eessOrigenReferencia,
                            nombre: eessNombreOrigen
                          } : sisVerificationResult?.isSuccess ? {
                            codigo: sisVerificationResult.eess?.replace(/^0+/, '') || '',
                            nombre: sisVerificationResult.descEESS || ''
                          } : undefined
                        }
                      />
                    </>
                  )}

                </CardContent>
              </Card>
            </div>
          </div>
          </div>

          {/* Botones de acción - Solo Aprobar y Denegar */}
          <div className="flex justify-center gap-4 pt-4 border-t mt-4 flex-shrink-0">
            <Button 
              onClick={() => {
                if (hasEspecialidadMatch && !hasConsultorioMatch) {
                  setShowEspecialidadConflictDialog(true)
                  return
                }
                if (!timeValidation.isValid) {
                  setShowTimeConflictDialog(true)
                  return
                }
                handleApprove()
              }}
              disabled={
                !selectedTipoCita || 
                !selectedSeguro || 
                (isSisSeguro() && (!selectedEntidadSis || !referencia.trim())) ||
                hasConsultorioMatch || // Deshabilitar si hay cita en el mismo consultorio
                // ✅ hasEspecialidadMatch ya NO bloquea, solo muestra advertencia
                isLoading
              }
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-6 text-base min-w-[160px] shadow-lg hover:shadow-xl transition-all"
              size="lg"
              title={
                hasConsultorioMatch 
                  ? "No se puede aprobar: el paciente ya tiene una cita en el mismo consultorio" 
                  : ""
              }
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

      
      {/* Diálogo de confirmación de conflicto de horario */}
      <Dialog open={showTimeConflictDialog} onOpenChange={setShowTimeConflictDialog}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-6 w-6" />
              ⚠️ Advertencia: Posible Conflicto de Horario
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Se ha detectado un posible conflicto de horario con otra cita del paciente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Mensaje de conflicto */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-2">Detalles del conflicto:</p>
                  <p>{timeValidation.message}</p>
                </div>
              </div>
            </div>

            {/* Advertencia de responsabilidad */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-semibold mb-2">
                ⚠️ IMPORTANTE - Responsabilidad del Admisionista
              </p>
              <p className="text-sm text-red-800">
                Si decide continuar con la aprobación a pesar del conflicto de horario detectado, 
                <span className="font-bold"> usted será responsable de cualquier problema o inconveniente</span> que 
                pueda surgir debido a la superposición de horarios.
              </p>
            </div>

            {/* Pregunta de confirmación */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium text-center">
                ¿Está seguro de que desea continuar con la aprobación de esta solicitud?
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowTimeConflictDialog(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowTimeConflictDialog(false)
                handleApprove() // Continuar con la aprobación
              }}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              Sí, Continuar Bajo Mi Responsabilidad
            </Button>
          </div>
        </DialogContent>
        </Dialog>

      {/* Diálogo de confirmación de especialidad duplicada */}
      <Dialog open={showEspecialidadConflictDialog} onOpenChange={setShowEspecialidadConflictDialog}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-6 w-6" />
              ⚠️ Advertencia: Cita en Misma Especialidad
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Se ha detectado que el paciente ya tiene una cita pendiente en la misma especialidad.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Mensaje de especialidad duplicada */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-2">Detalles:</p>
                  <p>El paciente <strong>{patient?.NOMBRES}</strong> ya tiene una cita pendiente en la especialidad <strong>{(appointment as any)?.especialidadNombre || 'la misma especialidad'}</strong>.</p>
                </div>
              </div>
            </div>

            {/* Advertencia de responsabilidad */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-semibold mb-2">
                ⚠️ IMPORTANTE - Responsabilidad del Admisionista
              </p>
              <p className="text-sm text-red-800">
                Si decide continuar con la aprobación a pesar de que el paciente ya tiene una cita en esta especialidad, 
                <span className="font-bold"> usted será responsable de cualquier problema o inconveniente</span> que 
                pueda surgir debido a la duplicidad de citas.
              </p>
            </div>

            {/* Pregunta de confirmación */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium text-center">
                ¿Está seguro de que desea continuar con la aprobación de esta solicitud?
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEspecialidadConflictDialog(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowEspecialidadConflictDialog(false)
                // Si también hay conflicto de horario, mostrar ese diálogo
                if (!timeValidation.isValid) {
                  setShowTimeConflictDialog(true)
                } else {
                  handleApprove() // Continuar con la aprobación
                }
              }}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              Sí, Continuar Bajo Mi Responsabilidad
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      </>
  )
}

// Componente wrapper con ReferenciaProvider
export function PatientAssignmentReservedModal(props: PatientAssignmentReservedModalProps) {
  return (
    <ReferenciaProvider>
      <PatientAssignmentReservedModalContent {...props} />
    </ReferenciaProvider>
  )
}
