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
import { History, Search, Calendar, User, Eye, Loader2, AlertCircle, RefreshCw, CalendarIcon, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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
  [key: string]: any
}

export function AppointmentHistoryModal({ isOpen, onClose }: AppointmentHistoryModalProps) {
  // Date filters - default to current day for both
  const [fechaDesde, setFechaDesde] = useState<Date>(new Date())
  const [fechaHasta, setFechaHasta] = useState<Date>(new Date())

  // Search filters
  const [searchType, setSearchType] = useState<string>("documento")
  const [searchTerm, setSearchTerm] = useState<string>("")

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const getEstadoBadge = (estado: number) => {
    const estadoInfo = ESTADO_OPTIONS.find((opt) => opt.value === estado.toString())
    return (
      <Badge className={`${estadoInfo?.color || 'bg-gray-500'} text-white font-medium text-xs`}>
        {estadoInfo?.label || 'DESCONOCIDO'}
      </Badge>
    )
  }

  const searchHistory = async (searchAllHistory = false) => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (!searchTerm.trim()) {
        setError('Debe ingresar un término de búsqueda')
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
      if (searchType === 'documento' || searchType === 'historia') {
        qs.set('documento', searchTerm.trim())
        apiUrl = `/api/citas/search-by-documento?${qs.toString()}`
      } else if (searchType === 'nombres') {
        qs.set('nombres', searchTerm.trim())
        apiUrl = `/api/citas/search-by-nombres?${qs.toString()}`
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
    searchHistory()
  }

  const handleSearchAllHistory = () => {
    setCurrentPage(0)
    searchHistory(true)
  }

  const handleRetry = () => {
    searchHistory()
  }

  const handleViewDetails = (appointment: HistoryAppointment) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }

  const resetFilters = () => {
    setSearchTerm("")
    setEstadoFilter("all")
    setConsultorioFilter("all")
    setMedicoFilter("all")
    setFechaDesde(new Date())
    setFechaHasta(new Date())
    setCurrentPage(0)
    setAppointments([])
    setHasSearched(false)
    setError(null)
    setShowAdditionalFilters(false)
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                      <SelectItem value="historia">Historia Clínica</SelectItem>
                      <SelectItem value="nombres">Apellidos y Nombres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {searchType === 'documento' ? 'Número de Documento' : 
                     searchType === 'historia' ? 'Historia Clínica' : 'Apellidos y Nombres'}
                  </Label>
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      searchType === 'documento' ? 'Ingrese número de documento' : 
                      searchType === 'historia' ? 'Ingrese historia clínica' : 'Ingrese apellidos y nombres'
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
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Rango de Fechas</Label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500">Desde</Label>
                      <Input
                        type="date"
                        value={fechaDesde.toISOString().split('T')[0]}
                        onChange={(e) => setFechaDesde(new Date(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center justify-center pt-6">
                      <div className="w-4 h-px bg-gray-300"></div>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500">Hasta</Label>
                      <Input
                        type="date"
                        value={fechaHasta.toISOString().split('T')[0]}
                        onChange={(e) => setFechaHasta(new Date(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date()
                        setFechaDesde(today)
                        setFechaHasta(today)
                      }}
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
                    >
                      Último mes
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
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Consultorio</TableHead>
                        <TableHead>Médico</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {new Date(appointment.fecha).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>{appointment.hora}</TableCell>
                          <TableCell>{getEstadoBadge(appointment.estado)}</TableCell>
                          <TableCell>
                            {appointment.consultorioNombre || appointment.consultorio}
                          </TableCell>
                          <TableCell>
                            {appointment.medicoNombre || appointment.medico}
                          </TableCell>
                          <TableCell>{appointment.paciente}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(appointment)}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
      />
    </>
  )
}
