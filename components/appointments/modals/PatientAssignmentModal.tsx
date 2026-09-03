"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PatientInfoCardAppointment } from "../patient/PatientInfoCardAppointment"
import { PatientPendingAppointmentsModal, type PendingAppointment } from "../patient/PatientPendingAppointmentsModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User, Stethoscope, CheckCircle, ArrowLeft, Printer, Edit, AlertTriangle, AlertCircle } from "lucide-react"
import { TipoCitaSelector } from "../selectors/TipoCitaSelector"
import { TipoSeguroSelector } from "../selectors/TipoSeguroSelector"
import { EntidadSisSelector } from "../selectors/EntidadSisSelector"
import { ReferenciaSelector } from "../selectors/ReferenciaSelector"
import { useTipoCita } from "@/contexts/TipoCitaContext"
import { useSegurosCita } from "@/contexts/SegurosCitaContext"
import { ReferenciaProvider } from "@/contexts/ReferenciaContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog"
import { SimpleSISVerification } from "../patient/SimpleSISVerification"
import { toast } from "@/components/ui/use-toast"
import { imprimirCita, CitaDto, formatDateToDDMMYYYY, formatDateTimeToDDMMYYYY } from "@/services/appointments/printService"
import { extractNombreCompletoFromToken, extractDocumentFromToken } from "@/utils/jwtUtils"
import { datetimeService } from '@/services/datetimeService'
import { convertTo12HourFormat } from "@/utils/timeUtils"
import { sincronizarCitaConRefcon, obtenerDatosCitaRefcon, esSeguroSIS, actualizarEstadoRefcon } from "@/services/appointments/refconSyncService"
import { UpdateClinicalHistoryButton } from "../patient/UpdateClinicalHistoryButton"
import { obtenerEntidadSISPorCodigo } from "@/services/appointments/sisEntitiesService"

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

const apiBaseUrl = import.meta.env.VITE_API_CITAS_MASTER_URL
// const FHIR_BASE_URL = import.meta.env.VITE_API_FHIR_URL || 'http://192.168.0.252:9015'

// Componente interno que usa el contexto de referencias
function PatientAssignmentModalContent({ 
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
  const [referenciaIdSeleccionada, setReferenciaIdSeleccionada] = useState("")
  const [eessOrigenReferencia, setEessOrigenReferencia] = useState("")
  const [eessNombreOrigen, setEessNombreOrigen] = useState("")
  const [skipRefconSync, setSkipRefconSync] = useState(false) // Flag para omitir sincronización con REFCON (estados 5, 7, manual)
  const [refreshedPatient, setRefreshedPatient] = useState<any>(null)
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [assignedCitaId, setAssignedCitaId] = useState<string | null>(null)
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false)
  const [pendingPrintCitaId, setPendingPrintCitaId] = useState<string | null>(null)
  const [sisVerificationResult, setSisVerificationResult] = useState<any>(null)
  const [enhancedPatient, setEnhancedPatient] = useState<Patient | null>(null)
  const [isLoadingPatientData, setIsLoadingPatientData] = useState(false)
  
  // Estados para el resultado de sincronización REFCON
  const [showRefconResultDialog, setShowRefconResultDialog] = useState(false)
  const [refconSyncSuccess, setRefconSyncSuccess] = useState(false)
  const [refconSyncError, setRefconSyncError] = useState<string | null>(null)
  // const [fhirSyncResult, setFhirSyncResult] = useState<{ ok: boolean; scusUuid?: string; message?: string } | null>(null)
  
  // Estados para el AlertDialog de error
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [errorTitle, setErrorTitle] = useState<string>('Error')
  
  // Estado para el dialog de confirmación de asignación
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  // Estado para el dialog de confirmación de conflicto de horario
  const [showTimeConflictDialog, setShowTimeConflictDialog] = useState(false)

  // Limpiar estados cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      // Limpiar estados de referencia y SIS
      setReferencia('')
      setReferenciaIdSeleccionada('')
      setSelectedEntidadSis('')
      setEessOrigenReferencia('')
      setEessNombreOrigen('')
      setSkipRefconSync(false)
      setSisVerificationResult(null)
      setShowRefconResultDialog(false)
      setRefconSyncSuccess(false)
      setRefconSyncError(null)
      // setFhirSyncResult(null)
    }
  }, [isOpen])
  

  // Determinar si hay coincidencias con citas pendientes
  const hasConsultorioMatch = pendingAppointments?.some((apt) => {
    const curr = appointment?.consultorioNombre?.trim().toLowerCase()
    const other = apt.consultorioNombre?.trim().toLowerCase()
    return curr && other && curr === other
  })

  const hasEspecialidadMatch = pendingAppointments?.some((apt) => {
    // El appointment actual tiene "especialidadSolicitud" (código como "0001")
    // Las citas pendientes tienen "especialidad" (código como "0001")
    const currCodigo = (appointment as any)?.especialidadSolicitud?.trim()?.toLowerCase()
    if (!currCodigo) return false
    
    // Comparar código con código
    const matchCodigo = apt.especialidad?.trim()?.toLowerCase() === currCodigo
    
    return matchCodigo
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
      const response = await fetch(`${apiBaseUrl}/cita/paciente-foto/${pacienteId}`)
      
      if (response.ok) {
        const additionalData = await response.json()
        
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
      } else {
        setEnhancedPatient(patient)
      }
    } catch (error) {
      setEnhancedPatient(patient)
    } finally {
      setIsLoadingPatientData(false)
    }
  }


  const imprimirCitaAsignada = async (citaId: string) => {
    try {
      // Obtener datos completos de la cita
      const response = await fetch(`${import.meta.env.VITE_API_CITAS_MASTER_URL}/cita/${citaId}`)
      
      if (!response.ok) {
        throw new Error('No se pudo obtener los datos de la cita')
      }
      
      const citaData = await response.json()
      
      // Obtener el DNI del usuario desde el JWT
      const usuarioDni = extractDocumentFromToken() || 'SISTEMA'
      // Obtener el operador desde el JWT
      const operador = extractNombreCompletoFromToken() || 'OPERADOR'
      
      // Formatear turno
      const turnoConsulta = citaData.turnoConsulta || ''
      const turnoFormateado = turnoConsulta.trim().toUpperCase() === 'M' ? 'Mañana' : 
                              turnoConsulta.trim().toUpperCase() === 'T' ? 'Tarde' : turnoConsulta
      
      // Obtener nombre de entidad SIS si existe
      let eessFormatted = ''
      if (citaData.entidadSis) {
        try {
          const entidadResult = await obtenerEntidadSISPorCodigo(citaData.entidadSis.trim())
          if (entidadResult.success && entidadResult.data) {
            eessFormatted = `(${citaData.entidadSis.trim()}) - ${entidadResult.data.NOMBRE}`
          } else {
            eessFormatted = citaData.entidadSis.trim()
          }
        } catch (error) {
          eessFormatted = citaData.entidadSis.trim()
        }
      }
      
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
        seguro: citaData.seguroNombre || 'PAGANTE',
        // Incluir campos SIS si existen
        ...(citaData.numRef && { nroRef: citaData.numRef }),
        ...(eessFormatted && { eess: eessFormatted })
      }
      
      await imprimirCita(citaDto)
    } catch (error) {
      // No mostrar error al usuario ya que la asignación fue exitosa
    }
  }

  const handleAssign = async () => {
    if (!selectedTipoCita || !selectedSeguro || !appointment?.id) {
      return
    }

    setIsLoading(true)
    
    try {
      // Verificar si la cita tiene una solicitud/reserva pendiente antes de asignar
      const reservasApiUrl = import.meta.env.VITE_API_RESERVAS_URL
      if (reservasApiUrl) {
        try {
          const checkReservaUrl = `${reservasApiUrl}/solicitudes/cita/${appointment.id}/estados?estados=PENDIENTE&estados=EN_REVISION&estados=CITADO`
          const checkReservaResponse = await fetch(checkReservaUrl, {
            headers: { 'accept': '*/*' }
          })
          
          if (checkReservaResponse.ok) {
            const reservaData = await checkReservaResponse.json()
            const solicitudes = Array.isArray(reservaData) ? reservaData : (reservaData?.data || [])
            
            if (solicitudes.length > 0) {
              const estados = solicitudes.map((s: any) => s.estado || s.Estado || 'DESCONOCIDO')
              setErrorTitle("⚠️ Cita Reservada")
              setErrorMessage(`Esta cita ha sido reservada mediante el sistema de citas en línea y se encuentra en estado: ${estados.join(', ')}. No se puede asignar manualmente.`)
              setShowErrorDialog(true)
              return
            }
          }
        } catch (checkError) {
          console.warn('⚠️ No se pudo verificar reservas de la cita:', checkError)
          // No bloquear la asignación si la verificación falla
        }
      }

      // Obtener el DNI del usuario desde el JWT
      const usuarioDni = extractDocumentFromToken() || 'SISTEMA'
      
      // Obtener fecha y hora del servidor para evitar desfase de zona horaria
      const serverDateTime = await datetimeService.getCurrentDateTime();
      
      // Determinar si la referencia es manual o de REFCON
      const esReferenciaManual = referenciaIdSeleccionada?.startsWith('manual-')
      
      // Preparar el cuerpo de la solicitud según el formato requerido
      const requestBody = {
        fechaOtorga: `${serverDateTime.date}T${serverDateTime.time}:00`,
        tipoCita: selectedTipoCita,
        tipoPaciente: 'C',
        paciente: patient?.PACIENTE || '',
        nombre: patient?.NOMBRES || `${patient?.PATERNO || ''} ${patient?.MATERNO || ''} ${patient?.NOMBRE || ''}`.trim(),
        seguro: selectedSeguro,
        estado: '2', // Estado 2 = SIN PAGO O FUA (cita otorgada)
        horaOtorga: serverDateTime.time,
        usuario: usuarioDni,
        numRef: referencia || '',
        entidadSis: eessOrigenReferencia || selectedEntidadSis || '',
        // Campos REFCON
        idRefcon: esReferenciaManual ? 0 : (referenciaIdSeleccionada ? parseInt(referenciaIdSeleccionada) || 0 : 0),
        // recibidoRefcon: 0=manual, 1=pendiente sync (fallido), 2=synced OK (por defecto), 3=reutilizada (estado 5 o 7)
        // Inicialmente asumimos éxito (2), solo cambiamos a 1 si REFCON falla
        recibidoRefcon: esReferenciaManual ? 0 : (skipRefconSync ? 3 : 2)
      }
      
      // Construir la URL usando la variable de entorno
      const apiUrl = `${import.meta.env.VITE_API_CITAS_MASTER_URL}/cita/${appointment.id}/asignar`;
      
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
      
      // Lógica especial para seguros '05' y '13' eliminada: ahora se maneja en backend Spring.
      
      // Mostrar toast de éxito
      toast({
        title: "¡Asignación Exitosa!",
        description: `La cita ha sido asignada correctamente al paciente ${patient?.NOMBRES || patient?.NOMBRE || ''}`,
        className: "bg-green-50 border-green-200 text-green-800"
      })
      
      // Mostrar mensaje de éxito
      setAssignedCitaId(appointment.id)
      setShowSuccess(true)

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
      
      // Sincronizar con REFCON solo si hay referencia Y es seguro SIS Y NO es referencia manual Y NO es estado 5 o 7
      const esReferenciaManualSync = referenciaIdSeleccionada?.startsWith('manual-')
      
      if (referenciaIdSeleccionada && appointment && esSeguroSIS(selectedSeguro) && !esReferenciaManualSync && !skipRefconSync) {
        try {
          // 1. Obtener datos de la cita desde REFCON
          const citaRefconResult = await obtenerDatosCitaRefcon(appointment.id, usuarioDni)
          
          if (!citaRefconResult.success || !citaRefconResult.data) {
            // No se pudieron obtener datos de REFCON
          } else {
            const datosRefcon = citaRefconResult.data
            
            // 2. Construir payload con datos obtenidos + idReferencia
            const refconPayload = {
              codUnicoDestino: datosRefcon.codUnicoDestino || "00005947",
              idReferencia: referenciaIdSeleccionada,
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
              setRefconSyncSuccess(false)
              setRefconSyncError(syncResult.error || 'Error desconocido al sincronizar con REFCON')
              
              // Actualizar estado REFCON a 1 (API consultada, pendiente) porque la sincronización falló
              await actualizarEstadoRefcon(appointment.id, 1)
            }
          }
        } catch (refconError) {
          setRefconSyncSuccess(false)
          setRefconSyncError(refconError instanceof Error ? refconError.message : 'Error desconocido')
          
          // Actualizar estado REFCON a 1 por error
          try {
            await actualizarEstadoRefcon(appointment.id, 1)
          } catch (updateError) {
            // Ignorar error de actualización
          }
        }
      }
      
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
    setReferenciaIdSeleccionada("")
    setEessOrigenReferencia("")
    setEessNombreOrigen("")
    setShowSuccess(false)
    setAssignedCitaId("")
    setSisVerificationResult(null)
    setEnhancedPatient(null)
    setIsLoadingPatientData(false)
    setShowErrorDialog(false)
    setErrorMessage("")
    setErrorTitle("")
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
      <DialogContent 
        className="max-w-6xl h-[90vh] overflow-hidden flex flex-col" 
        aria-describedby="patient-assignment-description"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0">
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
        
        {/* Contenido con scroll */}
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
        
        {/* Mensaje de éxito */}
        {showSuccess && (
          <div className="mb-6 space-y-2">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Cita asignada exitosamente! ID de la cita: <strong>{assignedCitaId}</strong>
                <br />
                Redirigiendo en unos segundos...
              </AlertDescription>
            </Alert>
            {/* Sincronización RENHICE/FHIR deshabilitada temporalmente
            {fhirSyncResult === null && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-700 text-sm">Sincronizando con RENHICE...</AlertDescription>
              </Alert>
            )}
            {fhirSyncResult?.ok && (
              <Alert className="bg-teal-50 border-teal-200">
                <CheckCircle className="h-4 w-4 text-teal-600" />
                <AlertDescription className="text-teal-800 text-sm">
                  Paciente sincronizado con RENHICE.{fhirSyncResult.scusUuid ? <> SCUS UUID: <strong>{fhirSyncResult.scusUuid}</strong></> : null}
                </AlertDescription>
              </Alert>
            )}
            {fhirSyncResult !== null && !fhirSyncResult.ok && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 text-sm">
                  Sincronización RENHICE: {fhirSyncResult.message || 'Error desconocido'}
                </AlertDescription>
              </Alert>
            )}
            */}
          </div>
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
              <div className="space-y-3">
                <PatientInfoCardAppointment 
                  patient={enhancedPatient || patient!}
                  className="h-full"
                />
                <UpdateClinicalHistoryButton
                  patient={patient!}
                  onPatientUpdated={(updated) => {
                    setEnhancedPatient(updated as Patient)
                    setRefreshedPatient(updated)
                  }}
                />
              </div>
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
                          return displayText;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón para ver citas pendientes */}
                {patient?.PACIENTE && (
                  <PatientPendingAppointmentsModal
                    pacienteId={patient.PACIENTE}
                    currentConsultorio={appointment?.consultorioNombre}
                    currentEspecialidad={(appointment as any)?.especialidadSolicitud}
                    limite={25}
                    highlight={hasConsultorioMatch || hasEspecialidadMatch}
                    onAppointmentsLoaded={setPendingAppointments}
                    timeConflict={timeValidation}
                  />
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
                            // Asegurar que se actualice el estado inmediatamente
                            setSelectedEntidadSis(trimmedEess)
                            
                            // Forzar un retraso para asegurar que el estado se actualice
                            setTimeout(() => {
                            }, 100)
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
                      especialidadCodigo={(appointment as any)?.especialidadSolicitud}
                      value={referenciaIdSeleccionada}
                      onChange={async (refData) => {
                        setReferencia(refData.numeroReferencia)
                        setReferenciaIdSeleccionada(refData.idReferencia)
                        
                        // Guardar flag de sincronización con REFCON
                        setSkipRefconSync(refData.skipRefconSync || false)
                        
                        // Obtener nombre de la entidad SIS desde la API
                        if (refData.codigoestablecimientoOrigen) {
                          
                          // Actualizar inmediatamente el código del establecimiento
                          setEessOrigenReferencia(refData.codigoestablecimientoOrigen)
                          
                          const result = await obtenerEntidadSISPorCodigo(refData.codigoestablecimientoOrigen)
                          if (result.success && result.data) {
                            setEessNombreOrigen(result.data.NOMBRE)
                          } else {
                            console.warn('⚠️ No se pudo obtener nombre de entidad SIS, usando valor de referencia')
                            setEessNombreOrigen(refData.establecimientoOrigen || 'Establecimiento de origen')
                          }
                        } else {
                          // Si no hay código, usar el nombre que viene de la referencia
                          setEessNombreOrigen(refData.establecimientoOrigen || '')
                          setEessOrigenReferencia('')
                        }
                      }}
                      onEessChange={(eess) => {
                        setEessOrigenReferencia(eess)
                      }}
                    />
                    <EntidadSisSelector
                      key={sisVerificationResult?.eess || eessOrigenReferencia || 'entidad-sis-selector'}
                      value={selectedEntidadSis}
                      onChange={(value) => {
                        setSelectedEntidadSis(value)
                      }}
                      sisEstablecimiento={
                        eessOrigenReferencia ? {
                          codigo: eessOrigenReferencia,
                          nombre: eessNombreOrigen
                        } : sisVerificationResult?.isSuccess ? {
                          codigo: sisVerificationResult.eess || '',
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

        {/* Botones fuera del grid */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              // Si hay conflicto de horario, mostrar diálogo de advertencia primero
              if (!timeValidation.isValid) {
                setShowTimeConflictDialog(true)
              } else {
                setShowConfirmDialog(true)
              }
            }}
            disabled={
              !selectedTipoCita || 
              !selectedSeguro || 
              (isSisSeguro() && (!selectedEntidadSis || !referencia.trim())) ||
              hasConsultorioMatch || // Deshabilitar si hay cita en el mismo consultorio
              // ✅ hasEspecialidadMatch ya NO bloquea, solo muestra advertencia
              isLoading
            }
            className="bg-blue-600 hover:bg-blue-700"
            title={
              hasConsultorioMatch 
                ? "No se puede confirmar: el paciente ya tiene una cita en el mismo consultorio" 
                : ""
            }
          >
            Confirmar Asignación
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo de confirmación de impresión */}
    <Dialog open={showPrintConfirmation} onOpenChange={setShowPrintConfirmation}>
        <DialogContent 
          className="sm:max-w-md" 
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
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

    {/* Dialog de confirmación de asignación */}
    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <CheckCircle className="h-5 w-5" />
            Confirmar Asignación de Cita
          </DialogTitle>
          <DialogDescription>
            Por favor, verifique que los datos sean correctos antes de confirmar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Datos del Paciente */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Paciente</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Nombre:</span> {enhancedPatient?.NOMBRES || patient?.NOMBRES}</p>
              <p><span className="font-medium">Documento:</span> {patient?.DOCUMENTO}</p>
              <p><span className="font-medium">Historia Clínica:</span> {patient?.HISTORIA}</p>
            </div>
          </div>

          {/* Datos de la Cita */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Detalles de la Cita</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Fecha:</span> {appointment?.fecha}</p>
              <p><span className="font-medium">Hora:</span> {appointment?.hora}</p>
              <p><span className="font-medium">Médico:</span> {appointment?.medicoNombre || 'No especificado'}</p>
              <p><span className="font-medium">Consultorio:</span> {appointment?.consultorioNombre || appointment?.consultorio}</p>
              <p><span className="font-medium">Especialidad:</span> {(appointment as any)?.especialidadSolicitud || 'N/A'}</p>
              <p><span className="font-medium">Tipo de Cita:</span> {tiposCita.find(t => t.Tipo_cita === selectedTipoCita)?.Nombre}</p>
              <p><span className="font-medium">Seguro:</span> {seguros.find(s => s.Seguro === selectedSeguro)?.Nombre}</p>
              {isSisSeguro() && selectedEntidadSis && (
                <p><span className="font-medium">Entidad SIS:</span> {selectedEntidadSis}</p>
              )}
            </div>
          </div>

          {/* Advertencia: SIS no válido */}
          {isSisSeguro() && sisVerificationResult && !sisVerificationResult.isSuccess && (
            <Alert variant="destructive" className="bg-orange-50 border-orange-300">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>⚠️ Advertencia:</strong> Está asignando cita a un paciente con seguro SIS que no ha sido validado exitosamente.
                {sisVerificationResult.manualOverride ? (
                  <span className="block mt-1 text-sm">El usuario decidió continuar sin validación SIS.</span>
                ) : (
                  <span className="block mt-1 text-sm">El sistema no encontró afiliación SIS activa para este paciente.</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowConfirmDialog(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={async () => {
              setShowConfirmDialog(false)
              await handleAssign()
            }}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Asignando..." : "Sí, Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
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
              Si decide continuar con la asignación a pesar del conflicto de horario detectado, 
              <span className="font-bold"> usted será responsable de cualquier problema o inconveniente</span> que 
              pueda surgir debido a la superposición de horarios.
            </p>
          </div>

          {/* Pregunta de confirmación */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium text-center">
              ¿Está seguro de que desea continuar con la asignación de esta cita?
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
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
              setShowConfirmDialog(true) // Continuar con el flujo normal
            }}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            Sí, Continuar Bajo Mi Responsabilidad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>


    {/* Dialog de resultado de sincronización REFCON */}
    <AlertDialog open={showRefconResultDialog} onOpenChange={setShowRefconResultDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {refconSyncSuccess ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>¡Asignación Exitosa!</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Asignación Parcial</span>
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            {refconSyncSuccess ? (
              <div className="space-y-2">
                <p className="text-green-700 font-medium">
                  ✅ La cita ha sido asignada correctamente
                </p>
                <p className="text-green-700">
                  ✅ La cita fue sincronizada exitosamente con el sistema REFCON
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-green-700 font-medium">
                  ✅ La cita ha sido asignada correctamente en el sistema local
                </p>
                <p className="text-orange-700 font-medium">
                  ⚠️ No se pudo sincronizar con el sistema REFCON
                </p>
                <p className="text-sm text-gray-600">
                  La cita está registrada y disponible, pero el sistema REFCON devolvió un error. 
                  Por favor, informe al área responsable para que realicen la sincronización manual.
                </p>
                {refconSyncError && (
                  <details className="text-xs text-gray-500 mt-2">
                    <summary className="cursor-pointer hover:text-gray-700">Ver detalles del error</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                      {refconSyncError}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              setShowRefconResultDialog(false)
              setRefconSyncSuccess(false)
              setRefconSyncError(null)
            }}
            className={refconSyncSuccess ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
          >
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

// Componente wrapper con ReferenciaProvider
export function PatientAssignmentModal(props: PatientAssignmentModalProps) {
  return (
    <ReferenciaProvider>
      <PatientAssignmentModalContent {...props} />
    </ReferenciaProvider>
  )
}
