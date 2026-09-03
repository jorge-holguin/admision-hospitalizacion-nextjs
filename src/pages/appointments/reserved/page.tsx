"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Eye, Search, RefreshCw, Calendar, User, Clock, FileText, UserCheck, XCircle, RotateCcw } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { PatientAssignmentReservedModal } from "./modal/PatientAssignmentReservedModal"
import { PatientAssignmentReservedDiagnosticSupportModal } from "./modal/PatientAssignmentReservedDiagnosticSupportModal"
import { useRouter } from "@/lib/router"

import { toast } from "@/components/ui/use-toast"
import { TipoCitaProvider } from "@/contexts/TipoCitaContext"
import { SegurosCitaProvider } from "@/contexts/SegurosCitaContext"
import { FiliationProvider } from "@/contexts/filiation/FiliationProvider"
import { extractDocumentFromToken } from "@/utils/jwtUtils"
import RoleBasedRoute from "@/components/RoleBasedRoute"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"
import { PatientRegistrationModal } from "@/components/filiation/modals/PatientRegistrationModal"
import { PatientSearchModal } from "@/components/filiation/modals/PatientSearchModal"
import { PatientNotFoundModal } from "@/components/appointments/modals/PatientNotFoundModal"
import { filiacionService } from "@/services/hospitalizacion/filiacionService"

// Componente separado para el contenido del modal de reversión
// Evita re-renders del padre al escribir en el textarea
interface RevertirModalContentProps {
  reserva: ReservaData
  isLoading: boolean
  onConfirm: (motivo: string) => void
  onCancel: () => void
}

function RevertirModalContent({ reserva, isLoading, onConfirm, onCancel }: RevertirModalContentProps) {
  const [motivo, setMotivo] = useState("")

  return (
    <>
      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-orange-900">Datos de la Solicitud:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Código:</span>
              <span className="font-medium text-orange-700">{reserva.codigo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estado Actual:</span>
              <span className="font-medium">{reserva.estado}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paciente:</span>
              <span className="font-medium">{reserva.nombres}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Especialidad:</span>
              <span className="font-medium">{reserva.especialidadNombre}</span>
            </div>
            {reserva.citaId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cita ID:</span>
                <span className="font-medium">{reserva.citaId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Motivo de Reversión <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder="Ingrese el motivo por el cual se revierte la solicitud..."
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

      <DialogFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={() => onConfirm(motivo)}
          disabled={!motivo.trim() || isLoading}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          {isLoading ? "Revirtiendo..." : "Confirmar Reversión"}
        </Button>
      </DialogFooter>
    </>
  )
}

// Interfaces
interface ReservaData {
  tipoDocumento: string
  numeroDocumento: string
  nombres: string
  especialidad: string
  especialidadNombre: string
  medico: string
  medicoNombre: string
  turno: string
  fecha: string
  hora: string
  correo: string
  celular?: string
  codigo: string
  estado: string
  citaId?: number
  idSolicitudCita?: number
  tipoAtencion?: string | null
  tipoCita?: string | null
  especialidadInterconsulta?: string | null  // ✅ Especialidad de interconsulta
  observacionPaciente?: string | null  // ✅ Observaciones del paciente
  observacion?: string | null  // ✅ Observación de denegación/revisión
  rutaReferencia?: string
  consultorio?: string | null
}

interface EspecialidadData {
  idEspecialidad: string
  nombre: string
}

interface PatientData {
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

export default function ReservedAppointmentsPage() {
  const router = useRouter()
  const [reservas, setReservas] = useState<ReservaData[]>([])
  const [especialidades, setEspecialidades] = useState<EspecialidadData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<string>("all")
  const [selectedEstado, setSelectedEstado] = useState<string>("all")
  const [selectedReserva, setSelectedReserva] = useState<ReservaData | null>(null)
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEcoModalOpen, setIsEcoModalOpen] = useState(false)
  const ECO_CONSULTORIOS_RES = ['7010', '7020']
  const [loadingPatient, setLoadingPatient] = useState(false)
  const [loadingReservas, setLoadingReservas] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [solicitudEnRevision, setSolicitudEnRevision] = useState<ReservaData | null>(null)
  const [showRevisionPendienteModal, setShowRevisionPendienteModal] = useState(false)
  const [showPacienteNoEncontradoModal, setShowPacienteNoEncontradoModal] = useState(false)
  const [reservaSinPaciente, setReservaSinPaciente] = useState<ReservaData | null>(null)
  const [motivoDenegacion, setMotivoDenegacion] = useState("")
  const [isDenegando, setIsDenegando] = useState(false)
  const [showRevertirModal, setShowRevertirModal] = useState(false)
  const [reservaARevertir, setReservaARevertir] = useState<ReservaData | null>(null)
  // motivoReversion state moved to RevertirModalContent component to avoid re-renders
  const [isRevirtiendo, setIsRevirtiendo] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [reniecData, setReniecData] = useState<any>(null)
  const [sisData, setSisData] = useState<any>(null)
  const [showMotivoModal, setShowMotivoModal] = useState(false)
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>("")

  // Función para obtener fechas
  const getDateRange = () => {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0) // Último día del mes siguiente
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]
    }
    
    return {
      fechaInicio: formatDate(today),
      fechaFin: formatDate(nextMonth)
    }
  }

  // Cargar especialidades
  const loadEspecialidades = async () => {
    setLoadingEspecialidades(true)
    try {
      const { fechaInicio, fechaFin } = getDateRange()
      const response = await fetch(`${import.meta.env.VITE_API_RESERVAS_URL}/app-citas/especialidades?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar especialidades')
      }
      
      const data = await response.json()
      setEspecialidades(data)
      
      // Si hay especialidades, seleccionar la primera por defecto
      if (data.length > 0 && !selectedEspecialidad) {
        setSelectedEspecialidad(data[0].idEspecialidad)
      }
    } catch (error) {
      console.error('Error al cargar especialidades:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las especialidades",
        variant: "destructive"
      })
    } finally {
      setLoadingEspecialidades(false)
    }
  }

  // Cargar reservas
  const loadReservas = async () => {
    setLoading(true)
    try {
      // Construir URL con filtros
      let url = `${import.meta.env.VITE_API_RESERVAS_URL}/solicitudes/listar-paginado?`
      
      // Agregar filtro de especialidad solo si no es "all"
      if (selectedEspecialidad && selectedEspecialidad !== 'all') {
        url += `especialidad=${selectedEspecialidad}&`
      }
      
      // Agregar filtro de estado si no es "all"
      if (selectedEstado && selectedEstado !== 'all') {
        url += `estado=${selectedEstado}&`
      }
      
      url += `page=${currentPage}&size=${pageSize}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar reservas')
      }
      
      const data = await response.json()
      setReservas(data.content || [])
      setTotalElements(data.totalElements || 0)

      // ✅ Debug: Ver qué campos están llegando desde la API
      if (data.content && data.content.length > 0) {
      }
    } catch (error) {
      console.error('Error al cargar reservas:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas",
        variant: "destructive"
      })
      // Usar datos mock en caso de error
      setReservas([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar reservas cuando cambie la especialidad, estado o página (incluye carga inicial)
  useEffect(() => {
    loadReservas()
  }, [selectedEspecialidad, selectedEstado, currentPage])

  // Buscar paciente por documento usando API filiacion2
  const searchPatientByDocument = async (documento: string, reservaCodigo: string) => {
    // Agregar esta reserva al set de loading
    setLoadingReservas(prev => new Set([...prev, reservaCodigo]))
    
    try {
      const data = await filiacionService.getPaginatedFiliacion(
        { documento },
        { page: 1, pageSize: 10 }
      )

      // Los datos vienen en un array dentro de data.data
      const patientInfo = data.data && data.data.length > 0 ? data.data[0] as any : null
      
      if (patientInfo && patientInfo.HISTORIA) {
        setPatientData({
          HISTORIA: patientInfo.HISTORIA || '',
          NOMBRES: patientInfo.NOMBRES || '',
          NOMBRE: patientInfo.NOMBRE || '',
          PATERNO: patientInfo.PATERNO || '',
          MATERNO: patientInfo.MATERNO || '',
          SEXO: patientInfo.SEXO || '',
          DOCUMENTO: patientInfo.DOCUMENTO || documento,
          TIPO_DOCUMENTO: patientInfo.TIPO_DOCUMENTO || '',
          FECHA_NACIMIENTO: patientInfo.FECHA_NACIMIENTO || '',
          EDAD: patientInfo.EDAD || '',
          ESTADO_CIVIL: patientInfo.ESTADO_CIVIL || '',
          DIRECCION: patientInfo.DIRECCION || '',
          DISTRITO: patientInfo.DISTRITO || patientInfo.Distrito_Dir || '',
          Distrito_Dir: patientInfo.Distrito_Dir || '',
          TELEFONO1: patientInfo.TELEFONO1,
          TELEFONO2: patientInfo.TELEFONO2,
          SEGURO: patientInfo.SEGURO,
          NOMBRE_SEGURO: patientInfo.NOMBRE_SEGURO,
          RELIGION: patientInfo.RELIGION,
          DESRELIGION: patientInfo.DESRELIGION,
          Nombre_Localidad: patientInfo.Nombre_Localidad,
          LOCALIDAD: patientInfo.LOCALIDAD,
          STRING_FOTO: patientInfo.STRING_FOTO,
          PACIENTE: patientInfo.PACIENTE
        })
        return true
      } else {
        toast({
          title: "Paciente no encontrado",
          description: `No se encontró información para el documento: ${documento}`,
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('❌ Error al buscar paciente:', error)
      toast({
        title: "Error",
        description: "Error al buscar información del paciente",
        variant: "destructive"
      })
      return false
    } finally {
      // Remover esta reserva del set de loading
      setLoadingReservas(prev => {
        const newSet = new Set(prev)
        newSet.delete(reservaCodigo)
        return newSet
      })
    }
  }

  // Obtener información completa de la solicitud incluyendo citaId
  const getSolicitudInfo = async (codigo: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_RESERVAS_URL}/solicitudes/codigo/${codigo}`, {
        method: 'GET',
        headers: {
          'accept': '*/*'
        }
      })

      if (!response.ok) {
        throw new Error(`Error al obtener solicitud: ${response.status} ${response.statusText}`)
      }

      const solicitudData = await response.json()
      return solicitudData
    } catch (error) {
      console.error('❌ Error al obtener información de la solicitud:', error)
      toast({
        title: "Error",
        description: "Error al obtener información de la solicitud",
        variant: "destructive"
      })
      return null
    }
  }

  // Función para cambiar el estado de una solicitud
  const cambiarEstadoSolicitud = async (codigo: string, nuevoEstado: string, observacion?: string, usuario?: string, error?: boolean) => {
    try {
      // Obtener usuario si no se proporciona
      const usuarioFinal = usuario || extractDocumentFromToken()
      
      const url = `${import.meta.env.VITE_API_RESERVAS_URL}/solicitudes/codigo/${codigo}/estado`
      const body: any = { 
        estado: nuevoEstado,
        usuario: usuarioFinal
      }
      
      if (observacion) {
        body.observacion = observacion
      }
      
      if (error !== undefined) {
        body.error = error
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Error al cambiar estado: ${response.status} ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error)
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la solicitud",
        variant: "destructive"
      })
      return false
    }
  }

  // Manejar clic en revisar
  const handleRevisar = async (reserva: ReservaData) => {
    // Verificar si ya hay una solicitud en revisión Y no es la misma
    if (solicitudEnRevision && solicitudEnRevision.codigo !== reserva.codigo) {
      setShowRevisionPendienteModal(true)
      return
    }
    
    setSelectedReserva(reserva)
    
    // Obtener el apellido del usuario desde el JWT
    const usuarioApellido = extractDocumentFromToken()
    
    // Cambiar estado a "EN_REVISION" al hacer clic en Revisar
    const cambioExitoso = await cambiarEstadoSolicitud(reserva.codigo, "EN_REVISION", undefined, usuarioApellido)
    if (cambioExitoso) {
      setReservas(prev => prev.map(r => 
        r.codigo === reserva.codigo 
          ? { ...r, estado: "EN REVISION" }
          : r
      ))
      // Guardar la solicitud en revisión
      setSolicitudEnRevision(reserva)
    }
    
    // Obtener información completa de la solicitud (incluyendo citaId)
    const solicitudInfo = await getSolicitudInfo(reserva.codigo)
    if (!solicitudInfo) {
      return
    }

    // Actualizar la reserva seleccionada con la información completa
    const reservaCompleta = {
      ...reserva,
      citaId: solicitudInfo.citaId,
      idSolicitudCita: solicitudInfo.idSolicitudCita,
      rutaReferencia: solicitudInfo.rutaReferencia,
      consultorio: solicitudInfo.consultorio,
      tipoAtencion: solicitudInfo.tipoAtencion,
      tipoCita: solicitudInfo.tipoCita,
      especialidadInterconsulta: solicitudInfo.especialidadInterconsulta,
      observacionPaciente: solicitudInfo.observacionPaciente,
      observacion: solicitudInfo.observacion
    }
    setSelectedReserva(reservaCompleta)
    
    // Actualizar la lista de reservas con el citaId e idSolicitudCita
    setReservas(prev => prev.map(r => 
      r.codigo === reserva.codigo 
        ? { ...r,
            citaId: solicitudInfo.citaId,
            idSolicitudCita: solicitudInfo.idSolicitudCita,
            tipoCita: solicitudInfo.tipoCita,
            especialidadInterconsulta: solicitudInfo.especialidadInterconsulta,
            observacionPaciente: solicitudInfo.observacionPaciente,
            observacion: solicitudInfo.observacion
          }
        : r
    ))
    
    // Buscar información del paciente por documento
    const found = await searchPatientByDocument(reserva.numeroDocumento, reserva.codigo)
    if (found) {
      if (ECO_CONSULTORIOS_RES.includes((reservaCompleta.consultorio || '').trim())) {
        setIsEcoModalOpen(true)
      } else {
        setIsModalOpen(true)
      }
    } else {
      // Mostrar modal de advertencia de paciente no encontrado
      setReservaSinPaciente(reserva)
      setShowPacienteNoEncontradoModal(true)
    }
  }

  // Manejar denegación cuando no se encuentra el paciente
  const handleDenegarSinPaciente = async () => {
    if (!reservaSinPaciente || !motivoDenegacion.trim()) {
      toast({
        title: "Campo requerido",
        description: "Debe ingresar un motivo para denegar",
        variant: "destructive"
      })
      return
    }

    setIsDenegando(true)
    try {
      const usuarioApellido = extractDocumentFromToken()
      const cambioExitoso = await cambiarEstadoSolicitud(
        reservaSinPaciente.codigo, 
        "DENEGADO", 
        motivoDenegacion,
        usuarioApellido
      )
      
      if (cambioExitoso) {
        toast({
          title: "Solicitud Denegada",
          description: "La solicitud ha sido denegada por falta de información del paciente",
        })
        // Actualizar estado en la lista
        setReservas(prev => prev.map(r => 
          r.codigo === reservaSinPaciente.codigo 
            ? { ...r, estado: "DENEGADO" }
            : r
        ))
        // Colocar el código en el filtro de búsqueda
        setSearchTerm(reservaSinPaciente.codigo)
        // Limpiar la solicitud en revisión
        setSolicitudEnRevision(null)
        // Cerrar modal y limpiar estados
        setShowPacienteNoEncontradoModal(false)
        setReservaSinPaciente(null)
        setMotivoDenegacion("")
        loadReservas()
      }
    } catch (error) {
      console.error('Error al denegar:', error)
      toast({
        title: "Error",
        description: "No se pudo denegar la solicitud",
        variant: "destructive"
      })
    } finally {
      setIsDenegando(false)
    }
  }

  // Manejar creación de historia clínica - Abrir modal de búsqueda
  const handleCrearHistoriaClinica = () => {
    if (!reservaSinPaciente) return    // Cerrar modal de advertencia y abrir modal de búsqueda
    setShowPacienteNoEncontradoModal(false)
    setShowSearchModal(true)
  }

  // Manejar cuando PatientSearchModal encuentra o no encuentra datos
  const handleSearchComplete = (reniecData: any, sisData: any) => {    setReniecData(reniecData)
    setSisData(sisData)
    setShowSearchModal(false)
    setShowRegistrationModal(true)
  }

  // Manejar cuando se encuentra un paciente existente
  const handlePatientFound = (patientData: any) => {    toast({
      title: "Paciente Encontrado",
      description: `El paciente ${patientData.NOMBRES} ya está registrado con HC: ${patientData.HISTORIA}`,
    })
    setShowSearchModal(false)
    
    // Recargar la información del paciente
    if (reservaSinPaciente) {
      searchPatientByDocument(reservaSinPaciente.numeroDocumento, reservaSinPaciente.codigo)
    }
  }

  // Manejar éxito al crear historia clínica
  const handleRegistrationSuccess = () => {
    toast({
      title: "Historia Clínica Creada",
      description: "La historia clínica se creó exitosamente. Ahora puede continuar con la cita.",
    })
    setShowRegistrationModal(false)
    setReniecData(null)
    setSisData(null)
    
    // Recargar la información del paciente
    if (reservaSinPaciente) {
      searchPatientByDocument(reservaSinPaciente.numeroDocumento, reservaSinPaciente.codigo)
    }
  }

  // Manejar cancelación del modal de búsqueda
  const handleSearchCancel = () => {    setShowSearchModal(false)
    setShowPacienteNoEncontradoModal(true)
  }

  // Manejar denegar desde la tabla
  const handleDenegarDesdeTabla = async (reserva: ReservaData) => {
    const cambioExitoso = await cambiarEstadoSolicitud(reserva.codigo, "DENEGADO")
    if (cambioExitoso) {
      setReservas(prev => prev.map(r => 
        r.codigo === reserva.codigo 
          ? { ...r, estado: "DENEGADO" }
          : r
      ))
      toast({
        title: "Solicitud Denegada",
        description: `La solicitud ${reserva.codigo} ha sido denegada`,
      })
    }
  }

  // Manejar ver ficha referencia
  const handleVerFichaReferencia = (reserva: ReservaData) => {
    // Aquí iría la lógica para mostrar la ficha de referencia
    toast({
      title: "Ficha de Referencia",
      description: `Mostrando ficha para: ${reserva.nombres}`,
    })
  }

  // Manejar clic en revertir - abre modal de confirmación
  const handleRevertirClick = (reserva: ReservaData) => {
    setReservaARevertir(reserva)
    setShowRevertirModal(true)
  }

  // Manejar confirmación de reversión (recibe motivo como parámetro del componente hijo)
  const handleConfirmarReversion = async (motivoParam: string) => {
    if (!reservaARevertir || !motivoParam.trim()) {
      toast({
        title: "Campo requerido",
        description: "Debe ingresar un motivo para revertir",
        variant: "destructive"
      })
      return
    }

    setIsRevirtiendo(true)    try {
      const usuarioApellido = extractDocumentFromToken()
      
      // Determinar si la cita fue asignada (CITADO) o hubo error (DENEGADO)
      const esEstadoCitado = reservaARevertir.estado === "CITADO"
      const errorFlag = !esEstadoCitado // error: true si fue denegado, false si fue citado
      
      // Si la cita fue asignada (CITADO), primero liberar la cita
      if (esEstadoCitado && reservaARevertir.citaId) {        try {
          const liberarResponse = await fetch(`${import.meta.env.VITE_API_CITAS_MASTER_URL}/cita/${reservaARevertir.citaId}/liberar`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'usuario': usuarioApellido
            },
            body: JSON.stringify(`Reversión de solicitud: ${motivoParam}`)
          })
          
          if (!liberarResponse.ok) {            // Continuamos con la reversión aunque falle la liberación
          } else {          }
        } catch (liberarError) {
          console.error('❌ Error al liberar cita:', liberarError)
          // Continuamos con la reversión aunque falle la liberación
        }
      }
      
      // Revertir al estado PENDIENTE con el campo error
      const cambioExitoso = await cambiarEstadoSolicitud(
        reservaARevertir.codigo, 
        "PENDIENTE",
        motivoParam,
        usuarioApellido,
        errorFlag
      )
      
      if (cambioExitoso) {
        toast({
          title: "Estado Revertido",
          description: `La solicitud ${reservaARevertir.codigo} ha sido revertida a PENDIENTE`,
        })
        
        // Actualizar estado en la lista
        setReservas(prev => prev.map(r => 
          r.codigo === reservaARevertir.codigo 
            ? { ...r, estado: "PENDIENTE" }
            : r
        ))
        
        // Limpiar la solicitud en revisión si es la misma
        if (solicitudEnRevision?.codigo === reservaARevertir.codigo) {
          setSolicitudEnRevision(null)
        }
        
        // Cerrar modal y limpiar estados
        setShowRevertirModal(false)
        setReservaARevertir(null)
        
        // Recargar las reservas para reflejar el cambio
        loadReservas()
      }
    } catch (error) {
      console.error('❌ Error al revertir estado:', error)
      toast({
        title: "Error",
        description: "No se pudo revertir el estado de la solicitud",
        variant: "destructive"
      })
    } finally {
      setIsRevirtiendo(false)
    }
  }

  // Filtrar reservas por término de búsqueda
  const filteredReservas = reservas.filter(reserva => 
    reserva.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reserva.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reserva.especialidadNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reserva.medicoNombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "EN_REVISION":
      case "EN REVISION":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "CITADO":
        return "bg-green-100 text-green-800 border-green-300"
      case "DENEGADO":
        return "bg-red-100 text-red-800 border-red-300"
      case "ELIMINADO":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "APROBADA":
        return "bg-green-100 text-green-800 border-green-200"
      case "OBSERVADA":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "ANULADA":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Función para formatear turno
  const formatTurno = (turno: string) => {
    return turno === 'M' ? 'MAÑANA' : turno === 'T' ? 'TARDE' : turno
  }

  const totalPages = Math.ceil(totalElements / pageSize)

  return (
    <RoleBasedRoute 
      allowedRoles={['DEVOPS', 'ANALISTA', 'CALL CENTER','DESARROLLADOR']}
      moduleName="Módulo de Citas Reservadas"
    >
      <TipoCitaProvider>
        <SegurosCitaProvider>
          <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <main className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/appointments')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Citas
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Bandeja de Solicitudes de Reservas</h1>
                  <p className="text-gray-600">Gestión de citas médicas - Sistema Hospitalario</p>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  loadEspecialidades()
                  loadReservas()
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>

            {/* Filtros y búsqueda */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Filtros y Búsqueda
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedEspecialidad("all")
                      setSelectedEstado("all")
                      setCurrentPage(0)
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Limpiar Filtros
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Especialidad</label>
                    <Select
                      value={selectedEspecialidad}
                      onValueChange={(value) => {
                        setSelectedEspecialidad(value)
                        setCurrentPage(0) // Reset página al cambiar especialidad
                      }}
                      disabled={loadingEspecialidades}
                      onOpenChange={(open) => {
                        // Cargar especialidades solo cuando se abre el selector
                        if (open && especialidades.length === 0) {
                          loadEspecialidades()
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las especialidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las especialidades</SelectItem>
                        {especialidades.map((esp) => (
                          <SelectItem key={esp.idEspecialidad} value={esp.idEspecialidad}>
                            {esp.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Estado</label>
                    <Select
                      value={selectedEstado}
                      onValueChange={(value) => {
                        setSelectedEstado(value)
                        setCurrentPage(0) // Reset página al cambiar estado
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                        <SelectItem value="EN_REVISION">En Revisión</SelectItem>
                        <SelectItem value="CITADO">Citado</SelectItem>
                        <SelectItem value="DENEGADO">Denegado</SelectItem>
                        <SelectItem value="ELIMINADO">Eliminado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Buscar</label>
                    <Input
                      placeholder="Buscar por código, paciente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de reservas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Solicitudes de Reservas
                  </span>
                  <span className="text-sm font-normal text-gray-500">
                    Mostrando {filteredReservas.length} de {totalElements} registros
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Cargando reservas...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">CÓDIGO</TableHead>
                          <TableHead className="font-semibold">CITA_ID</TableHead>
                          <TableHead className="font-semibold">PACIENTE</TableHead>
                          <TableHead className="font-semibold">CELULAR</TableHead>
                          <TableHead className="font-semibold">ESPECIALIDAD</TableHead>
                          <TableHead className="font-semibold">MÉDICO</TableHead>
                          <TableHead className="font-semibold">TIPO ATENCIÓN</TableHead>
                          <TableHead className="font-semibold">TIPO CITA</TableHead>
                          <TableHead className="font-semibold">TURNO</TableHead>
                          <TableHead className="font-semibold">FECHA Y HORA</TableHead>
                          <TableHead className="font-semibold">ESTADO</TableHead>
                          <TableHead className="font-semibold">ACCIONES</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReservas.map((reserva) => (
                          <TableRow key={reserva.codigo} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-blue-600">
                              {reserva.codigo}
                            </TableCell>
                            <TableCell className="font-medium">
                              {reserva.citaId || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium">{reserva.nombres}</div>
                                  <div className="text-sm text-gray-500">{reserva.numeroDocumento}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {reserva.celular || '-'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {reserva.especialidadNombre}
                            </TableCell>
                            <TableCell>
                              {reserva.medicoNombre}
                            </TableCell>
                            <TableCell className="text-sm">
                              {reserva.tipoAtencion || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {/* ✅ Fusionar tipo de cita con especialidad de interconsulta */}
                              {reserva.tipoCita 
                                ? (reserva.tipoCita === 'INTERCONSULTA' && reserva.especialidadInterconsulta
                                    ? `${reserva.tipoCita} - ${reserva.especialidadInterconsulta}`
                                    : reserva.tipoCita)
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatTurno(reserva.turno)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium">{reserva.fecha}</div>
                                  <div className="text-sm text-gray-500">{reserva.hora}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <Badge 
                                  variant="outline" 
                                  className={getEstadoBadgeColor(reserva.estado)}
                                >
                                  {reserva.estado}
                                </Badge>
                                {reserva.estado === "DENEGADO" && reserva.observacion && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setMotivoSeleccionado(reserva.observacion || "")
                                      setShowMotivoModal(true)
                                    }}
                                    className="text-xs h-7 px-2 text-red-600 border-red-300 hover:bg-red-50"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Ver Motivo
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRevisar(reserva)}
                                  disabled={
                                    loadingReservas.has(reserva.codigo) ||
                                    reserva.estado === "CITADO" ||
                                    reserva.estado === "ANULADO" ||
                                    reserva.estado === "ELIMINADO" ||
                                    reserva.estado === "DENEGADO"
                                  }
                                  className="flex items-center gap-2"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  {loadingReservas.has(reserva.codigo)
                                    ? 'Cargando...' 
                                    : 'Revisar'
                                  }
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRevertirClick(reserva)}
                                  disabled={
                                    loadingReservas.has(reserva.codigo) ||
                                    reserva.estado === "PENDIENTE" ||
                                    reserva.estado === "ANULADO" ||
                                    reserva.estado === "ELIMINADO" ||
                                    reserva.estado === "EN_REVISION" ||
                                    reserva.estado === "EN REVISION"
                                  }
                                  className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Revertir
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {filteredReservas.length === 0 && (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No se encontraron reservas
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm 
                            ? 'Intenta con otros términos de búsqueda' 
                            : 'No hay solicitudes de reservas disponibles para esta especialidad'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Página {currentPage + 1} de {totalPages} - Total: {totalElements} registros
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>

          {/* Modal de asignación de paciente */}
          {isModalOpen && patientData && selectedReserva && (
            <PatientAssignmentReservedModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false)
                setSelectedReserva(null)
                setPatientData(null)
              }}
              patient={patientData}
              appointment={{
                codigo: selectedReserva.codigo,
                citaId: selectedReserva.citaId?.toString() || '',
                idSolicitudCita: selectedReserva.idSolicitudCita,
                fecha: selectedReserva.fecha,
                hora: selectedReserva.hora,
                especialidad: selectedReserva.especialidad,
                especialidadNombre: selectedReserva.especialidadNombre,
                medico: selectedReserva.medico,
                medicoNombre: selectedReserva.medicoNombre,
                estado: selectedReserva.estado,
                consultorio: selectedReserva.consultorio || undefined,
                tipoCita: selectedReserva.tipoCita,
                especialidadInterconsulta: selectedReserva.especialidadInterconsulta,
                observacionPaciente: selectedReserva.observacionPaciente,
                observacion: selectedReserva.observacion
              }}
              onApprove={async (data: any) => {
                // Cambiar estado a "CITADO" al aprobar
                if (selectedReserva) {
                  const usuarioApellido = extractDocumentFromToken()
                  const cambioExitoso = await cambiarEstadoSolicitud(selectedReserva.codigo, "CITADO", undefined, usuarioApellido)
                  if (cambioExitoso) {
                    toast({
                      title: "Reserva Aprobada",
                      description: "La solicitud ha sido aprobada correctamente",
                    })
                    // Colocar el código en el filtro de búsqueda
                    setSearchTerm(selectedReserva.codigo)
                    // Limpiar la solicitud en revisión
                    setSolicitudEnRevision(null)
                    setIsModalOpen(false)
                    setSelectedReserva(null)
                    setPatientData(null)
                    loadReservas()
                  }
                }
              }}
              onDeny={async (motivo: string) => {
                // Cambiar estado a "DENEGADO" con observación
                if (selectedReserva) {
                  const usuarioApellido = extractDocumentFromToken()
                  const cambioExitoso = await cambiarEstadoSolicitud(selectedReserva.codigo, "DENEGADO", motivo, usuarioApellido)
                  if (cambioExitoso) {
                    toast({
                      title: "Solicitud Denegada",
                      description: "La solicitud ha sido denegada correctamente",
                    })
                    // Colocar el código en el filtro de búsqueda
                    setSearchTerm(selectedReserva.codigo)
                    // Limpiar la solicitud en revisión
                    setSolicitudEnRevision(null)
                    setIsModalOpen(false)
                    setSelectedReserva(null)
                    setPatientData(null)
                    loadReservas()
                  }
                }
              }}
              onObserve={(motivo: string) => {
                // Aquí iría la lógica para observar la reserva
                return Promise.resolve()
              }}
              onSuccess={() => {
                toast({
                  title: "Éxito",
                  description: "Reserva procesada correctamente",
                })
                setIsModalOpen(false)
                setSelectedReserva(null)
                setPatientData(null)
                // Limpiar filtro de búsqueda para mostrar todas las reservas
                setSearchTerm("")
                // Recargar reservas
                loadReservas()
              }}
            />
          )}

          {/* Modal de asignación de paciente — Apoyo Diagnóstico (Ecografía 1 y 2) */}
          {isEcoModalOpen && patientData && selectedReserva && (
            <PatientAssignmentReservedDiagnosticSupportModal
              isOpen={isEcoModalOpen}
              onClose={() => {
                setIsEcoModalOpen(false)
                setSelectedReserva(null)
                setPatientData(null)
              }}
              patient={patientData}
              appointment={{
                codigo: selectedReserva.codigo,
                citaId: selectedReserva.citaId?.toString() || '',
                idSolicitudCita: selectedReserva.idSolicitudCita,
                fecha: selectedReserva.fecha,
                hora: selectedReserva.hora,
                especialidad: selectedReserva.especialidad,
                especialidadNombre: selectedReserva.especialidadNombre,
                medico: selectedReserva.medico,
                medicoNombre: selectedReserva.medicoNombre,
                estado: selectedReserva.estado,
                consultorio: selectedReserva.consultorio || undefined,
                tipoCita: selectedReserva.tipoCita,
                especialidadInterconsulta: selectedReserva.especialidadInterconsulta,
                observacionPaciente: selectedReserva.observacionPaciente,
                observacion: selectedReserva.observacion
              }}
              onApprove={async (data: any) => {
                if (selectedReserva) {
                  const usuarioApellido = extractDocumentFromToken()
                  const cambioExitoso = await cambiarEstadoSolicitud(selectedReserva.codigo, "CITADO", undefined, usuarioApellido)
                  if (cambioExitoso) {
                    toast({ title: "Reserva Aprobada", description: "La solicitud ha sido aprobada correctamente" })
                    setSearchTerm(selectedReserva.codigo)
                    setSolicitudEnRevision(null)
                    setIsEcoModalOpen(false)
                    setSelectedReserva(null)
                    setPatientData(null)
                    loadReservas()
                  }
                }
              }}
              onDeny={async (motivo: string) => {
                if (selectedReserva) {
                  const usuarioApellido = extractDocumentFromToken()
                  const cambioExitoso = await cambiarEstadoSolicitud(selectedReserva.codigo, "DENEGADO", motivo, usuarioApellido)
                  if (cambioExitoso) {
                    toast({ title: "Solicitud Denegada", description: "La solicitud ha sido denegada correctamente" })
                    setSearchTerm(selectedReserva.codigo)
                    setSolicitudEnRevision(null)
                    setIsEcoModalOpen(false)
                    setSelectedReserva(null)
                    setPatientData(null)
                    loadReservas()
                  }
                }
              }}
              onObserve={() => Promise.resolve()}
              onSuccess={() => {
                toast({ title: "Éxito", description: "Reserva procesada correctamente" })
                setIsEcoModalOpen(false)
                setSelectedReserva(null)
                setPatientData(null)
                setSearchTerm("")
                loadReservas()
              }}
            />
          )}

          <Dialog open={showPacienteNoEncontradoModal} onOpenChange={(open) => {
            setShowPacienteNoEncontradoModal(open)
            if (!open) {
              setReservaSinPaciente(null)
              setMotivoDenegacion("")
              setSolicitudEnRevision(null)
            }
          }}>
            <PatientNotFoundModal
              reserva={reservaSinPaciente}
              motivoDenegacion={motivoDenegacion}
              onMotivoDenegacionChange={setMotivoDenegacion}
              onCrearHistoriaClinica={handleCrearHistoriaClinica}
              onDenegar={handleDenegarSinPaciente}
              onCancel={() => {
                setShowPacienteNoEncontradoModal(false)
                setReservaSinPaciente(null)
                setMotivoDenegacion("")
                setSolicitudEnRevision(null)
              }}
              isDenegando={isDenegando}
            />
          </Dialog>

          {/* Modal de advertencia de revisión pendiente */}
          <Dialog open={showRevisionPendienteModal} onOpenChange={setShowRevisionPendienteModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-5 w-5" />
                  Revisión Pendiente
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  No puedes revisar esta solicitud hasta que no termines la solicitud pendiente.
                </DialogDescription>
              </DialogHeader>
              
              {solicitudEnRevision && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-orange-900">Solicitud en Revisión:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Código:</span>
                      <span className="font-medium text-orange-700">{solicitudEnRevision.codigo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paciente:</span>
                      <span className="font-medium">{solicitudEnRevision.nombres}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Documento:</span>
                      <span className="font-medium">{solicitudEnRevision.numeroDocumento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Especialidad:</span>
                      <span className="font-medium">{solicitudEnRevision.especialidadNombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Médico:</span>
                      <span className="font-medium">{solicitudEnRevision.medicoNombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-medium">{solicitudEnRevision.fecha} - {solicitudEnRevision.hora}</span>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowRevisionPendienteModal(false)
                    // Buscar la solicitud en revisión en el filtro
                    if (solicitudEnRevision) {
                      setSearchTerm(solicitudEnRevision.codigo)
                    }
                  }}
                  className="w-full"
                >
                  Entendido
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de confirmación de reversión - Usa componente separado para evitar re-renders */}
          <Dialog open={showRevertirModal} onOpenChange={(open) => {
            setShowRevertirModal(open)
            if (!open) {
              setReservaARevertir(null)
            }
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-orange-600">
                  <RotateCcw className="h-5 w-5" />
                  Revertir Solicitud
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  Esta acción revertirá el estado de la solicitud a PENDIENTE.
                  {reservaARevertir?.estado === "CITADO" && " La cita asignada será liberada automáticamente."}
                </DialogDescription>
              </DialogHeader>
              
              {reservaARevertir && (
                <RevertirModalContent
                  reserva={reservaARevertir}
                  isLoading={isRevirtiendo}
                  onConfirm={handleConfirmarReversion}
                  onCancel={() => {
                    setShowRevertirModal(false)
                    setReservaARevertir(null)
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Modal para mostrar el motivo de denegación */}
          <Dialog open={showMotivoModal} onOpenChange={(open) => {
            setShowMotivoModal(open)
            if (!open) {
              setMotivoSeleccionado("")
            }
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Motivo de Denegación
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  A continuación se muestra el motivo por el cual fue denegada esta solicitud.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Motivo de Rechazo:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {motivoSeleccionado || "No se especificó un motivo"}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowMotivoModal(false)
                    setMotivoSeleccionado("")
                  }}
                  className="w-full"
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Búsqueda de Paciente - Solo carga contextos cuando se abre */}
          {showSearchModal && reservaSinPaciente && (
            <FiliationProvider>
              <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
                <PatientSearchModal
                  prefilledDocument={reservaSinPaciente.numeroDocumento}
                  onSearchComplete={handleSearchComplete}
                  onPatientFound={handlePatientFound}
                  onCancel={handleSearchCancel}
                />
              </Dialog>
            </FiliationProvider>
          )}

          {/* Modal de Registro de Paciente - Solo carga contextos cuando se abre */}
          {showRegistrationModal && reservaSinPaciente && (
            <FiliationProvider>
              <Dialog open={showRegistrationModal} onOpenChange={setShowRegistrationModal}>
                <PatientRegistrationModal
                  reniecData={reniecData}
                  sisData={sisData}
                  documentType={reservaSinPaciente.tipoDocumento}
                  documentNumber={reservaSinPaciente.numeroDocumento}
                  onCancel={() => {
                    setShowRegistrationModal(false)
                    setReniecData(null)
                    setSisData(null)
                    setShowPacienteNoEncontradoModal(true)
                  }}
                  onSuccess={handleRegistrationSuccess}
                />
              </Dialog>
            </FiliationProvider>
          )}
          </div>
        </SegurosCitaProvider>
      </TipoCitaProvider>
    </RoleBasedRoute>
  )
}
