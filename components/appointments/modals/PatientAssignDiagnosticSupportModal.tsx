"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { PatientInfoCardAppointment } from "../patient/PatientInfoCardAppointment"
import { PatientPendingAppointmentsModal, type PendingAppointment } from "../patient/PatientPendingAppointmentsModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User, Stethoscope, CheckCircle, ArrowLeft, Printer, Loader2, MapPin, ClipboardList, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { TipoCitaSelector } from "../selectors/TipoCitaSelector"
import { TipoSeguroSelector } from "../selectors/TipoSeguroSelector"
import { EntidadSisSelector } from "../selectors/EntidadSisSelector"
import { ReferenciaSelector } from "../selectors/ReferenciaSelector"
import { useTipoCita } from "@/contexts/TipoCitaContext"
import { useSegurosCita } from "@/contexts/SegurosCitaContext"
import { ReferenciaProvider, useReferencia } from "@/contexts/ReferenciaContext"
import { usePatientData } from "@/contexts/PatientDataContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog"
import { SimpleSISVerification } from "../patient/SimpleSISVerification"
import { toast } from "@/components/ui/use-toast"
import { extractDocumentFromToken, extractNombreCompletoFromToken } from "@/utils/jwtUtils"
import { datetimeService } from '@/services/datetimeService'
import { obtenerEntidadSISPorCodigo } from "@/services/appointments/sisEntitiesService"
import { getCivilStatusDescription } from "@/utils/civilStatusUtils"
import { UpdateClinicalHistoryButton } from "../patient/UpdateClinicalHistoryButton"
import { CrearOrdenApoyoDiagnosticoModal, type OrdenToEdit } from "./CrearOrdenApoyoDiagnosticoModal"
import { verificarExamenesConPedido } from "@/services/apoyoDiagnostico/maestroService"
import { filiacionService } from "@/services/hospitalizacion/filiacionService"

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
  periferico?: boolean
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

const extractCptCode = (value: Array<{ cpt1: string }> | string | null): string | null => {
  if (Array.isArray(value) && value.length > 0) return value[0]?.cpt1 || null
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

interface ProcedimientoCPMS {
  codcpt: string
  nombre: string
  descripcion?: string
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
  turno?: string
  turnoConsulta?: string
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

const APOYO_DIAGNOSTICO_BASE_URL = import.meta.env.VITE_API_APOYO_DIAGNOSTICO_URL || 'http://192.168.5.239:9020'
const apiBaseUrl = import.meta.env.VITE_API_CITAS_MASTER_URL
// const FHIR_BASE_URL = import.meta.env.VITE_API_FHIR_URL || 'http://192.168.0.252:9015'
const REFERENCIA_BASE_URL = import.meta.env.VITE_API_REFERENCIA_URL || 'http://192.168.0.31:9012'
const EESS_DESTINO = import.meta.env.VITE_EESS_CODIGO || '5947'

const SIS_SEGUROS_CODES = ['20', '21', '22', '23', '24', '25']

/**
 * Construye el nombre completo del paciente limpiando espacios al unir las partes.
 * Si maxLength se indica, trunca respetando palabras completas.
 */
function buildPatientFullName(p: Patient | null | undefined, maxLength?: number): string {
  if (!p) return ''
  const paterno = (p.PATERNO || '').toString().trim()
  const materno = (p.MATERNO || '').toString().trim()
  const nombre = (p.NOMBRE || '').toString().trim()
  const nombres = (p.NOMBRES || '').toString().trim()

  const usarPartes = paterno || materno || nombre
  const raw = usarPartes ? `${paterno} ${materno} ${nombre}` : nombres

  const normalized = raw.split(/\s+/).filter(Boolean).join(' ')

  if (maxLength && normalized.length > maxLength) {
    const cut = normalized.slice(0, maxLength)
    const lastSpace = cut.lastIndexOf(' ')
    if (lastSpace > 20) {
      return cut.slice(0, lastSpace).trim()
    }
    return cut.trim()
  }

  return normalized
}

function getCodigoSeguroInicial(value: string | null | undefined): string {
  if (!value) return ''
  const str = String(value).trim()
  if (str.includes('-')) return str.split('-')[0].trim()
  const parts = str.split(/\s+/)
  if (parts[0] && /^\d+$/.test(parts[0])) return parts[0]
  return str
}

/**
 * Indica si el seguro seleccionado permite crear una orden manual
 * sin necesidad de una referencia REFCON (PAGANTE, SOAT, PROGRAMAS).
 */
function permiteOrdenSinReferencia(seguro: string | null | undefined): boolean {
  const code = (seguro ?? '').toString().trim()
  return ['0', '00', '02', '2', '13'].includes(code)
}

/**
 * Obtiene el código de turno (M/T) que espera la base de datos para la
 * clave foránea FK_ATENCION_CITA_TURNO -> TURNO_CONSULTA.TURNO_CONSULTA.
 */
function getTurnoConsulta(appointment: Appointment | null): string {
  if (!appointment) return 'M'

  // Si viene el turno normalizado (M/T), usarlo directamente
  if (appointment.turnoConsulta && typeof appointment.turnoConsulta === 'string') {
    const t = appointment.turnoConsulta.trim().toUpperCase()
    if (t === 'M' || t === 'T' || t === 'MAÑANA' || t === 'TARDE') {
      return t.startsWith('M') ? 'M' : 'T'
    }
  }

  // Si viene un texto como "MAÑANA" o "TARDE", convertirlo
  if (appointment.turno && typeof appointment.turno === 'string') {
    const t = appointment.turno.trim().toUpperCase()
    if (t.startsWith('M')) return 'M'
    if (t.startsWith('T')) return 'T'
  }

  // Fallback: derivar del horario (antes de las 12:00 es mañana)
  if (appointment.hora) {
    const [hours] = appointment.hora.split(':')
    const hour = parseInt(hours, 10)
    if (!isNaN(hour)) {
      return hour < 12 ? 'M' : 'T'
    }
  }

  return 'M'
}

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
  const { selectedReferencia: selectedSisReferencia } = useReferencia()
  const { getPatientData } = usePatientData()

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

  const [isPacientePeriferico, setIsPacientePeriferico] = useState(false)
  const [referenciaItems, setReferenciaItems] = useState<ReferenciaItem[]>([])
  const [loadingReferencia, setLoadingReferencia] = useState(false)
  const [selectedRefItem, setSelectedRefItem] = useState<ReferenciaItem | null>(null)
  const [showCrearOrdenModal, setShowCrearOrdenModal] = useState(false)
  const [ordenCreadaId, setOrdenCreadaId] = useState<number | null>(null)
  const [ordenToEdit, setOrdenToEdit] = useState<OrdenToEdit | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [assignedCitaId, setAssignedCitaId] = useState<string | null>(null)
  // const [fhirSyncResult, setFhirSyncResult] = useState<{ ok: boolean; scusUuid?: string; message?: string } | null>(null)
  const [seguroFiliacion, setSeguroFiliacion] = useState<string>("")
  const seguroManual = useRef(false)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [confirmDialog, setConfirmDialog] = useState<{ type: 'edit' | 'delete'; orden: OrdenApoyoDiagnostico } | null>(null)

  const [pedidoAlert, setPedidoAlert] = useState<{ show: boolean; examenes: { cpms: string; descripcion: string }[] }>({ show: false, examenes: [] })
  const [loadingPedido, setLoadingPedido] = useState(false)
  const [detallesPedidoMap, setDetallesPedidoMap] = useState<Record<string, boolean>>({})
  const [selectedDetailCpms, setSelectedDetailCpms] = useState<Set<string>>(new Set())

  const handleDeleteOrden = async () => {
    const orden = confirmDialog?.orden
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
      if (pacId) loadOrdenesApoyoDiagnostico(pacId)
      if (selectedOrdenEcografia === String(orden.idOrden)) setSelectedOrdenEcografia('')
    } catch (e: any) {
      toast({ title: 'Error al eliminar orden', description: e.message || 'No se pudo eliminar la orden.', variant: 'destructive' })
    } finally {
      setConfirmDialog(null)
    }
  }
  const [errorTitle, setErrorTitle] = useState("Error")

  const pacienteIdKey = (patient?.PACIENTE || patient?.HISTORIA || '').toString()
  const patientDataFiliacion = pacienteIdKey ? getPatientData(pacienteIdKey) : null
  const seguroPacienteFiliacion = seguroFiliacion || patientDataFiliacion?.seguro || patient?.SEGURO || ''

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

  const handleSeguroChange = (value: string) => {
    if (value) seguroManual.current = true
    setSelectedSeguro(value)
  }

  const cargarSeguroFiliacion = async () => {
    const tipoDoc = patient?.TIPO_DOCUMENTO?.trim() || patient?.TIPO_DOCUMENTO || 'D'
    const documento = patient?.DOCUMENTO?.trim()
    if (!documento) return
    try {
      const pacientes = await filiacionService.searchByDocumento(documento, tipoDoc)
      if (pacientes.length > 0) {
        const p = pacientes[0] as any
        const seguroEncontrado = (p.SEGURO ?? p.seguro)?.toString().trim() || ''
        setSeguroFiliacion(seguroEncontrado)
        if (seguroEncontrado && !seguroManual.current) {
          setSelectedSeguro(getCodigoSeguroInicial(seguroEncontrado))
        }
      }
    } catch (e: any) {
      console.error('[FILIACION] Error cargando seguro:', e)
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (searchType === 'name' && patient) {
        const idToUse = patient.PACIENTE || patient.HISTORIA
        if (idToUse) loadEnhancedPatientData(idToUse)
        else setEnhancedPatient(patient)
      } else {
        setEnhancedPatient(patient)
      }
      // Cargar órdenes del paciente y seguro de filiación
      const pacienteId = patient?.PACIENTE || patient?.HISTORIA
      if (pacienteId) loadOrdenesApoyoDiagnostico(pacienteId)
      cargarSeguroFiliacion()
    }
  }, [isOpen, patient, searchType])

  useEffect(() => {
    if (!isOpen || seguroManual.current) return
    const code = getCodigoSeguroInicial(seguroPacienteFiliacion)
    if (code) setSelectedSeguro(code)
  }, [isOpen, seguroPacienteFiliacion])

  useEffect(() => {
    if (!isSisSeguro()) {
      setSelectedEntidadSis("")
      setReferencia("")
      setReferenciaIdSeleccionada("")
      setEessOrigenReferencia("")
      setEessNombreOrigen("")
    }
  }, [selectedSeguro])

  // Limpiar datos de REFCON detalle cuando cambia la referencia SIS seleccionada en el contexto
  useEffect(() => {
    if (!selectedSisReferencia || !isPacientePeriferico) return
    setReferenciaItems([])
    setSelectedRefItem(null)
  }, [selectedSisReferencia?.numeroReferencia, selectedSisReferencia?.idReferencia, isPacientePeriferico])

  const loadOrdenesApoyoDiagnostico = async (pacienteId: string) => {
    setLoadingOrdenes(true)
    try {
      const res = await fetch(`${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/ordenes/paciente/${pacienteId}?origen=CE`)
      if (res.ok) {
        const json = await res.json()
        const lista: OrdenApoyoDiagnostico[] = (Array.isArray(json?.data) ? json.data
          : Array.isArray(json) ? json : []).filter(
            (o: OrdenApoyoDiagnostico) => ['1', '2', '3'].includes(String(o.estadoOrden))
          )
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

  // Verificar campo PEDIDO de APOYO_DIAGNOSTICO.MAESTRO para los exámenes de la orden seleccionada
  useEffect(() => {
    const checkPedido = async () => {
      const ordenIdRaw = selectedOrdenEcografia || (ordenCreadaId ? String(ordenCreadaId) : '')
      if (!ordenIdRaw) {
        setPedidoAlert({ show: false, examenes: [] })
        setDetallesPedidoMap({})
        setSelectedDetailCpms(new Set())
        return
      }
      const orden = ordenes.find((o) => String(o.idOrden) === ordenIdRaw)
      if (!orden?.detalles?.length) {
        setPedidoAlert({ show: false, examenes: [] })
        setDetallesPedidoMap({})
        setSelectedDetailCpms(new Set())
        return
      }
      setLoadingPedido(true)
      try {
        const detallesVisibles = orden.detalles.filter((d) => d.estadoDetalle !== '0')
        const { bloqueado, examenes } = await verificarExamenesConPedido(detallesVisibles)
        const pedidoSet = new Set(examenes.map((e) => e.cpms))
        const newMap: Record<string, boolean> = {}
        detallesVisibles.forEach((d) => {
          const cpms = (d.cpms?.trim() || String(d.idProcedimiento)).trim()
          newMap[cpms] = pedidoSet.has(cpms)
        })
        setDetallesPedidoMap(newMap)
        // Seleccionar por defecto sólo los exámenes que NO requieren pedido previo y NO están completados
        const initialSelected = new Set(
          detallesVisibles
            .filter((d) => d.estadoDetalle !== '2' && !pedidoSet.has((d.cpms?.trim() || String(d.idProcedimiento)).trim()))
            .map((d) => (d.cpms?.trim() || String(d.idProcedimiento)).trim())
        )
        setSelectedDetailCpms(initialSelected)
        setPedidoAlert({ show: bloqueado, examenes })
      } catch (error) {
        console.error('❌ Error verificando PEDIDO:', error)
        setPedidoAlert({ show: false, examenes: [] })
        setDetallesPedidoMap({})
        setSelectedDetailCpms(new Set())
      } finally {
        setLoadingPedido(false)
      }
    }
    checkPedido()
  }, [selectedOrdenEcografia, ordenCreadaId, ordenes])

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
          ESTADO_CIVIL: getCivilStatusDescription(additionalData.estadoCivil || patient!.ESTADO_CIVIL),
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

  const getUPSDestino = (): string[] => {
    const c = appointment?.consultorio?.trim() || ''
    if (['7010', '7020'].includes(c)) return ['080900']
    return ['080900']
  }

  const getTipoSeguroParam = () => {
    const s = selectedSeguro?.toString().trim()
    if (s === '00') return '0'
    return s || '0'
  }

  const mapSisReferenciaToItem = (sisRef: any): ReferenciaItem => {
    const fullName = buildPatientFullName(patient)
    const [primerApellido = '', segundoApellido = '', ...nombresResto] = fullName.split(/\s+/)
    return {
      rownum: '1',
      paciente: {
        tipo_documento: sisRef.tipoDocumento || patient?.TIPO_DOCUMENTO || '1',
        numero_documento: sisRef.numeroDocumento || patient?.DOCUMENTO || '',
        nombres: nombresResto.join(' ') || patient?.NOMBRE || '',
        primer_apellido: primerApellido,
        segundo_apellido: segundoApellido,
      },
      datos_referencia: {
        codigo_especialidad: sisRef.codigoEspecialidad || '',
        codigoEstado: sisRef.codigoEstado || '3',
        estado: sisRef.estado || 'ACEPTADO',
        fecha_referencia: sisRef.fechaEnvio || '',
        servicio_origen: sisRef.upsOrigen || '',
        codigo_establecimiento_origen: sisRef.codigoestablecimientoOrigen || '',
        servicio_destino: sisRef.upsDestino || '080900',
        numero_referencia: sisRef.numeroReferencia || '',
        id_referencia: sisRef.idReferencia || '',
        resume_exfisico: null,
        motivo_referencia: '',
      },
      diagnosticos: (() => {
        const raw = sisRef.diagnosticos || sisRef.DIAGNOSTICOS || sisRef.data?.diagnosticos || sisRef.data?.DIAGNOSTICOS || []
        const list = Array.isArray(raw) ? raw : []
        return list.map((d: any) => ({
          id: d.id || d.ID || '',
          codigo_ciex: d.codigo_ciex || d.codigoCiex || d.CODIGO_CIEX || d.codigo || d.CODIGO || '',
          tipo_diagnostico: d.tipo_diagnostico || d.tipoDiagnostico || d.TIPO_DIAGNOSTICO || d.tipo || d.TIPO || '',
        })).filter((d: any) => d.codigo_ciex)
      })(),
      cpt_procedimiento: null,
      cpt_laboratorio: null,
      cpt_imagenes: null,
    }
  }

  const getCpmsFromRef = (ref: ReferenciaItem): string | null => {
    const ups = ref.datos_referencia?.servicio_destino || ''
    if (ups === '150000') return extractCptCode(ref.cpt_laboratorio)
    if (ups === '080400') return extractCptCode(ref.cpt_imagenes)
    if (ups === '080900') return extractCptCode(ref.cpt_imagenes) || extractCptCode(ref.cpt_procedimiento)
    return extractCptCode(ref.cpt_procedimiento) || extractCptCode(ref.cpt_imagenes) || extractCptCode(ref.cpt_laboratorio)
  }

  const ESTADOS_REFERENCIA_PERMITIDOS = ['ACEPTADO', 'PACIENTE RECIBIDO', 'PACIENTE CITADO']

  const isReferenciaPermitida = (ref: ReferenciaItem): boolean => {
    const estado = (ref.datos_referencia?.estado || '').trim().toUpperCase()
    return ESTADOS_REFERENCIA_PERMITIDOS.includes(estado)
  }

  const isReferenciaValida = (ref: ReferenciaItem): boolean => {
    return isReferenciaPermitida(ref) && !!getCpmsFromRef(ref)
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
      const tipoDoc = (patient.TIPO_DOCUMENTO === 'CE' || patient.TIPO_DOCUMENTO === 'C') ? '2' : '1'
      const body = { establecimientoDestino: EESS_DESTINO, limite: '25', numerodocumento: doc, pagina: '1', tipodocumento: tipoDoc }
      const res = await fetch(`${REFERENCIA_BASE_URL}/api/referencia/detalle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText)
        console.error('[REFCON] Error response:', errText)
        toast({ title: 'Error al buscar referencias', description: `Error ${res.status}: ${res.statusText}`, variant: 'destructive' })
        return
      }
      const json = await res.json()
      // Estructura esperada: { codigo: '0000', mensaje: '...', datos: { paginas, porPagina, total, datos: [...] } }
      if (json?.codigo && json.codigo !== '0000') {
        console.error('[REFCON] API respondió con código de error:', json?.codigo, json?.mensaje)
        toast({ title: 'Error al buscar referencias', description: json?.mensaje || `Código ${json?.codigo}`, variant: 'destructive' })
        return
      }
      const extractLista = (r: any): ReferenciaItem[] => {
        if (Array.isArray(r?.datos?.datos)) return r.datos.datos
        if (Array.isArray(r?.datos)) return r.datos
        if (Array.isArray(r?.data)) return r.data
        if (Array.isArray(r?.items)) return r.items
        if (Array.isArray(r?.lista)) return r.lista
        if (Array.isArray(r?.resultado)) return r.resultado
        if (Array.isArray(r)) return r
        return []
      }
      const rawLista = extractLista(json)
      if (rawLista.length > 0) {
      }
      const filteredLista = rawLista.filter(isReferenciaValida)

      if (filteredLista.length === 0 && selectedSisReferencia) {
        const fallbackRef = mapSisReferenciaToItem(selectedSisReferencia)
        if (!isReferenciaValida(fallbackRef)) {
          toast({ title: 'Sin referencias', description: 'No se encontraron referencias de apoyo diagnóstico con CPMS para este paciente.', variant: 'default' })
          return
        }
        setReferenciaItems([fallbackRef])
        setSelectedRefItem(fallbackRef)
        setShowCrearOrdenModal(true)
        return
      }
      if (filteredLista.length === 0) {
        toast({ title: 'Sin referencias', description: 'No se encontraron referencias de apoyo diagnóstico en estado permitido y con CPMS para este paciente.', variant: 'default' })
        return
      }
      setReferenciaItems(filteredLista)
      // Auto-seleccionar: 1) match exacto con referencia SIS ya elegida, 2) UPS destino, 3) primera
      let autoSelected: ReferenciaItem | undefined
      if (selectedSisReferencia) {
        autoSelected = filteredLista.find(r =>
          r.datos_referencia?.numero_referencia === selectedSisReferencia.numeroReferencia ||
          r.datos_referencia?.id_referencia === selectedSisReferencia.idReferencia
        )
      }
      if (!autoSelected) {
        const ups = getUPSDestino()
        autoSelected = filteredLista.find(r => ups.includes(r.datos_referencia?.servicio_destino || '')) ?? filteredLista[0]
      }
      setSelectedRefItem(autoSelected)
      // Abrir modal directamente para que el usuario valide y cree la orden
      setShowCrearOrdenModal(true)
    } catch (e: any) {
      console.error('[REFCON] Excepción:', e)
      if (selectedSisReferencia) {
        const fallbackRef = mapSisReferenciaToItem(selectedSisReferencia)
        if (isReferenciaValida(fallbackRef)) {
          setReferenciaItems([fallbackRef])
          setSelectedRefItem(fallbackRef)
          setShowCrearOrdenModal(true)
        } else {
          toast({ title: 'Sin referencias', description: 'No se encontraron referencias de apoyo diagnóstico con CPMS para este paciente.', variant: 'default' })
        }
      } else {
        toast({ title: 'Error de conexión', description: e?.message || 'No se pudo conectar al servicio de referencias.', variant: 'destructive' })
      }
    } finally {
      setLoadingReferencia(false)
    }
  }

  const resetForm = () => {
    seguroManual.current = false
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
    // setFhirSyncResult(null)
    setShowErrorDialog(false)
    setErrorMessage("")
    setErrorTitle("Error")
    setIsPacientePeriferico(false)
    setReferenciaItems([])
    setSelectedRefItem(null)
    setShowCrearOrdenModal(false)
    setOrdenCreadaId(null)
    setPedidoAlert({ show: false, examenes: [] })
    setLoadingPedido(false)
    setDetallesPedidoMap({})
    setSelectedDetailCpms(new Set())
  }

  const handleAssign = async () => {
    if (!selectedTipoCita || !selectedSeguro || !appointment?.id) return

    // Evitar enviar IDs fallback generados localmente (ej: R0)
    if (!/^\d+$/.test(appointment.id.trim())) {
      toast({
        title: "Error",
        description: "La cita no tiene un identificador válido (ID_CITA).",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const usuarioDni = extractDocumentFromToken() || 'SISTEMA'
      const serverDateTime = await datetimeService.getCurrentDateTime()

      const fullName = buildPatientFullName(patient, 60)

      // Construir detalles filtrando solo los exámenes seleccionados por el usuario
      const ordenIdRaw = selectedOrdenEcografia || (ordenCreadaId ? String(ordenCreadaId) : '')
      const ordenActiva = ordenes.find((o) => String(o.idOrden) === ordenIdRaw)
      const detalles: { cpms: string; cantidad: number; ciex?: string; observacion?: string }[] =
        ordenActiva?.detalles
          ?.filter((d) => d.estadoDetalle !== '0' && d.estadoDetalle !== '2')
          .filter((d) => {
            const cpms = (d.cpms?.trim() || String(d.idProcedimiento)).trim()
            return selectedDetailCpms.size === 0 || selectedDetailCpms.has(cpms)
          })
          .map((d) => ({
            cpms: d.cpms?.trim() || String(d.idProcedimiento),
            cantidad: d.cantidad ?? 1,
            ...(d.ciex ? { ciex: d.ciex } : {}),
            ...(d.observacion ? { observacion: d.observacion } : {}),
          })) ?? []

      const asignarPayload = {
        idOrden: ordenIdRaw ? Number(ordenIdRaw) : null,
        idPaciente: (patient?.PACIENTE || patient?.HISTORIA || '').toString().trim(),
        idEstadoCita: appointment.id,
        consultorio: appointment.consultorio,
        origen: 'CE',
        origenId: appointment.id,
        tipoCita: selectedTipoCita,
        turno: getTurnoConsulta(appointment),
        seguro: selectedSeguro.toString().trim(),
        fechaCita: appointment.fecha,
        horaCita: appointment.hora,
        idMedicoEjecuta: appointment.medico ? Number(appointment.medico) : 0,
        flgParticular: false,
        nroFormulario: referencia || '',
        tiempoAtencion: { hour: 0, minute: 0, second: 0, nano: 0 },
        // TIPO_PACIENTE válidos: C=Continuador, N=Nuevo, O=Otros, P=Procedimiento, R=Reingreso
        // Para SIS se envía 'C' (continuador); para otros seguros 'P' (procedimiento).
        tipoPaciente: isSisSeguro() ? 'C' : 'P',
        numRef: referenciaIdSeleccionada || referencia || '',
        entidadSis: selectedEntidadSis || '',
        estado: '1',
        nombre: fullName,
        fechaOtorga: `${serverDateTime.date}T${serverDateTime.time}:00`,
        horaOtorga: serverDateTime.time,
        detalles,
      }

      const asignarUrl = `${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/atenciones/${appointment.id}/asignar`
      const asignarResponse = await fetch(asignarUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Usuario': usuarioDni },
        body: JSON.stringify(asignarPayload),
      })

      const responseData = await asignarResponse.json().catch(() => ({}))

      if (!asignarResponse.ok) {
        if (asignarResponse.status === 409 && responseData.message) {
          setErrorTitle("⚠️ Cita No Disponible")
          setErrorMessage(responseData.message)
          setShowErrorDialog(true)
          return
        }
        const errorMsg = responseData.message || `Error al asignar: ${asignarResponse.status} ${asignarResponse.statusText}`
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

      // Registrar paciente en RENHICE/FHIR (deshabilitado temporalmente)
      // const pacienteId = patient?.PACIENTE || patient?.HISTORIA
      // if (pacienteId) {
      //   try {
      //     const fhirUrl = `${FHIR_BASE_URL}/api/fhir/ips/pacientes/${pacienteId}/registrar`
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

      await onAssign({ ...asignarPayload, appointmentId: appointment.id, success: true, responseData })

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

  const hasAtLeastOneDetalle =
    isPacientePeriferico ||
    !selectedOrdenEcografia ||
    loadingPedido ||
    selectedDetailCpms.size > 0

  const isFormValid = !!selectedTipoCita && !!selectedSeguro &&
    (isPacientePeriferico ? !!ordenCreadaId : !!selectedOrdenEcografia) &&
    (!isSisSeguro() || (!!selectedEntidadSis && !!referencia.trim())) &&
    !hasConsultorioMatch &&
    !loadingPedido &&
    hasAtLeastOneDetalle

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
                {/* Sincronización RENHICE/FHIR deshabilitada temporalmente
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
                */}
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
                    <CardTitle className="text-lg flex flex-wrap items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Información de la Cita
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      onChange={handleSeguroChange}
                      required={true}
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

                    {/* Checkbox Paciente Periférico */}
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        id="paciente-periferico"
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
                      <Label htmlFor="paciente-periferico" className="text-sm font-medium cursor-pointer">
                        Paciente Periférico (referencia externa)
                      </Label>
                    </div>

                    {isPacientePeriferico && (
                      <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                        {/* Header con acción principal */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-blue-800 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Orden de referencia externa
                          </span>
                          {(() => {
                            let btnLabel: React.ReactNode
                            if (loadingReferencia) btnLabel = <><Loader2 className="h-3 w-3 animate-spin mr-1.5" />Buscando...</>
                            else if (ordenCreadaId) btnLabel = <><CheckCircle className="h-3 w-3 mr-1.5" />Orden Creada</>
                            else btnLabel = <><ClipboardList className="h-3 w-3 mr-1.5" />Completar y Crear Orden</>
                            return (
                              <Button
                                size="sm"
                                onClick={async () => {
                                  if (loadingReferencia) return
                                  if (ordenCreadaId) return

                                  // Si hay referencia SIS seleccionada, buscar match exacto en referencias cargadas (solo válidas: estado permitido + CPMS)
                                  if (selectedSisReferencia) {
                                    const matching = referenciaItems
                                      .filter(isReferenciaValida)
                                      .find(r =>
                                        r.datos_referencia?.numero_referencia === selectedSisReferencia.numeroReferencia ||
                                        r.datos_referencia?.id_referencia === selectedSisReferencia.idReferencia
                                      )
                                    if (matching) {
                                      setSelectedRefItem(matching)
                                      setShowCrearOrdenModal(true)
                                      return
                                    }
                                    await buscarReferenciaDetalle()
                                    return
                                  }

                                  const allowedRefs = referenciaItems.filter(isReferenciaValida)
                                  if (allowedRefs.length === 0) {
                                    // PAGANTE (0/00), SOAT (02) y PROGRAMAS (13): permitir crear orden manual
                                    // sin referencia REFCON (paciente periférico con orden impresa de otro establecimiento)
                                    const seguroCode = selectedSeguro?.toString().trim()
                                    if (permiteOrdenSinReferencia(seguroCode)) {
                                      setSelectedRefItem(null)
                                      setShowCrearOrdenModal(true)
                                      return
                                    }
                                    await buscarReferenciaDetalle()
                                    return
                                  }
                                  const targetRef = selectedRefItem && isReferenciaValida(selectedRefItem)
                                    ? selectedRefItem
                                    : (allowedRefs.find(r => getUPSDestino().includes(r.datos_referencia?.servicio_destino || '')) ?? allowedRefs[0])
                                  if (targetRef) {
                                    setSelectedRefItem(targetRef)
                                    setShowCrearOrdenModal(true)
                                  }
                                }}
                                disabled={loadingReferencia || !!ordenCreadaId}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {btnLabel}
                              </Button>
                            )
                          })()}
                        </div>

                        {/* Estado: cargando */}
                        {loadingReferencia && (
                          <div className="flex items-center gap-2 py-3 justify-center text-xs text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Consultando referencias en REFCON...
                          </div>
                        )}

                        {/* Estado: sin referencias aún */}
                        {!loadingReferencia && referenciaItems.length === 0 && !selectedSisReferencia && (
                          <p className="text-xs text-gray-500 text-center py-2">
                            {permiteOrdenSinReferencia(selectedSeguro)
                              ? <>Haga clic en <strong>Completar y Crear Orden</strong> para transcribir la orden impresa.</>
                              : <>Haga clic en <strong>Completar y Crear Orden</strong> para consultar la referencia y abrir el formulario.</>}
                          </p>
                        )}

                        {/* Estado: referencia SIS lista */}
                        {!loadingReferencia && referenciaItems.length === 0 && selectedSisReferencia && (
                          <p className="text-xs text-green-700 text-center py-2">
                            Referencia SIS <strong>{selectedSisReferencia.numeroReferencia}</strong> disponible. Haga clic en el botón para crear la orden.
                          </p>
                        )}

                        {/* Lista de referencias para seleccionar */}
                        {referenciaItems.length > 0 && (
                          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                            {referenciaItems.map((ref) => {
                              const isSelected = selectedRefItem?.datos_referencia?.id_referencia === ref.datos_referencia?.id_referencia
                              const cpms = getCpmsFromRef(ref)
                              const diag = ref.diagnosticos?.[0]
                              return (
                                <div
                                  key={ref.datos_referencia?.id_referencia}
                                  onClick={() => {
                                    setSelectedRefItem(ref)
                                    setOrdenCreadaId(null)
                                    setShowCrearOrdenModal(false)
                                  }}
                                  className={`p-2 rounded border cursor-pointer text-xs space-y-0.5 transition-colors ${
                                    isSelected ? 'border-blue-500 bg-blue-100 ring-1 ring-blue-400' : 'border-gray-200 bg-white hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-gray-800">{ref.datos_referencia?.numero_referencia}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                                      ref.datos_referencia?.codigoEstado === '3' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {ref.datos_referencia?.estado}
                                    </span>
                                  </div>
                                  <div className="text-gray-500 flex items-center gap-2 flex-wrap">
                                    <span>{ref.datos_referencia?.fecha_referencia}</span>
                                    {diag && <span className="font-mono bg-yellow-50 text-yellow-800 px-1 rounded">{diag.codigo_ciex}</span>}
                                    {cpms
                                      ? <span className="text-green-700">✅ CPMS: {cpms}</span>
                                      : <span className="text-amber-600">⚠️ Sin CPMS</span>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Orden creada: confirmación */}
                        {ordenCreadaId && (
                          <Alert className="bg-green-50 border-green-300 py-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 text-xs">
                              ✅ Orden <strong>#{ordenCreadaId}</strong> creada exitosamente. Ya puede confirmar la asignación.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    {/* Campo extra: Orden de Apoyo al Diagnóstico */}
                    {!isPacientePeriferico && <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-700">
                        Orden de Apoyo al Diagnóstico <span className="text-red-500">*</span>
                      </Label>
                      {loadingOrdenes ? (
                        <div className="flex items-center gap-2 h-10 border rounded-md px-3 bg-gray-50">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                          <span className="text-sm text-gray-500">Cargando órdenes...</span>
                        </div>
                      ) : ordenes.length === 0 ? (
                        <div className="text-sm text-gray-500 px-1">No hay órdenes disponibles para este paciente</div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {ordenes.map((ord) => {
                            const isSelected = String(ord.idOrden) === selectedOrdenEcografia
                            const origenKey = ord.origen?.trim().toUpperCase() || ''
                            const origenMeta: Record<string, { label: string; color: string }> = {
                              CE: { label: 'Consulta Externa', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                              EM: { label: 'Emergencia', color: 'bg-red-100 text-red-800 border-red-200' },
                              HO: { label: 'Hospitalización', color: 'bg-green-100 text-green-800 border-green-200' },
                            }
                            const origen = origenMeta[origenKey] || { label: origenKey, color: 'bg-gray-100 text-gray-700 border-gray-200' }

                            const servicioKey = ord.tipoServicio?.trim().toUpperCase() || ''
                            const servicioMeta: Record<string, string> = {
                              ECO: 'Ecografía',
                              RX: 'Rayos X',
                              LAB: 'Laboratorio',
                              TAC: 'Tomografía',
                              RM: 'Resonancia',
                            }
                            const servicioLabel = servicioMeta[servicioKey] || ord.tipoServicio

                            const ordenEstadoMeta: Record<string, { label: string; color: string }> = {
                              '1': { label: 'CREADA', color: 'bg-sky-100 text-sky-800 border-sky-200' },
                              '2': { label: 'FIRMADA', color: 'bg-amber-100 text-amber-800 border-amber-200' },
                              '3': { label: 'PENDIENTE', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                            }
                            const seleccionable = String(ord.estadoOrden) === '3'
                            const estadoOrdenKey = String(ord.estadoOrden || '')
                            const estadoOrdenBadge = ordenEstadoMeta[estadoOrdenKey]

                            const fechaCreacion = ord.regFechaCreacion
                              ? new Date(ord.regFechaCreacion).toLocaleDateString('es-PE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : null

                            const detallesVisibles = (ord.detalles || []).filter((d) => d.estadoDetalle !== '0')

                            return (
                              <div
                                key={ord.idOrden}
                                className={`border rounded-lg p-2.5 transition-colors ${
                                  isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400' : seleccionable ? 'border-gray-200 bg-white hover:bg-gray-50' : 'border-gray-200 bg-gray-50 opacity-70'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div
                                    className={`flex-1 min-w-0 ${seleccionable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                    onClick={() => seleccionable && setSelectedOrdenEcografia(isSelected ? '' : String(ord.idOrden))}
                                    title={seleccionable ? 'Haga clic para seleccionar' : 'La orden requiere aprobación médica para poder ser seleccionada'}
                                  >
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${origen.color}`} title={origen.label}>
                                        <span className="uppercase tracking-wide">{ord.origen?.trim()}</span>
                                        <span className="font-normal opacity-90">{origen.label}</span>
                                      </span>
                                      <span className="font-medium text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded" title={servicioLabel}>
                                        {servicioLabel}
                                      </span>
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
                                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded" title={`Creada el ${ord.regFechaCreacion}`}>
                                          <Calendar className="h-3 w-3" />
                                          {fechaCreacion}
                                        </span>
                                      )}
                                    </div>
                                    {detallesVisibles.length > 0 && (
                                      <div className="flex flex-col gap-1 mt-1.5">
                                        {isSelected && (
                                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide pl-0.5 mb-0.5">
                                            Exámenes a enviar:
                                          </p>
                                        )}
                                        <ul className="flex flex-col gap-1 pl-1">
                                          {detallesVisibles.map((d, idx) => {
                                            const cpms = (d.cpms?.trim() || String(d.idProcedimiento)).trim()
                                            const nombre = d.cpmsDescripcion?.trim() || `CPMS ${cpms}`
                                            const completado = d.estadoDetalle === '2'
                                            const requierePedido = detallesPedidoMap[cpms] ?? false
                                            const isChecked = selectedDetailCpms.has(cpms)
                                            return (
                                              <li key={idx} className={`flex items-center gap-1.5 text-xs rounded px-0.5 py-0.5 ${isSelected && requierePedido ? 'bg-amber-50' : ''}`}>
                                                {isSelected ? (
                                                  <Checkbox
                                                    id={`det-${ord.idOrden}-${idx}`}
                                                    checked={isChecked}
                                                    disabled={completado || loadingPedido}
                                                    onCheckedChange={(checked) => {
                                                      setSelectedDetailCpms((prev) => {
                                                        const next = new Set(prev)
                                                        if (checked) next.add(cpms)
                                                        else next.delete(cpms)
                                                        return next
                                                      })
                                                    }}
                                                    className="h-3.5 w-3.5 shrink-0"
                                                  />
                                                ) : (
                                                  <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-blue-500" />
                                                )}
                                                <span className={`truncate flex-1 ${
                                                  completado ? 'text-gray-400 line-through' :
                                                  isSelected && requierePedido ? 'text-amber-800' : 'text-gray-700'
                                                }`} title={nombre}>
                                                  {nombre}
                                                </span>
                                                {isSelected && requierePedido && (
                                                  <span className="shrink-0 text-[10px] text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0 rounded">
                                                    ⚠️ Pedido previo
                                                  </span>
                                                )}
                                                {completado
                                                  ? <span className="shrink-0 inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold bg-green-100 text-green-800 border border-green-300">✓ Completado</span>
                                                  : <span className="shrink-0 inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-300">Pendiente</span>
                                                }
                                              </li>
                                            )
                                          })}
                                        </ul>
                                        {isSelected && (
                                          <p className={`text-[10px] pl-0.5 mt-0.5 ${selectedDetailCpms.size === 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                            {selectedDetailCpms.size === 0
                                              ? '⚠️ Seleccione al menos un exámen para continuar'
                                              : `ℹ️ ${selectedDetailCpms.size} de ${detallesVisibles.length} exámen(es) serán enviados`
                                            }
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {ord.observacionesMedicas && (
                                      <div className="flex items-start gap-1 text-xs text-gray-500 bg-yellow-50 rounded px-2 py-1 mt-1.5" title={ord.observacionesMedicas}>
                                        <span className="shrink-0">📝</span>
                                        <span className="truncate">{ord.observacionesMedicas}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      title={ord.periferico ? 'Editar orden' : 'Solo disponible para órdenes periféricas'}
                                      disabled={!ord.periferico}
                                      onClick={() => setConfirmDialog({ type: 'edit', orden: ord })}
                                      className={`p-1.5 rounded transition-colors ${ord.periferico ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-400 cursor-not-allowed'}`}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      title={ord.periferico ? 'Eliminar orden' : 'Solo disponible para órdenes periféricas'}
                                      disabled={!ord.periferico}
                                      onClick={() => setConfirmDialog({ type: 'delete', orden: ord })}
                                      className={`p-1.5 rounded transition-colors ${ord.periferico ? 'text-red-600 hover:bg-red-100' : 'text-gray-400 cursor-not-allowed'}`}
                                    >
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
                        <Alert className="bg-amber-50 border-amber-300 mt-3">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800 text-xs">
                            <p className="font-semibold mb-1">⚠️ Examen(es) con pedido previo detectados</p>
                            <p>Los siguientes exámenes han sido deshabilitados por defecto porque requieren pedido previo. Puede habilitarlos manualmente si lo desea:</p>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>}
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
            <DialogTitle className="flex flex-wrap items-center gap-2 text-blue-700">
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
            <AlertDialogTitle className="flex flex-wrap items-center gap-2 text-red-600">
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

      {/* Confirmación editar/eliminar orden */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) setConfirmDialog(null) }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className={confirmDialog?.type === 'delete' ? 'text-red-700' : 'text-blue-700'}>
              {confirmDialog?.type === 'delete' ? 'Eliminar Orden' : 'Editar Orden'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.type === 'delete'
                ? `¿Está seguro de eliminar la orden #${confirmDialog?.orden?.idOrden}? Esta acción no se puede deshacer.`
                : `¿Está seguro de editar la orden #${confirmDialog?.orden?.idOrden}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const orden = confirmDialog?.orden
                if (!orden) return
                if (confirmDialog?.type === 'delete') {
                  handleDeleteOrden()
                } else {
                  const edit: OrdenToEdit = {
                    idOrden: orden.idOrden,
                    idPaciente: orden.idPaciente,
                    tipoServicio: orden.tipoServicio,
                    idLugar: orden.idLugar,
                    origen: orden.origen,
                    origenId: orden.origenId,
                    idTipoSeguro: orden.seguro,
                    idMedico: orden.idMedicoSolicita,
                    cama: orden.cama ?? null,
                    detalles: (orden.detalles || []).map(d => ({
                      cpms: d.cpms || null,
                      ciex: d.ciex || (d.diagnosticoId != null ? String(d.diagnosticoId) : null),
                      cantidad: d.cantidad,
                      observacion: d.observacion ?? null,
                      cpmsDescripcion: d.cpmsDescripcion ?? null,
                      estadoDetalle: d.estadoDetalle,
                    })),
                  }
                  setOrdenToEdit(edit)
                  setShowCrearOrdenModal(true)
                  setConfirmDialog(null)
                }
              }}
              className={confirmDialog?.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {confirmDialog?.type === 'delete' ? 'Sí, eliminar' : 'Sí, editar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showCrearOrdenModal && (
        <CrearOrdenApoyoDiagnosticoModal
          key={ordenToEdit ? `edit-${ordenToEdit.idOrden}` : selectedRefItem?.datos_referencia?.id_referencia || 'nueva-orden'}
          isOpen={showCrearOrdenModal}
          onClose={() => { setShowCrearOrdenModal(false); setOrdenToEdit(null) }}
          referencia={selectedRefItem ?? undefined}
          pacienteId={(patient?.PACIENTE || patient?.HISTORIA || '').toString()}
          selectedSeguro={selectedSeguro}
          seguroPaciente={seguroPacienteFiliacion}
          isPacientePeriferico={isPacientePeriferico}
          ordenToEdit={ordenToEdit ?? undefined}
          onOrdenCreada={(nuevaId) => {
            setOrdenCreadaId(nuevaId)
            setSelectedOrdenEcografia(String(nuevaId))
            setOrdenToEdit(null)
            const pacId = patient?.PACIENTE || patient?.HISTORIA
            if (pacId) loadOrdenesApoyoDiagnostico(pacId)
          }}
        />
      )}
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
