  "use client"

  import { useState, useEffect } from "react"
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
  import { Badge } from "@/components/ui/badge"
  import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar"
  import { TimeSlotSelector } from "@/components/appointments/TimeSlotSelector"
  import { ConsultorioCitasSelector } from "@/components/appointments/ConsultorioCitasSelector"
  import { MedicoSelector } from "@/components/appointments/MedicoSelector"
  import { EstadoSelector, ESTADO_OPTIONS } from "@/components/appointments/EstadoSelector"
  import { AppointmentsTable } from "@/components/appointments/AppointmentsTable"
  import { ShiftFilter } from "@/components/appointments/ShiftFilter"
  import { Separator } from "@/components/ui/separator"
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { ArrowLeft, User, Unlock, CalendarClock, UserPlus, Eye, Search, Filter, Clock, Check, ChevronsUpDown, X } from "lucide-react"
  import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
  // Removed date-fns format to avoid TS type import issues; using native formatting below
  import { Navbar } from "@/components/Navbar"
  import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
  import { MedicosProvider } from "@/contexts/MedicosContext"
  import { ConsultoriosProvider } from "@/contexts/ConsultoriosContext"
  import MedicoDisplay from "@/components/appointments/MedicoDisplay"

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
    const searchAppointmentsByParams = async (dateOverride?: Date) => {
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
            qs.set('turno', turnoBackend)
          }
        }
        
        qs.set('page', String(pageParam))
        qs.set('size', String(sizeParam))

        const url = `http://192.168.0.21:9011/api/cita/buscar?${qs.toString()}`
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
          medico: String(it.medico ?? it.MEDICO ?? "").trim(),
          seguro: String(it.seguro ?? it.SEGURO ?? ""),
          paciente: String(it.paciente ?? it.PACIENTE ?? "") + " " + String(it.nombre ?? it.NOMBRE ?? ""),
          fechaProgramada: String(it.fechaProgramacion ?? it.fechaProgramada ?? it.FECHA_PROGRAMADA ?? it.FECHAPROGRAMADA ?? ""),
          fechaPago: it.fechaPago ?? it.FECHA_PAGO ?? it.FECHAPAGO ?? null,
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
    }

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
        const res = await fetch(`http://192.168.0.21:9011/api/cita/${encodeURIComponent(id)}`)
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
      setSelectedAppointment(appointment)
      switch (action) {
        case "assign":
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
    }

    // Cargar citas del día actual al iniciar
    useEffect(() => {
      if (isInitialLoad) {
        searchAppointmentsByParams()
        setIsInitialLoad(false)
      }
    }, [isInitialLoad])
    
    // Aplicar filtros cuando cambien
    useEffect(() => {
      if (!isInitialLoad) {
        applyFilters()
      }
    }, [filters, isInitialLoad])

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
              _dashboard
            </Button>
          </div>
          <MedicosProvider>
            <ConsultoriosProvider>
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
                          onChange={(val: string | "all") =>
                            setFilters({ ...filters, estado: val })
                          }
                          className="space-y-2"
                          options={ESTADO_OPTIONS}
                        />
    
                        <ConsultorioCitasSelector
                          label="Consultorio"
                          value={filters.consultorio}
                          onChange={(val: string | "all") =>
                            setFilters({ ...filters, consultorio: val })
                          }
                          className="space-y-2"
                        />
    
                        <MedicoSelector
                          label="Médico"
                          value={filters.medico}
                          onChange={(val: string | "all") =>
                            setFilters({ ...filters, medico: val })
                          }
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
                                  if (lastRemote) searchAppointmentsByParams()
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
                                  if (lastRemote) searchAppointmentsByParams()
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
            </ConsultoriosProvider>
          </MedicosProvider>
        </main>

      {/* Modals */}

      {/* Assign Patient Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-800 font-semibold">Asignar Paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Buscar Paciente</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="DNI o nombre del paciente..." className="pl-10" />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">Asignar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-blue-800 font-semibold">Detalles de la Cita</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">ID CITA</Label>
                  <p className="text-sm font-medium">{selectedAppointment.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">ESTADO</Label>
                  <div className="mt-1">{getEstadoBadge(selectedAppointment.estado)}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">FECHA</Label>
                  <p className="text-sm font-medium">{new Date(selectedAppointment.fecha).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">FECHA PROGRAMADA</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedAppointment.fechaProgramada).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">FECHA PAGO</Label>
                  <p className="text-sm font-medium">
                    {selectedAppointment.fechaPago
                      ? new Date(selectedAppointment.fechaPago).toLocaleDateString('es-ES')
                      : "Sin pago"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">HORA</Label>
                  <p className="text-sm font-medium">{selectedAppointment.hora}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">MÉDICO</Label>
                <p className="text-sm font-medium">
                  {/* Usar el contexto de médicos para mostrar el nombre completo */}
                  <MedicosProvider>
                    <MedicoDisplay code={selectedAppointment.medico} />
                  </MedicosProvider>
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">PACIENTE</Label>
                <p className="text-sm font-medium">{selectedAppointment.paciente}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">CONSULTORIO</Label>
                <p className="text-sm font-medium">{selectedAppointment.consultorio}</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
