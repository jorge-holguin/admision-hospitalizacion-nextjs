"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PatientInfoCardAppointment } from "@/components/appointments/patient/PatientInfoCardAppointment"
import { PatientPendingAppointmentsModal, type PendingAppointment } from "@/components/appointments/patient/PatientPendingAppointmentsModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User, Stethoscope, CheckCircle, ArrowLeft, XCircle, AlertTriangle, ClipboardList, MapPin, Trash2, Pencil, Calendar as CalendarIcon } from "lucide-react"
import { TipoCitaSelector } from "@/components/appointments/selectors/TipoCitaSelector"
import { TipoSeguroSelector } from "@/components/appointments/selectors/TipoSeguroSelector"
import { EntidadSisSelector } from "@/components/appointments/selectors/EntidadSisSelector"
import { ReferenciaSelector } from "@/components/appointments/selectors/ReferenciaSelector"
import { useTipoCita } from "@/contexts/TipoCitaContext"
import { useSegurosCita } from "@/contexts/SegurosCitaContext"
import { ReferenciaProvider, useReferencia } from "@/contexts/ReferenciaContext"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SimpleSISVerification } from "@/components/appointments/patient/SimpleSISVerification"
import { toast } from "@/components/ui/use-toast"
import { extractDocumentFromToken } from '@/utils/jwtUtils'
import { datetimeService } from '@/services/datetimeService'
import { sincronizarCitaConRefcon, obtenerDatosCitaRefcon, esSeguroSIS, actualizarEstadoRefcon } from "@/services/appointments/refconSyncService"
import { obtenerEntidadSISPorCodigo } from "@/services/appointments/sisEntitiesService"
import { UpdateClinicalHistoryButton } from "@/components/appointments/patient/UpdateClinicalHistoryButton"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { CrearOrdenApoyoDiagnosticoModal, type OrdenToEdit } from "@/components/appointments/modals/CrearOrdenApoyoDiagnosticoModal"
import { verificarExamenesConPedido } from "@/services/apoyoDiagnostico/maestroService"

const APOYO_DIAGNOSTICO_BASE_URL = import.meta.env.VITE_API_APOYO_DIAGNOSTICO_URL || 'http://192.168.5.239:9020'
const REFERENCIA_BASE_URL = import.meta.env.VITE_API_REFERENCIA_URL || 'http://192.168.0.31:9012'
const EESS_DESTINO = import.meta.env.VITE_EESS_CODIGO || '5947'
const ESTADOS_REF_PERMITIDOS = ['ACEPTADO', 'PACIENTE RECIBIDO', 'PACIENTE CITADO']
const MAX_OBSERVACION_LENGTH = 200

interface OrdenDetalle {
  idOrdenDetalle: number
  idOrden: number
  idProcedimiento: number
  cpms?: string
  cpmsDescripcion?: string
  ciex?: string
  diagnosticoId: number | null
  cantidad: number
  observacion?: string
  observacionEspecifica: string
  estadoDetalle: string
}

interface OrdenApoyoDiagnostico {
  idOrden: number
  idPaciente: string
  tipoServicio: string
  grupoServicio: string
  idLugar?: string | number
  origen: string
  origenId: string
  seguro: string
  idMedicoSolicita: number
  cama?: string
  fechaTentativa: string
  horaTentativa: string
  observacionesMedicas?: string
  estadoOrden: string
  regFechaCreacion?: string
  detalles: OrdenDetalle[]
}

interface ReferenciaItem {
  rownum: string
  paciente: { tipo_documento: string; numero_documento: string; nombres: string; primer_apellido: string; segundo_apellido: string }
  datos_referencia: {
    codigo_especialidad: string; codigoEstado: string; estado: string; fecha_referencia: string
    servicio_origen: string; codigo_establecimiento_origen: string; servicio_destino: string
    numero_referencia: string; id_referencia: string; resume_exfisico?: string | null; motivo_referencia?: string
  }
  diagnosticos: Array<{ id: string; codigo_ciex: string; tipo_diagnostico: string }>
  cpt_procedimiento: Array<{ cpt1: string }> | string | null
  cpt_laboratorio: Array<{ cpt1: string }> | string | null
  cpt_imagenes: Array<{ cpt1: string }> | string | null
}

const extractCpt = (value: Array<{ cpt1: string }> | string | null): string | null => {
  if (Array.isArray(value) && value.length > 0) return value[0]?.cpt1 || null
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

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

interface PatientAssignmentReservedDiagnosticSupportModalProps {
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
      toast({ title: "Campo requerido", description: "Debe ingresar un motivo", variant: "destructive" })
    }
  }

  const handleClose = () => { setMotivo(""); onClose() }

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
            <Label className="text-sm font-medium">Motivo <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder={`Ingrese el motivo por el cual se ${action.toLowerCase()} la solicitud...`}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">{motivo.length}/500 caracteres</div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancelar</Button>
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

function PatientAssignmentReservedDiagnosticSupportModalContent({
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
}: PatientAssignmentReservedDiagnosticSupportModalProps) {

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
  const [skipRefconSync, setSkipRefconSync] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [pendingAssignmentData, setPendingAssignmentData] = useState<any>(null)

  const [refconSyncSuccess, setRefconSyncSuccess] = useState(false)
  const [refconSyncError, setRefconSyncError] = useState<string | null>(null)
  const [sisVerificationResult, setSisVerificationResult] = useState<any>(null)
  const [refreshedPatient, setRefreshedPatient] = useState<any>(null)
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([])

  const [showMotivoModal, setShowMotivoModal] = useState(false)
  const [motivoAction, setMotivoAction] = useState<"DENEGAR" | "OBSERVAR">("DENEGAR")
  const [motivoLoading, setMotivoLoading] = useState(false)

  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorDialogData, setErrorDialogData] = useState<{ title: string; message: string; type: 'warning' | 'error' }>({ title: '', message: '', type: 'error' })

  const [showTimeConflictDialog, setShowTimeConflictDialog] = useState(false)
  const [showEspecialidadConflictDialog, setShowEspecialidadConflictDialog] = useState(false)

  // Apoyo al Diagnóstico — siempre habilitado en este modal
  const [ordenes, setOrdenes] = useState<OrdenApoyoDiagnostico[]>([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(false)
  const [selectedOrdenEcografia, setSelectedOrdenEcografia] = useState("")
  const [isPacientePeriferico, setIsPacientePeriferico] = useState(false)
  const [referenciaItems, setReferenciaItems] = useState<ReferenciaItem[]>([])
  const [loadingReferencia, setLoadingReferencia] = useState(false)
  const [selectedRefItem, setSelectedRefItem] = useState<ReferenciaItem | null>(null)
  const [showCrearOrdenModal, setShowCrearOrdenModal] = useState(false)
  const [ordenCreadaId, setOrdenCreadaId] = useState<number | null>(null)
  const [ordenToEdit, setOrdenToEdit] = useState<OrdenToEdit | null>(null)
  const [confirmDialogOrden, setConfirmDialogOrden] = useState<{ type: 'delete'; orden: OrdenApoyoDiagnostico } | null>(null)

  const [pedidoAlert, setPedidoAlert] = useState<{ show: boolean; examenes: { cpms: string; descripcion: string }[] }>({ show: false, examenes: [] })
  const [loadingPedido, setLoadingPedido] = useState(false)

  const { selectedReferencia: selectedSisReferencia } = useReferencia()

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
      setPendingAssignmentData(null)
      setOrdenes([])
      setSelectedOrdenEcografia("")
      setIsPacientePeriferico(false)
      setReferenciaItems([])
      setSelectedRefItem(null)
      setShowCrearOrdenModal(false)
      setOrdenCreadaId(null)
      setOrdenToEdit(null)
      setConfirmDialogOrden(null)
    }
  }, [isOpen, patient])

  const hasConsultorioMatch = pendingAppointments?.some((apt) => {
    const currCodigo = appointment?.consultorio?.trim()
    const otherCodigo = apt.consultorio?.trim()
    return currCodigo && otherCodigo && currCodigo.toLowerCase() === otherCodigo.toLowerCase()
  })

  const hasEspecialidadMatch = pendingAppointments?.some((apt) => {
    const currCodigo = appointment?.especialidad?.trim()?.toLowerCase()
    if (!currCodigo) return false
    return apt.especialidad?.trim()?.toLowerCase() === currCodigo
  })

  const validateTimeWindow = (): { isValid: boolean; conflictingAppointment?: any; message?: string } => {
    if (!appointment?.fecha || !appointment?.hora || pendingAppointments.length === 0) return { isValid: true }

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

    for (const apt of pendingAppointments) {
      if (!apt.fecha || !apt.hora) continue
      let aptDate: Date
      if (apt.fecha.includes('/')) {
        const [day, month, year] = apt.fecha.split('/')
        aptDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      } else if (apt.fecha.includes('-')) {
        const fechaClean = apt.fecha.split(' ')[0].split('T')[0]
        aptDate = new Date(fechaClean + 'T00:00:00')
      } else {
        continue
      }

      const [hours, minutes] = apt.hora.split(':').map(Number)
      aptDate.setHours(hours, minutes || 0, 0, 0)

      const isSameDay = currentDate.toDateString() === aptDate.toDateString()
      if (!isSameDay) continue

      const diffMs = Math.abs(currentDate.getTime() - aptDate.getTime())
      const diffHours = diffMs / (1000 * 60 * 60)

      if (diffHours < 3) {
        return {
          isValid: false,
          conflictingAppointment: apt,
          message: `⚠️ El paciente tiene una cita programada el ${apt.fecha} a las ${apt.hora}. Los horarios se cruzarían. Debe haber al menos 3 horas de diferencia entre citas.`
        }
      }
    }

    return { isValid: true }
  }

  const timeValidation = validateTimeWindow()

  // Cargar órdenes de apoyo diagnóstico — siempre al abrir este modal
  const loadOrdenes = async (pacienteId: string) => {
    setLoadingOrdenes(true)
    try {
      const res = await fetch(`${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes/paciente/${pacienteId}?origen=CE`)
      if (res.ok) {
        const json = await res.json()
        const lista: OrdenApoyoDiagnostico[] = (Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [])
          .filter((o: OrdenApoyoDiagnostico) => ['1', '2', '3'].includes(String(o.estadoOrden)))
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

  useEffect(() => {
    if (isOpen) {
      const pacienteId = patient?.PACIENTE || patient?.HISTORIA
      if (pacienteId) loadOrdenes(pacienteId)
    }
  }, [isOpen, appointment?.consultorio])

  // Verificar campo PEDIDO de APOYO_DIAGNOSTICO.MAESTRO para los exámenes de la orden seleccionada
  useEffect(() => {
    const checkPedido = async () => {
      const ordenIdRaw = selectedOrdenEcografia || (ordenCreadaId ? String(ordenCreadaId) : '')
      if (!ordenIdRaw) {
        setPedidoAlert({ show: false, examenes: [] })
        return
      }
      const orden = ordenes.find((o) => String(o.idOrden) === ordenIdRaw)
      if (!orden?.detalles?.length) {
        setPedidoAlert({ show: false, examenes: [] })
        return
      }
      setLoadingPedido(true)
      try {
        const detallesVisibles = orden.detalles.filter((d) => d.estadoDetalle !== '0')
        const { bloqueado, examenes } = await verificarExamenesConPedido(detallesVisibles)
        setPedidoAlert({ show: bloqueado, examenes })
      } catch (error) {
        setPedidoAlert({ show: false, examenes: [] })
      } finally {
        setLoadingPedido(false)
      }
    }
    checkPedido()
  }, [selectedOrdenEcografia, ordenCreadaId, ordenes])

  const getCpmsFromRef = (ref: ReferenciaItem): string | null => {
    const ups = ref.datos_referencia?.servicio_destino || ''
    if (ups === '150000') return extractCpt(ref.cpt_laboratorio)
    if (ups === '080400') return extractCpt(ref.cpt_imagenes)
    if (ups === '080900') return extractCpt(ref.cpt_imagenes) || extractCpt(ref.cpt_procedimiento)
    return extractCpt(ref.cpt_procedimiento) || extractCpt(ref.cpt_imagenes) || extractCpt(ref.cpt_laboratorio)
  }

  const isReferenciaValida = (ref: ReferenciaItem): boolean => {
    const estado = (ref.datos_referencia?.estado || '').trim().toUpperCase()
    return ESTADOS_REF_PERMITIDOS.includes(estado)
  }

  const buscarReferenciaDetalle = async () => {
    const doc = patient?.DOCUMENTO
    if (!doc) {
      toast({ title: 'Sin documento', description: 'El paciente no tiene número de documento registrado.', variant: 'destructive' })
      return
    }
    setLoadingReferencia(true)
    setReferenciaItems([])
    setSelectedRefItem(null)
    setOrdenCreadaId(null)
    setShowCrearOrdenModal(false)
    try {
      const tipoDoc = (patient?.TIPO_DOCUMENTO === 'CE' || patient?.TIPO_DOCUMENTO === 'C') ? '2' : '1'
      const body = { establecimientoDestino: EESS_DESTINO, limite: '25', numerodocumento: doc, pagina: '1', tipodocumento: tipoDoc }
      const res = await fetch(`${REFERENCIA_BASE_URL}/api/referencia/detalle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        toast({ title: 'Error al buscar referencias', description: `Error ${res.status}: ${res.statusText}`, variant: 'destructive' })
        return
      }
      const json = await res.json()
      if (json?.codigo && json.codigo !== '0000') {
        toast({ title: 'Error al buscar referencias', description: json?.mensaje || `Código ${json?.codigo}`, variant: 'destructive' })
        return
      }
      const extractLista = (r: any): ReferenciaItem[] => {
        if (Array.isArray(r?.datos?.datos)) return r.datos.datos
        if (Array.isArray(r?.datos)) return r.datos
        if (Array.isArray(r?.data)) return r.data
        if (Array.isArray(r?.items)) return r.items
        if (Array.isArray(r)) return r
        return []
      }
      const rawLista = extractLista(json)

      if (rawLista.filter(isReferenciaValida).length === 0 && selectedSisReferencia) {
        const fullName = patient?.NOMBRES?.trim() || `${patient?.PATERNO || ''} ${patient?.MATERNO || ''} ${patient?.NOMBRE || ''}`.trim()
        const parts = fullName.split(/\s+/)
        const fallbackRef: ReferenciaItem = {
          rownum: '1',
          paciente: { tipo_documento: selectedSisReferencia.tipoDocumento || '1', numero_documento: patient?.DOCUMENTO || '', nombres: parts.slice(2).join(' ') || '', primer_apellido: parts[0] || '', segundo_apellido: parts[1] || '' },
          datos_referencia: { codigo_especialidad: '', codigoEstado: '3', estado: 'ACEPTADO', fecha_referencia: '', servicio_origen: '', codigo_establecimiento_origen: selectedSisReferencia.codigoestablecimientoOrigen || '', servicio_destino: '080900', numero_referencia: selectedSisReferencia.numeroReferencia || '', id_referencia: selectedSisReferencia.idReferencia || '', resume_exfisico: null, motivo_referencia: '' },
          diagnosticos: [], cpt_procedimiento: null, cpt_laboratorio: null, cpt_imagenes: null,
        }
        if (isReferenciaValida(fallbackRef)) {
          setReferenciaItems([fallbackRef])
          setSelectedRefItem(fallbackRef)
          setShowCrearOrdenModal(true)
          return
        }
      }

      const filteredLista = rawLista.filter(isReferenciaValida)
      if (filteredLista.length === 0) {
        toast({ title: 'Sin referencias', description: 'No se encontraron referencias activas de apoyo diagnóstico para este paciente.', variant: 'default' })
        return
      }
      setReferenciaItems(filteredLista)
      const autoSelected = filteredLista.find(r => ['080900'].includes(r.datos_referencia?.servicio_destino || '')) ?? filteredLista[0]
      setSelectedRefItem(autoSelected)
      setShowCrearOrdenModal(true)
    } catch (e: any) {
      toast({ title: 'Error de conexión', description: e?.message || 'No se pudo conectar al servicio de referencias.', variant: 'destructive' })
    } finally {
      setLoadingReferencia(false)
    }
  }

  const handleDeleteOrden = async () => {
    const orden = confirmDialogOrden?.orden
    if (!orden) return
    try {
      const usuarioDni = extractDocumentFromToken() || 'SISTEMA'
      const res = await fetch(`${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes/${orden.idOrden}`, {
        method: 'DELETE',
        headers: { 'Usuario': usuarioDni },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any)?.message || `Error ${res.status}`)
      }
      toast({ title: 'Orden eliminada', description: `Orden #${orden.idOrden} eliminada correctamente.` })
      const pacId = patient?.PACIENTE || patient?.HISTORIA
      if (pacId) loadOrdenes(pacId)
      if (selectedOrdenEcografia === String(orden.idOrden)) setSelectedOrdenEcografia('')
    } catch (e: any) {
      toast({ title: 'Error al eliminar orden', description: e.message || 'No se pudo eliminar la orden.', variant: 'destructive' })
    } finally {
      setConfirmDialogOrden(null)
    }
  }

  const handleEditarOrden = (ord: OrdenApoyoDiagnostico) => {
    const ordenToEdit: OrdenToEdit = {
      idOrden: ord.idOrden,
      idPaciente: ord.idPaciente,
      tipoServicio: ord.tipoServicio,
      idLugar: ord.idLugar,
      origen: ord.origen,
      origenId: ord.origenId,
      idTipoSeguro: ord.seguro,
      idMedico: ord.idMedicoSolicita,
      cama: ord.cama ?? null,
      detalles: ord.detalles.map((d) => ({
        cpms: d.cpms ?? null,
        cpmsDescripcion: d.cpmsDescripcion ?? null,
        ciex: d.ciex ?? null,
        cantidad: d.cantidad ?? 1,
        observacion: ((d.observacion ?? d.observacionEspecifica) || '').trim().slice(0, MAX_OBSERVACION_LENGTH) || null,
        estadoDetalle: d.estadoDetalle,
      })),
    }
    setOrdenToEdit(ordenToEdit)

    if (!selectedRefItem) {
      const tipo = (ord.tipoServicio || 'ECO').toUpperCase()
      const servicioDestino = tipo === 'RX' ? '080400' : tipo === 'LAB' ? '150000' : '080900'
      const minimalRef: ReferenciaItem = {
        rownum: '',
        paciente: { tipo_documento: patient?.TIPO_DOCUMENTO || '1', numero_documento: patient?.DOCUMENTO || '', nombres: (patient?.NOMBRES || patient?.NOMBRE || '').trim(), primer_apellido: (patient?.PATERNO || '').trim(), segundo_apellido: (patient?.MATERNO || '').trim() },
        datos_referencia: { codigo_especialidad: '', codigoEstado: '3', estado: 'ACEPTADO', fecha_referencia: new Date().toISOString().split('T')[0], servicio_origen: '', codigo_establecimiento_origen: '', servicio_destino: servicioDestino, numero_referencia: '', id_referencia: '' },
        diagnosticos: [], cpt_procedimiento: null, cpt_laboratorio: null, cpt_imagenes: null,
      }
      setSelectedRefItem(minimalRef)
    }

    setShowCrearOrdenModal(true)
  }

  const isSisSeguro = () => {
    if (!selectedSeguro || !seguros) return false
    const seguro = seguros.find(s => s.Seguro === selectedSeguro)
    return seguro?.Seguro === '21' || seguro?.Nombre?.toUpperCase().includes('SIS') || false
  }

  const handleApprove = async () => {
    if (!patient || !appointment) return

    if (pedidoAlert.show) {
      toast({
        title: '⛔ Atención bloqueada',
        description: 'No se puede aprobar la solicitud porque la orden contiene exámenes que requieren pedido previo.',
        variant: 'destructive',
      })
      return
    }

    if (hasConsultorioMatch) {
      toast({
        title: "⛔ Doble Cita Detectada",
        description: "El paciente ya tiene una cita pendiente en este mismo consultorio. No se puede aprobar esta solicitud.",
        variant: "destructive",
        duration: 8000
      })
      return
    }

    setIsLoading(true)
    try {
      const usuarioApellido = extractDocumentFromToken()
      const serverDateTime = await datetimeService.getCurrentDateTime()
      const esReferenciaManual = referenciaIdSeleccionada?.startsWith('manual-')

      const requestBody = {
        fechaOtorga: `${serverDateTime.date}T${serverDateTime.time}:00`,
        tipoCita: selectedTipoCita,
        tipoPaciente: 'C',
        paciente: patient?.PACIENTE || '',
        nombre: patient?.NOMBRES || `${patient?.PATERNO || ''} ${patient?.MATERNO || ''} ${patient?.NOMBRE || ''}`.trim(),
        seguro: selectedSeguro,
        estado: '1',
        horaOtorga: serverDateTime.time,
        usuario: usuarioApellido,
        numRef: referencia || '',
        entidadSis: eessOrigenReferencia || selectedEntidadSis || '',
        idRefcon: esReferenciaManual ? 0 : (referenciaIdSeleccionada ? parseInt(referenciaIdSeleccionada) || 0 : 0),
        recibidoRefcon: esReferenciaManual ? 0 : (skipRefconSync ? 3 : 2)
      }

      const apiUrl = `${import.meta.env.VITE_API_CITAS_MASTER_URL}/cita/${appointment.citaId}/asignar`

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 409 && responseData.message) {
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
        const errorMessage = responseData.message || `Error al asignar paciente: ${response.status} ${response.statusText}`
        setErrorDialogData({ title: '❌ Error en la Asignación', message: errorMessage, type: 'error' })
        setShowErrorDialog(true)
        return
      }

      if (appointment.idSolicitudCita) {
        const reservasApiUrl = `${import.meta.env.VITE_API_RESERVAS_URL}/solicitudes/${appointment.idSolicitudCita}/citar?usuarioAsigna=${usuarioApellido}`
        const reservasResponse = await fetch(reservasApiUrl, { method: 'PUT', headers: { 'accept': '*/*' } })
        if (!reservasResponse.ok) {
        }
      }

      const assignmentData = { ...requestBody, appointmentId: appointment.citaId, success: true, responseData }
      setPendingAssignmentData(assignmentData)

      const esReferenciaManualSync = referenciaIdSeleccionada?.startsWith('manual-')
      if (referenciaIdSeleccionada && appointment && esSeguroSIS(selectedSeguro) && !esReferenciaManualSync && !skipRefconSync) {
        try {
          const citaRefconResult = await obtenerDatosCitaRefcon(appointment.citaId, usuarioApellido)
          if (citaRefconResult.success && citaRefconResult.data) {
            const datosRefcon = citaRefconResult.data
            const refconPayload = {
              codUnicoDestino: datosRefcon.codUnicoDestino || "00005947",
              idReferencia: referenciaIdSeleccionada,
              datosCita: datosRefcon.datosCita || {},
              datosMedico: datosRefcon.datosMedico || {},
              personalRegistra: datosRefcon.personalRegistra || {}
            }
            const syncResult = await sincronizarCitaConRefcon(refconPayload)
            if (syncResult.success) {
              setRefconSyncSuccess(true)
              setRefconSyncError(null)
            } else {
              setRefconSyncSuccess(false)
              setRefconSyncError(syncResult.error || 'Error desconocido al sincronizar con REFCON')
              await actualizarEstadoRefcon(appointment.citaId, 1)
            }
          }
        } catch (refconError) {
          setRefconSyncSuccess(false)
          setRefconSyncError(refconError instanceof Error ? refconError.message : 'Error desconocido')
          try { await actualizarEstadoRefcon(appointment.citaId, 1) } catch { /* silenciar */ }
        }
      }

      // Apoyo al Diagnóstico: siempre vincular orden
      try {
        const ordenIdRaw = selectedOrdenEcografia || (ordenCreadaId ? String(ordenCreadaId) : null)
        const serverDT2 = await datetimeService.getCurrentDateTime()
        let detalles: { cpms: string; cantidad: number }[] = []
        if (ordenIdRaw) {
          try {
            const detallesRes = await fetch(`${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes/detalles/orden/${ordenIdRaw}`)
            if (detallesRes.ok) {
              const detallesData = await detallesRes.json()
              const rawDetalles: OrdenDetalle[] = Array.isArray(detallesData?.data) ? detallesData.data : Array.isArray(detallesData) ? detallesData : []
              detalles = rawDetalles.filter((d) => d.estadoDetalle !== '0').map((d) => ({ cpms: d.cpms?.trim() || String(d.idProcedimiento), cantidad: d.cantidad ?? 1 }))
            }
          } catch { /* continuar sin detalles */ }
        }

        const apoyoBody = {
          fechaOtorga: `${serverDT2.date}T${serverDT2.time}:00`,
          tipoCita: selectedTipoCita,
          tipoPaciente: 'C',
          idPaciente: (patient.PACIENTE || patient.HISTORIA || '').toString().trim(),
          nombre: (patient.NOMBRES || '').trim(),
          seguro: selectedSeguro.toString().trim(),
          estado: '1',
          horaOtorga: serverDT2.time,
          numRef: referencia || '',
          entidadSis: eessOrigenReferencia || selectedEntidadSis || '',
          idOrden: ordenIdRaw ? Number(ordenIdRaw) : null,
          detalles,
        }
        const apoyoUrl = `${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/atenciones/${appointment.citaId}/asignar`
        const apoyoRes = await fetch(apoyoUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Usuario': extractDocumentFromToken() || 'SISTEMA' },
          body: JSON.stringify(apoyoBody),
        })
        if (!apoyoRes.ok) {
          const apoyoErr = await apoyoRes.json().catch(() => ({}))
        }
      } catch (apoyoError) {
        // El error en apoyo diagnóstico no es crítico; la cita principal ya fue asignada.
      }

      setShowSuccess(true)
      toast({
        title: "¡Asignación Exitosa!",
        description: `La cita ha sido asignada correctamente al paciente ${patient.NOMBRES}`,
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 5000
      })
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo aprobar la solicitud. Intente nuevamente.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDenyClick = () => { setMotivoAction("DENEGAR"); setShowMotivoModal(true) }

  const handleMotivoConfirm = async (motivo: string) => {
    setMotivoLoading(true)
    try {
      await onDeny(motivo)
      setShowMotivoModal(false)
      toast({ title: "✅ Solicitud Denegada", description: "La solicitud ha sido denegada correctamente", className: "bg-orange-50 border-orange-200 text-orange-800", duration: 5000 })
      setTimeout(() => { onClose() }, 1500)
    } catch (error) {
      toast({ title: "Error", description: "No se pudo denegar la solicitud", variant: "destructive", duration: 5000 })
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
              <h3 className="text-lg font-semibold text-gray-900">¡Solicitud Aprobada!</h3>
              <p className="text-gray-600 mt-1">La solicitud de reserva ha sido aprobada y la cita fue asignada correctamente.</p>
            </div>
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 text-left space-y-1 text-sm">
              <p className="font-semibold text-green-800 mb-1">Información de la Cita Asignada</p>
              <p><span className="font-medium">Paciente:</span> {patient.NOMBRES}</p>
              <p><span className="font-medium">Consultorio:</span> {appointment?.consultorioNombre || appointment?.consultorio || 'N/A'}</p>
              <p><span className="font-medium">Médico:</span> {appointment?.medicoNombre || appointment.medico || 'N/A'}</p>
              <p><span className="font-medium">Fecha:</span> {appointment?.fecha || 'N/A'}</p>
              <p><span className="font-medium">Hora:</span> {appointment?.hora || 'N/A'}</p>
            </div>
            {refconSyncSuccess && (
              <div className="w-full bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm text-left">
                <p className="font-semibold mb-1">Sincronización con REFCON</p>
                <p>✅ La cita fue registrada exitosamente en el sistema de referencias (REFCON).</p>
              </div>
            )}
            {!refconSyncSuccess && refconSyncError && (
              <div className="w-full bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-3 text-sm text-left space-y-1">
                <p className="font-semibold flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Sincronización con REFCON incompleta</p>
                <p>✅ La cita fue asignada correctamente, pero REFCON devolvió un error.</p>
                <p className="text-xs text-orange-900">Por favor, informe al área responsable para la sincronización manual.</p>
              </div>
            )}
            <Button
              onClick={async () => {
                if (pendingAssignmentData) await onApprove(pendingAssignmentData)
                setShowSuccess(false)
                setRefconSyncSuccess(false)
                setRefconSyncError(null)
                setPendingAssignmentData(null)
                onClose()
                if (onSuccess) onSuccess(appointment.citaId)
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
                <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <DialogTitle className="text-xl font-semibold text-blue-600">
                  Confirmar Asignación — Apoyo al Diagnóstico
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Información del Paciente</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-3 mb-4">
              {(hasConsultorioMatch || hasEspecialidadMatch) && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertDescription className="text-orange-800">
                    {hasConsultorioMatch && hasEspecialidadMatch && <>⚠️ Este paciente tiene una cita pendiente en el mismo consultorio y especialidad.</>}
                    {!hasEspecialidadMatch && hasConsultorioMatch && <>⚠️ Este paciente tiene una cita pendiente en el mismo consultorio.</>}
                    {!hasConsultorioMatch && hasEspecialidadMatch && <>⚠️ Este paciente tiene una cita pendiente en la misma especialidad.</>}
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
              <div className="space-y-3 flex flex-col">
                <PatientInfoCardAppointment patient={refreshedPatient || patient} className="flex-1" />
                <UpdateClinicalHistoryButton patient={patient} onPatientUpdated={(updated) => setRefreshedPatient(updated)} />
              </div>

              <div className="space-y-4 flex flex-col">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Información de la Cita
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Fecha</Label>
                        <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-gray-400" />{appointment.fecha}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Hora</Label>
                        <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-gray-400" />{appointment.hora}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Especialidad</Label>
                        <div className="flex items-center gap-2 text-sm"><Stethoscope className="h-4 w-4 text-gray-400" />{appointment.especialidadNombre || appointment.especialidad}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Médico</Label>
                        <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-gray-400" />{appointment.medicoNombre || appointment.medico}</div>
                      </div>
                    </div>
                    {appointment.tipoCita && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Tipo de Cita según Reserva</Label>
                          <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-gray-400" /><span className="font-medium">{appointment.tipoCita}</span></div>
                        </div>
                        {appointment.tipoCita === 'INTERCONSULTA' && appointment.especialidadInterconsulta && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Especialidad de Interconsulta</Label>
                            <div className="flex items-center gap-2 text-sm"><Stethoscope className="h-4 w-4 text-blue-400" /><span className="font-medium text-blue-600">{appointment.especialidadInterconsulta}</span></div>
                          </div>
                        )}
                      </div>
                    )}
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
                    {hasConsultorioMatch && (
                      <Alert className="bg-red-100 border-red-500 border-2 mt-4">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-red-800 font-semibold">
                          <div className="flex flex-col gap-1">
                            <span className="text-base">⛔ DOBLE CITA DETECTADA</span>
                            <span className="text-sm font-normal">El paciente ya tiene una cita pendiente en este mismo consultorio. No se puede aprobar esta solicitud.</span>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Datos de Asignación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <TipoCitaSelector value={selectedTipoCita} onChange={setSelectedTipoCita} required={true} />
                    <TipoSeguroSelector value={selectedSeguro} onChange={setSelectedSeguro} required={true} initialValue={patient?.SEGURO} />

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
                          tipoDocumento={patient?.TIPO_DOCUMENTO === 'CE' || patient?.TIPO_DOCUMENTO === 'C' ? '2' : '1'}
                          especialidadCodigo={appointment?.especialidad}
                          value={referenciaIdSeleccionada}
                          onChange={async (refData) => {
                            setReferencia(refData.numeroReferencia)
                            setReferenciaIdSeleccionada(refData.idReferencia)
                            setSkipRefconSync(refData.skipRefconSync || false)
                            if (refData.codigoestablecimientoOrigen) {
                              setEessOrigenReferencia(refData.codigoestablecimientoOrigen)
                              const result = await obtenerEntidadSISPorCodigo(refData.codigoestablecimientoOrigen)
                              if (result.success && result.data) setEessNombreOrigen(result.data.NOMBRE)
                              else setEessNombreOrigen(refData.establecimientoOrigen || 'Establecimiento de origen')
                            } else {
                              setEessNombreOrigen(refData.establecimientoOrigen || '')
                              setEessOrigenReferencia('')
                            }
                          }}
                          onEessChange={(eess) => setEessOrigenReferencia(eess)}
                        />
                        <EntidadSisSelector
                          value={selectedEntidadSis}
                          onChange={setSelectedEntidadSis}
                          required={true}
                          sisEstablecimiento={
                            eessOrigenReferencia ? { codigo: eessOrigenReferencia, nombre: eessNombreOrigen }
                              : sisVerificationResult?.isSuccess ? { codigo: sisVerificationResult.eess?.replace(/^0+/, '') || '', nombre: sisVerificationResult.descEESS || '' }
                                : undefined
                          }
                        />
                      </>
                    )}

                    {/* Apoyo al Diagnóstico — siempre visible en este modal */}
                    <div className="mt-4 border border-blue-200 rounded-lg p-3 bg-blue-50/30 space-y-3">
                      <h4 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Apoyo al Diagnóstico
                      </h4>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="paciente-periferico-diag"
                          checked={isPacientePeriferico}
                          onCheckedChange={(v) => {
                            const checked = !!v
                            setIsPacientePeriferico(checked)
                            if (checked) {
                              buscarReferenciaDetalle()
                            } else {
                              setReferenciaItems([])
                              setSelectedRefItem(null)
                              setOrdenCreadaId(null)
                              setShowCrearOrdenModal(false)
                            }
                          }}
                        />
                        <Label htmlFor="paciente-periferico-diag" className="text-sm font-medium cursor-pointer">
                          Paciente Periférico (referencia externa)
                        </Label>
                      </div>

                      {isPacientePeriferico && (
                        <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-800 flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Orden de referencia externa
                            </span>
                            {(() => {
                              let btnLabel: React.ReactNode
                              if (loadingReferencia) btnLabel = <><span className="animate-spin mr-1">⏳</span>Buscando...</>
                              else if (ordenCreadaId) btnLabel = <><CheckCircle className="h-3 w-3 mr-1.5" />Orden Creada</>
                              else btnLabel = <><ClipboardList className="h-3 w-3 mr-1.5" />Completar y Crear Orden</>
                              return (
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    if (loadingReferencia || ordenCreadaId) return
                                    const allowedRefs = referenciaItems.filter(isReferenciaValida)
                                    if (allowedRefs.length === 0) { await buscarReferenciaDetalle(); return }
                                    const targetRef = selectedRefItem && isReferenciaValida(selectedRefItem)
                                      ? selectedRefItem
                                      : (allowedRefs.find(r => r.datos_referencia?.servicio_destino === '080900') ?? allowedRefs[0])
                                    if (targetRef) { setSelectedRefItem(targetRef); setShowCrearOrdenModal(true) }
                                  }}
                                  disabled={loadingReferencia || !!ordenCreadaId}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {btnLabel}
                                </Button>
                              )
                            })()}
                          </div>

                          {!loadingReferencia && referenciaItems.length === 0 && (
                            <p className="text-xs text-gray-500 text-center py-2">
                              Haga clic en <strong>Completar y Crear Orden</strong> para consultar la referencia.
                            </p>
                          )}

                          {referenciaItems.length > 0 && (
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {referenciaItems.map((ref) => {
                                const isSel = selectedRefItem?.datos_referencia?.id_referencia === ref.datos_referencia?.id_referencia
                                const cpms = getCpmsFromRef(ref)
                                const diag = ref.diagnosticos?.[0]
                                return (
                                  <div key={ref.datos_referencia?.id_referencia}
                                    onClick={() => { setSelectedRefItem(ref); setOrdenCreadaId(null); setShowCrearOrdenModal(false) }}
                                    className={`p-2 rounded border cursor-pointer text-xs space-y-0.5 transition-colors ${isSel ? 'border-blue-500 bg-blue-100 ring-1 ring-blue-400' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-semibold text-gray-800">{ref.datos_referencia?.numero_referencia}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${ref.datos_referencia?.codigoEstado === '3' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                        {ref.datos_referencia?.estado}
                                      </span>
                                    </div>
                                    <div className="text-gray-500 flex items-center gap-2 flex-wrap">
                                      <span>{ref.datos_referencia?.fecha_referencia}</span>
                                      {diag && <span className="font-mono bg-yellow-50 text-yellow-800 px-1 rounded">{diag.codigo_ciex}</span>}
                                      {cpms ? <span className="text-green-700">✅ CPMS: {cpms}</span> : <span className="text-amber-600">⚠️ Sin CPMS</span>}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {ordenCreadaId && (
                            <Alert className="bg-green-50 border-green-300 py-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <AlertDescription className="text-green-800 text-xs">
                                ✅ Orden <strong>#{ordenCreadaId}</strong> creada. Ya puede aprobar la solicitud.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}

                      {!isPacientePeriferico && (
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-gray-700">Orden de Apoyo al Diagnóstico</Label>
                          {loadingOrdenes ? (
                            <div className="flex items-center gap-2 h-10 border rounded-md px-3 bg-gray-50">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                              <span className="text-sm text-gray-500">Cargando órdenes...</span>
                            </div>
                          ) : ordenes.length === 0 ? (
                            <div className="text-sm text-gray-500 px-1">No hay órdenes disponibles para este paciente</div>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {ordenes.map((ord) => {
                                const isSel = String(ord.idOrden) === selectedOrdenEcografia
                                const servicioMeta: Record<string, string> = { ECO: 'Ecografía', RX: 'Rayos X', LAB: 'Laboratorio', TAC: 'Tomografía', RM: 'Resonancia' }
                                const servicioLabel = servicioMeta[ord.tipoServicio?.trim().toUpperCase() || ''] || ord.tipoServicio
                                const fechaCreacion = ord.regFechaCreacion
                                  ? new Date(ord.regFechaCreacion).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                  : null
                                const detallesVisibles = (ord.detalles || []).filter((d) => d.estadoDetalle !== '0')
                                const ordenEstadoMeta: Record<string, { label: string; color: string }> = {
                                  '1': { label: 'CREADA', color: 'bg-sky-100 text-sky-800 border-sky-200' },
                                  '2': { label: 'FIRMADA', color: 'bg-amber-100 text-amber-800 border-amber-200' },
                                  '3': { label: 'PENDIENTE', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                                }
                                const seleccionable = String(ord.estadoOrden) === '3'
                                const estadoOrdenBadge = ordenEstadoMeta[String(ord.estadoOrden || '')]
                                return (
                                  <div key={ord.idOrden}
                                    className={`border rounded-lg p-2.5 transition-colors ${isSel ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400' : seleccionable ? 'border-gray-200 bg-white hover:bg-gray-50' : 'border-gray-200 bg-gray-50 opacity-70'}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className={`flex-1 min-w-0 ${seleccionable ? 'cursor-pointer' : 'cursor-not-allowed'}`} onClick={() => seleccionable && setSelectedOrdenEcografia(isSel ? '' : String(ord.idOrden))} title={seleccionable ? 'Haga clic para seleccionar' : 'La orden requiere aprobación médica para poder ser seleccionada'}>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">{servicioLabel}</span>
                                          {estadoOrdenBadge && (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${estadoOrdenBadge.color}`}>
                                              {estadoOrdenBadge.label}
                                            </span>
                                          )}
                                          {!seleccionable && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200" title="Esta orden aún no puede seleccionarse para una cita">
                                              Requiere aprobación
                                            </span>
                                          )}
                                          {fechaCreacion && (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                              <CalendarIcon className="h-3 w-3" />{fechaCreacion}
                                            </span>
                                          )}
                                        </div>
                                        {detallesVisibles.length > 0 && (
                                          <ul className="flex flex-col gap-1 pl-1 mt-1.5">
                                            {detallesVisibles.map((d, idx) => {
                                              const completado = d.estadoDetalle === '2'
                                              return (
                                                <li key={idx} className="flex items-center gap-1.5 text-xs">
                                                  <span className={`shrink-0 w-1 h-1 rounded-full ${completado ? 'bg-gray-300' : 'bg-blue-500'}`} />
                                                  <span className={`truncate ${completado ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                    {d.cpmsDescripcion?.trim() || `CPMS ${d.cpms || d.idProcedimiento}`}
                                                  </span>
                                                  {completado && <span className="shrink-0 text-[10px] font-semibold bg-green-100 text-green-800 border border-green-300 px-1.5 py-0 rounded">✓ Completado</span>}
                                                </li>
                                              )
                                            })}
                                          </ul>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => handleEditarOrden(ord)} className="p-1.5 rounded text-blue-600 hover:bg-blue-100 transition-colors shrink-0" title="Editar orden">
                                          <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button type="button" onClick={() => setConfirmDialogOrden({ type: 'delete', orden: ord })} className="p-1.5 rounded text-red-600 hover:bg-red-100 transition-colors shrink-0" title="Eliminar orden">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {loadingPedido && (
                            <div className="flex items-center gap-2 text-xs text-amber-600 mt-3">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600" />
                              Verificando requisitos del examen...
                            </div>
                          )}

                          {pedidoAlert.show && !loadingPedido && (
                            <Alert className="bg-red-50 border-red-300 mt-3">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-800 text-xs">
                                <p className="font-semibold mb-1">⛔ Examen requiere pedido previo</p>
                                <p className="mb-1">No se puede crear una atención con los siguientes exámenes porque requieren pedido previo:</p>
                                <ul className="list-disc pl-4 space-y-0.5">
                                  {pedidoAlert.examenes.map((ex, i) => (
                                    <li key={i}>{ex.descripcion} (CPMS: {ex.cpms})</li>
                                  ))}
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4 border-t mt-4 flex-shrink-0">
            <Button
              onClick={() => {
                if (hasEspecialidadMatch && !hasConsultorioMatch) { setShowEspecialidadConflictDialog(true); return }
                if (!timeValidation.isValid) { setShowTimeConflictDialog(true); return }
                handleApprove()
              }}
              disabled={!selectedTipoCita || !selectedSeguro || (isSisSeguro() && (!selectedEntidadSis || !referencia.trim())) || hasConsultorioMatch || isLoading || loadingPedido || pedidoAlert.show}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-6 text-base min-w-[160px] shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              {isLoading ? "Aprobando..." : "Aprobar Solicitud"}
            </Button>
            <Button onClick={handleDenyClick} disabled={isLoading} variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-6 text-base min-w-[160px] shadow-lg hover:shadow-xl transition-all" size="lg">
              <XCircle className="h-5 w-5 mr-2" />
              {isLoading ? "Procesando..." : "Denegar Solicitud"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MotivoModal isOpen={showMotivoModal} onClose={() => setShowMotivoModal(false)} onConfirm={handleMotivoConfirm} title={motivoAction === "DENEGAR" ? "Denegar Solicitud" : "Observar Solicitud"} action={motivoAction} isLoading={motivoLoading} />

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-xl ${errorDialogData.type === 'warning' ? 'text-orange-600' : 'text-red-600'}`}>
              {errorDialogData.type === 'warning' ? <AlertTriangle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              {errorDialogData.title}
            </DialogTitle>
          </DialogHeader>
          <div className={`p-6 rounded-lg ${errorDialogData.type === 'warning' ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-base ${errorDialogData.type === 'warning' ? 'text-orange-800' : 'text-red-800'}`}>{errorDialogData.message}</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => setShowErrorDialog(false)} className={errorDialogData.type === 'warning' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}>Entendido</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTimeConflictDialog} onOpenChange={setShowTimeConflictDialog}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600"><AlertTriangle className="h-6 w-6" />⚠️ Advertencia: Posible Conflicto de Horario</DialogTitle>
            <DialogDescription className="text-gray-600">Se ha detectado un posible conflicto de horario con otra cita del paciente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800"><p className="font-semibold mb-2">Detalles del conflicto:</p><p>{timeValidation.message}</p></div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-semibold mb-2">⚠️ IMPORTANTE - Responsabilidad del Admisionista</p>
              <p className="text-sm text-red-800">Si decide continuar, <span className="font-bold">usted será responsable</span> de cualquier problema que surja por la superposición de horarios.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTimeConflictDialog(false)} className="flex-1">Cancelar</Button>
            <Button onClick={() => { setShowTimeConflictDialog(false); handleApprove() }} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">Sí, Continuar Bajo Mi Responsabilidad</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEspecialidadConflictDialog} onOpenChange={setShowEspecialidadConflictDialog}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600"><AlertTriangle className="h-6 w-6" />⚠️ Advertencia: Cita en Misma Especialidad</DialogTitle>
            <DialogDescription className="text-gray-600">Se ha detectado que el paciente ya tiene una cita pendiente en la misma especialidad.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-2">Detalles:</p>
                  <p>El paciente <strong>{patient?.NOMBRES}</strong> ya tiene una cita pendiente en la especialidad <strong>{appointment?.especialidadNombre || 'la misma especialidad'}</strong>.</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-semibold mb-2">⚠️ IMPORTANTE - Responsabilidad del Admisionista</p>
              <p className="text-sm text-red-800">Si decide continuar, <span className="font-bold">usted será responsable</span> de cualquier problema por la duplicidad de citas.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEspecialidadConflictDialog(false)} className="flex-1">Cancelar</Button>
            <Button onClick={() => { setShowEspecialidadConflictDialog(false); if (!timeValidation.isValid) setShowTimeConflictDialog(true); else handleApprove() }} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">Sí, Continuar Bajo Mi Responsabilidad</Button>
          </div>
        </DialogContent>
      </Dialog>

      {showCrearOrdenModal && selectedRefItem && (
        <CrearOrdenApoyoDiagnosticoModal
          isOpen={showCrearOrdenModal}
          onClose={() => { setOrdenToEdit(null); setShowCrearOrdenModal(false) }}
          referencia={selectedRefItem as any}
          pacienteId={(patient?.PACIENTE || patient?.HISTORIA || '').toString().trim()}
          selectedSeguro={selectedSeguro}
          seguroPaciente={selectedSeguro}
          isPacientePeriferico={isPacientePeriferico}
          onOrdenCreada={(idOrden) => {
            setOrdenCreadaId(idOrden)
            setOrdenToEdit(null)
            setShowCrearOrdenModal(false)
            const pacId = patient?.PACIENTE || patient?.HISTORIA
            if (pacId) loadOrdenes(pacId)
          }}
          ordenToEdit={ordenToEdit ?? undefined}
        />
      )}

      <AlertDialog open={!!confirmDialogOrden} onOpenChange={(open) => { if (!open) setConfirmDialogOrden(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Orden</AlertDialogTitle>
            <AlertDialogDescription>¿Está seguro de eliminar la orden #{confirmDialogOrden?.orden?.idOrden}? Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setConfirmDialogOrden(null)} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancelar</AlertDialogAction>
            <AlertDialogAction onClick={handleDeleteOrden} className="bg-red-600 text-white hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function PatientAssignmentReservedDiagnosticSupportModal(props: PatientAssignmentReservedDiagnosticSupportModalProps) {
  return (
    <ReferenciaProvider>
      <PatientAssignmentReservedDiagnosticSupportModalContent {...props} />
    </ReferenciaProvider>
  )
}
