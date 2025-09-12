  "use client"

  import React, { useState, useEffect, useCallback } from "react"
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
  import { Badge } from "@/components/ui/badge"
  import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar"
  import { ConsultorioCitasSelector } from "@/components/appointments/ConsultorioCitasSelector"
  import { MedicoSelector } from "@/components/appointments/MedicoSelector"
  import { EstadoSelector, ESTADO_OPTIONS } from "@/components/appointments/EstadoSelector"
  import { AppointmentsTable } from "@/components/appointments/AppointmentsTable"
  import { ShiftFilter } from "@/components/appointments/ShiftFilter"
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { ArrowLeft, User, Unlock, CalendarClock, UserPlus, Eye, Search, Filter, Clock, Check, ChevronsUpDown, X } from "lucide-react"
import { PatientSearchModal } from "@/components/appointments/PatientSearchModal"
import { PatientAssignmentModal } from "@/components/appointments/PatientAssignmentModal"
import { AppointmentDetailsModal } from "@/components/appointments/AppointmentDetailsModal"
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
  // Removed date-fns format to avoid TS type import issues; using native formatting below
  import { Navbar } from "@/components/Navbar"
  import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
  import { House } from "lucide-react"

  // Lista vacía para almacenar citas
  const emptyAppointments: any[] = []

  export default function AppointmentsPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedTime, setSelectedTime] = useState<string>("")
    const [filteredAppointments, setFilteredAppointments] = useState(emptyAppointments)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [filters, setFilters] = useState({
      estado: "all",
      consultorio: "all",
      medico: "all",
      turno: "ALL",
    })
    const [searchEstados, setSearchEstados] = useState("")
    const [searchConsultorios, setSearchConsultorios] = useState("")
    const [searchMedicos, setSearchMedicos] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [openMedico, setOpenMedico] = useState(false)
    const [openConsultorio, setOpenConsultorio] = useState(false)
    const [openEstado, setOpenEstado] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [showPatientAssignmentModal, setShowPatientAssignmentModal] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<any>(null)
    const [showRescheduleModal, setShowRescheduleModal] = useState(false)
    const [showReleaseModal, setShowReleaseModal] = useState(false)
    const [showDetailsModal, setShowDetailsModal] = useState(false)

    // Parámetros de paginación para búsqueda remota
    const [pageParam, setPageParam] = useState<number>(1)
    const [sizeParam, setSizeParam] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [lastRemote, setLastRemote] = useState<boolean>(false)

    const getEstadoBadge = (estado: number) => {
      const estadoInfo = ESTADO_OPTIONS.find((opt) => opt.value === estado.toString())
      return <Badge className={`${estadoInfo?.color} text-white font-medium`}>{estadoInfo?.label}</Badge>
    }

    // Buscar citas por parámetros (usa la fecha seleccionada en el calendario como desde/hasta)
    const searchAppointmentsByParams = useCallback(async (dateOverride?: Date) => {
      try {
        const qs = new URLSearchParams()
        const targetDate = dateOverride || selectedDate
        const dateStr = targetDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        qs.set('desde', dateStr)
        qs.set('hasta', dateStr)
        if (filters.consultorio && filters.consultorio !== 'all') qs.set('consultorio', String(filters.consultorio))
        if (filters.medico && filters.medico !== 'all') qs.set('medico', String(filters.medico))
        
        // Agregar filtro de estado si no es "all"
        if (filters.estado && filters.estado !== 'all') {
          qs.set('estado', String(filters.estado))
        }
        
        // Agregar filtro de turno si no es "ALL"
        if (filters.turno && filters.turno !== 'ALL') {
          // Mapear de 'MAÑANA'/'TARDE' a 'M'/'T' para el backend
          const turnoBackend = filters.turno === 'MAÑANA' ? 'M' : filters.turno === 'TARDE' ? 'T' : null
          if (turnoBackend) {
            qs.set('turnoConsulta', turnoBackend)
          }
        }
        
        qs.set('page', String(pageParam))
        qs.set('size', String(sizeParam))

        const url = `${process.env.NEXT_PUBLIC_API_CITAS_URL}/buscar?${qs.toString()}`
        const res = await fetch(url)
        if (!res.ok) {
          return
        }
        const data = await res.json()
        // Determinar si la respuesta es un array o tiene un campo content/items
        const list = Array.isArray(data) ? data : 
                     Array.isArray(data?.content) ? data.content : 
                     Array.isArray(data?.items) ? data.items : []
        
        console.log('API response:', list)
        
        const mapped = list.map((it: any, idx: number) => ({
          id: it.citaId || it.id || it.ID || `R${idx}`,
          estado: Number(it.estado ?? it.ESTADO ?? 1),
          fecha: String(it.fecha ?? it.FECHA ?? new Date().toISOString().slice(0,10)),
          hora: String(it.hora ?? it.HORA ?? "08:00"),
          turno: it.turnoConsulta?.trim() === "T" ? "TARDE" : it.turnoConsulta?.trim() === "M" ? "MAÑANA" : 
                 String(it.turno ?? it.TURNO ?? "MAÑANA"),
          turnoConsulta: String(it.turnoConsulta ?? it.TURNO_CONSULTA ?? ""),
          consultorio: String(it.consultorio ?? it.CONSULTORIO ?? "").trim(),
          consultorioNombre: String(it.consultorioNombre ?? it.CONSULTORIO_NOMBRE ?? it.NOMBRE_CONSULTORIO ?? "").trim(),
          medico: String(it.medico ?? it.MEDICO ?? "").trim(),
          medicoNombre: String(it.medicoNombre ?? it.MEDICO_NOMBRE ?? it.NOMBRE_MEDICO ?? "").trim(),
          seguro: String(it.seguro ?? it.SEGURO ?? ""),
          seguroNombre: String(it.seguroNombre ?? it.SEGURO_NOMBRE ?? it.NOMBRE_SEGURO ?? "").trim(),
          paciente: String(it.nombre ?? it.NOMBRE ?? it.paciente ?? it.PACIENTE ?? "").replace(/^\d+\s*/, "").trim(),
          codigoPaciente: String(it.paciente ?? it.PACIENTE ?? "").trim(),
          numero: String(it.numero ?? it.NUMERO ?? ""),
          usuario: String(it.usuario ?? it.USUARIO ?? ""),
          fechaProgramada: String(it.fechaProgramacion ?? it.fechaProgramada ?? it.FECHA_PROGRAMADA ?? it.FECHAPROGRAMADA ?? ""),
          fechaPago: it.fechaPago ?? it.FECHA_PAGO ?? it.FECHAPAGO ?? null,
          fechaOtorgada: String(it.fechaOtorgada ?? it.FECHA_OTORGADA ?? ""),
          pagoId: String(it.pagoId ?? it.PAGO_ID ?? it.PAGOID ?? ""),
          orden: String(it.orden ?? it.ORDEN ?? ""),
          entidadSis: String(it.entidadSis ?? it.ENTIDAD_SIS ?? it.ENTIDADSIS ?? ""),
          idRefcon: it.idRefcon ?? it.ID_REFCON ?? it.IDREFCON ?? null,
        }))
        setFilteredAppointments(mapped)
        const total = (typeof data?.total === 'number') ? data.total
          : (typeof data?.totalElements === 'number') ? data.totalElements
          : (typeof data?.totalItems === 'number') ? data.totalItems
          : (typeof data?.totalCount === 'number') ? data.totalCount
          : mapped.length
        setTotalCount(total)
        setLastRemote(true)
      } catch (e) {
        // noop silencioso
      }
    }, [selectedDate, filters, pageParam, sizeParam])

    // Estas funciones ya no son necesarias al eliminar los datos de ejemplo

    const applyFilters = () => {
      // Al eliminar los datos de ejemplo, esta función ahora solo debe llamar a la API
      searchAppointmentsByParams()
    }

    const searchAppointmentById = async (query: string) => {
      const id = (query || "").trim()
      if (!id) {
        applyFilters()
        return
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_CITAS_URL}/${encodeURIComponent(id)}`)
        if (!res.ok) {
          applyFilters()
          return
        }
        const data = await res.json()
        const list = Array.isArray(data) ? data : [data]
        const mapped = list.map((it: any) => ({
          id: it.id || it.ID || id,
          estado: Number(it.estado ?? it.ESTADO ?? 1),
          fecha: String(it.fecha ?? it.FECHA ?? new Date().toISOString().slice(0,10)),
          hora: String(it.hora ?? it.HORA ?? "08:00"),
          turno: String(it.turno ?? it.TURNO ?? "MAÑANA"),
          turnoConsulta: String(it.turnoConsulta ?? it.TURNO_CONSULTA ?? ""),
          consultorio: String(it.consultorio ?? it.CONSULTORIO ?? ""),
          medico: String(it.medico ?? it.MEDICO ?? ""),
          seguro: String(it.seguro ?? it.SEGURO ?? ""),
          paciente: String(it.paciente ?? it.PACIENTE ?? ""),
          numero: String(it.numero ?? it.NUMERO ?? ""),
          usuario: String(it.usuario ?? it.USUARIO ?? ""),
          fechaProgramada: String(it.fechaProgramada ?? it.FECHA_PROGRAMADA ?? it.FECHAPROGRAMADA ?? ""),
          fechaPago: it.fechaPago ?? it.FECHA_PAGO ?? it.FECHAPAGO ?? null,
        }))
        setFilteredAppointments(mapped)
      } catch (e) {
        applyFilters()
      }
    }

    const handleDateSelect = async (date: Date | undefined) => {
      if (date) {
        setSelectedDate(date)
        setSelectedTime("") // Reset selected time when date changes
        setPageParam(1) // Reset to first page
        // Automatically search API when date is selected
        await searchAppointmentsByParams(date)
      }
    }

    const handleTimeSelect = (time: string) => {
      setSelectedTime(time)
      // Time filtering is now handled by frontend ShiftFilter, not by specific time slots
      // Keep the selected time for UI purposes but don't filter the appointments
    }

    const handleAction = (action: string, appointment: any) => {
      console.log('🎯 handleAction - Acción:', action, 'Appointment:', {
        id: appointment.id,
        consultorio: appointment.consultorio,
        consultorioNombre: appointment.consultorioNombre,
        medico: appointment.medico,
        medicoNombre: appointment.medicoNombre
      })
      
      setSelectedAppointment(appointment)
      switch (action) {
        case "assign":
          console.log('📋 Abriendo modal de asignación con appointment:', appointment)
          setShowAssignModal(true)
          break
        case "reschedule":
          setShowRescheduleModal(true)
          break
        case "release":
          setShowReleaseModal(true)
          break
        case "details":
          setShowDetailsModal(true)
          break
      }
    }
    
    const handleShiftChange = (shift: 'MAÑANA' | 'TARDE' | 'ALL') => {
      setFilters({ ...filters, turno: shift })
      setPageParam(1) // Reset to page 1 when filter changes
    }

    // Cargar citas del día actual al iniciar y cuando cambien los filtros
  // Use a ref to track if this is the first render
  const isFirstRender = React.useRef(true);
  
  useEffect(() => {
    // Only run on initial load or when filters change
    if (isInitialLoad) {
      searchAppointmentsByParams();
      setIsInitialLoad(false);
    } else if (!searchQuery) {
      // Skip the first effect run after initial load to prevent duplicate calls
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      // Solo aplicar filtros si no hay una búsqueda por ID activa
      searchAppointmentsByParams();
    }
  }, [isInitialLoad, searchQuery, filters, pageParam, sizeParam])

    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Navbar fijo arriba */}
        <Navbar />
    
        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Botón para volver al dashboard */}
          <div className="mb-6">
            <Button 
              variant="destructive" 
              size="lg"
              className="font-bold text-lg" 
              onClick={() => window.location.href = '/dashboard'}
            >
              <House className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Calendario (25%) */}
                <div className="xl:col-span-1 space-y-6">
                  <Card className="shadow-lg border-0">
                    <CardHeader className="bg-blue-50 border-b">
                      <CardTitle className="text-lg text-blue-800 font-semibold">
                        Calendario de Citas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="flex h-[400px]">
                        <div className="flex-1">
                          <AppointmentCalendar
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            className="h-full border-0 rounded-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
    
                {/* Tabla (75%) */}
                <div className="xl:col-span-3">
                  <Card className="shadow-lg border-0">
                    <CardHeader className="bg-blue-50 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-blue-800 font-semibold">
                          Lista de Citas
                          {selectedTime && (
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              - {selectedTime}
                            </span>
                          )}
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilters({
                              estado: "all",
                              consultorio: "all",
                              medico: "all",
                              turno: "ALL",
                            })
                            setPageParam(1)
                            setSelectedTime("")
                            searchAppointmentsByParams()
                          }}
                          className="font-medium"
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Limpiar Filtros
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Filtros reorganizados con flex columns responsivo */}
                      <div className="space-y-4 mb-6">
                        {/* Primera fila: Filtros de turno y búsqueda */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <ShiftFilter onShiftChange={handleShiftChange} className="flex-shrink-0" />
                          {/* Buscador por ID */}
                          <div className="flex items-center w-full sm:w-auto">
                            <Search className="h-4 w-4 mr-2 text-gray-500" />
                            <Input
                              placeholder="ID de cita..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  searchAppointmentById(searchQuery)
                                }
                              }}
                              className="w-full sm:w-[300px]"
                              inputMode="numeric"
                              pattern="[0-9]*"
                            />
                          </div>
                          <Button
                            onClick={() => searchAppointmentsByParams()}
                            className="font-medium w-full sm:w-auto"
                          >
                            Buscar
                          </Button>
                        </div>
                      </div>
    
                      {/* Filtros */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <EstadoSelector
                          label="Estado"
                          value={filters.estado}
                          onChange={(val: string | "all") => {
                            setFilters({ ...filters, estado: val })
                            setPageParam(1) // Reset to page 1 when filter changes
                          }}
                          className="space-y-2"
                          options={ESTADO_OPTIONS}
                        />
    
                        <ConsultorioCitasSelector
                          label="Consultorio"
                          value={filters.consultorio}
                          onChange={(val: string | "all") => {
                            setFilters({ ...filters, consultorio: val })
                            setPageParam(1) // Reset to page 1 when filter changes
                          }}
                          className="space-y-2"
                        />
    
                        <MedicoSelector
                          label="Médico"
                          value={filters.medico}
                          onChange={(val: string | "all") => {
                            setFilters({ ...filters, medico: val })
                            setPageParam(1) // Reset to page 1 when filter changes
                          }}
                          className="mt-1"
                        />
                      </div>
    
                      {/* Tabla de citas */}
                      {(() => {
                        const start = (pageParam - 1) * sizeParam
                        const end = start + sizeParam
                        const pageItems = lastRemote
                          ? filteredAppointments
                          : filteredAppointments.slice(start, end)
                        return (
                          <AppointmentsTable
                            appointments={pageItems as any}
                            getEstadoBadge={getEstadoBadge}
                            onAction={handleAction}
                          />
                        )
                      })()}
    
                      {/* Paginación */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">
                          Mostrando{" "}
                          {Math.min(
                            (pageParam - 1) * sizeParam + 1,
                            Math.max(totalCount, 0)
                          )}
                          -
                          {Math.min(pageParam * sizeParam, totalCount)} de{" "}
                          {totalCount}
                        </div>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (pageParam <= 1) return
                                  const newPage = Math.max(1, pageParam - 1)
                                  setPageParam(newPage)
                                  // API call will be triggered by useEffect when pageParam changes
                                }}
                                aria-disabled={pageParam <= 1}
                              />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink href="#" isActive>
                                {pageParam}
                              </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  const totalPages = Math.max(
                                    1,
                                    Math.ceil(totalCount / sizeParam)
                                  )
                                  const disabled =
                                    pageParam * sizeParam >= totalCount &&
                                    !lastRemote
                                  if (disabled) return
                                  const newPage = lastRemote
                                    ? pageParam + 1
                                    : Math.min(totalPages, pageParam + 1)
                                  setPageParam(newPage)
                                  // API call will be triggered by useEffect when pageParam changes
                                }}
                                aria-disabled={
                                  pageParam * sizeParam >= totalCount && !lastRemote
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
    
                      {filteredAppointments.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p className="font-medium">
                            No se encontraron citas con los filtros aplicados
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
        </main>

      {/* Modals */}

      {/* Patient Search Modal */}
      <PatientSearchModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onPatientSelect={(patient) => {
          setSelectedPatient(patient)
          setShowAssignModal(false)
          setShowPatientAssignmentModal(true)
        }}
      />

      {/* Patient Assignment Modal */}
      <PatientAssignmentModal
        isOpen={showPatientAssignmentModal}
        onClose={() => {
          setShowPatientAssignmentModal(false)
          setSelectedPatient(null)
        }}
        patient={selectedPatient}
        appointment={selectedAppointment}
        onAssign={async (assignmentData) => {
          // TODO: Implement assignment logic
          console.log('Assignment data:', assignmentData)
          // Here you would call the API to assign the patient to the appointment
        }}
      />

      {/* Reschedule Modal */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-800 font-semibold">Reprogramar Cita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Nueva Fecha</Label>
              <Input type="date" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Nueva Hora</Label>
              <Input type="time" className="mt-1" />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRescheduleModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">Reprogramar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Release Modal */}
      <Dialog open={showReleaseModal} onOpenChange={setShowReleaseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-800 font-semibold">Liberar Cita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              ¿Está seguro que desea liberar la cita <strong>{selectedAppointment?.id}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta acción no se puede deshacer y la cita quedará disponible para otros pacientes.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowReleaseModal(false)}>
                Cancelar
              </Button>
              <Button variant="destructive">Liberar Cita</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        appointment={selectedAppointment}
        getEstadoBadge={getEstadoBadge}
      />
    </div>
  )
}
