"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ConsultorioCitasSelector } from "../selectors/ConsultorioCitasSelector"
import { MedicoSelector } from "../selectors/MedicoSelector"
import { AppointmentDetailsModal } from "./AppointmentDetailsModal"
import { History, Search, Calendar, User, Eye, Loader2, AlertCircle, RefreshCw, CalendarIcon, Filter, ChevronDown, ChevronUp, Printer, UserCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { extractDocumentFromToken, extractNombreCompletoFromToken } from "@/utils/jwtUtils"
import { imprimirCita, CitaDto, formatDateToDDMMYYYY, formatDateTimeToDDMMYYYY } from "@/services/appointments/printService"
import { PatientViewModal } from "@/components/filiation/modals/PatientViewModal"
import { TicketPreviewModal, type TicketData } from "./TicketPreviewModal"
import { API_ENDPOINTS, buildUrl } from "@/lib/api-config"
import { searchCitasByDocumento, searchCitasByNombres } from "@/services/citas/citasService"
import { TipoDocumentoSelector } from "@/components/filiation/selectors/TipoDocumentoSelector"
import { useTipoDocumento } from "@/contexts/filiation/TipoDocumentoContext"

// Estado options for appointments
const ESTADO_OPTIONS = [
  { value: "all", label: "Todos los Estados", color: "bg-gray-500" },
  { value: "1", label: "NO OTORGADA", color: "bg-gray-500" },
  { value: "2", label: "SIN PAGO O FUA", color: "bg-yellow-500" },
  { value: "3", label: "CON PAGO O FUA", color: "bg-blue-500" },
  { value: "4", label: "ATENDIDO", color: "bg-green-500" },
  { value: "5", label: "DESERCIÓN", color: "bg-red-500" }
]

interface AppointmentHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

interface HistoryAppointment {
  id: string
  fecha: string
  hora: string
  estado: number
  consultorio: string
  consultorioNombre?: string
  medico: string
  medicoNombre?: string
  paciente: string
  numero?: string
  turno?: string
  tipoConsulta?: string
  entidadSis?: string
  numRef?: string
  seguro?: string
  seguroNombre?: string
  diagnostico?: string
  [key: string]: any
}

interface PatientInfo {
  paciente: string
  historia: string
  nombres: string
  sexo: string
  direccion: string
  fechaNacimiento: string
  distrito: string
  nombreDocumento: string
  documento: string
  nombreSeguro: string
  nombreLocalidad: string
  distritoDir: string
  seguro: string
  tipoDocumento: string
  telefono1: string
  telefono2: string
  stringFoto?: string
  foto?: string
}

export function AppointmentHistoryModal({ isOpen, onClose }: AppointmentHistoryModalProps) {
  // Date range filters - Por defecto 1 año de antigüedad
  const [fechaDesde, setFechaDesde] = useState<Date>(() => {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    return oneYearAgo
  })
  const [fechaHasta, setFechaHasta] = useState<Date>(new Date())

  // Search filters
  const [searchType, setSearchType] = useState<string>("documento")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [documentType, setDocumentType] = useState<string>("D")

  // Contexto de tipos de documento
  const { getTipoDocumentoByCode } = useTipoDocumento()
  
  // Limpiar filtros cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("")
      setDocumentType("D")
      setAppointments([])
      setHasSearched(false)
      setError(null)
      setCurrentPage(0)
      setPatientInfo(null)
      // Resetear fecha a 1 año atrás
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      setFechaDesde(oneYearAgo)
      setFechaHasta(new Date())
    }
  }, [isOpen])

  // Quick filters
  const [estadoFilter, setEstadoFilter] = useState<string>("all")
  const [consultorioFilter, setConsultorioFilter] = useState<string>("all")
  const [medicoFilter, setMedicoFilter] = useState<string>("all")

  // UI state
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false)

  // Data and UI state
  const [appointments, setAppointments] = useState<HistoryAppointment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<HistoryAppointment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const [isLoadingPatient, setIsLoadingPatient] = useState(false)
  const [showTicketPreview, setShowTicketPreview] = useState(false)
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [isLoadingTicket, setIsLoadingTicket] = useState<string | null>(null)
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null)
  const [isLoadingPatientInfo, setIsLoadingPatientInfo] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const [photoSrc, setPhotoSrc] = useState<string | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const getEstadoBadge = (estado: number) => {
    const estadoInfo = ESTADO_OPTIONS.find((opt) => opt.value === estado.toString())
    return (
      <Badge className={`${estadoInfo?.color || 'bg-gray-500'} text-white font-bold text-xs`}>
        {estadoInfo?.label || 'DESCONOCIDO'}
      </Badge>
    )
  }

  const formatTurno = (turno: string) => {
    if (!turno) return ''
    const turnoUpper = turno.toUpperCase().trim()
    if (turnoUpper === 'M' || turnoUpper === 'MAÑANA') return 'MAÑANA'
    if (turnoUpper === 'T' || turnoUpper === 'TARDE') return 'TARDE'
    if (turnoUpper === 'N' || turnoUpper === 'NOCHE') return 'NOCHE'
    return turno // Devolver original si no coincide
  }

  const getTipoConsultaNombre = (tipo: string) => {
    if (!tipo) return '-'
    const tipoUpper = tipo.toUpperCase().trim()
    switch (tipoUpper) {
      case 'A': return 'Cita Adicional'
      case 'C': return 'Citado'
      case 'D': return 'Demanda'
      case 'R': return 'Cita Referencia'
      case 'I': return 'Interconsulta HOS'
      case 'N': return 'Interconsulta CON'
      default: return tipo
    }
  }

  const searchHistory = async (searchAllHistory = false, isManualSearch = false) => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (!searchTerm.trim()) {
        setError('Debe ingresar un término de búsqueda')
        setIsLoading(false)
        return
      }

      // Solo permitir búsqueda si es manual o es paginación de una búsqueda existente
      if (!isManualSearch && !hasSearched) {
        setIsLoading(false)
        return
      }

      // Construir filtros para los servicios de Spring
      const filters: any = {}

      // Date range (only if additional filters are enabled and not searching all history)
      if (!searchAllHistory && showAdditionalFilters) {
        filters.fechaDesde = fechaDesde.toISOString().split('T')[0]
        filters.fechaHasta = fechaHasta.toISOString().split('T')[0]
      }

      // Additional filters (only if enabled)
      if (showAdditionalFilters) {
        if (estadoFilter !== 'all') {
          filters.estado = parseInt(estadoFilter)
        }
        if (consultorioFilter !== 'all') {
          filters.consultorio = consultorioFilter
        }
        if (medicoFilter !== 'all') {
          filters.medico = medicoFilter
        }
      }

      const term = searchTerm.trim()
      let result

      // Llamar directamente a Spring, sin pasar por /api/appointments/search-by-...
      if (searchType === 'documento') {
        result = await searchCitasByDocumento(term, filters, currentPage, 10, documentType)
      } else if (searchType === 'nombres') {
        result = await searchCitasByNombres(term, filters, currentPage, 10)
      } else {
        throw new Error('Tipo de búsqueda no soportado')
      }

      const fetchedAppointments: HistoryAppointment[] = result.content || []
      setAppointments(fetchedAppointments)
      setTotalCount(result.totalElements || 0)
      setHasSearched(true)
      fetchPatientInfo(searchTerm.trim(), searchType, fetchedAppointments[0], documentType)
      
    } catch (err) {
      console.error('Error searching appointment history:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al buscar el historial de citas. Intente nuevamente.'
      setError(errorMessage)
      setAppointments([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(0)
    searchHistory(false, true) // Búsqueda manual
  }

  const handleSearchAllHistory = () => {
    setCurrentPage(0)
    searchHistory(true, true) // Búsqueda manual
  }

  const handleRetry = () => {
    searchHistory(false, true) // Búsqueda manual
  }

  const handleViewDetails = (appointment: HistoryAppointment) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }

  const handleViewPatient = async (pacienteId: string) => {
    try {
      setIsLoadingPatient(true)
      const response = await fetch(API_ENDPOINTS.filiation.byId(pacienteId))
      
      if (!response.ok) {
        throw new Error('No se pudo cargar los datos del paciente')
      }
      
      const patientData = await response.json()
      setSelectedPatient(patientData)
      setShowPatientModal(true)
    } catch (error) {
      console.error('Error al cargar paciente:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la historia clínica del paciente",
        variant: "destructive"
      })
    } finally {
      setIsLoadingPatient(false)
    }
  }

  const handlePrintClick = async (citaId: string) => {
    try {
      setIsLoadingTicket(citaId)
      
      // Obtener datos completos de la cita
      const response = await fetch(API_ENDPOINTS.citas.byId(citaId))
      
      if (!response.ok) {
        throw new Error('No se pudo obtener los datos de la cita')
      }
      
      const citaData = await response.json()
      
      // Obtener el operador desde el JWT
      const operador = extractNombreCompletoFromToken() || 'OPERADOR'
      
      // Formatear turno
      const turnoConsulta = citaData.turnoConsulta || ''
      const turnoFormateado = turnoConsulta.trim().toUpperCase() === 'M' ? 'Mañana' : 
                              turnoConsulta.trim().toUpperCase() === 'T' ? 'Tarde' : turnoConsulta
      
      // Construir el TicketData para preview
      const ticket: TicketData = {
        numero: citaData.citaId || citaId,
        numeroAtencion: citaData.numero || '',
        paciente: citaData.nombre || '',
        consultorio: citaData.consultorioNombre || '',
        medico: citaData.medicoNombre || '',
        diaAtencion: formatDateToDDMMYYYY(citaData.fecha || new Date().toISOString()),
        turno: turnoFormateado,
        hora: citaData.hora || '',
        historiaClinica: citaData.historia ? String(citaData.historia).trim() : '',
        emitidoEl: formatDateTimeToDDMMYYYY(new Date().toISOString()),
        operador: operador,
        seguro: citaData.seguroNombre || 'PAGANTE',
        // Campos SIS (solo si el seguro es SIS: códigos 20-25)
        numRef: citaData.numRef || citaData.nroRef || '',
        entidadSis: citaData.entidadSis || citaData.eess || '',
        codigoSeguro: citaData.seguro?.trim() || ''  // Código del seguro para validar si es SIS
      }
      
      setTicketData(ticket)
      setShowTicketPreview(true)
      
    } catch (error) {
      console.error('❌ Error al cargar datos de cita:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar los datos de la cita. Intente nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingTicket(null)
    }
  }

  // Función para formatear fecha correctamente sin desfase
  const formatFecha = (fechaStr: string): string => {
    if (!fechaStr) return '-'
    
    // Si viene en formato DD/MM/YYYY, retornar tal cual
    if (fechaStr.includes('/')) {
      return fechaStr
    }
    
    // Si viene en formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
    const fecha = fechaStr.split('T')[0] // Obtener solo la parte de la fecha
    const [year, month, day] = fecha.split('-')
    return `${day}/${month}/${year}`
  }

  const getPatientPhotoSrc = (stringFoto?: string): string | null => {
    if (!stringFoto || stringFoto.trim() === '') return null
    const cleaned = stringFoto.replace(/\s+/g, '')
    if (cleaned.startsWith('data:')) return cleaned

    // Detectar formato por prefijo base64
    let mime = 'image/jpeg'
    if (cleaned.startsWith('iVBORw0KGgo')) mime = 'image/png'
    else if (cleaned.startsWith('R0lGOD')) mime = 'image/gif'
    else if (cleaned.startsWith('UklGR')) mime = 'image/webp'

    return `data:${mime};base64,${cleaned}`
  }

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const m = hoy.getMonth() - nacimiento.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  const buildPatientInfoFromAppointment = (appt: HistoryAppointment, term: string, type: string, documentType: string = ''): PatientInfo => {
    const a = appt as any
    const docTypeCode = a.tipoDocumento || (type === 'documento' ? documentType : '')
    const docTypeName = getTipoDocumentoByCode(docTypeCode)?.nombre?.replace(/^\*/, '') || docTypeCode

    return {
      paciente: appt.paciente || '',
      historia: appt.paciente || '',
      nombres: a.nombre || appt.paciente || term || '',
      sexo: a.sexo || '',
      direccion: a.direccion || '',
      fechaNacimiento: a.fechaNacimiento || '',
      distrito: a.distrito || '',
      nombreDocumento: docTypeName,
      documento: a.documento || (type === 'documento' ? term : ''),
      nombreSeguro: appt.seguroNombre || '',
      nombreLocalidad: a.distritoDir || '',
      distritoDir: a.distritoDir || '',
      seguro: appt.seguro || '',
      tipoDocumento: docTypeCode,
      telefono1: a.telefono1 || '',
      telefono2: a.telefono2 || '',
      foto: a.foto || a.stringFoto || undefined,
      stringFoto: a.stringFoto || a.foto || undefined,
    }
  }

  const buildPatientInfoFromFiliation = (p: any, term: string, type: string, documentType: string = ''): PatientInfo => {
    const docTypeCode = p.TIPO_DOCUMENTO || p.tipoDocumento || (type === 'documento' ? documentType : '')
    const docTypeName = getTipoDocumentoByCode(docTypeCode)?.nombre?.replace(/^\*/, '') || docTypeCode

    return {
      paciente: p.PACIENTE || p.paciente || '',
      historia: p.HISTORIA || p.historia || p.PACIENTE || p.paciente || '',
      nombres: p.NOMBRES || p.nombres || p.nombre || term || '',
      sexo: p.SEXO || p.sexo || '',
      direccion: p.DIRECCION || p.direccion || '',
      fechaNacimiento: p.FECHA_NACIMIENTO || p.fechaNacimiento || '',
      distrito: p.DISTRITO || p.distrito || '',
      nombreDocumento: docTypeName,
      documento: p.DOCUMENTO || p.documento || (type === 'documento' ? term : ''),
      nombreSeguro: p.SEGURO_NOMBRE || p.nombreSeguro || '',
      nombreLocalidad: p.DISTRITO_DIR || p.distritoDir || '',
      distritoDir: p.DISTRITO_DIR || p.distritoDir || '',
      seguro: p.SEGURO || p.seguro || '',
      tipoDocumento: docTypeCode,
      telefono1: p.TELEFONO1 || p.telefono1 || p.TELEFONO || p.telefono || '',
      telefono2: p.TELEFONO2 || p.telefono2 || '',
      foto: p.FOTO || p.foto || p.STRING_FOTO || p.stringFoto || undefined,
      stringFoto: p.STRING_FOTO || p.stringFoto || p.FOTO || p.foto || undefined,
    }
  }

  const fetchPatientInfo = async (term: string, type: string, fallbackAppt?: HistoryAppointment, documentType: string = '') => {
    try {
      setIsLoadingPatientInfo(true)
      setPatientInfo(null)

      let paciente: any = null

      if (type === 'documento') {
        const url = buildUrl(API_ENDPOINTS.filiation.searchByDocument, { documento: term, tipoDocumento: documentType || 'D' })
        const res = await fetch(url, { headers: { accept: '*/*' } })

        if (!res.ok) {
          console.error('❌ Error del servicio de búsqueda por documento:', res.status, await res.text())
        } else {
          const data: any = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            paciente = data[0]
          } else if (data && !Array.isArray(data)) {
            const list = data.content || data.pacientes || data.result || data.data
            if (Array.isArray(list) && list.length > 0) {
              paciente = list[0]
            } else if (list && typeof list === 'object') {
              paciente = list
            } else {
              paciente = data
            }
          }
        }
      } else if (type === 'nombres') {
        const url = buildUrl(API_ENDPOINTS.filiation.searchByName, { nombres: term })
        const res = await fetch(url, { headers: { accept: '*/*' } })

        if (!res.ok) {
          console.error('❌ Error del servicio de búsqueda por nombre:', res.status, await res.text())
        } else {
          const data: any = await res.json()
          const list = Array.isArray(data) ? data : (data.data || data.content || data.pacientes || data.result || [])
          paciente = Array.isArray(list) ? list[0] : (list && typeof list === 'object' ? list : undefined)
        }
      }

      if (paciente) {
        setPatientInfo(buildPatientInfoFromFiliation(paciente, term, type, documentType))
        return
      }

      if (fallbackAppt) {
        setPatientInfo(buildPatientInfoFromAppointment(fallbackAppt, term, type, documentType))
      } else {
        setPatientInfo(null)
      }
    } catch (e) {
      console.error('Error fetching patient info:', e)
      if (fallbackAppt) {
        setPatientInfo(buildPatientInfoFromAppointment(fallbackAppt, term, type, documentType))
      } else {
        setPatientInfo(null)
      }
    } finally {
      setIsLoadingPatientInfo(false)
    }
  }

  const resetFilters = () => {
    // NO borrar searchTerm ni cerrar showAdditionalFilters
    // Solo resetear los filtros adicionales
    setEstadoFilter("all")
    setConsultorioFilter("all")
    setMedicoFilter("all")
    // Resetear fechas a 1 año de antigüedad (valor por defecto)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    setFechaDesde(oneYearAgo)
    setFechaHasta(new Date())
    setCurrentPage(0)
    // Mantener appointments y hasSearched para no perder los resultados
    setError(null)
  }

  // Don't load initial data - wait for user to search
  // useEffect(() => {
  //   if (isOpen && !hasSearched) {
  //     searchHistory()
  //   }
  // }, [isOpen])

  // Handle pagination changes
  useEffect(() => {
    if (hasSearched && currentPage > 0) {
      searchHistory()
    }
  }, [currentPage])

  // Compute photo source when patient info changes
  useEffect(() => {
    if (patientInfo) {
      const raw = patientInfo.foto || patientInfo.stringFoto
      const src = getPatientPhotoSrc(raw)
      setPhotoError(false)
      setPhotoSrc(src)
    } else {
      setPhotoSrc(null)
    }
  }, [patientInfo])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-purple-800 flex flex-wrap items-center">
              <History className="mr-2 h-5 w-5" />
              Historial de Citas
            </DialogTitle>
            <DialogDescription>
              Consulte el historial completo de citas médicas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-3 flex flex-wrap items-center">
                <Search className="mr-2 h-4 w-4" />
                Búsqueda de Paciente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Buscar por</Label>
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="documento">Documento</SelectItem>
                      <SelectItem value="nombres">Apellidos y Nombres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {searchType === 'documento' && (
                  <div className="md:col-span-3">
                    <Label className="text-sm font-medium text-gray-700">Tipo de Documento</Label>
                    <div className="mt-1">
                      <TipoDocumentoSelector
                        value={documentType}
                        onChange={setDocumentType}
                        excludeCodes={['0']}
                      />
                    </div>
                  </div>
                )}
                <div className={searchType === 'documento' ? 'md:col-span-5' : 'md:col-span-8'}>
                  <Label className="text-sm font-medium text-gray-700">
                    {searchType === 'documento' ? 'Número de Documento' : 'Apellidos y Nombres'}
                  </Label>
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      searchType === 'documento' ? 'Ingrese número de documento' : 'Ingrese apellidos y nombres'
                    }
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={handleSearch} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Filters Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <Checkbox
                id="show-filters"
                checked={showAdditionalFilters}
                onCheckedChange={(checked) => setShowAdditionalFilters(checked === true)}
              />
              <Label 
                htmlFor="show-filters" 
                className="text-sm font-medium text-gray-700 cursor-pointer flex flex-wrap items-center"
              >
                <Filter className="mr-2 h-4 w-4" />
                Mostrar filtros adicionales
                {showAdditionalFilters ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Label>
            </div>

            {/* Collapsible Filters Section */}
            {showAdditionalFilters && (
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-400 animate-in slide-in-from-top-2 duration-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex flex-wrap items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros Adicionales
                </h3>
                
                {/* Date Range - Improved */}
                <div className="mb-4">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block flex flex-wrap items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Rango de Fechas
                  </Label>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">Fecha Desde</Label>
                        <Input
                          type="date"
                          value={fechaDesde.toISOString().split('T')[0]}
                          onChange={(e) => setFechaDesde(new Date(e.target.value))}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:pt-6">
                        <div className="w-full sm:w-6 h-px sm:h-1 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">Fecha Hasta</Label>
                        <Input
                          type="date"
                          value={fechaHasta.toISOString().split('T')[0]}
                          onChange={(e) => setFechaHasta(new Date(e.target.value))}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date()
                        setFechaDesde(today)
                        setFechaHasta(today)
                      }}
                      className="text-xs bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400"
                    >
                      Hoy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date()
                        const lastWeek = new Date()
                        lastWeek.setDate(today.getDate() - 7)
                        setFechaDesde(lastWeek)
                        setFechaHasta(today)
                      }}
                      className="text-xs bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                    >
                      Última semana
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date()
                        const lastMonth = new Date()
                        lastMonth.setMonth(today.getMonth() - 1)
                        setFechaDesde(lastMonth)
                        setFechaHasta(today)
                      }}
                      className="text-xs bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400"
                    >
                      Último mes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date()
                        const lastYear = new Date()
                        lastYear.setFullYear(today.getFullYear() - 1)
                        setFechaDesde(lastYear)
                        setFechaHasta(today)
                      }}
                      className="text-xs bg-blue-50 border-blue-400 text-blue-800 hover:bg-blue-100 hover:border-blue-500 font-medium"
                    >
                      Último año
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date()
                        const fiveYearsAgo = new Date()
                        fiveYearsAgo.setFullYear(today.getFullYear() - 5)
                        setFechaDesde(fiveYearsAgo)
                        setFechaHasta(today)
                      }}
                      className="text-xs bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-500 font-medium"
                    >
                      Últimos 5 años
                    </Button>
                  </div>
                </div>

                {/* Other Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Estado</Label>
                    <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADO_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Consultorio</Label>
                    <ConsultorioCitasSelector
                      label=""
                      value={consultorioFilter}
                      onChange={setConsultorioFilter}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Médico</Label>
                    <MedicoSelector
                      label=""
                      value={medicoFilter}
                      onChange={setMedicoFilter}
                    />
                  </div>
                </div>
                
                {/* Filter Actions */}
                <div className="flex flex-wrap justify-end mt-4 pt-3 border-t">
                  <Button variant="outline" onClick={resetFilters} size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Limpiar Filtros
                  </Button>
                </div>
              </div>
            )}

            {/* Patient Info Card */}
            {hasSearched && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-blue-600 px-4 py-2 flex flex-wrap items-center gap-2">
                  <User className="h-4 w-4 text-white" />
                  <span className="text-sm font-semibold text-white">Ficha del Paciente</span>
                </div>
                <div className="p-4">
                  {isLoadingPatientInfo ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando datos del paciente...
                    </div>
                  ) : patientInfo ? (
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Foto */}
                      {photoSrc && !photoError ? (
                        <img
                          key={photoSrc}
                          src={photoSrc}
                          alt="Foto paciente"
                          onError={(e) => {
                            console.error('❌ Error cargando foto base64:', e)
                            setPhotoError(true)
                          }}
                          className="w-16 h-16 rounded-full object-cover border-2 border-blue-300 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-300 flex flex-wrap items-center justify-center flex-shrink-0">
                          <User className="h-8 w-8 text-blue-400" />
                        </div>
                      )}
                      {/* Datos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base font-bold text-gray-900">{patientInfo.nombres}</h3>
                          <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                            {patientInfo.sexo === 'M' ? 'Masculino' : patientInfo.sexo === 'F' ? 'Femenino' : patientInfo.sexo}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-1 text-xs text-gray-600">
                          <div>
                            <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wide">Edad</span>
                            <p className="font-bold text-gray-900 text-sm">
                              {patientInfo.fechaNacimiento
                                ? `${calcularEdad(patientInfo.fechaNacimiento)} años`
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wide">Documento</span>
                            <p className="font-medium text-gray-800">{patientInfo.nombreDocumento?.trim()} {patientInfo.documento}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wide">Seguro</span>
                            <p className="font-medium text-gray-800">{patientInfo.nombreSeguro || '-'}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wide">Historia</span>
                            <p className="font-medium text-gray-800">{patientInfo.historia}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wide">Teléfono</span>
                            <p className="font-medium text-gray-800">
                              {patientInfo.telefono1?.trim() || '-'}
                              {patientInfo.telefono2?.trim() && patientInfo.telefono2.trim() !== '' && ` / ${patientInfo.telefono2.trim()}`}
                            </p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wide">F. Nacimiento</span>
                            <p className="font-medium text-gray-800">
                              {patientInfo.fechaNacimiento
                                ? new Date(patientInfo.fechaNacimiento).toLocaleDateString('es-ES')
                                : '-'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wide">Dirección</span>
                            <p className="font-medium text-gray-800 truncate">
                              {patientInfo.direccion?.trim() || '-'}{patientInfo.distritoDir ? `, ${patientInfo.distritoDir}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      No se encontró información del paciente en el servicio de búsqueda.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Section */}
            {isLoading && (
              <div className="text-center py-8">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600 mb-3" />
                <p className="text-gray-600">Cargando historial de citas...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
              </div>
            )}

            {!hasSearched && !isLoading && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <History className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Historial de Citas</h3>
                <p className="text-gray-500 mb-4">
                  Ingrese los criterios de búsqueda para consultar el historial de citas
                </p>
                <p className="text-sm text-gray-400">
                  Puede buscar por documento o apellidos y nombres del paciente
                </p>
              </div>
            )}

            {hasSearched && !isLoading && !error && appointments.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600 mb-4">
                  No se encontraron citas en el rango de fechas seleccionado
                </p>
                <Button variant="outline" onClick={handleSearchAllHistory}>
                  Buscar todo el historial
                </Button>
              </div>
            )}

            {hasSearched && !isLoading && !error && appointments.length > 0 && (
              <>
                {/* Results Table */}
                <div className="border rounded-lg overflow-x-auto table-responsive w-full">
                  <Table className="text-sm w-full min-w-[800px]">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="px-1.5 py-1.5">Fecha y Hora</TableHead>
                        <TableHead className="px-1.5 py-1.5">Estado</TableHead>
                        <TableHead className="px-1.5 py-1.5">Consultorio</TableHead>
                        <TableHead className="px-1.5 py-1.5">Médico</TableHead>
                        <TableHead className="px-1.5 py-1.5">Tipo Consulta</TableHead>
                        <TableHead className="px-1.5 py-1.5">Tipo Seguro</TableHead>
                        <TableHead className="px-1.5 py-1.5">Num Referencia</TableHead>
                        <TableHead className="px-1.5 py-1.5">Diagnóstico</TableHead>
                        <TableHead className="text-center px-1.5 py-1.5">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment.id} className="hover:bg-gray-50">
                          <TableCell className="px-1.5 py-1.5">
                            <span className="font-medium whitespace-nowrap">{formatFecha(appointment.fecha)}</span>
                            {appointment.hora && <span className="text-gray-500 ml-1 whitespace-nowrap">{appointment.hora}</span>}
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5">{getEstadoBadge(appointment.estado)}</TableCell>
                          <TableCell className="px-1.5 py-1.5 leading-tight">
                            {appointment.consultorioNombre || appointment.consultorio}
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5 leading-tight font-medium">
                            {appointment.medicoNombre || appointment.medico}
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5 leading-tight">
                            {getTipoConsultaNombre(appointment.tipoConsulta || '')}
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5 leading-tight">
                            {appointment.seguro + ' - ' + appointment.seguroNombre || '-'}
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5 leading-tight">
                            {appointment.numRef || '-'}
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5 leading-tight text-gray-600" title={appointment.diagnostico || ''}>
                            {appointment.diagnostico || <span className="text-gray-400">-</span>}
                          </TableCell>
                          <TableCell className="px-1.5 py-1.5">
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(appointment)}
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintClick(appointment.id)}
                                disabled={isLoadingTicket === appointment.id}
                                title="Ver ticket de cita"
                              >
                                {isLoadingTicket === appointment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Printer className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewPatient(appointment.paciente)}
                                title="Ver historia clínica"
                              >
                                <UserCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="text-sm text-gray-600">
                      Mostrando {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalCount)} de {totalCount} citas
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage > 0) setCurrentPage(currentPage - 1)
                            }}
                            aria-disabled={currentPage <= 0}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink href="#" isActive>
                            {currentPage + 1}
                          </PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1)
                            }}
                            aria-disabled={currentPage >= totalPages - 1}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Close Button */}
          <div className="flex flex-wrap justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedAppointment(null)
        }}
        appointment={selectedAppointment}
        getEstadoBadge={getEstadoBadge}
        formatTurno={formatTurno}
      />

      {/* Patient View Modal */}
      {showPatientModal && selectedPatient && (
        <PatientViewModal
          patient={selectedPatient}
          onClose={() => {
            setShowPatientModal(false)
            setSelectedPatient(null)
          }}
          onEdit={() => {
            // No permitir edición desde aquí
            toast({
              title: "Información",
              description: "Para editar el paciente, use el módulo de filiación",
              variant: "default"
            })
          }}
        />
      )}

      {/* Ticket Preview Modal */}
      <TicketPreviewModal
        isOpen={showTicketPreview}
        onClose={() => {
          setShowTicketPreview(false)
          setTicketData(null)
        }}
        ticketData={ticketData}
      />
    </>
  )
}
