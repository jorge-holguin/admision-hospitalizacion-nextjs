"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PatientInfoCardAppointment } from "../patient/PatientInfoCardAppointment"
import { PatientPendingAppointmentsModal, type PendingAppointment } from "../patient/PatientPendingAppointmentsModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User, Stethoscope, CheckCircle, ArrowLeft, AlertTriangle, AlertCircle, Printer } from "lucide-react"
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
import { extractDocumentFromToken, extractNombreCompletoFromToken } from "@/utils/jwtUtils"
import { datetimeService } from '@/services/datetimeService'
import { obtenerEntidadSISPorCodigo } from "@/services/appointments/sisEntitiesService"
import { UpdateClinicalHistoryButton } from "../patient/UpdateClinicalHistoryButton"

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
  TELEFONO1?: string
  TELEFONO2?: string
  SEGURO?: string
  NOMBRE_SEGURO?: string
  STRING_FOTO?: string
  PACIENTE?: string
}

interface OrdenDetalle {
  idOrdenDetalle: number
  idOrden: number
  idProcedimiento: number
  diagnosticoId: number | null
  cantidad: number
  observacionEspecifica: string
  estadoDetalle: string
}

interface OrdenApoyoDiagnostico {
  idOrden: number
  idPaciente: string
  tipoServicio: string
  grupoServicio: string
  origen: string
  origenId: string
  seguro: string
  idMedicoSolicita: number
  cama?: string
  fechaTentativa: string
  horaTentativa: string
  observacionesMedicas?: string
  estadoOrden: string
  detalles: any[]
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

interface PatientAssignDiagnosticSupportModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient | null
  appointment: Appointment | null
  onAssign: (assignmentData: any) => void
  onSuccess?: (citaId: string) => void
  onBack?: () => void
  searchType?: 'document' | 'name'
}

const APOYO_DIAGNOSTICO_BASE_URL = process.env.NEXT_PUBLIC_API_APOYO_DIAGNOSTICO_URL || 'http://192.168.5.239:9020'
const apiBaseUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
const FHIR_BASE_URL = process.env.NEXT_PUBLIC_API_FHIR_URL || 'http://192.168.0.252:9015'

const SIS_SEGUROS_CODES = ['20', '21', '22', '23', '24', '25']

function PatientAssignDiagnosticSupportModalContent({
  isOpen,
  onClose,
  patient,
  appointment,
  onAssign,
  onSuccess,
  onBack,
  searchType = 'document',
}: PatientAssignDiagnosticSupportModalProps) {
  const { tiposCita } = useTipoCita()
  const { seguros } = useSegurosCita()

  const [selectedTipoCita, setSelectedTipoCita] = useState("")
  const [selectedSeguro, setSelectedSeguro] = useState("")
  const [selectedOrdenEcografia, setSelectedOrdenEcografia] = useState("")
  const [ordenes, setOrdenes] = useState<OrdenApoyoDiagnostico[]>([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(false)
  const [selectedEntidadSis, setSelectedEntidadSis] = useState("")
  const [referencia, setReferencia] = useState("")
  const [referenciaIdSeleccionada, setReferenciaIdSeleccionada] = useState("")
  const [eessOrigenReferencia, setEessOrigenReferencia] = useState("")
  const [eessNombreOrigen, setEessNombreOrigen] = useState("")
  const [sisVerificationResult, setSisVerificationResult] = useState<any>(null)
  const [enhancedPatient, setEnhancedPatient] = useState<Patient | null>(null)
  const [isLoadingPatientData, setIsLoadingPatientData] = useState(false)
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [assignedCitaId, setAssignedCitaId] = useState<string | null>(null)
  const [fhirSyncResult, setFhirSyncResult] = useState<{ ok: boolean; scusUuid?: string; message?: string } | null>(null)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [errorTitle, setErrorTitle] = useState("Error")

  const isSisSeguro = () => SIS_SEGUROS_CODES.includes(selectedSeguro?.toString().trim())

  const hasConsultorioMatch = pendingAppointments?.some((apt) => {
    const curr = appointment?.consultorioNombre?.trim().toLowerCase()
    const other = apt.consultorioNombre?.trim().toLowerCase()
    return curr && other && curr === other
  })

  const hasEspecialidadMatch = pendingAppointments?.some((apt) => {
    const currCodigo = (appointment as any)?.especialidadSolicitud?.trim()?.toLowerCase()
    if (!currCodigo) return false
    return apt.especialidad?.trim()?.toLowerCase() === currCodigo
  })

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      if (searchType === 'name' && patient) {
        const idToUse = patient.PACIENTE || patient.HISTORIA
        if (idToUse) loadEnhancedPatientData(idToUse)
        else setEnhancedPatient(patient)
      } else {
        setEnhancedPatient(patient)
      }
      // Cargar órdenes del paciente
      const pacienteId = patient?.PACIENTE || patient?.HISTORIA
      if (pacienteId) loadOrdenesApoyoDiagnostico(pacienteId)
    }
  }, [isOpen, patient, searchType])

  useEffect(() => {
    if (!isSisSeguro()) {
      setSelectedEntidadSis("")
      setReferencia("")
      setReferenciaIdSeleccionada("")
      setEessOrigenReferencia("")
      setEessNombreOrigen("")
    }
  }, [selectedSeguro])

  const loadOrdenesApoyoDiagnostico = async (pacienteId: string) => {
    setLoadingOrdenes(true)
    try {
      const res = await fetch(`${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes/paciente/${pacienteId}`)
      if (res.ok) {
        const json = await res.json()
        const lista: OrdenApoyoDiagnostico[] = Array.isArray(json?.data) ? json.data
          : Array.isArray(json) ? json : []
        setOrdenes(lista)
      } else {
        setOrdenes([])
      }
    } catch {
      setOrdenes([])
    } finally {
      setLoadingOrdenes(false)
    }
  }

  const loadEnhancedPatientData = async (pacienteId: string) => {
    setIsLoadingPatientData(true)
    try {
      const response = await fetch(`${apiBaseUrl}/cita/paciente-foto/${pacienteId}`)
      if (response.ok) {
        const additionalData = await response.json()
        setEnhancedPatient({
          ...patient!,
          NOMBRES: additionalData.nombres || patient!.NOMBRES,
          STRING_FOTO: additionalData.stringFoto || patient!.STRING_FOTO,
          ESTADO_CIVIL: additionalData.estadoCivil || patient!.ESTADO_CIVIL,
          FECHA_NACIMIENTO: additionalData.fechaNacimiento
            ? new Date(additionalData.fechaNacimiento).toISOString().split('T')[0]
            : patient!.FECHA_NACIMIENTO,
          EDAD: additionalData.edad || patient!.EDAD,
        })
      } else {
        setEnhancedPatient(patient)
      }
    } catch {
      setEnhancedPatient(patient)
    } finally {
      setIsLoadingPatientData(false)
    }
  }

  const resetForm = () => {
    setSelectedTipoCita("")
    setSelectedSeguro("")
    setSelectedOrdenEcografia("")
    setOrdenes([])
    setLoadingOrdenes(false)
    setSelectedEntidadSis("")
    setReferencia("")
    setReferenciaIdSeleccionada("")
    setEessOrigenReferencia("")
    setEessNombreOrigen("")
    setSisVerificationResult(null)
    setEnhancedPatient(null)
    setIsLoadingPatientData(false)
    setShowSuccess(false)
    setAssignedCitaId("")
    setFhirSyncResult(null)
    setShowErrorDialog(false)
    setErrorMessage("")
    setErrorTitle("Error")
  }

  const handleAssign = async () => {
    if (!selectedTipoCita || !selectedSeguro || !appointment?.id) return

    setIsLoading(true)
    try {
      const usuarioDni = extractDocumentFromToken() || 'SISTEMA'
      const serverDateTime = await datetimeService.getCurrentDateTime()

      const fullName = `${patient?.PATERNO || ''} ${patient?.MATERNO || ''} ${patient?.NOMBRE || ''}`.trim()

      let detalles: { idProcedimiento: number; item: string; cantidad: number }[] = []
      if (selectedOrdenEcografia) {
        try {
          const detallesRes = await fetch(
            `${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes/detalles/orden/${selectedOrdenEcografia}`
          )
          if (detallesRes.ok) {
            const detallesData = await detallesRes.json()
            const rawDetalles: OrdenDetalle[] = Array.isArray(detallesData?.data)
              ? detallesData.data
              : Array.isArray(detallesData)
              ? detallesData
              : []
            detalles = rawDetalles.map((d) => ({
              idProcedimiento: d.idProcedimiento,
              item: d.observacionEspecifica || '',
              cantidad: d.cantidad ?? 1,
            }))
          }
        } catch {
          // Si falla la carga de detalles, se continúa sin ellos
        }
      }

      const requestBody = {
        fechaOtorga: `${serverDateTime.date}T${serverDateTime.time}:00`,
        tipoCita: selectedTipoCita,
        tipoPaciente: 'C',
        idPaciente: (patient?.PACIENTE || patient?.HISTORIA || '').toString().trim(),
        nombre: (patient?.NOMBRES || fullName).trim(),
        seguro: selectedSeguro.toString().trim(),
        estado: '2',
        horaOtorga: serverDateTime.time,
        numRef: referencia || '',
        entidadSis: eessOrigenReferencia || selectedEntidadSis || '',
        idOrden: selectedOrdenEcografia ? Number(selectedOrdenEcografia) : null,
        detalles,
      }

      const apiUrl = `${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/citas/${appointment.id}/asignar`
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Usuario': usuarioDni },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 409 && responseData.message) {
          setErrorTitle("⚠️ Cita No Disponible")
          setErrorMessage(responseData.message)
          setShowErrorDialog(true)
          return
        }
        const errorMsg = responseData.message || `Error al asignar: ${response.status} ${response.statusText}`
        setErrorTitle("Error en la Asignación")
        setErrorMessage(errorMsg)
        setShowErrorDialog(true)
        return
      }

      toast({
        title: "¡Asignación Exitosa!",
        description: `Cita de ecografía asignada al paciente ${patient?.NOMBRES || ''}`,
        className: "bg-green-50 border-green-200 text-green-800",
      })

      setAssignedCitaId(appointment.id)
      setShowSuccess(true)

      // Registrar paciente en RENHICE/FHIR
      const pacienteId = patient?.PACIENTE || patient?.HISTORIA
      console.log('📡 FHIR: Intentando registrar paciente en RENHICE:', pacienteId)
      if (pacienteId) {
        try {
          const fhirUrl = `${FHIR_BASE_URL}/api/fhir/ips/pacientes/${pacienteId}/registrar`
          console.log('📡 FHIR: URL:', fhirUrl)
          const fhirRes = await fetch(
            fhirUrl,
            { method: 'POST', headers: { 'accept': 'application/json' } }
          )
          console.log('📡 FHIR: Respuesta status:', fhirRes.status)
          const fhirData = await fhirRes.json()
          console.log('📡 FHIR: Respuesta data:', fhirData)
          setFhirSyncResult({
            ok: fhirData.ok === true,
            scusUuid: fhirData.data?.scusUuid,
            message: fhirData.message,
          })
        } catch {
          setFhirSyncResult({ ok: false, message: 'No se pudo conectar con el servicio FHIR' })
        }
      }

      await onAssign({ ...requestBody, appointmentId: appointment.id, success: true, responseData })

      onSuccess?.(appointment.id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el paciente. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!patient || !appointment) return null

  const isFormValid = !!selectedTipoCita && !!selectedSeguro && !!selectedOrdenEcografia &&
    (!isSisSeguro() || (!!selectedEntidadSis && !!referencia.trim())) &&
    !hasConsultorioMatch

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-6xl h-[90vh] overflow-hidden flex flex-col"
          aria-describedby="apoyo-diagnostico-assign-description"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack} className="p-2 hover:bg-gray-100" disabled={isLoading}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1">
                <DialogTitle className="text-blue-800 font-semibold">
                  Confirmar Asignación — Apoyo Diagnóstico (Ecografía)
                </DialogTitle>
                <DialogDescription id="apoyo-diagnostico-assign-description">
                  Información del Paciente
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Advertencias */}
            <div className="space-y-3 mb-4">
              {(hasConsultorioMatch || hasEspecialidadMatch) && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertDescription className="text-orange-800">
                    {hasConsultorioMatch
                      ? "⚠️ Este paciente tiene una cita pendiente en el mismo consultorio."
                      : "⚠️ Este paciente tiene una cita pendiente en la misma especialidad."}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Éxito */}
            {showSuccess && (
              <div className="mb-6 space-y-2">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ¡Cita asignada exitosamente! ID: <strong>{assignedCitaId}</strong>
                  </AlertDescription>
                </Alert>
                {fhirSyncResult === null && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-700 text-sm">
                      Sincronizando con RENHICE...
                    </AlertDescription>
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
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Izquierda — Paciente */}
              <div className="flex flex-col h-full">
                {isLoadingPatientData ? (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">Cargando información del paciente...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    <PatientInfoCardAppointment patient={enhancedPatient || patient!} className="h-full" />
                    <UpdateClinicalHistoryButton
                      patient={patient!}
                      onPatientUpdated={(updated) => setEnhancedPatient(updated as Patient)}
                    />
                  </div>
                )}
              </div>

              {/* Derecha — Cita + Datos */}
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
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Consultorio</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {appointment.consultorioNombre
                            ? `${appointment.consultorio} - ${appointment.consultorioNombre}`
                            : appointment.consultorio}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Médico</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Stethoscope className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {appointment.medicoNombre
                            ? `${appointment.medico} - ${appointment.medicoNombre}`
                            : appointment.medico}
                        </span>
                      </div>
                    </div>

                    {patient?.PACIENTE && (
                      <PatientPendingAppointmentsModal
                        pacienteId={patient.PACIENTE}
                        currentConsultorio={appointment?.consultorioNombre}
                        currentEspecialidad={(appointment as any)?.especialidadSolicitud}
                        limite={25}
                        highlight={hasConsultorioMatch || hasEspecialidadMatch}
                        onAppointmentsLoaded={setPendingAppointments}
                        timeConflict={{ isValid: true }}
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
                    <TipoCitaSelector value={selectedTipoCita} onChange={setSelectedTipoCita} required={true} />

                    <TipoSeguroSelector
                      value={selectedSeguro}
                      onChange={setSelectedSeguro}
                      required={true}
                      initialValue={patient?.SEGURO}
                    />

                    {isSisSeguro() && (
                      <div className="mt-2">
                        <SimpleSISVerification
                          patientId={patient.HISTORIA}
                          documento={patient.DOCUMENTO}
                          autoVerify={true}
                          showButton={true}
                          onVerificationComplete={(result) => {
                            setSisVerificationResult(result)
                            if (result.isSuccess) {
                              setSelectedTipoCita('D')
                              if (result.eess) {
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
                          especialidadCodigo={(appointment as any)?.especialidadSolicitud}
                          value={referenciaIdSeleccionada}
                          onChange={async (refData) => {
                            setReferencia(refData.numeroReferencia)
                            setReferenciaIdSeleccionada(refData.idReferencia)
                            if (refData.codigoestablecimientoOrigen) {
                              setEessOrigenReferencia(refData.codigoestablecimientoOrigen)
                              const result = await obtenerEntidadSISPorCodigo(refData.codigoestablecimientoOrigen)
                              if (result.success && result.data) {
                                setEessNombreOrigen(result.data.NOMBRE)
                              } else {
                                setEessNombreOrigen(refData.establecimientoOrigen || '')
                              }
                            } else {
                              setEessNombreOrigen(refData.establecimientoOrigen || '')
                              setEessOrigenReferencia('')
                            }
                          }}
                          onEessChange={(eess) => setEessOrigenReferencia(eess)}
                        />
                        <EntidadSisSelector
                          key={sisVerificationResult?.eess || eessOrigenReferencia || 'entidad-sis'}
                          value={selectedEntidadSis}
                          onChange={setSelectedEntidadSis}
                          sisEstablecimiento={
                            eessOrigenReferencia
                              ? { codigo: eessOrigenReferencia, nombre: eessNombreOrigen }
                              : sisVerificationResult?.isSuccess
                              ? { codigo: sisVerificationResult.eess || '', nombre: sisVerificationResult.descEESS || '' }
                              : undefined
                          }
                        />
                      </>
                    )}

                    {/* Campo extra: Orden de Apoyo al Diagnóstico */}
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-700">
                        Orden de Apoyo al Diagnóstico <span className="text-red-500">*</span>
                      </Label>
                      {loadingOrdenes ? (
                        <div className="flex items-center gap-2 h-10 border rounded-md px-3 bg-gray-50">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                          <span className="text-sm text-gray-500">Cargando órdenes...</span>
                        </div>
                      ) : (
                        <Select value={selectedOrdenEcografia} onValueChange={setSelectedOrdenEcografia}>
                          <SelectTrigger>
                            <SelectValue placeholder={ordenes.length === 0 ? 'Sin órdenes disponibles' : 'Seleccione una orden'} />
                          </SelectTrigger>
                          <SelectContent>
                            {ordenes.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500">No hay órdenes disponibles para este paciente</div>
                            ) : (
                              ordenes.map((ord) => {
                                const origenColor: Record<string, string> = {
                                  CE: 'bg-blue-100 text-blue-800',
                                  EM: 'bg-red-100 text-red-800',
                                  HO: 'bg-green-100 text-green-800',
                                }
                                const colorClass = origenColor[ord.origen?.trim()] || 'bg-gray-100 text-gray-700'
                                return (
                                  <SelectItem key={ord.idOrden} value={String(ord.idOrden)}>
                                    <div className="flex items-center gap-2 w-full">
                                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${colorClass}`}>
                                        {ord.origen?.trim()}
                                      </span>
                                      <span className="font-medium text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                        {ord.tipoServicio}
                                      </span>
                                      <span className="text-sm">#{ord.idOrden}</span>
                                      {ord.observacionesMedicas && (
                                        <span className="text-xs text-gray-500 truncate max-w-[160px]" title={ord.observacionesMedicas}>
                                          — {ord.observacionesMedicas}
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                )
                              })
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4 flex-shrink-0">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!isFormValid || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
              title={hasConsultorioMatch ? "El paciente ya tiene una cita en este consultorio" : ""}
            >
              Confirmar Asignación
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <CheckCircle className="h-5 w-5" />
              Confirmar Asignación — Ecografía
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Paciente</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nombre:</span> {enhancedPatient?.NOMBRES || patient?.NOMBRES}</p>
                <p><span className="font-medium">Documento:</span> {patient?.DOCUMENTO}</p>
                <p><span className="font-medium">Historia Clínica:</span> {patient?.HISTORIA}</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Detalles de la Cita</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Fecha:</span> {appointment?.fecha}</p>
                <p><span className="font-medium">Hora:</span> {appointment?.hora}</p>
                <p><span className="font-medium">Consultorio:</span> {appointment?.consultorioNombre || appointment?.consultorio}</p>
                <p><span className="font-medium">Tipo de Cita:</span> {tiposCita.find(t => t.Tipo_cita === selectedTipoCita)?.Nombre}</p>
                <p><span className="font-medium">Seguro:</span> {seguros.find(s => s.Seguro === selectedSeguro)?.Nombre}</p>
                <p><span className="font-medium">Orden Apoyo Diagnóstico:</span> #{selectedOrdenEcografia}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={async () => { setShowConfirmDialog(false); await handleAssign() }}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Asignando..." : "Sí, Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error dialog */}
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
            <AlertDialogAction onClick={() => setShowErrorDialog(false)} className="bg-blue-600 hover:bg-blue-700">
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function PatientAssignDiagnosticSupportModal(props: PatientAssignDiagnosticSupportModalProps) {
  return (
    <ReferenciaProvider>
      <PatientAssignDiagnosticSupportModalContent {...props} />
    </ReferenciaProvider>
  )
}
