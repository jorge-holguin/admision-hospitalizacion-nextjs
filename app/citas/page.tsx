"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AppointmentCalendar } from "@/components/dates/AppointmentCalendar"
import { TimeSlotSelector } from "@/components/dates/TimeSlotSelector"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, User, Unlock, CalendarClock, UserPlus, Eye, Search, Filter, Clock, Check, ChevronsUpDown, X } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Mock data for appointments
const mockAppointments = [
  {
    id: "C001",
    estado: 1,
    fecha: "2025-01-15",
    hora: "08:00",
    turno: "MAÑANA",
    consultorio: "MEDICINA",
    medico: "PINTADO CABALLERO JOSÉ BELÉN",
    seguro: "SIS",
    paciente: "GARCIA LOPEZ MARIA",
    fechaProgramada: "2025-01-10",
    fechaPago: null,
  },
  {
    id: "C002",
    estado: 3,
    fecha: "2025-01-15",
    hora: "09:00",
    turno: "MAÑANA",
    consultorio: "CARDIOLOGIA 1",
    medico: "ALZAMORA ONETO JUAN CARLOS MARIANO",
    seguro: "ESSALUD",
    paciente: "RODRIGUEZ PEREZ CARLOS",
    fechaProgramada: "2025-01-12",
    fechaPago: "2025-01-14",
  },
  {
    id: "C003",
    estado: 4,
    fecha: "2025-01-15",
    hora: "10:30",
    turno: "MAÑANA",
    consultorio: "PEDIATRIA",
    medico: "ARROYO BASTO CARLOS ALEJANDRO",
    seguro: "SIS",
    paciente: "MARTINEZ SILVA ANA",
    fechaProgramada: "2025-01-08",
    fechaPago: "2025-01-13",
  },
  {
    id: "C004",
    estado: 2,
    fecha: "2025-01-16",
    hora: "14:00",
    turno: "TARDE",
    consultorio: "CIRUGIA",
    medico: "ABAD BARREDO PEDRO MANUEL",
    seguro: "PARTICULAR",
    paciente: "LOPEZ TORRES JUAN",
    fechaProgramada: "2025-01-11",
    fechaPago: null,
  },
  {
    id: "C005",
    estado: 5,
    fecha: "2025-01-16",
    hora: "15:30",
    turno: "TARDE",
    consultorio: "NEUROLOGIA 1",
    medico: "AQUINO CUEVA FRANCISCO JAVIER",
    seguro: "SIS",
    paciente: "FERNANDEZ RUIZ LUIS",
    fechaProgramada: "2025-01-09",
    fechaPago: "2025-01-15",
  },
]

const estadoOptions = [
  { value: "1", label: "Cita no otorgada", color: "bg-gray-500" },
  { value: "2", label: "Sin Pago o sin FUA", color: "bg-yellow-500" },
  { value: "3", label: "Pagado o con FUA", color: "bg-blue-500" },
  { value: "4", label: "Atendido", color: "bg-green-500" },
  { value: "5", label: "Sin atención", color: "bg-red-500" },
]

const consultorioOptions = [
  "MEDICINA",
  "MEDICINA INTERNA 1",
  "MEDICINA INTERNA 2",
  "CIRUGIA",
  "CIRUGIA PEDIATRICA",
  "NEUMOLOGIA 1",
  "CARDIOLOGIA 1",
  "NEUROLOGIA 1",
  "GASTROENTEROLOGIA 1",
  "DERMATOLOGIA 1",
  "EPIDEMIOLOGIA",
  "PEDIATRIA",
]

const medicoOptions = [
  "PINTADO CABALLERO JOSÉ BELÉN",
  "PARDAVE VIZURRAGA ANTONIO ELEODORO",
  "NINGUNO",
  "ARROYO BASTO CARLOS ALEJANDRO",
  "ABAD BARREDO PEDRO MANUEL",
  "AQUINO CUEVA FRANCISCO JAVIER",
  "ALZAMORA ONETO JUAN CARLOS MARIANO",
  "ASMAT RAMIREZ VICTOR ARTURO",
  "AMADO TINEO JOSÉ PERCY",
  "ARNAEZ VARGAS LUCIO ANTONIO",
  "ALVAREZ VALENZUELA RICARDO NICANOR",
]

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [filteredAppointments, setFilteredAppointments] = useState(mockAppointments)
  const [filters, setFilters] = useState({
    estado: "all",
    consultorio: "all",
    medico: "all",
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

  const getEstadoBadge = (estado: number) => {
    const estadoInfo = estadoOptions.find((e) => e.value === estado.toString())
    return <Badge className={`${estadoInfo?.color} text-white font-medium`}>{estadoInfo?.label}</Badge>
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return mockAppointments.filter((apt) => apt.fecha === dateStr)
  }

  const getAppointmentCountForDate = (date: Date) => {
    return getAppointmentsForDate(date).length
  }

  const getAppointmentsForTime = (time: string) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    return mockAppointments.filter((apt) => apt.fecha === dateStr && apt.hora === time)
  }

  const applyFilters = () => {
    let filtered = mockAppointments

    if (filters.estado !== "all") {
      filtered = filtered.filter((apt) => apt.estado.toString() === filters.estado)
    }
    if (filters.consultorio !== "all") {
      filtered = filtered.filter((apt) => apt.consultorio === filters.consultorio)
    }
    if (filters.medico !== "all") {
      filtered = filtered.filter((apt) => apt.medico === filters.medico)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (apt) =>
          apt.medico.toLowerCase().includes(query) ||
          apt.paciente.toLowerCase().includes(query) ||
          apt.consultorio.toLowerCase().includes(query) ||
          apt.id.toLowerCase().includes(query)
      )
    }

    setFilteredAppointments(filtered)
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      const dayAppointments = getAppointmentsForDate(date)
      setFilteredAppointments(dayAppointments)
      setSelectedTime("") // Reset selected time when date changes
    }
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    const timeAppointments = getAppointmentsForTime(time)
    setFilteredAppointments(timeAppointments)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700 font-medium"
              onClick={() => (window.location.href = "/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SIGSALUD</h1>
              <p className="text-sm opacity-90 font-medium">GESTIÓN DE CITAS</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold">ESTRADA CARDENAS DENISSE FIORELLA</p>
              <p className="text-xs opacity-90 font-medium">ANALISTA</p>
            </div>
            <User className="w-8 h-8 bg-blue-500 rounded-full p-1" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column - Calendar and Time Slots */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="text-lg text-blue-800 font-semibold">Calendario de Citas</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex h-[500px]">
                  {/* Calendar */}
                  <div className="flex-1">
                    <AppointmentCalendar
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                      className="h-full border-0 rounded-none"
                    />
                  </div>

                  {/* 1px Separator */}
                  <Separator orientation="vertical" className="h-full" />

                  {/* Time Slots */}
                  <div className="w-40">
                    <TimeSlotSelector
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onTimeSelect={handleTimeSelect}
                      appointments={mockAppointments}
                      className="h-full border-0 rounded-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Appointments Table */}
          <div>
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-blue-800 font-semibold">
                    Lista de Citas
                    {selectedTime && <span className="text-sm font-normal text-gray-600 ml-2">- {selectedTime}</span>}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilteredAppointments(mockAppointments)
                      setSelectedTime("")
                    }}
                    className="font-medium"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Estado Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Estado</Label>
                    <Popover open={openEstado} onOpenChange={setOpenEstado}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openEstado}
                          className="w-full justify-between"
                        >
                          {filters.estado !== "all"
                            ? estadoOptions.find((estado) => estado.value === filters.estado)?.label
                            : "Seleccionar estado..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar estado..." 
                            value={searchEstados}
                            onValueChange={setSearchEstados}
                          />
                          <CommandList>
                            <CommandGroup>
                              <CommandItem
                                value="all"
                                onSelect={() => {
                                  setFilters({ ...filters, estado: "all" })
                                  setOpenEstado(false)
                                  setTimeout(applyFilters, 100)
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    filters.estado === "all" ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                Todos los estados
                              </CommandItem>
                              {estadoOptions
                                .filter((estado) =>
                                  estado.label.toLowerCase().includes(searchEstados.toLowerCase())
                                )
                                .map((estado) => (
                                  <CommandItem
                                    key={estado.value}
                                    value={estado.value}
                                    onSelect={() => {
                                      setFilters({ ...filters, estado: estado.value })
                                      setOpenEstado(false)
                                      setTimeout(applyFilters, 100)
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        filters.estado === estado.value ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    <div className="flex items-center">
                                      <div className={`w-3 h-3 rounded-full ${estado.color} mr-2`}></div>
                                      {estado.label}
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {filters.estado !== "all" && (
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">
                          {estadoOptions.find(e => e.value === filters.estado)?.label}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-2"
                          onClick={() => {
                            setFilters({ ...filters, estado: "all" })
                            setTimeout(applyFilters, 100)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Consultorio Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Consultorio</Label>
                    <Popover open={openConsultorio} onOpenChange={setOpenConsultorio}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openConsultorio}
                          className="w-full justify-between"
                        >
                          {filters.consultorio !== "all"
                            ? consultorioOptions.find((c) => c === filters.consultorio)
                            : "Seleccionar consultorio..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar consultorio..." 
                            value={searchConsultorios}
                            onValueChange={setSearchConsultorios}
                          />
                          <CommandList>
                            <CommandGroup>
                              <CommandItem
                                value="all"
                                onSelect={() => {
                                  setFilters({ ...filters, consultorio: "all" })
                                  setOpenConsultorio(false)
                                  setTimeout(applyFilters, 100)
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    filters.consultorio === "all" ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                Todos los consultorios
                              </CommandItem>
                              {consultorioOptions
                                .filter((consultorio) =>
                                  consultorio.toLowerCase().includes(searchConsultorios.toLowerCase())
                                )
                                .map((consultorio) => (
                                  <CommandItem
                                    key={consultorio}
                                    value={consultorio}
                                    onSelect={() => {
                                      setFilters({ ...filters, consultorio })
                                      setOpenConsultorio(false)
                                      setTimeout(applyFilters, 100)
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        filters.consultorio === consultorio ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    {consultorio}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {filters.consultorio !== "all" && (
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">
                          {filters.consultorio}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-2"
                          onClick={() => {
                            setFilters({ ...filters, consultorio: "all" })
                            setTimeout(applyFilters, 100)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Médico</Label>
                    <Popover open={openMedico} onOpenChange={setOpenMedico}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openMedico}
                          className="w-full justify-between mt-1"
                        >
                          {filters.medico === "all"
                            ? "Todos los médicos"
                            : medicoOptions.find((medico) => medico === filters.medico) || "Seleccionar médico"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar médico..." 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No se encontraron médicos</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="all"
                                onSelect={() => {
                                  setFilters({ ...filters, medico: "all" })
                                  setOpenMedico(false)
                                  setTimeout(applyFilters, 100)
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    filters.medico === "all" ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                Todos los médicos
                              </CommandItem>
                              {medicoOptions
                                .filter((medico) =>
                                  medico.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((medico) => (
                                  <CommandItem
                                    key={medico}
                                    value={medico}
                                    onSelect={() => {
                                      setFilters({ ...filters, medico })
                                      setOpenMedico(false)
                                      setTimeout(applyFilters, 100)
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        filters.medico === medico ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    {medico}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {filters.medico !== "all" && (
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">
                          {filters.medico}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-2"
                          onClick={() => {
                            setFilters({ ...filters, medico: "all" })
                            setTimeout(applyFilters, 100)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Estado</TableHead>
                          <TableHead className="font-semibold">Hora</TableHead>
                          <TableHead className="font-semibold">Consultorio</TableHead>
                          <TableHead className="font-semibold">Médico</TableHead>
                          <TableHead className="font-semibold">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.map((appointment) => (
                          <TableRow key={appointment.id} className="hover:bg-blue-50 transition-colors">
                            <TableCell>{getEstadoBadge(appointment.estado)}</TableCell>
                            <TableCell className="font-medium">{appointment.hora}</TableCell>
                            <TableCell className="font-medium">{appointment.consultorio}</TableCell>
                            <TableCell className="text-sm">{appointment.medico}</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction("release", appointment)}
                                  title="Liberar"
                                >
                                  <Unlock className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction("reschedule", appointment)}
                                  title="Reprogramar"
                                >
                                  <CalendarClock className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction("assign", appointment)}
                                  title="Asignar"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction("details", appointment)}
                                  title="Ver más"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden space-y-4">
                    {filteredAppointments.map((appointment) => (
                      <Card key={appointment.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-gray-600">
                                {new Date(appointment.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {appointment.hora}
                              </div>
                              {getEstadoBadge(appointment.estado)}
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Consultorio:</div>
                              <div className="font-medium">{appointment.consultorio}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Médico:</div>
                              <div className="font-medium text-sm">{appointment.medico}</div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction("release", appointment)}
                                className="text-xs"
                              >
                                Liberar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction("reschedule", appointment)}
                                className="text-xs"
                              >
                                Reprogramar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction("assign", appointment)}
                                className="text-xs"
                              >
                                Asignar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction("details", appointment)}
                                className="text-xs"
                              >
                                Ver más
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {filteredAppointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="font-medium">No se encontraron citas con los filtros aplicados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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
                  <p className="text-sm font-medium">{format(new Date(selectedAppointment.fecha), "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">FECHA PROGRAMADA</Label>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedAppointment.fechaProgramada), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">FECHA PAGO</Label>
                  <p className="text-sm font-medium">
                    {selectedAppointment.fechaPago
                      ? format(new Date(selectedAppointment.fechaPago), "dd/MM/yyyy")
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
                <p className="text-sm font-medium">{selectedAppointment.medico}</p>
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
