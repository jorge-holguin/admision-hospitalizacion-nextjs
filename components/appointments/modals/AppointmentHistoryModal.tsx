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
  [key: string]: any
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
  
  // Limpiar filtros cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("")
      setAppointments([])
      setHasSearched(false)
      setError(null)
      setCurrentPage(0)
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
      
      const qs = new URLSearchParams()
      
      // Date range (only if additional filters are enabled and not searching all history)
      if (!searchAllHistory && showAdditionalFilters) {
        qs.set('fechaDesde', fechaDesde.toISOString().split('T')[0])
        qs.set('fechaHasta', fechaHasta.toISOString().split('T')[0])
      }
      
      // Additional filters (only if enabled)
      if (showAdditionalFilters) {
        if (estadoFilter !== 'all') {
          qs.set('estado', estadoFilter)
        }
        if (consultorioFilter !== 'all') {
          qs.set('consultorio', consultorioFilter)
        }
        if (medicoFilter !== 'all') {
          qs.set('medico', medicoFilter)
        }
      }
      
      // Pagination
      qs.set('page', currentPage.toString())
      qs.set('size', '10')
      
      let apiUrl = ''
      
      // Determine which API to call based on search type
      if (searchType === 'documento') {
        qs.set('documento', searchTerm.trim())
        apiUrl = `/api/appointments/search-by-document?${qs.toString()}`
      } else if (searchType === 'nombres') {
        qs.set('nombres', searchTerm.trim())
        apiUrl = `/api/appointments/search-by-name?${qs.toString()}`
      }
      
      console.log('Searching with URL:', apiUrl)
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error en la búsqueda')
      }
      
      const data = await response.json()
      
      setAppointments(data.content || [])
      setTotalCount(data.totalElements || 0)
      setHasSearched(true)
      
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/historia-clinica/pacientes/${pacienteId}`)
      
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
      console.log('🎫 Obteniendo datos de la cita para preview:', citaId)
      
      // Obtener datos completos de la cita
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/cita/${citaId}`)
      
      if (!response.ok) {
        throw new Error('No se pudo obtener los datos de la cita')
      }
      
      const citaData = await response.json()
      console.log('📋 Datos de cita recibidos:', citaData)
      
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
        seguro: citaData.seguroNombre || 'PAGANTE'
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

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-purple-800 flex items-center">
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
              <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                <Search className="mr-2 h-4 w-4" />
                Búsqueda de Paciente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
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
                <div className="md:col-span-2">
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
                <div>
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-filters"
                checked={showAdditionalFilters}
                onCheckedChange={(checked) => setShowAdditionalFilters(checked === true)}
              />
              <Label 
                htmlFor="show-filters" 
                className="text-sm font-medium text-gray-700 cursor-pointer flex items-center"
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
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros Adicionales
                </h3>
                
                {/* Date Range - Improved */}
                <div className="mb-4">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Rango de Fechas
                  </Label>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">Fecha Desde</Label>
                        <Input
                          type="date"
                          value={fechaDesde.toISOString().split('T')[0]}
                          onChange={(e) => setFechaDesde(new Date(e.target.value))}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-center pt-6">
                        <div className="w-6 h-px bg-gradient-to-r from-blue-400 to-purple-400"></div>
                      </div>
                      <div className="flex-1">
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
                <div className="flex justify-end mt-4 pt-3 border-t">
                  <Button variant="outline" onClick={resetFilters} size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Limpiar Filtros
                  </Button>
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
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
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>ID Cita</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Consultorio</TableHead>
                        <TableHead>Médico</TableHead>
                        <TableHead>Tipo Consulta</TableHead>
                        <TableHead>Tipo Seguro</TableHead>
                        <TableHead>Num Referencia</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-blue-600">
                            {appointment.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatFecha(appointment.fecha)}
                          </TableCell>
                          <TableCell>{appointment.hora}</TableCell>
                          <TableCell>{getEstadoBadge(appointment.estado)}</TableCell>
                          <TableCell>
                            {appointment.consultorioNombre || appointment.consultorio}
                          </TableCell>
                          <TableCell>
                            {appointment.medicoNombre || appointment.medico}
                          </TableCell>
                          <TableCell className="text-sm">
                            {getTipoConsultaNombre(appointment.tipoConsulta || '')}
                          </TableCell>
                          <TableCell className="text-sm">
                            {appointment.seguro + ' - ' + appointment.seguroNombre || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {appointment.numRef || '-'}
                          </TableCell>
                          <TableCell>{appointment.nombre}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
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
                  <div className="flex items-center justify-between">
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
          <div className="flex justify-end pt-4 border-t">
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
