"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { PatientInfoCardAppointment } from "../patient/PatientInfoCardAppointment"
import { PatientPendingAppointmentsModal, type PendingAppointment } from "../patient/PatientPendingAppointmentsModal"
import { ConsultorioCitasSelector } from "../selectors/ConsultorioCitasSelector"
import { MedicoSelector } from "../selectors/MedicoSelector"
import { TipoSeguroSelector } from "../selectors/TipoSeguroSelector"
import { TurnoSelector } from "../selectors/TurnoSelector"
import { TipoCitaSelector } from "../selectors/TipoCitaSelector"
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, MapPin, ClipboardList, Trash2, Pencil, Calendar as CalendarIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { UpdateClinicalHistoryButton } from "../patient/UpdateClinicalHistoryButton"
import { SimpleSISVerification } from "../patient/SimpleSISVerification"
import { EntidadSisSelector } from "../selectors/EntidadSisSelector"
import { ReferenciaSelector } from "../selectors/ReferenciaSelector"
import { ReferenciaProvider, useReferencia } from "@/contexts/ReferenciaContext"
import { extractDocumentFromToken, extractNombreCompletoFromToken, extractPuestoFromToken } from "@/utils/jwtUtils"
import { sincronizarCitaConRefcon, obtenerDatosCitaRefcon, esSeguroSIS, actualizarEstadoRefcon } from "@/services/appointments/refconSyncService"
import { obtenerEntidadSISPorCodigo } from "@/services/appointments/sisEntitiesService"
import { imprimirCita, CitaDto, formatDateToDDMMYYYY, formatDateTimeToDDMMYYYY } from "@/services/appointments/printService"
import { AppointmentCalendar } from "../utils/AppointmentCalendar"
import { Checkbox } from "@/components/ui/checkbox"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { availableDatesService } from "@/services/appointments/availableDatesService"
import { datetimeService } from '@/services/datetimeService'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog"
import { CrearOrdenApoyoDiagnosticoModal, type OrdenToEdit } from "./CrearOrdenApoyoDiagnosticoModal"

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
  regUsuarioCreacion?: string
  detalles: OrdenDetalle[]
}

interface ReferenciaItemEco {
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

const APOYO_DIAGNOSTICO_BASE_URL = process.env.NEXT_PUBLIC_API_APOYO_DIAGNOSTICO_URL || 'http://192.168.5.239:9020'
const REFERENCIA_BASE_URL = process.env.NEXT_PUBLIC_API_REFERENCIA_URL || 'http://192.168.0.31:9012'
const EESS_DESTINO = process.env.NEXT_PUBLIC_EESS_CODIGO || '5947'
const ESTADOS_REF_PERMITIDOS = ['ACEPTADO', 'PACIENTE RECIBIDO', 'PACIENTE CITADO']

const extractCptEco = (value: Array<{ cpt1: string }> | string | null): string | null => {
  if (Array.isArray(value) && value.length > 0) return value[0]?.cpt1 || null
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

interface AdditionalAppointmentDiagnosticSupportModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  patient: any
  initialConsultorio?: string
  onAppointmentCreated?: (appointment: any) => void
}

function AdditionalAppointmentDiagnosticSupportModalContent({
  isOpen,
  onClose,
  onBack,
  patient,
  initialConsultorio,
  onAppointmentCreated
}: AdditionalAppointmentDiagnosticSupportModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdAppointment, setCreatedAppointment] = useState<any>(null)
  const [refreshedPatient, setRefreshedPatient] = useState<any>(null)
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([])
  const [consultorioNombreSel, setConsultorioNombreSel] = useState<string>("")

  const [fecha, setFecha] = useState<string>("")
  const [consultorio, setConsultorio] = useState<string>(initialConsultorio || "")
  const [medico, setMedico] = useState<string>("")
  const [turno, setTurno] = useState<string>("")
  const [tipoCita, setTipoCita] = useState<string>("A")
  const [tipoSeguro, setTipoSeguro] = useState<string>("")
  const [observacion, setObservacion] = useState<string>("")
  const [referencia, setReferencia] = useState<string>("")
  const [referenciaIdSeleccionada, setReferenciaIdSeleccionada] = useState<string>("")
  const [eessOrigenReferencia, setEessOrigenReferencia] = useState<string>("")
  const [eessNombreOrigen, setEessNombreOrigen] = useState<string>("")
  const [skipRefconSync, setSkipRefconSync] = useState(false)
  const [selectedEntidadSis, setSelectedEntidadSis] = useState<string>("")
  const [sisVerificationResult, setSisVerificationResult] = useState<any>(null)

  const [refconSyncSuccess, setRefconSyncSuccess] = useState(false)
  const [refconSyncError, setRefconSyncError] = useState<string | null>(null)
  const [especialidadConsultorio, setEspecialidadConsultorio] = useState<string | null>(null)

  const [datesWithAppointments, setDatesWithAppointments] = useState<Date[]>([])
  const [datesWithoutAppointments, setDatesWithoutAppointments] = useState<Date[]>([])
  const [showPastDates, setShowPastDates] = useState(false)
  const [loadingDates, setLoadingDates] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date())

  const [showTimeConflictDialog, setShowTimeConflictDialog] = useState(false)

  const [availableMedicos, setAvailableMedicos] = useState<Array<{codigo: string, nombre: string}>>([])
  const [loadingMedicos, setLoadingMedicos] = useState(false)

  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false)
  const [existingAppointmentsWarning, setExistingAppointmentsWarning] = useState<string | null>(null)
  const [loadingExistingAppointments, setLoadingExistingAppointments] = useState(false)
  const [isFechaConfirmed, setIsFechaConfirmed] = useState(false)

  // Apoyo al Diagnóstico — siempre habilitado en este modal
  const [ordenes, setOrdenes] = useState<OrdenApoyoDiagnostico[]>([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(false)
  const [selectedOrdenEcografia, setSelectedOrdenEcografia] = useState("")
  const [isPacientePeriferico, setIsPacientePeriferico] = useState(false)
  const [referenciaItemsEco, setReferenciaItemsEco] = useState<ReferenciaItemEco[]>([])
  const [loadingReferenciaEco, setLoadingReferenciaEco] = useState(false)
  const [selectedRefItemEco, setSelectedRefItemEco] = useState<ReferenciaItemEco | null>(null)
  const [showCrearOrdenModal, setShowCrearOrdenModal] = useState(false)
  const [ordenCreadaId, setOrdenCreadaId] = useState<number | null>(null)
  const [ordenToEditEco, setOrdenToEditEco] = useState<OrdenToEdit | null>(null)
  const [confirmDialogOrden, setConfirmDialogOrden] = useState<{ type: 'delete'; orden: OrdenApoyoDiagnostico } | null>(null)

  const { selectedReferencia: selectedSisReferenciaEco } = useReferencia()

  const userPuesto = extractPuestoFromToken()
  const isDevOps = userPuesto?.toUpperCase() === 'DEVOPS'

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://localhost:8080/api'

  useEffect(() => {
    if (isOpen && patient) {
      const today = new Date()
      setSelectedCalendarDate(today)
      setIsFechaConfirmed(true)
      setFecha(today.toISOString().split('T')[0])

      if (patient.SEGURO) setTipoSeguro(patient.SEGURO)
      else setTipoSeguro("")

      const pacienteId = patient.PACIENTE || patient.HISTORIA
      if (pacienteId) loadOrdenesApoyoDiagnostico(pacienteId)

      setConsultorio(initialConsultorio || "")
      setMedico("")
      setTurno("")
      setObservacion("")
      setReferencia("")
      setReferenciaIdSeleccionada("")
      setEessOrigenReferencia("")
      setEessNombreOrigen("")
      setSelectedEntidadSis("")
      setSisVerificationResult(null)
      setShowSuccess(false)
      setCreatedAppointment(null)
      setDatesWithAppointments([])
      setDatesWithoutAppointments([])
      setShowPastDates(false)
      setRefreshedPatient(null)
      setPendingAppointments([])
      setConsultorioNombreSel("")
      setEspecialidadConsultorio(null)
      setAvailableMedicos([])
      setExistingAppointmentsWarning(null)
      setRefconSyncSuccess(false)
      setRefconSyncError(null)
      setSkipRefconSync(false)
      setIsCalendarExpanded(false)
      setSelectedOrdenEcografia("")
      setIsPacientePeriferico(false)
      setReferenciaItemsEco([])
      setSelectedRefItemEco(null)
      setShowCrearOrdenModal(false)
      setOrdenCreadaId(null)
      setOrdenToEditEco(null)
      setConfirmDialogOrden(null)
    }
  }, [isOpen, patient])

  useEffect(() => {
    if (refreshedPatient && refreshedPatient.SEGURO) setTipoSeguro(refreshedPatient.SEGURO)
  }, [refreshedPatient])

  useEffect(() => {
    if (!isSisSeguro()) { setSelectedEntidadSis(""); setReferencia(""); setSisVerificationResult(null) }
  }, [tipoSeguro])

  useEffect(() => {
    const validateExistingAppointments = async () => {
      if (!consultorio || !patient?.PACIENTE) { setExistingAppointmentsWarning(null); return }
      setLoadingExistingAppointments(true)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011'
        const response = await fetch(`${apiUrl}/cita/cita-valida-paciente?paciente=${patient.PACIENTE}&limite=25`)
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            const citasEnConsultorio = data.filter((cita: any) => cita.consultorio?.trim() === consultorio?.trim() || cita.CONSULTORIO?.trim() === consultorio?.trim())
            if (citasEnConsultorio.length > 0) {
              const citaInfo = citasEnConsultorio[0]
              setExistingAppointmentsWarning(`⚠️ El paciente ya tiene una cita en este consultorio para el ${citaInfo.fecha || citaInfo.FECHA || 'fecha desconocida'}. Verifique antes de continuar.`)
            } else { setExistingAppointmentsWarning(null) }
          } else { setExistingAppointmentsWarning(null) }
        }
      } catch (error) { console.error('Error validando citas existentes:', error) }
      finally { setLoadingExistingAppointments(false) }
    }
    validateExistingAppointments()
  }, [consultorio, patient?.PACIENTE])

  // Cargar órdenes — siempre habilitado (no condicional en consultorio de eco)
  const loadOrdenesApoyoDiagnostico = async (pacienteId: string) => {
    setLoadingOrdenes(true)
    try {
      const res = await fetch(`${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes/paciente/${pacienteId}?estado=1&origen=CE`)
      if (res.ok) {
        const json = await res.json()
        setOrdenes(Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [])
      } else { setOrdenes([]) }
    } catch { setOrdenes([]) }
    finally { setLoadingOrdenes(false) }
  }

  const getCpmsFromRefEco = (ref: ReferenciaItemEco): string | null => {
    const ups = ref.datos_referencia?.servicio_destino || ''
    if (ups === '150000') return extractCptEco(ref.cpt_laboratorio)
    if (ups === '080400') return extractCptEco(ref.cpt_imagenes)
    if (ups === '080900') return extractCptEco(ref.cpt_imagenes) || extractCptEco(ref.cpt_procedimiento)
    return extractCptEco(ref.cpt_procedimiento) || extractCptEco(ref.cpt_imagenes) || extractCptEco(ref.cpt_laboratorio)
  }

  const isReferenciaValidaEco = (ref: ReferenciaItemEco): boolean => {
    const estado = (ref.datos_referencia?.estado || '').trim().toUpperCase()
    return ESTADOS_REF_PERMITIDOS.includes(estado)
  }

  const buscarReferenciaDetalleEco = async () => {
    const doc = patient?.DOCUMENTO
    if (!doc) { toast({ title: 'Sin documento', description: 'El paciente no tiene número de documento registrado.', variant: 'destructive' }); return }
    setLoadingReferenciaEco(true)
    setReferenciaItemsEco([])
    setSelectedRefItemEco(null)
    setOrdenCreadaId(null)
    setShowCrearOrdenModal(false)
    try {
      const tipoDoc = (patient.TIPO_DOCUMENTO === 'CE' || patient.TIPO_DOCUMENTO === 'C') ? '2' : '1'
      const body = { establecimientoDestino: EESS_DESTINO, limite: '25', numerodocumento: doc, pagina: '1', tipodocumento: tipoDoc }
      const res = await fetch(`${REFERENCIA_BASE_URL}/api/referencia/detalle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { toast({ title: 'Error al buscar referencias', description: `Error ${res.status}: ${res.statusText}`, variant: 'destructive' }); return }
      const json = await res.json()
      if (json?.codigo && json.codigo !== '0000') { toast({ title: 'Error al buscar referencias', description: json?.mensaje || `Código ${json?.codigo}`, variant: 'destructive' }); return }
      const extractLista = (r: any): ReferenciaItemEco[] => {
        if (Array.isArray(r?.datos?.datos)) return r.datos.datos
        if (Array.isArray(r?.datos)) return r.datos
        if (Array.isArray(r?.data)) return r.data
        if (Array.isArray(r?.items)) return r.items
        if (Array.isArray(r)) return r
        return []
      }
      const rawLista = extractLista(json)

      if (rawLista.filter(isReferenciaValidaEco).length === 0 && selectedSisReferenciaEco) {
        const fullName = patient?.NOMBRES?.trim() || `${patient?.PATERNO || ''} ${patient?.MATERNO || ''} ${patient?.NOMBRE || ''}`.trim()
        const parts = fullName.split(/\s+/)
        const fallbackRef: ReferenciaItemEco = {
          rownum: '1',
          paciente: { tipo_documento: selectedSisReferenciaEco.tipoDocumento || '1', numero_documento: patient?.DOCUMENTO || '', nombres: parts.slice(2).join(' ') || '', primer_apellido: parts[0] || '', segundo_apellido: parts[1] || '' },
          datos_referencia: { codigo_especialidad: '', codigoEstado: '3', estado: 'ACEPTADO', fecha_referencia: '', servicio_origen: '', codigo_establecimiento_origen: selectedSisReferenciaEco.codigoestablecimientoOrigen || '', servicio_destino: '080900', numero_referencia: selectedSisReferenciaEco.numeroReferencia || '', id_referencia: selectedSisReferenciaEco.idReferencia || '', resume_exfisico: null, motivo_referencia: '' },
          diagnosticos: [], cpt_procedimiento: null, cpt_laboratorio: null, cpt_imagenes: null,
        }
        if (isReferenciaValidaEco(fallbackRef)) { setReferenciaItemsEco([fallbackRef]); setSelectedRefItemEco(fallbackRef); setShowCrearOrdenModal(true); return }
      }

      const filteredLista = rawLista.filter(isReferenciaValidaEco)
      if (filteredLista.length === 0) { toast({ title: 'Sin referencias', description: 'No se encontraron referencias activas de apoyo diagnóstico para este paciente.', variant: 'default' }); return }
      setReferenciaItemsEco(filteredLista)
      const autoSelected = filteredLista.find(r => ['080900'].includes(r.datos_referencia?.servicio_destino || '')) ?? filteredLista[0]
      setSelectedRefItemEco(autoSelected)
      setShowCrearOrdenModal(true)
    } catch (e: any) { toast({ title: 'Error de conexión', description: e?.message || 'No se pudo conectar al servicio de referencias.', variant: 'destructive' }) }
    finally { setLoadingReferenciaEco(false) }
  }

  const handleDeleteOrdenEcografia = async () => {
    const orden = confirmDialogOrden?.orden
    if (!orden) return
    try {
      const usuarioDni = extractDocumentFromToken() || 'SISTEMA'
      const res = await fetch(`${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes/${orden.idOrden}`, { method: 'DELETE', headers: { 'Usuario': usuarioDni } })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any)?.message || `Error ${res.status}`) }
      toast({ title: 'Orden eliminada', description: `Orden #${orden.idOrden} eliminada correctamente.` })
      const pacId = patient?.PACIENTE || patient?.HISTORIA
      if (pacId) loadOrdenesApoyoDiagnostico(pacId)
      if (selectedOrdenEcografia === String(orden.idOrden)) setSelectedOrdenEcografia('')
    } catch (e: any) { toast({ title: 'Error al eliminar orden', description: e.message || 'No se pudo eliminar la orden.', variant: 'destructive' }) }
    finally { setConfirmDialogOrden(null) }
  }

  const handleEditarOrdenEcografia = (ord: OrdenApoyoDiagnostico) => {
    const ordenToEdit: OrdenToEdit = {
      idOrden: ord.idOrden, idPaciente: ord.idPaciente, tipoServicio: ord.tipoServicio, idLugar: ord.idLugar,
      origen: ord.origen, origenId: ord.origenId, idTipoSeguro: ord.seguro, idMedico: ord.idMedicoSolicita, cama: ord.cama ?? null,
      detalles: ord.detalles.map((d) => ({ cpms: d.cpms ?? null, cpmsDescripcion: d.cpmsDescripcion ?? null, ciex: d.ciex ?? null, cantidad: d.cantidad ?? 1, observacion: d.observacion ?? d.observacionEspecifica ?? null, estadoDetalle: d.estadoDetalle })),
    }
    setOrdenToEditEco(ordenToEdit)
    if (!selectedRefItemEco) {
      const tipo = (ord.tipoServicio || 'ECO').toUpperCase()
      const servicioDestino = tipo === 'RX' ? '080400' : tipo === 'LAB' ? '150000' : '080900'
      const minimalRef: ReferenciaItemEco = {
        rownum: '', paciente: { tipo_documento: patient?.TIPO_DOCUMENTO || '1', numero_documento: patient?.DOCUMENTO || '', nombres: (patient?.NOMBRES || patient?.NOMBRE || '').trim(), primer_apellido: (patient?.PATERNO || '').trim(), segundo_apellido: (patient?.MATERNO || '').trim() },
        datos_referencia: { codigo_especialidad: '', codigoEstado: '3', estado: 'ACEPTADO', fecha_referencia: new Date().toISOString().split('T')[0], servicio_origen: '', codigo_establecimiento_origen: '', servicio_destino: servicioDestino, numero_referencia: '', id_referencia: '' },
        diagnosticos: [], cpt_procedimiento: null, cpt_laboratorio: null, cpt_imagenes: null,
      }
      setSelectedRefItemEco(minimalRef)
    }
    setShowCrearOrdenModal(true)
  }

  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!consultorio || !especialidadConsultorio || !turno || !selectedCalendarDate) { setDatesWithAppointments([]); setDatesWithoutAppointments([]); return }
      setLoadingDates(true)
      try {
        const monthStart = startOfMonth(selectedCalendarDate)
        const monthEnd = endOfMonth(selectedCalendarDate)
        const formatDateForAPI = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const fechaInicio = formatDateForAPI(monthStart)
        const fechaFin = formatDateForAPI(monthEnd)
        const turnoConsulta = turno === 'MAÑANA' ? 'M' : 'T'
        const availableDates = await availableDatesService.fetchAvailableDates({ fechaInicio, fechaFin, consultorioId: consultorio, turnoConsulta })
        const consultorioCode = consultorio.trim()
        const { available, unavailable } = availableDatesService.getDatesWithAvailability(availableDates, consultorioCode)
        setDatesWithAppointments(available)
        setDatesWithoutAppointments(unavailable)
      } catch { setDatesWithAppointments([]); setDatesWithoutAppointments([]) }
      finally { setLoadingDates(false) }
    }
    fetchAvailableDates()
  }, [consultorio, especialidadConsultorio, turno, selectedCalendarDate])

  const handleCalendarDateSelect = (date: Date | undefined) => {
    if (date) { setSelectedCalendarDate(date); setFecha(date.toISOString().split('T')[0]); setIsFechaConfirmed(true) }
  }

  useEffect(() => {
    const fetchAvailableMedicos = async () => {
      if (!consultorio || !selectedCalendarDate) { setAvailableMedicos([]); setMedico(""); return }
      setLoadingMedicos(true)
      setMedico("")
      try {
        const formatDateForAPI = (date: Date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
        const fechaConsulta = formatDateForAPI(selectedCalendarDate)
        const url = consultorio
          ? `/api/appointments/doctor-by-date?fecha=${encodeURIComponent(fechaConsulta)}&consultorio=${encodeURIComponent(consultorio)}`
          : `/api/appointments/doctor-by-date?fecha=${encodeURIComponent(fechaConsulta)}`
        const response = await fetch(url)
        if (!response.ok) throw new Error('Error al cargar médicos disponibles')
        const data = await response.json()
        setAvailableMedicos(Array.isArray(data) ? data.map((item: any) => ({ codigo: item.MEDICO, nombre: item.NOMBRE })) : [])
      } catch { setAvailableMedicos([]) }
      finally { setLoadingMedicos(false) }
    }
    fetchAvailableMedicos()
  }, [consultorio, selectedCalendarDate, apiBaseUrl])

  const isSisSeguro = () => {
    const sisSegurosCodes = ['20', '21', '22', '23', '24', '25']
    return sisSegurosCodes.includes(tipoSeguro?.trim())
  }

  const handleSave = async () => {
    if (!patient) return
    if (!consultorio || !medico || !turno || !tipoCita || !tipoSeguro || !fecha) {
      toast({ title: "Campos requeridos", description: "Por favor complete todos los campos requeridos.", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      const usuarioDocumento = extractDocumentFromToken()
      const serverDateTime = await datetimeService.getCurrentDateTime()
      const esReferenciaManual = referenciaIdSeleccionada?.startsWith('manual-')

      const requestBody: any = {
        fecha,
        consultorio,
        medico,
        turno,
        tipoCita,
        tipoSeguro,
        observacion,
        paciente: patient.PACIENTE || patient.HISTORIA,
        nombre: patient.NOMBRES || patient.NOMBRE || `${patient?.PATERNO || ''} ${patient?.MATERNO || ''}`.trim(),
        historia: patient.HISTORIA,
        seguro: tipoSeguro,
        usuario: usuarioDocumento,
        fechaOtorga: `${serverDateTime.date}T${serverDateTime.time}:00`,
        horaOtorga: serverDateTime.time,
        numRef: referencia || '',
        entidadSis: eessOrigenReferencia || selectedEntidadSis || '',
        idRefcon: esReferenciaManual ? 0 : (referenciaIdSeleccionada ? parseInt(referenciaIdSeleccionada) || 0 : 0),
        recibidoRefcon: esReferenciaManual ? 0 : (skipRefconSync ? 3 : 2),
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/cita/adicional`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()

      if (!response.ok) {
        toast({ title: "Error", description: responseData.message || `Error al crear la cita adicional: ${response.status}`, variant: "destructive" })
        return
      }

      setCreatedAppointment(responseData)
      setShowSuccess(true)

      const citaId = responseData.citaId || responseData.id

      const esReferenciaManualSync = referenciaIdSeleccionada?.startsWith('manual-')
      if (referenciaIdSeleccionada && citaId && esSeguroSIS(tipoSeguro) && !esReferenciaManualSync && !skipRefconSync) {
        try {
          const citaRefconResult = await obtenerDatosCitaRefcon(citaId, usuarioDocumento || 'SISTEMA')
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
            if (syncResult.success) { setRefconSyncSuccess(true); setRefconSyncError(null) }
            else {
              setRefconSyncSuccess(false)
              setRefconSyncError(syncResult.error || 'Error desconocido al sincronizar con REFCON')
              await actualizarEstadoRefcon(citaId, 1)
            }
          }
        } catch (refconError) {
          setRefconSyncSuccess(false)
          setRefconSyncError(refconError instanceof Error ? refconError.message : 'Error desconocido')
          if (citaId) { try { await actualizarEstadoRefcon(citaId, 1) } catch { /* silenciar */ } }
        }
      }

      if (citaId) {
        try { await imprimirCitaAsignada(citaId) } catch (printError) { console.error('Error al imprimir cita:', printError) }
      }

      // Apoyo al Diagnóstico: siempre vincular orden
      if (citaId) {
        try {
          const ordenIdRaw = selectedOrdenEcografia || (ordenCreadaId ? String(ordenCreadaId) : null)
          const serverDT = await datetimeService.getCurrentDateTime()
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
            fechaOtorga: `${serverDT.date}T${serverDT.time}:00`,
            tipoCita, tipoPaciente: 'C',
            idPaciente: (patient.PACIENTE || patient.HISTORIA || '').toString().trim(),
            nombre: (patient.NOMBRES || patient.NOMBRE || '').trim(),
            seguro: tipoSeguro.toString().trim(), estado: '1', horaOtorga: serverDT.time,
            numRef: referencia || '', entidadSis: eessOrigenReferencia || selectedEntidadSis || '',
            idOrden: ordenIdRaw ? Number(ordenIdRaw) : null, detalles,
          }
          const apoyoRes = await fetch(`${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/atenciones/${citaId}/asignar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Usuario': extractDocumentFromToken() || 'SISTEMA' },
            body: JSON.stringify(apoyoBody),
          })
          if (!apoyoRes.ok) { const apoyoErr = await apoyoRes.json().catch(() => ({})); console.warn('⚠️ Error al vincular orden de apoyo diagnóstico (no crítico):', apoyoErr) }
        } catch (apoyoError) { console.error('❌ Error en apoyo diagnóstico (no crítico):', apoyoError) }
      }

      if (onAppointmentCreated) onAppointmentCreated(responseData)

    } catch (error: any) {
      console.error('❌ Error creating additional appointment:', error)
      toast({ title: "Error", description: error.message || "Hubo un error al crear la cita adicional. Intente nuevamente.", variant: "destructive" })
    } finally { setIsLoading(false) }
  }

  const imprimirCitaAsignada = async (citaId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/cita/${citaId}`)
      if (!response.ok) throw new Error('No se pudo obtener los datos de la cita')
      const citaData = await response.json()
      const operador = extractNombreCompletoFromToken() || 'OPERADOR'
      const turnoConsulta = citaData.turnoConsulta || ''
      const turnoFormateado = turnoConsulta.trim().toUpperCase() === 'M' ? 'Mañana' : turnoConsulta.trim().toUpperCase() === 'T' ? 'Tarde' : turnoConsulta
      let eessFormatted = ''
      if (citaData.entidadSis) {
        try {
          const entidadResponse = await fetch(`/api/appointments/sis-entities/${citaData.entidadSis.trim()}`)
          if (entidadResponse.ok) {
            const entidadData = await entidadResponse.json()
            eessFormatted = entidadData.success && entidadData.data ? `(${citaData.entidadSis.trim()}) - ${entidadData.data.NOMBRE}` : citaData.entidadSis.trim()
          } else { eessFormatted = citaData.entidadSis.trim() }
        } catch { eessFormatted = citaData.entidadSis.trim() }
      }
      const citaDto: CitaDto = {
        numero: citaData.citaId || citaId, numeroAtencion: citaData.numero || '', paciente: citaData.nombre || '',
        consultorio: citaData.consultorioNombre || '', medico: citaData.medicoNombre || '',
        diaAtencion: formatDateToDDMMYYYY(citaData.fecha || new Date().toISOString()), turno: turnoFormateado, hora: citaData.hora || '',
        historiaClinica: patient?.HISTORIA ? String(patient.HISTORIA).trim() : (citaData.historia ? String(citaData.historia).trim() : null),
        emitidoEl: formatDateTimeToDDMMYYYY(new Date().toISOString()), operador, seguro: citaData.seguroNombre || 'PAGANTE',
        ...(citaData.numRef && { nroRef: citaData.numRef }), ...(eessFormatted && { eess: eessFormatted })
      }
      await imprimirCita(citaDto)
    } catch (error) { console.error('❌ Error al imprimir cita:', error) }
  }

  const handleClose = () => {
    setShowSuccess(false); setCreatedAppointment(null); setReferencia(''); setReferenciaIdSeleccionada(''); setSelectedEntidadSis(''); setEessOrigenReferencia(''); setEessNombreOrigen(''); setSkipRefconSync(false); setSisVerificationResult(null); setRefconSyncSuccess(false); setRefconSyncError(null)
    onClose()
  }

  if (!patient) return null

  const hasConsultorioMatch = pendingAppointments?.some((apt) => {
    const curr = consultorioNombreSel?.trim().toLowerCase()
    const other = apt.consultorioNombre?.trim().toLowerCase()
    return curr && other && curr === other
  })

  const hasEspecialidadMatch = pendingAppointments?.some((apt) => {
    const currEspecialidad = especialidadConsultorio?.trim().toLowerCase()
    if (!currEspecialidad) return false
    return apt.especialidad?.trim().toLowerCase() === currEspecialidad
  })

  const validateTimeWindow = (): { isValid: boolean; conflictingAppointment?: any; message?: string } => {
    if (!fecha || !turno || pendingAppointments.length === 0) return { isValid: true }
    let selectedHour = 0
    let selectedTurno = ''
    if (turno === 'M' || turno === 'MAÑANA') { selectedHour = 8; selectedTurno = 'MAÑANA' }
    else if (turno === 'T' || turno === 'TARDE') { selectedHour = 14; selectedTurno = 'TARDE' }
    else return { isValid: true }
    const selectedDate = new Date(fecha)
    const selectedDateTime = new Date(selectedDate)
    selectedDateTime.setHours(selectedHour, 0, 0, 0)
    for (const apt of pendingAppointments) {
      if (!apt.fecha || !apt.hora) continue
      let aptDate: Date
      if (apt.fecha.includes('/')) { const [day, month, year] = apt.fecha.split('/'); aptDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day)) }
      else if (apt.fecha.includes('-')) { const fechaClean = apt.fecha.split(' ')[0].split('T')[0]; aptDate = new Date(fechaClean + 'T00:00:00') }
      else continue
      const [hours, minutes] = apt.hora.split(':').map(Number)
      aptDate.setHours(hours, minutes || 0, 0, 0)
      const isSameDay = selectedDate.toDateString() === aptDate.toDateString()
      if (isSameDay) {
        const aptTurno = hours < 14 ? 'MAÑANA' : 'TARDE'
        if (aptTurno === selectedTurno) return { isValid: false, conflictingAppointment: apt, message: `⚠️ El paciente ya tiene una cita programada el ${apt.fecha} a las ${apt.hora} en el turno de ${aptTurno}.` }
        const diffMs = Math.abs(selectedDateTime.getTime() - aptDate.getTime())
        const diffHours = diffMs / (1000 * 60 * 60)
        if (diffHours < 3) return { isValid: false, conflictingAppointment: apt, message: `⚠️ El paciente tiene una cita programada el ${apt.fecha} a las ${apt.hora}. Los horarios se cruzarían.` }
      }
    }
    return { isValid: true }
  }

  const timeValidation = validateTimeWindow()

  if (showSuccess) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-green-700 flex items-center justify-center">
              <CheckCircle className="mr-2 h-6 w-6" />
              ¡Cita Creada Exitosamente!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-gray-700">La cita adicional de apoyo diagnóstico ha sido guardada correctamente.</p>
            {createdAppointment && (
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-green-800 text-lg mb-3">Información de la Cita Creada</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Número:</span> {createdAppointment.numero || 'N/A'}</div>
                  <div><span className="font-medium">Fecha:</span> {createdAppointment.fecha ? new Date(createdAppointment.fecha).toLocaleDateString('es-PE') : 'N/A'}</div>
                  <div><span className="font-medium">Hora:</span> {createdAppointment.hora || 'N/A'}</div>
                  <div><span className="font-medium">Turno:</span> {createdAppointment.turnoConsulta === 'M' ? 'MAÑANA' : 'TARDE'}</div>
                  <div><span className="font-medium">Consultorio:</span> {createdAppointment.consultorio || 'N/A'}</div>
                  <div><span className="font-medium">Médico:</span> {createdAppointment.medico || 'N/A'}</div>
                  <div className="col-span-2"><span className="font-medium">Paciente:</span> {createdAppointment.nombre || patient.NOMBRES}</div>
                </div>
              </div>
            )}
            {refconSyncSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm text-left">
                <p className="font-semibold mb-1">Sincronización con REFCON</p>
                <p>✅ La cita fue registrada exitosamente en el sistema de referencias (REFCON).</p>
              </div>
            )}
            {!refconSyncSuccess && refconSyncError && (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-3 text-sm text-left space-y-1">
                <p className="font-semibold flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Sincronización con REFCON incompleta</p>
                <p>✅ La cita fue creada correctamente, pero REFCON devolvió un error.</p>
              </div>
            )}
            <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700">Aceptar</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2 p-1"><ArrowLeft className="h-4 w-4" /></Button>
            Confirmar Asignación — Apoyo al Diagnóstico
          </DialogTitle>
          <DialogDescription>Complete los datos para crear una cita adicional de apoyo diagnóstico</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-3 mb-4">
            {(hasConsultorioMatch || hasEspecialidadMatch) && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-orange-800">
                {hasConsultorioMatch && hasEspecialidadMatch && <>⚠️ Este paciente tiene una cita pendiente en el mismo consultorio y especialidad.</>}
                {!hasEspecialidadMatch && hasConsultorioMatch && <>⚠️ Este paciente tiene una cita pendiente en el mismo consultorio.</>}
                {!hasConsultorioMatch && hasEspecialidadMatch && <>⚠️ Este paciente tiene una cita pendiente en la misma especialidad.</>}
              </div>
            )}
            {!timeValidation.isValid && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div><p className="font-semibold">⛔ Conflicto de horario</p><p className="text-sm mt-1">{timeValidation.message}</p></div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1 flex flex-col space-y-3">
              <PatientInfoCardAppointment patient={refreshedPatient || patient} className="flex-1" />
              <UpdateClinicalHistoryButton patient={patient} onPatientUpdated={(updated) => setRefreshedPatient(updated)} className="w-full justify-center px-6 py-2.5 h-11 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 relative z-10 mt-4" />
            </div>

            <div className="lg:col-span-1 flex flex-col">
              <Card className="flex-1">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      Información de la Cita
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Siga el orden: Consultorio → Turno → Fecha → Médico)</span>
                    </h3>

                    {/* PASO 1: Consultorio */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                        <Label className="text-sm font-medium text-gray-700">Consultorio <span className="text-red-500">*</span></Label>
                      </div>
                      <ConsultorioCitasSelector
                        label=""
                        value={consultorio}
                        onChange={(value) => { setConsultorio(value); setTurno(""); setMedico(""); setDatesWithAppointments([]); setDatesWithoutAppointments([]); setExistingAppointmentsWarning(null) }}
                        onConsultorioDataChange={(data) => {
                          if (data && data.ESPECIALIDAD) { setEspecialidadConsultorio(data.ESPECIALIDAD); if (data.NOMBRE) setConsultorioNombreSel(data.NOMBRE) }
                          else { setEspecialidadConsultorio(null); setConsultorioNombreSel("") }
                        }}
                        className="w-full"
                      />
                      {loadingExistingAppointments && <div className="mt-2 text-xs text-gray-500 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" />Verificando citas existentes...</div>}
                      {existingAppointmentsWarning && <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-md p-2 text-yellow-800 text-sm">{existingAppointmentsWarning}</div>}
                    </div>

                    {/* PASO 2: Turno */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${consultorio ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>2</div>
                        <Label className="text-sm font-medium text-gray-700">Turno <span className="text-red-500">*</span></Label>
                      </div>
                      {!consultorio ? (
                        <div className="border rounded-lg p-3 bg-gray-100"><p className="text-sm text-gray-500 text-center">Primero seleccione un consultorio</p></div>
                      ) : (
                        <TurnoSelector label="" value={turno} onChange={(value) => { setTurno(value); setMedico(""); setDatesWithAppointments([]); setDatesWithoutAppointments([]) }} />
                      )}
                    </div>

                    {/* PASO 3: Fecha */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${consultorio && turno ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>3</div>
                          <Label className="text-sm font-medium text-gray-700">Fecha de la Cita <span className="text-red-500">*</span></Label>
                        </div>
                        <div className="flex items-center gap-2">
                          {isDevOps && (
                            <div className="flex items-center space-x-2">
                              <Checkbox id="showPastDatesDiag" checked={showPastDates} onCheckedChange={(checked) => setShowPastDates(checked as boolean)} />
                              <label htmlFor="showPastDatesDiag" className="text-xs font-medium text-gray-600 cursor-pointer">Permitir fechas pasadas</label>
                            </div>
                          )}
                          <Button type="button" variant="ghost" size="sm" onClick={() => setIsCalendarExpanded(!isCalendarExpanded)} className="h-7 text-xs" disabled={!consultorio || !turno}>
                            {isCalendarExpanded ? 'Contraer' : 'Expandir'}
                          </Button>
                        </div>
                      </div>
                      {!consultorio || !turno ? (
                        <div className="border rounded-lg p-3 bg-gray-100"><p className="text-sm text-gray-500 text-center">Primero seleccione consultorio y turno</p></div>
                      ) : (
                        <>
                          {!isCalendarExpanded && (
                            <div className="border rounded-lg p-2.5 bg-gray-50">
                              <Input type="date" value={fecha} onChange={(e) => { const newDate = e.target.value; setFecha(newDate); if (newDate) { setSelectedCalendarDate(new Date(newDate + 'T00:00:00')); setIsFechaConfirmed(true) } else { setIsFechaConfirmed(false) } }} className="w-full" min={showPastDates ? undefined : new Date().toISOString().split('T')[0]} />
                            </div>
                          )}
                          {isCalendarExpanded && (
                            <>
                              <div className="border rounded-lg overflow-hidden">
                                <AppointmentCalendar selectedDate={selectedCalendarDate} onDateSelect={handleCalendarDateSelect} className="border-0 rounded-none" datesWithAppointments={datesWithAppointments} datesWithoutAvailability={datesWithoutAppointments} disablePastDates={!showPastDates} />
                              </div>
                              <div className="mt-3">
                                <Input type="date" value={fecha} onChange={(e) => { const newDate = e.target.value; setFecha(newDate); if (newDate) { setSelectedCalendarDate(new Date(newDate + 'T00:00:00')); setIsFechaConfirmed(true) } else { setIsFechaConfirmed(false) } }} className="w-full" min={showPastDates ? undefined : new Date().toISOString().split('T')[0]} />
                              </div>
                            </>
                          )}
                        </>
                      )}
                      {loadingDates && consultorio && turno && <div className="mt-2 text-xs text-gray-500 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" />Cargando fechas disponibles para turno {turno}...</div>}
                    </div>

                    {/* PASO 4: Médico */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${consultorio && turno && isFechaConfirmed ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>4</div>
                          <Label className="text-sm font-medium text-gray-700">Médico <span className="text-red-500">*</span></Label>
                        </div>
                        <div>
                          {loadingMedicos && <span className="text-xs text-gray-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Cargando...</span>}
                          {!loadingMedicos && availableMedicos.length > 0 && <span className="text-xs text-green-600">{availableMedicos.length} disponible{availableMedicos.length !== 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                      {(!consultorio || !turno || !isFechaConfirmed) ? (
                        <div className="border rounded-lg p-3 bg-gray-100"><p className="text-sm text-gray-500 text-center">Primero complete consultorio, turno y fecha</p></div>
                      ) : (
                        <MedicoSelector label="" value={medico} onChange={setMedico} especialidad={especialidadConsultorio} availableMedicos={availableMedicos.length > 0 ? availableMedicos : undefined} className="w-full" />
                      )}
                    </div>

                    {patient?.PACIENTE && (
                      <div className="mt-4">
                        <PatientPendingAppointmentsModal pacienteId={patient.PACIENTE} currentConsultorio={consultorioNombreSel} currentEspecialidad={especialidadConsultorio || undefined} limite={25} highlight={hasConsultorioMatch || hasEspecialidadMatch} onAppointmentsLoaded={setPendingAppointments} timeConflict={timeValidation} />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Datos de Asignación</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Tipo de Cita <span className="text-red-500">*</span></Label>
                        <TipoCitaSelector label="" value={tipoCita} onChange={setTipoCita} initialValue="A" placeholder="A - ADICIONAL" />
                        <p className="text-xs text-gray-500 mt-1">Por defecto: A - ADICIONAL (cita adicional fuera del cupo regular)</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Tipo de Seguro <span className="text-red-500">*</span></Label>
                        <TipoSeguroSelector label="" value={tipoSeguro} onChange={setTipoSeguro} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Observación</Label>
                        <Input value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Ingrese observaciones..." className="w-full" />
                      </div>
                    </div>

                    {isSisSeguro() && (
                      <div className="mt-4">
                        <SimpleSISVerification patientId={patient.HISTORIA} documento={patient.DOCUMENTO} autoVerify={true} showButton={true}
                          onVerificationComplete={(result) => {
                            setSisVerificationResult(result)
                            if (result.isSuccess && result.eess) { const trimmedEess = result.eess.replace(/^0+/, '') || result.eess; setSelectedEntidadSis(trimmedEess) }
                          }}
                        />
                      </div>
                    )}

                    {isSisSeguro() && (
                      <>
                        <ReferenciaSelector
                          numeroDocumento={patient?.DOCUMENTO || ''}
                          tipoDocumento={patient?.TIPO_DOCUMENTO === 'CE' || patient?.TIPO_DOCUMENTO === 'C' ? '2' : '1'}
                          especialidadCodigo={especialidadConsultorio || undefined}
                          value={referenciaIdSeleccionada}
                          onChange={async (refData) => {
                            setReferencia(refData.numeroReferencia); setReferenciaIdSeleccionada(refData.idReferencia); setSkipRefconSync(refData.skipRefconSync || false)
                            if (refData.codigoestablecimientoOrigen) {
                              setEessOrigenReferencia(refData.codigoestablecimientoOrigen); setSelectedEntidadSis(refData.codigoestablecimientoOrigen)
                              const result = await obtenerEntidadSISPorCodigo(refData.codigoestablecimientoOrigen)
                              setEessNombreOrigen(result.success && result.data ? result.data.NOMBRE : refData.establecimientoOrigen || 'Establecimiento de origen')
                            } else { setEessNombreOrigen(refData.establecimientoOrigen || ''); setEessOrigenReferencia(''); setSelectedEntidadSis('') }
                          }}
                          onEessChange={(eess) => setEessOrigenReferencia(eess)}
                        />
                        <EntidadSisSelector
                          value={selectedEntidadSis} onChange={setSelectedEntidadSis} required={true}
                          sisEstablecimiento={eessOrigenReferencia ? { codigo: eessOrigenReferencia, nombre: eessNombreOrigen } : sisVerificationResult?.isSuccess ? { codigo: sisVerificationResult.eess?.replace(/^0+/, '') || '', nombre: sisVerificationResult.descEESS || '' } : undefined}
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
                          id="paciente-periferico-diagsup"
                          checked={isPacientePeriferico}
                          onCheckedChange={(v) => {
                            const checked = !!v
                            setIsPacientePeriferico(checked)
                            if (checked) buscarReferenciaDetalleEco()
                            else { setReferenciaItemsEco([]); setSelectedRefItemEco(null); setOrdenCreadaId(null); setShowCrearOrdenModal(false) }
                          }}
                        />
                        <Label htmlFor="paciente-periferico-diagsup" className="text-sm font-medium cursor-pointer">Paciente Periférico (referencia externa)</Label>
                      </div>

                      {isPacientePeriferico && (
                        <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-800 flex items-center gap-1"><MapPin className="h-4 w-4" />Orden de referencia externa</span>
                            {(() => {
                              let btnLabel: React.ReactNode
                              if (loadingReferenciaEco) btnLabel = <><Loader2 className="h-3 w-3 animate-spin mr-1.5" />Buscando...</>
                              else if (ordenCreadaId) btnLabel = <><CheckCircle className="h-3 w-3 mr-1.5" />Orden Creada</>
                              else btnLabel = <><ClipboardList className="h-3 w-3 mr-1.5" />Completar y Crear Orden</>
                              return (
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    if (loadingReferenciaEco || ordenCreadaId) return
                                    const allowedRefs = referenciaItemsEco.filter(isReferenciaValidaEco)
                                    if (allowedRefs.length === 0) { await buscarReferenciaDetalleEco(); return }
                                    const targetRef = selectedRefItemEco && isReferenciaValidaEco(selectedRefItemEco) ? selectedRefItemEco : (allowedRefs.find(r => ['080900'].includes(r.datos_referencia?.servicio_destino || '')) ?? allowedRefs[0])
                                    if (targetRef) { setSelectedRefItemEco(targetRef); setShowCrearOrdenModal(true) }
                                  }}
                                  disabled={loadingReferenciaEco || !!ordenCreadaId}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {btnLabel}
                                </Button>
                              )
                            })()}
                          </div>
                          {loadingReferenciaEco && <div className="flex items-center gap-2 py-3 justify-center text-xs text-blue-600"><Loader2 className="h-4 w-4 animate-spin" />Consultando referencias en REFCON...</div>}
                          {!loadingReferenciaEco && referenciaItemsEco.length === 0 && <p className="text-xs text-gray-500 text-center py-2">Haga clic en <strong>Completar y Crear Orden</strong> para consultar la referencia.</p>}
                          {referenciaItemsEco.length > 0 && (
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {referenciaItemsEco.map((ref) => {
                                const isSelected = selectedRefItemEco?.datos_referencia?.id_referencia === ref.datos_referencia?.id_referencia
                                const cpms = getCpmsFromRefEco(ref)
                                const diag = ref.diagnosticos?.[0]
                                return (
                                  <div key={ref.datos_referencia?.id_referencia} onClick={() => { setSelectedRefItemEco(ref); setOrdenCreadaId(null); setShowCrearOrdenModal(false) }}
                                    className={`p-2 rounded border cursor-pointer text-xs space-y-0.5 transition-colors ${isSelected ? 'border-blue-500 bg-blue-100 ring-1 ring-blue-400' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-semibold text-gray-800">{ref.datos_referencia?.numero_referencia}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${ref.datos_referencia?.codigoEstado === '3' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{ref.datos_referencia?.estado}</span>
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
                              <AlertDescription className="text-green-800 text-xs">✅ Orden <strong>#{ordenCreadaId}</strong> creada. Ya puede confirmar la cita.</AlertDescription>
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
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                              {ordenes.map((ord) => {
                                const isSelected = String(ord.idOrden) === selectedOrdenEcografia
                                const servicioMeta: Record<string, string> = { ECO: 'Ecografía', RX: 'Rayos X', LAB: 'Laboratorio', TAC: 'Tomografía', RM: 'Resonancia' }
                                const servicioLabel = servicioMeta[ord.tipoServicio?.trim().toUpperCase() || ''] || ord.tipoServicio
                                const fechaCreacion = ord.regFechaCreacion ? new Date(ord.regFechaCreacion).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null
                                const detallesVisibles = (ord.detalles || []).filter((d) => d.estadoDetalle !== '0')
                                return (
                                  <div key={ord.idOrden} className={`border rounded-lg p-2.5 transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedOrdenEcografia(isSelected ? '' : String(ord.idOrden))}>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">{servicioLabel}</span>
                                          {fechaCreacion && <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded"><CalendarIcon className="h-3 w-3" />{fechaCreacion}</span>}
                                        </div>
                                        {detallesVisibles.length > 0 && (
                                          <ul className="flex flex-col gap-1 pl-1 mt-1.5">
                                            {detallesVisibles.map((d, idx) => (
                                              <li key={idx} className="flex items-center gap-1.5 text-xs">
                                                <span className="shrink-0 w-1 h-1 rounded-full bg-blue-500" />
                                                <span className="truncate text-gray-700">{d.cpmsDescripcion?.trim() || `CPMS ${d.cpms || d.idProcedimiento}`}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => handleEditarOrdenEcografia(ord)} className="p-1.5 rounded text-blue-600 hover:bg-blue-100 transition-colors shrink-0" title="Editar orden"><Pencil className="h-3.5 w-3.5" /></button>
                                        <button type="button" onClick={() => setConfirmDialogOrden({ type: 'delete', orden: ord })} className="p-1.5 rounded text-red-600 hover:bg-red-100 transition-colors shrink-0" title="Eliminar orden"><Trash2 className="h-3.5 w-3.5" /></button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button
            onClick={() => { if (!timeValidation.isValid) { setShowTimeConflictDialog(true) } else { handleSave() } }}
            disabled={isLoading || !consultorio || !medico || !turno || !tipoCita || !tipoSeguro || (isSisSeguro() && (!selectedEntidadSis || !referencia)) || hasConsultorioMatch}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>) : 'Confirmar Cita — Apoyo Diagnóstico'}
          </Button>
        </div>
      </DialogContent>

      <Dialog open={showTimeConflictDialog} onOpenChange={setShowTimeConflictDialog}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600"><AlertTriangle className="h-6 w-6" />⚠️ Advertencia: Posible Conflicto de Horario</DialogTitle>
            <DialogDescription className="text-gray-600">Se ha detectado un posible conflicto de horario con otra cita del paciente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3"><AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" /><div className="text-sm text-orange-800"><p className="font-semibold mb-2">Detalles del conflicto:</p><p>{timeValidation.message}</p></div></div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-semibold mb-2">⚠️ IMPORTANTE - Responsabilidad del Admisionista</p>
              <p className="text-sm text-red-800">Si decide continuar, <span className="font-bold">usted será responsable</span> de cualquier problema por la superposición de horarios.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTimeConflictDialog(false)} className="flex-1">Cancelar</Button>
            <Button onClick={() => { setShowTimeConflictDialog(false); handleSave() }} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">Sí, Continuar Bajo Mi Responsabilidad</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showCrearOrdenModal && selectedRefItemEco && (
        <CrearOrdenApoyoDiagnosticoModal
          isOpen={showCrearOrdenModal}
          onClose={() => { setOrdenToEditEco(null); setShowCrearOrdenModal(false) }}
          referencia={selectedRefItemEco as any}
          pacienteId={(patient?.PACIENTE || patient?.HISTORIA || '').toString().trim()}
          selectedSeguro={tipoSeguro}
          seguroPaciente={tipoSeguro}
          isPacientePeriferico={isPacientePeriferico}
          onOrdenCreada={(idOrden) => {
            setOrdenCreadaId(idOrden); setOrdenToEditEco(null); setShowCrearOrdenModal(false)
            const pacId = patient?.PACIENTE || patient?.HISTORIA
            if (pacId) loadOrdenesApoyoDiagnostico(pacId)
          }}
          ordenToEdit={ordenToEditEco ?? undefined}
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
            <AlertDialogAction onClick={handleDeleteOrdenEcografia} className="bg-red-600 text-white hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

export function AdditionalAppointmentDiagnosticSupportModal(props: AdditionalAppointmentDiagnosticSupportModalProps) {
  return (
    <ReferenciaProvider>
      <AdditionalAppointmentDiagnosticSupportModalContent {...props} />
    </ReferenciaProvider>
  )
}
