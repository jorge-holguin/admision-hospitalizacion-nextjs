  "use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { extractDocumentFromToken, extractPuestoFromToken, extractNombreCompletoFromToken } from "@/utils/jwtUtils"
import { availableDatesService } from "@/services/appointments/availableDatesService"
import { imprimirCita, CitaDto, formatDateToDDMMYYYY, formatDateTimeToDDMMYYYY } from "@/services/appointments/printService"
import { TicketPreviewModal, type TicketData } from "@/components/appointments/modals/TicketPreviewModal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { 
  ArrowLeft, 
  User, 
  Unlock, 
  CalendarClock, 
  UserPlus, 
  Eye, 
  RefreshCw, 
  Plus, 
  Search, 
  Calendar, 
  House,
  History,
  Filter,
  ChevronsUpDown, 
  X,
  FileText
} from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { TipoCitaProvider } from "@/contexts/TipoCitaContext"
import { SegurosCitaProvider } from "@/contexts/SegurosCitaContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import RoleBasedRoute from "@/components/RoleBasedRoute"
import { format, startOfMonth, endOfMonth } from "date-fns"

// Import all components from the appointments module
import {
  AppointmentCalendar,
  ConsultorioCitasSelector,
  MedicoSelector,
  EstadoSelector, 
  ESTADO_OPTIONS,
  AppointmentsTable,
  ShiftFilter,
  PatientSearchModal,
  PatientAssignmentModal,
  AppointmentDetailsModal,
  MedicoReassignmentModal,
  AdditionalAppointmentModal,
  RescheduleAppointmentModal,
  AppointmentHistoryModal
} from "@/components/appointments"
import { PrintingModal } from "@/components/appointments/modals/PrintingModal"

  // Lista vacía para almacenar citas
  const emptyAppointments: any[] = []

  export default function AppointmentsPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedTime, setSelectedTime] = useState<string>("")
    const [filteredAppointments, setFilteredAppointments] = useState(emptyAppointments)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [filters, setFilters] = useState({
      estado: "1", // Estado por defecto: NO OTORGADO
      consultorio: "all",
      medico: "all",
      turno: "ALL",
    })
    const [searchEstados, setSearchEstados] = useState("")
    const [searchConsultorios, setSearchConsultorios] = useState("")
    const [searchMedicos, setSearchMedicos] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [showSearchById, setShowSearchById] = useState(false)
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
    const [showReassignModal, setShowReassignModal] = useState(false)
    const [showAdditionalAppointmentModal, setShowAdditionalAppointmentModal] = useState(false)
    const [showAdditionalPatientSearchModal, setShowAdditionalPatientSearchModal] = useState(false)
    const [selectedPatientForAdditional, setSelectedPatientForAdditional] = useState<any>(null)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [showPrintingModal, setShowPrintingModal] = useState(false)
  const [showTicketPreview, setShowTicketPreview] = useState(false)
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Parámetros de paginación para búsqueda remota
    const [pageParam, setPageParam] = useState<number>(0)
    const [sizeParam, setSizeParam] = useState<number>(50) // Por defecto 50 items
    const [totalCount, setTotalCount] = useState<number>(0)
    const [lastRemote, setLastRemote] = useState<boolean>(false)

    // Verificar permisos para Ver Reservas (solo DEVOPS y ANALISTA)
    const userPuesto = extractPuestoFromToken()
    const canAccessReservas = userPuesto && ['DEVOPS', 'ANALISTA', 'DESARROLLADOR','CALL CENTER'].includes(userPuesto.toUpperCase())

    // Estados para fechas disponibles en el calendario
    const [datesWithAppointments, setDatesWithAppointments] = useState<Date[]>([])
    const [selectedConsultorioData, setSelectedConsultorioData] = useState<any>(null)
    const [loadingDates, setLoadingDates] = useState(false)
    const [showPastAppointments, setShowPastAppointments] = useState(false)

    const getEstadoBadge = (estado: number) => {
      const estadoInfo = ESTADO_OPTIONS.find((opt) => opt.value === estado.toString())
      return <Badge className={`${estadoInfo?.color} text-white font-medium`}>{estadoInfo?.label}</Badge>
    }

    // Función para cargar fechas disponibles basándose en consultorio y turno
    const loadAvailableDates = useCallback(async (currentMonth: Date) => {
      // Solo cargar si hay un consultorio seleccionado (que tenga especialidad)
      if (filters.consultorio === 'all' || !selectedConsultorioData?.ESPECIALIDAD) {
        console.log('⏸️ No se cargan fechas: consultorio =', filters.consultorio, 'especialidad =', selectedConsultorioData?.ESPECIALIDAD)
        setDatesWithAppointments([])
        return
      }
      
      console.log('🔄 Cargando fechas disponibles para:', {
        consultorio: filters.consultorio,
        especialidad: selectedConsultorioData.ESPECIALIDAD,
        turno: filters.turno,
        mes: format(currentMonth, 'yyyy-MM')
      })

      try {
        setLoadingDates(true)
        
        // Calcular fechas
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        
        // ✅ NO llamar al servicio si el mes es anterior al mes actual (a menos que checkbox esté marcado)
        const currentMonthStart = startOfMonth(today)
        const isCurrentOrFutureMonth = monthStart >= currentMonthStart
        
        if (!isCurrentOrFutureMonth && !showPastAppointments) {
          console.log('⏸️ Mes pasado detectado - No se cargan fechas disponibles')
          setDatesWithAppointments([])
          setLoadingDates(false)
          return
        }
        
        // Determinar fecha de inicio según el mes
        let startDate: Date
        
        if (monthStart.getTime() === currentMonthStart.getTime()) {
          // ✅ Mes actual: Iniciar desde HOY (a menos que checkbox esté marcado)
          startDate = showPastAppointments ? monthStart : today
        } else if (monthStart > currentMonthStart) {
          // ✅ Mes futuro: Iniciar desde el día 1 del mes
          startDate = monthStart
        } else {
          // ✅ Mes pasado (solo si checkbox está marcado): Desde inicio del mes
          startDate = monthStart
        }
        
        const fechaInicio = format(startDate, 'yyyy-MM-dd')
        const fechaFin = format(monthEnd, 'yyyy-MM-dd')
        const idEspecialidad = selectedConsultorioData.ESPECIALIDAD.trim()
        
        console.log(`📅 Consultando fechas: ${fechaInicio} a ${fechaFin}`)

        let availableDates: any[] = []

        // Llamar al API según el turno seleccionado
        if (filters.turno === 'ALL') {
          // Si es "TODOS", llamar a ambos turnos
          availableDates = await availableDatesService.fetchAvailableDatesAllShifts(
            fechaInicio,
            fechaFin,
            idEspecialidad
          )
        } else {
          // Si es Mañana o Tarde, llamar al turno específico
          const turnoConsulta = filters.turno === 'MAÑANA' ? 'M' : 'T'
          availableDates = await availableDatesService.fetchAvailableDates({
            fechaInicio,
            fechaFin,
            turnoConsulta,
            idEspecialidad,
          })
        }

        // Convertir las fechas a objetos Date únicos, filtrando por consultorio seleccionado
        const consultorioCode = filters.consultorio !== 'all' ? filters.consultorio : undefined
        const uniqueDates = availableDatesService.getUniqueDates(availableDates, consultorioCode)
        setDatesWithAppointments(uniqueDates)

        console.log(`✅ ${uniqueDates.length} días con citas disponibles para consultorio ${consultorioCode || 'todos'}`)
        console.log(`   Rango consultado: ${fechaInicio} a ${fechaFin}`)
      } catch (error) {
        console.error('Error al cargar fechas disponibles:', error)
        setDatesWithAppointments([])
      } finally {
        setLoadingDates(false)
      }
    }, [filters.consultorio, filters.turno, selectedConsultorioData, showPastAppointments])

    // Effect para cargar fechas cuando cambia consultorio, turno, mes o checkbox de citas pasadas
    useEffect(() => {
      loadAvailableDates(selectedDate)
    }, [filters.consultorio, filters.turno, selectedDate, showPastAppointments, loadAvailableDates])

    // Buscar citas por parámetros (usa la fecha seleccionada en el calendario como desde/hasta)
    const searchAppointmentsByParams = useCallback(async (dateOverride?: Date) => {
      setIsRefreshing(true)
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
        
        // Backend API usa paginación basada en 0
        qs.set('page', String(pageParam))
        qs.set('size', String(sizeParam))

        const url = `${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/cita/buscar?${qs.toString()}`
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
          historia: it.historia ? String(it.historia).trim() : null,
          usuario: String(it.usuario ?? it.USUARIO ?? ""),
          userLiberacion: it.userLiberacion ?? it.USER_LIBERACION ?? null,
          userEliminacion: it.userEliminacion ?? it.USER_ELIMINACION ?? null,
          fechaProgramada: String(it.fechaProgramacion ?? it.fechaProgramada ?? it.FECHA_PROGRAMADA ?? it.FECHAPROGRAMADA ?? ""),
          fechaPago: it.fechaPago ?? it.FECHA_PAGO ?? it.FECHAPAGO ?? null,
          fechaOtorgada: String(it.fechaOtorgada ?? it.FECHA_OTORGADA ?? ""),
          pagoId: String(it.pagoId ?? it.PAGO_ID ?? it.PAGOID ?? ""),
          orden: String(it.orden ?? it.ORDEN ?? ""),
          entidadSis: String(it.entidadSis ?? it.ENTIDAD_SIS ?? it.ENTIDADSIS ?? ""),
          idRefcon: it.idRefcon ?? it.ID_REFCON ?? it.IDREFCON ?? null,
        }))
        
        // Ordenar por hora de forma ascendente (cronológico)
        const sorted = mapped.sort((a, b) => {
          // Convertir hora a formato comparable (HH:MM -> minutos desde medianoche)
          const timeToMinutes = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number)
            return (hours || 0) * 60 + (minutes || 0)
          }
          
          const timeA = timeToMinutes(a.hora || '00:00')
          const timeB = timeToMinutes(b.hora || '00:00')
          return timeA - timeB // Orden cronológico: 08:00, 08:30, 09:00...
        })
        
        setFilteredAppointments(sorted)
        const total = (typeof data?.total === 'number') ? data.total
          : (typeof data?.totalElements === 'number') ? data.totalElements
          : (typeof data?.totalItems === 'number') ? data.totalItems
          : (typeof data?.totalCount === 'number') ? data.totalCount
          : mapped.length
        setTotalCount(total)
        setLastRemote(true)
      } catch (e) {
        // noop silencioso
      } finally {
        setIsRefreshing(false)
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
      setIsRefreshing(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/cita/${encodeURIComponent(id)}`)
        if (!res.ok) {
          // Si no encuentra la cita, mostrar lista vacía en lugar de aplicar filtros
          console.log(`❌ No se encontró la cita con ID: ${id}`)
          setFilteredAppointments([])
          setTotalCount(0)
          return
        }
        const data = await res.json()
        
        // Verificar si realmente se encontró una cita válida
        if (!data || (Array.isArray(data) && data.length === 0)) {
          console.log(`❌ No se encontró la cita con ID: ${id}`)
          setFilteredAppointments([])
          setTotalCount(0)
          return
        }
        
        const list = Array.isArray(data) ? data : [data]
        const mapped = list.map((it: any) => ({
          id: it.id || it.ID || id,
          estado: Number(it.estado ?? it.ESTADO ?? 1),
          fecha: String(it.fecha ?? it.FECHA ?? new Date().toISOString().slice(0,10)),
          hora: String(it.hora ?? it.HORA ?? "08:00"),
          turno: String(it.turno ?? it.TURNO ?? "MAÑANA"),
          turnoConsulta: String(it.turnoConsulta ?? it.TURNO_CONSULTA ?? ""),
          consultorio: String(it.consultorio ?? it.CONSULTORIO ?? ""),
          consultorioNombre: String(it.consultorioNombre ?? it.CONSULTORIO_NOMBRE ?? ""),
          medico: String(it.medico ?? it.MEDICO ?? ""),
          medicoNombre: String(it.medicoNombre ?? it.MEDICO_NOMBRE ?? ""),
          seguro: String(it.seguro ?? it.SEGURO ?? ""),
          seguroNombre: String(it.seguroNombre ?? it.nombreSeguro ?? it.NOMBRE_SEGURO ?? ""),
          paciente: String(it.paciente ?? it.PACIENTE ?? ""),
          nombre: String(it.nombre ?? it.NOMBRE ?? ""),
          numero: String(it.numero ?? it.NUMERO ?? ""),
          historia: it.historia ? String(it.historia).trim() : null,
          numRef: String(it.numRef ?? it.NUMREF ?? ""),
          entidadSis: String(it.entidadSis ?? it.ENTIDADSIS ?? ""),
          usuario: String(it.usuario ?? it.USUARIO ?? ""),
          userLiberacion: it.userLiberacion ?? it.USER_LIBERACION ?? null,
          userEliminacion: it.userEliminacion ?? it.USER_ELIMINACION ?? null,
          fechaProgramada: String(it.fechaProgramada ?? it.FECHA_PROGRAMADA ?? it.FECHAPROGRAMADA ?? ""),
          fechaPago: it.fechaPago ?? it.FECHA_PAGO ?? it.FECHAPAGO ?? null,
        }))
        
        console.log(`✅ Cita encontrada con ID: ${id}`)
        setFilteredAppointments(mapped)
        setTotalCount(mapped.length)
      } catch (e) {
        console.log(`❌ Error al buscar la cita con ID: ${id}`, e)
        setFilteredAppointments([])
        setTotalCount(0)
      } finally {
        setIsRefreshing(false)
      }
    }

    const handleDateSelect = async (date: Date | undefined) => {
      if (date) {
        setSelectedDate(date)
        setSelectedTime("") // Reset selected time when date changes
        setPageParam(0) // Reset to page 0 (backend usa base 0)
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
        case "reassign":
          console.log('🔄 Abriendo modal de reasignación con appointment:', appointment)
          setShowReassignModal(true)
          break
        case "print":
          handlePrintAppointment(appointment)
          break
      }
    }
    
    // Función para imprimir una cita - Abre modal de previsualización
    const handlePrintAppointment = async (appointment: any) => {
      try {
        // Obtener el nombre completo del operador desde el JWT
        const operador = extractNombreCompletoFromToken() || 'OPERADOR'
        
        // Formatear turno: M -> Mañana, T -> Tarde
        const turnoConsulta = appointment.turnoConsulta || appointment.turno || ''
        const turnoFormateado = turnoConsulta.trim().toUpperCase() === 'M' ? 'Mañana' : 
                                turnoConsulta.trim().toUpperCase() === 'T' ? 'Tarde' : turnoConsulta
        
        // Construir los datos del ticket
        const ticket: TicketData = {
          numero: appointment.id || '',
          numeroAtencion: appointment.numero || '',
          paciente: appointment.nombre || appointment.paciente || '',
          consultorio: appointment.consultorioNombre || '',
          medico: appointment.medicoNombre || '',
          diaAtencion: formatDateToDDMMYYYY(appointment.fecha || new Date().toISOString()),
          turno: turnoFormateado,
          hora: appointment.hora || '',
          historiaClinica: appointment.historia || '',
          emitidoEl: formatDateTimeToDDMMYYYY(new Date().toISOString()),
          operador: operador,
          seguro: appointment.seguroNombre || 'PAGANTE'
        }
        
        console.log('📋 Abriendo previsualización de ticket:', ticket)
        
        // Abrir modal de previsualización
        setTicketData(ticket)
        setShowTicketPreview(true)
      } catch (error) {
        console.error('❌ Error al preparar ticket:', error)
        toast({
          title: "Error",
          description: "No se pudo preparar el ticket. Intente nuevamente.",
          variant: "destructive"
        })
      }
    }
    
    // Función para liberar una cita
    const handleReleaseAppointment = async (citaId: string) => {
      if (!citaId) {
        toast({
          title: "Error",
          description: "No se ha seleccionado ninguna cita para liberar",
          variant: "destructive"
        })
        return
      }
      
      try {
        // Obtener el usuario del token JWT
        const usuario = extractDocumentFromToken()
        
        // Llamar al endpoint para liberar la cita
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/cita/${citaId}/liberar`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'usuario': usuario
          }
        })
        
        if (!response.ok) {
          throw new Error(`Error al liberar la cita: ${response.status}`)
        }
        
        // Cerrar el modal
        setShowReleaseModal(false)
        
        // Mostrar mensaje de éxito
        toast({
          title: "Éxito",
          description: "Cita liberada correctamente",
          variant: "default"
        })
        
        // Actualizar la lista de citas
        searchAppointmentsByParams()
      } catch (error) {
        console.error('Error al liberar la cita:', error)
        toast({
          title: "Error",
          description: "No se pudo liberar la cita. Intente nuevamente.",
          variant: "destructive"
        })
      }
    }
    
    const handleShiftChange = (shift: 'MAÑANA' | 'TARDE' | 'ALL') => {
      setFilters({ ...filters, turno: shift })
      setPageParam(0) // Reset to page 0 when filter changes
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
      <ProtectedRoute>
        <RoleBasedRoute 
          allowedRoles={['CALL CENTER', 'DEVOPS' , 'ANALISTA', 'DESARROLLADOR', 'ADMISIONISTA']}
          moduleName="Módulo de Citas"
        >
          <TipoCitaProvider>
            <SegurosCitaProvider>
            <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Navbar fijo arriba */}
            <Navbar />
    
            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
              {/* Header con botones de acción */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start">
                <Button 
                  variant="destructive" 
                  size="lg"
                  className="font-bold text-lg" 
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <House className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                
                <div className="flex flex-col sm:flex-row gap-3">
                {/*   <Button
                    variant="outline"
                    size="lg"
                    className="font-semibold border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => setShowReassignModal(true)}
                    title="Reasignar médico por turno y consultorio"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reasignar Médico
                  </Button> */}
                  
                  <Button
                    variant="outline"
                    size="lg"
                    className="font-semibold border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => setShowHistoryModal(true)}
                    title="Ver historial de citas"
                  >
                    <History className="mr-2 h-4 w-4" />
                    Historial
                  </Button>
                  
                  {/* Botón Ver Reservas - Solo para DEVOPS y ANALISTA */}
                  {canAccessReservas && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="font-semibold border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={() => window.location.href = '/appointments/reserved'}
                      title="Ver bandeja de solicitudes de reservas"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Ver Reservas
                    </Button>
                  )}
                  
                 {/*  <Button
                    variant="default"
                    size="lg"
                    className="font-semibold bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setShowAdditionalPatientSearchModal(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Cita Adicional
                  </Button> */}
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Calendario (25%) */}
                <div className="xl:col-span-1 space-y-6">
                  <Card className="shadow-lg border-0">
                    <CardHeader className="bg-blue-50 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-blue-800 font-semibold">
                          Calendario de Citas
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="showPastAppointments"
                            checked={showPastAppointments}
                            onCheckedChange={(checked) => setShowPastAppointments(checked as boolean)}
                          />
                          <label
                            htmlFor="showPastAppointments"
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            Ver citas pasadas
                          </label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="flex h-[400px]">
                        <div className="flex-1">
                          <AppointmentCalendar
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            className="h-full border-0 rounded-none"
                            datesWithAppointments={datesWithAppointments}
                            disablePastDates={!showPastAppointments}
                          />
                        </div>
                      </div>
                      {/* Leyenda del calendario */}
                      {filters.consultorio !== 'all' && selectedConsultorioData?.ESPECIALIDAD && (
                        <div className="p-4 border-t bg-gray-50">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                              <span className="text-gray-700">Días con citas disponibles</span>
                            </div>
                            {loadingDates && (
                              <span className="text-gray-500 text-xs ml-2">Cargando...</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {datesWithAppointments.length > 0 
                              ? `${datesWithAppointments.length} día(s) disponible(s)` 
                              : 'No hay citas disponibles este mes'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg border-0">


                    {/* Botón Horario de Médicos */}
                <div className="p-4 border-t flex justify-center">
                  <a
                    href="https://www.hospitalchosica.gob.pe/horario-profesional/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                  >
                    Horario de Médicos
                  </a>
                </div>
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setFilters({
                                estado: "all",
                                consultorio: "all",
                                medico: "all",
                                turno: "ALL",
                              })
                              setPageParam(0) // Reset to page 0 (backend usa base 0)
                              setSelectedTime("")
                              setSearchQuery("") // Limpiar campo de búsqueda
                              setShowSearchById(false) // Ocultar campo de búsqueda
                              searchAppointmentsByParams()
                            }}
                            className="font-medium"
                          >
                            <Filter className="w-4 h-4 mr-2" />
                            Limpiar Filtros
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => {
                              searchAppointmentsByParams()
                            }}
                            disabled={isRefreshing}
                            className="font-medium"
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Actualizar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Filtros reorganizados con flex columns responsivo */}
                      <div className="space-y-4 mb-6">
                        {/* Primera fila: Filtros de turno y búsqueda */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <ShiftFilter onShiftChange={handleShiftChange} className="flex-shrink-0" />
                          
                          {/* Checkbox para habilitar búsqueda por ID */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="searchById"
                              checked={showSearchById}
                              onCheckedChange={(checked) => {
                                setShowSearchById(checked as boolean)
                                if (!checked) {
                                  setSearchQuery("") // Limpiar al desmarcar
                                }
                              }}
                            />
                            <label
                              htmlFor="searchById"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Buscar por ID de cita
                            </label>
                          </div>

                          {/* Buscador por ID - Solo visible si el checkbox está marcado */}
                          {showSearchById && (
                            <>
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
                                onClick={() => {
                                  if (searchQuery.trim()) {
                                    searchAppointmentById(searchQuery)
                                  } else {
                                    searchAppointmentsByParams()
                                  }
                                }}
                                className="font-medium w-full sm:w-auto"
                              >
                                Buscar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
    
                      {/* Filtros */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <EstadoSelector
                          label="Estado"
                          value={filters.estado}
                          onChange={(val: string | "all") => {
                            setFilters({ ...filters, estado: val })
                            setPageParam(0) // Reset to page 0 when filter changes
                          }}
                          className="space-y-2"
                          options={ESTADO_OPTIONS}
                        />
    
                        <ConsultorioCitasSelector
                          label="Consultorio"
                          value={filters.consultorio}
                          onChange={(val: string | "all") => {
                            setFilters({ ...filters, consultorio: val })
                            setPageParam(0) // Reset to page 0 when filter changes
                          }}
                          onConsultorioDataChange={(data) => {
                            setSelectedConsultorioData(data)
                          }}
                          className="space-y-2"
                        />
    
                        <MedicoSelector
                          label="Médico"
                          value={filters.medico}
                          onChange={(val: string | "all") => {
                            setFilters({ ...filters, medico: val })
                            setPageParam(0) // Reset to page 0 when filter changes
                          }}
                          className="mt-1"
                        />
                      </div>
    
                      {/* Tabla de citas */}
                      {/* Wrapper con animación de transición */}
                      <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                        {(() => {
                          const start = pageParam * sizeParam
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
                      </div>
    
                      {/* Paginación */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                        {/* Información y selector de tamaño */}
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            Mostrando{" "}
                            {Math.min(
                              pageParam * sizeParam + 1,
                              Math.max(totalCount, 0)
                            )}
                            {" "}-{" "}
                            {Math.min((pageParam + 1) * sizeParam, totalCount)} de{" "}
                            {totalCount}
                          </div>
                          
                          {/* Selector de tamaño de página */}
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-600 whitespace-nowrap">
                              Items por página:
                            </Label>
                            <Select
                              value={String(sizeParam)}
                              onValueChange={(value) => {
                                setSizeParam(Number(value))
                                setPageParam(0) // Reset a página 0 al cambiar tamaño
                              }}
                            >
                              <SelectTrigger className="w-[70px] h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Controles de paginación */}
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (pageParam <= 0) return
                                  const newPage = Math.max(0, pageParam - 1)
                                  setPageParam(newPage)
                                  // API call will be triggered by useEffect when pageParam changes
                                }}
                                aria-disabled={pageParam <= 0}
                              />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink href="#" isActive>
                                {pageParam + 1}
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
              onPatientSelect={(patient, searchType) => {
                console.log('🔍 Tipo de búsqueda:', searchType)
                setSelectedPatient(patient)
                setShowAssignModal(false)
                setShowPatientAssignmentModal(true)
                // Guardar el tipo de búsqueda en un atributo del paciente para pasarlo al modal de asignación
                setSelectedPatient({...patient, _searchType: searchType})
              }}
            />

            {/* Patient Assignment Modal */}
            <PatientAssignmentModal
              isOpen={showPatientAssignmentModal}
              onClose={() => {
                setShowPatientAssignmentModal(false)
                setSelectedPatient(null)
              }}
              onBack={() => {
                setShowPatientAssignmentModal(false)
                setShowAssignModal(true)
              }}
              patient={selectedPatient}
              appointment={selectedAppointment}
              searchType={selectedPatient?._searchType || 'document'}
              onAssign={async (assignmentData) => {
                console.log('Assignment data:', assignmentData)
              }}
              onSuccess={(citaId) => {
                // Buscar automáticamente la cita asignada
                setSearchQuery(citaId)
                searchAppointmentById(citaId)
              }}
            />

            {/* Reschedule Modal */}
            <RescheduleAppointmentModal
              isOpen={showRescheduleModal}
              onClose={() => setShowRescheduleModal(false)}
              appointment={selectedAppointment}
              onConfirm={async (data) => {
                console.log('Reprogramando cita:', data)
                // TODO: Implement API call for appointment rescheduling
                // For now, just close the modal
                setShowRescheduleModal(false)
              }}
            />

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
                    <Button 
                      variant="destructive"
                      onClick={() => handleReleaseAppointment(selectedAppointment?.id)}
                      disabled={!selectedAppointment?.id}
                    >
                      Liberar Cita
                    </Button>
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

            {/* Medico Reassignment Modal */}
            <MedicoReassignmentModal
              isOpen={showReassignModal}
              onClose={() => setShowReassignModal(false)}
              appointment={null}
              onConfirm={async (data) => {
                console.log('Reasignando médico:', data)
                // TODO: Implement API call for medico reassignment
                // For now, just close the modal
                setShowReassignModal(false)
              }}
            />

            {/* Additional Patient Search Modal */}
            <PatientSearchModal
              isOpen={showAdditionalPatientSearchModal}
              onClose={() => setShowAdditionalPatientSearchModal(false)}
              onPatientSelect={(patient, searchType) => {
                console.log('🔍 Paciente seleccionado para cita adicional:', patient)
                setSelectedPatientForAdditional(patient)
                setShowAdditionalPatientSearchModal(false)
                setShowAdditionalAppointmentModal(true)
              }}
            />

            {/* Additional Appointment Modal */}
            <AdditionalAppointmentModal
              isOpen={showAdditionalAppointmentModal}
              onClose={() => {
                setShowAdditionalAppointmentModal(false)
                setSelectedPatientForAdditional(null)
              }}
              onBack={() => {
                setShowAdditionalAppointmentModal(false)
                setShowAdditionalPatientSearchModal(true)
              }}
              patient={selectedPatientForAdditional}
            />

            {/* Appointment History Modal */}
            <AppointmentHistoryModal
              isOpen={showHistoryModal}
              onClose={() => setShowHistoryModal(false)}
            />

            {/* Printing Modal */}
            <PrintingModal
              isOpen={showPrintingModal}
              onClose={() => setShowPrintingModal(false)}
            />

            {/* Ticket Preview Modal */}
            <TicketPreviewModal
              isOpen={showTicketPreview}
              onClose={() => {
                setShowTicketPreview(false)
                setTicketData(null)
              }}
              ticketData={ticketData}
            />
          </div>
        </SegurosCitaProvider>
      </TipoCitaProvider>
      </RoleBasedRoute>
      </ProtectedRoute>
  )
}
