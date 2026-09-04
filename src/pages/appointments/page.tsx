  "use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { extractPuestoFromToken, extractDocumentFromToken, extractNombreCompletoFromToken } from "@/utils/jwtUtils"
import { usePermissions } from "@/contexts/PermissionsContext"
import { PERMISOS } from "@/lib/permissions"
import { availableDatesService } from "@/services/appointments/availableDatesService"
import { imprimirCita, CitaDto, formatDateToDDMMYYYY, formatDateTimeToDDMMYYYY } from "@/services/appointments/printService"
import { TicketPreviewModal, type TicketData } from "@/components/appointments/modals/TicketPreviewModal"
import ReleaseAppointmentModal from "@/components/appointments/modals/ReleaseAppointmentModal"
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
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { TipoCitaProvider } from "@/contexts/TipoCitaContext"
import { SegurosCitaProvider } from "@/contexts/SegurosCitaContext"
import { FiliationProvider } from "@/contexts/filiation/FiliationProvider"
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
import { PatientAssignDiagnosticSupportModal } from "@/components/appointments/modals/PatientAssignDiagnosticSupportModal"
import { AdditionalAppointmentDiagnosticSupportModal } from "@/components/appointments/modals/AdditionalAppointmentDiagnosticSupportModal"
import { PatientSearchModal as FiliationPatientSearchModal } from "@/components/filiation/modals/PatientSearchModal"
import { PatientRegistrationModal } from "@/components/filiation/modals/PatientRegistrationModal"

  // Lista vacía para almacenar citas
  const emptyAppointments: any[] = []
  const APOYO_DIAGNOSTICO_CONSULTORIOS = ['7010', '7020']
  const APOYO_DIAGNOSTICO_BASE_URL = import.meta.env.VITE_API_APOYO_DIAGNOSTICO_URL || 'http://192.168.5.239:9020'

  export default function AppointmentsPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedTime, setSelectedTime] = useState<string>("")
    const [filteredAppointments, setFilteredAppointments] = useState(emptyAppointments)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [filters, setFilters] = useState({
      estado: "1", // Estado por defecto: TODOS los estados
      consultorio: "all",
      medico: "all",
      turno: "ALL",
    })
    const [searchEstados, setSearchEstados] = useState("")
    const [searchConsultorios, setSearchConsultorios] = useState("")
    const [searchMedicos, setSearchMedicos] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [showSearchById, setShowSearchById] = useState(false)
    const [consultorioNameSearch, setConsultorioNameSearch] = useState("")  // Búsqueda por texto libre
    const [openMedico, setOpenMedico] = useState(false)
    const [openConsultorio, setOpenConsultorio] = useState(false)
    const [openEstado, setOpenEstado] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [showPatientAssignmentModal, setShowPatientAssignmentModal] = useState(false)
    const [showApoyoDiagnosticoAssignModal, setShowApoyoDiagnosticoAssignModal] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<any>(null)
    const [showRescheduleModal, setShowRescheduleModal] = useState(false)
    const [showReleaseModal, setShowReleaseModal] = useState(false)
    const [showReleaseSuccessDialog, setShowReleaseSuccessDialog] = useState(false)
    const [showReleaseErrorDialog, setShowReleaseErrorDialog] = useState(false)
    const [releaseErrorMessage, setReleaseErrorMessage] = useState('')
    const [releasedCitaId, setReleasedCitaId] = useState<string | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showReassignModal, setShowReassignModal] = useState(false)
    const [showAdditionalAppointmentModal, setShowAdditionalAppointmentModal] = useState(false)
    const [showAdditionalPatientSearchModal, setShowAdditionalPatientSearchModal] = useState(false)
    const [selectedPatientForAdditional, setSelectedPatientForAdditional] = useState<any>(null)
    const [showAdditionalEcoModal, setShowAdditionalEcoModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [showPrintingModal, setShowPrintingModal] = useState(false)
  const [showTicketPreview, setShowTicketPreview] = useState(false)
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showReservaActivaDialog, setShowReservaActivaDialog] = useState(false)
    const [isValidatingReserva, setIsValidatingReserva] = useState(false)

    // Estados para modales de filiación (Nuevo Paciente)
    const [isNewPatientSearchModalOpen, setIsNewPatientSearchModalOpen] = useState(false)
    const [isNewPatientRegistrationModalOpen, setIsNewPatientRegistrationModalOpen] = useState(false)
    const [reniecData, setReniecData] = useState<any>(null)
    const [sisData, setSisData] = useState<any>(null)
    const [documentType, setDocumentType] = useState("DNI")
    const [documentNumber, setDocumentNumber] = useState("")

    // Parámetros de paginación para búsqueda remota
    const [pageParam, setPageParam] = useState<number>(0)
    const [sizeParam, setSizeParam] = useState<number>(50) // Por defecto 50 items
    const [totalCount, setTotalCount] = useState<number>(0)
    const [lastRemote, setLastRemote] = useState<boolean>(false)

    // Verificar permisos para Ver Reservas (solo DEVOPS y ANALISTA)
    const [userPuesto, setUserPuesto] = useState<string | null>(null)

    useEffect(() => {
      const puesto = extractPuestoFromToken()
      setUserPuesto(puesto)
    }, [])

    const canAccessReservas = userPuesto && ['DEVOPS', 'ANALISTA', 'DESARROLLADOR','CALL CENTER'].includes(userPuesto.toUpperCase())

    const { hasPermission } = usePermissions()
    const canNuevoPaciente    = hasPermission(PERMISOS.CITAS.NUEVO_PACIENTE)
    const canHistorial        = hasPermission(PERMISOS.CITAS.HISTORIAL)
    const canVerReservas      = hasPermission(PERMISOS.CITAS.VER_RESERVAS)
    const canCitaAdicional    = hasPermission(PERMISOS.CITAS.CREAR_ADICIONAL)
    const canApoyoDiagnostico = hasPermission(PERMISOS.CITAS.APOYO_DIAGNOSTICO)
    const canVerPasadas       = hasPermission(PERMISOS.CITAS.VER_PASADAS)
    const canAsignarPasadas   = hasPermission(PERMISOS.CITAS.ASG_CITAS_PASADAS)

    // Estados para fechas disponibles en el calendario
    const [datesWithAppointments, setDatesWithAppointments] = useState<Date[]>([])
    const [datesWithoutAvailability, setDatesWithoutAvailability] = useState<Date[]>([]) // ✅ Fechas sin citas disponibles (rojas)
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
        setDatesWithAppointments([])
        setDatesWithoutAvailability([])
        return
      }
      
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
        const consultorioId = selectedConsultorioData.CONSULTORIO.trim()
        
        let availableDates: any[] = []

        // ✅ Llamar al API según el turno seleccionado usando consultorioId
        if (filters.turno === 'ALL') {
          // ✅ Si es "TODOS", llamar sin turnoConsulta (obtiene ambos turnos en una sola llamada)
          availableDates = await availableDatesService.fetchAvailableDates({
            fechaInicio,
            fechaFin,
            consultorioId,
            // turnoConsulta no se incluye, así el backend devuelve ambos turnos
          })
        } else {
          // Si es Mañana o Tarde, llamar al turno específico
          const turnoConsulta = filters.turno === 'MAÑANA' ? 'M' : 'T'
          availableDates = await availableDatesService.fetchAvailableDates({
            fechaInicio,
            fechaFin,
            turnoConsulta,
            consultorioId,
          })
        }

        // ✅ Convertir las fechas separando disponibles (verdes) y no disponibles (rojas)
        const consultorioCode = filters.consultorio !== 'all' ? filters.consultorio : undefined
        const { available, unavailable } = availableDatesService.getDatesWithAvailability(availableDates, consultorioCode)
        setDatesWithAppointments(available)
        setDatesWithoutAvailability(unavailable)
      } catch (error) {
        setDatesWithAppointments([])
      } finally {
        setLoadingDates(false)
      }
    }, [filters.consultorio, filters.turno, selectedConsultorioData, showPastAppointments])

    // Effect para cargar fechas cuando cambia consultorio, turno, mes o checkbox de citas pasadas
    useEffect(() => {
      loadAvailableDates(selectedDate)
    }, [filters.consultorio, filters.turno, selectedDate, showPastAppointments, loadAvailableDates])

    // Buscar citas por parámetros
    // Lógica de APIs:
    // - Sin consultorio/médico: usa /cita/buscar/nombreConsultorio (sin param consultorio)
    // - Con consultorio: usa /cita/citas-por-medico-consultorio?consultorioId=xxx
    // - Con médico: usa /cita/citas-por-medico-consultorio?medicoId=xxx
    // - Turno: solo se envía si no es ALL
    const searchAppointmentsByParams = useCallback(async (dateOverride?: Date) => {
      setIsRefreshing(true)
      try {
        const qs = new URLSearchParams()
        const targetDate = dateOverride || selectedDate
        const dateStr = targetDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        qs.set('desde', dateStr)
        qs.set('hasta', dateStr)
        
        // Siempre usar /api/cita/buscar/nombreConsultorio
        // - Sin consultorio: obtiene todas las citas del día
        // - Con consultorio: filtra por nombre de consultorio (completo o parcial)
        const endpoint = 'cita/buscar/nombreConsultorio'
        
        const hasConsultorio = filters.consultorio && filters.consultorio !== 'all'
        const hasMedico = filters.medico && filters.medico !== 'all'
        const hasConsultorioNameSearch = consultorioNameSearch && consultorioNameSearch.trim().length > 0
        
        // Prioridad de búsqueda:
        // 1. Búsqueda por texto libre (consultorioNameSearch)
        // 2. Consultorio seleccionado del selector
        if (hasConsultorioNameSearch) {
          qs.set('consultorio', consultorioNameSearch.trim())
        } else if (hasConsultorio && selectedConsultorioData?.NOMBRE) {
          qs.set('consultorio', selectedConsultorioData.NOMBRE.trim())
        }
        
        // Si hay médico seleccionado, pasar el código del médico
        if (hasMedico) {
          qs.set('medico', String(filters.medico).trim())
        }
        
        // Agregar filtro de estado si no es "all"
        if (filters.estado && filters.estado !== 'all') {
          qs.set('estado', String(filters.estado))
        }
        
        // Agregar filtro de turno SOLO si no es "ALL"
        if (filters.turno && filters.turno !== 'ALL') {
          const turnoBackend = filters.turno === 'MAÑANA' ? 'M' : filters.turno === 'TARDE' ? 'T' : null
          if (turnoBackend) {
            qs.set('turnoConsulta', turnoBackend)
          }
        }
        
        // Backend API usa paginación basada en 0
        qs.set('page', String(pageParam))
        qs.set('size', String(sizeParam))

        const url = `${import.meta.env.VITE_API_CITAS_MASTER_URL}/${endpoint}?${qs.toString()}`
        const res = await fetch(url)
        if (!res.ok) {
          setFilteredAppointments([])
          setTotalCount(0)
          return
        }
        const data = await res.json()
        // Determinar si la respuesta es un array o tiene un campo content/items
        const list = Array.isArray(data) ? data : 
                     Array.isArray(data?.content) ? data.content : 
                     Array.isArray(data?.items) ? data.items : []
        const mapped = list.map((it: any, idx: number) => ({
          id: String(it.citaId || it.CITAID || it.id || it.ID || `R${idx}`),
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
          especialidadSolicitud: String(it.especialidadSolicitud ?? it.ESPECIALIDAD_SOLICITUD ?? "").trim(),
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
          numRef: it.numRef ? String(it.numRef).trim() : (it.NUMREF ? String(it.NUMREF).trim() : ''),
          entidadSis: it.entidadSis ? String(it.entidadSis).trim() : (it.ENTIDAD_SIS ? String(it.ENTIDAD_SIS).trim() : (it.ENTIDADSIS ? String(it.ENTIDADSIS).trim() : '')),
          idRefcon: it.idRefcon ?? it.ID_REFCON ?? it.IDREFCON ?? null,
          nombre: String(it.nombre ?? it.NOMBRE ?? "").trim(),
        }))
        
        // Ordenar: primero por consultorio (alfabético), luego por hora (cronológico)
        const sorted = mapped.sort((a: any, b: any) => {
          // Primero comparar por nombre de consultorio
          const consultorioA = (a.consultorioNombre || a.consultorio || '').toLowerCase()
          const consultorioB = (b.consultorioNombre || b.consultorio || '').toLowerCase()
          
          if (consultorioA !== consultorioB) {
            return consultorioA.localeCompare(consultorioB)
          }
          
          // Si son del mismo consultorio, ordenar por hora
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
    }, [selectedDate, filters, pageParam, sizeParam, selectedConsultorioData, consultorioNameSearch])

    // Debounce para búsqueda por nombre de consultorio (texto libre)
    useEffect(() => {
      if (!consultorioNameSearch || consultorioNameSearch.trim().length === 0) {
        return
      }
      
      const timer = setTimeout(() => {
        searchAppointmentsByParams()
      }, 500) // 500ms de debounce
      
      return () => clearTimeout(timer)
    }, [consultorioNameSearch])

    // Estas funciones ya no son necesarias al eliminar los datos de ejemplo

    const applyFilters = () => {
      // Al eliminar los datos de ejemplo, esta función ahora solo debe llamar a la API
      searchAppointmentsByParams()
    }

    const searchAppointmentById = async (query: string, isApoyoDiagnostico = false) => {
      const id = (query || "").trim()
      if (!id) {
        applyFilters()
        return
      }
      setIsRefreshing(true)
      try {
        const res = await fetch(`${import.meta.env.VITE_API_CITAS_MASTER_URL}/cita/${encodeURIComponent(id)}`)
        if (!res.ok) {
          // Si no encuentra la cita, mostrar lista vacía en lugar de aplicar filtros
          setFilteredAppointments([])
          setTotalCount(0)
          return
        }
        const data = await res.json()
        // Verificar si realmente se encontró una cita válida
        if (!data || (Array.isArray(data) && data.length === 0)) {
          setFilteredAppointments([])
          setTotalCount(0)
          return
        }
        
        const list = Array.isArray(data) ? data : [data]
        const mapped = list.map((it: any) => ({
          id: it.citaId || it.CITAID || it.id || it.ID || id,
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
          especialidadSolicitud: String(it.especialidadSolicitud ?? it.ESPECIALIDAD_SOLICITUD ?? "").trim(),
          paciente: String(it.paciente ?? it.PACIENTE ?? ""),
          nombre: String(it.nombre ?? it.NOMBRE ?? ""),
          numero: String(it.numero ?? it.NUMERO ?? ""),
          historia: it.historia ? String(it.historia).trim() : null,
          numRef: it.numRef ? String(it.numRef).trim() : (it.NUMREF ? String(it.NUMREF).trim() : ''),
          entidadSis: it.entidadSis ? String(it.entidadSis).trim() : (it.ENTIDADSIS ? String(it.ENTIDADSIS).trim() : ''),
          usuario: String(it.usuario ?? it.USUARIO ?? ""),
          userLiberacion: it.userLiberacion ?? it.USER_LIBERACION ?? null,
          userEliminacion: it.userEliminacion ?? it.USER_ELIMINACION ?? null,
          fechaProgramada: String(it.fechaProgramada ?? it.FECHA_PROGRAMADA ?? it.FECHAPROGRAMADA ?? ""),
          fechaPago: it.fechaPago ?? it.FECHA_PAGO ?? it.FECHAPAGO ?? null,
        }))
        
        setFilteredAppointments(mapped)
        setTotalCount(mapped.length)
      } catch (e) {
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

    // Validar si la cita tiene una reserva activa
    const validarReservaActiva = async (citaId: string): Promise<boolean> => {
      try {
        setIsValidatingReserva(true)
        const apiUrl = import.meta.env.VITE_API_CITAS_MASTER_URL
        const response = await fetch(`${apiUrl}/cita/cita-valida-solicitud?citaId=${citaId}`)
        
        if (!response.ok) {
          throw new Error('Error al validar reserva')
        }
        
        const tieneReservaActiva = await response.json()
        return tieneReservaActiva
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo validar la reserva de la cita",
          variant: "destructive"
        })
        return false
      } finally {
        setIsValidatingReserva(false)
      }
    }

    const isPastDate = (dateStr?: string | null) => {
      if (!dateStr) return false
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return new Date(dateStr) < today
    }

    const handleAction = async (action: string, appointment: any) => {
      setSelectedAppointment(appointment)
      switch (action) {
        case "assign":
          if (isPastDate(appointment.fecha) && !canAsignarPasadas) {
            toast({
              title: "Acción no permitida",
              description: "No tiene permiso para asignar citas pasadas.",
              variant: "destructive"
            })
            return
          }

          const tieneReserva = await validarReservaActiva(appointment.id)

          if (tieneReserva) {
            setShowReservaActivaDialog(true)
            return
          }

          setShowAssignModal(true)
          break
        case "reschedule":
          setShowRescheduleModal(true)
          break
        case "release": {
          if (isPastDate(appointment.fecha) && !canAsignarPasadas) {
            setReleaseErrorMessage('No tiene permiso para liberar citas pasadas.')
            setShowReleaseErrorDialog(true)
            return
          }

          // Validar que solo se pueda liberar citas:
          // - Cualquier seguro en estado 2 (SIN PAGO O FUA)
          // - 05 (Crédito Paciente) o 13 (Programas) en estado 3
          const raw = (appointment.seguro ?? '').toString().trim()
          const codePart = raw.split('-')[0].trim()
          const name = (appointment.seguroNombre ?? '').toString().trim().toUpperCase()
          let seguroCode = ''
          if (codePart === '0' || codePart === '00' || name.includes('PAGANTE')) seguroCode = '0'
          else if (codePart === '05' || name.includes('CRÉDITO') || name.includes('CREDITO')) seguroCode = '05'
          else if (codePart === '13' || name.includes('PROGRAMA')) seguroCode = '13'

          const estado = Number(appointment.estado)
          const puedeLiberar =
            estado === 2 ||
            (estado === 3 && (seguroCode === '05' || seguroCode === '13'))

          if (!puedeLiberar) {
            setReleaseErrorMessage('Solo puedes liberar citas en estado SIN PAGO O FUA (2), o con seguro 05/13 en estado PAGADO O FUA (3).')
            setShowReleaseErrorDialog(true)
            return
          }

          setShowReleaseModal(true)
          break
        }
        case "details":
          setShowDetailsModal(true)
          break
        case "reassign":
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
          seguro: appointment.seguroNombre || 'PAGANTE',
          // Campos SIS (solo si el seguro es SIS: códigos 20-25)
          numRef: appointment.numRef || appointment.nroRef || '',
          entidadSis: appointment.entidadSis || appointment.eess || '',
          codigoSeguro: appointment.seguro?.trim() || ''  // Código del seguro para validar si es SIS
        }
        
        // Abrir modal de previsualización
        setTicketData(ticket)
        setShowTicketPreview(true)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo preparar el ticket. Intente nuevamente.",
          variant: "destructive"
        })
      }
    }
    
    // Función para liberar una cita
    const handleReleaseAppointment = useCallback(async (citaId: string, motivo: string) => {
      if (!citaId) {
        toast({
          title: "Error",
          description: "No se ha seleccionado ninguna cita para liberar",
          variant: "destructive"
        })
        return
      }
      
      // Validar que se haya ingresado un motivo
      if (!motivo.trim()) {
        toast({
          title: "Campo requerido",
          description: "Debe ingresar un motivo para liberar la cita",
          variant: "destructive"
        })
        return
      }
      
      try {
        // Obtener el usuario del token JWT
        const usuario = extractDocumentFromToken()

        const isApoyoDiagnostico = APOYO_DIAGNOSTICO_CONSULTORIOS.includes((selectedAppointment?.consultorio || '').trim())

        const parseReleaseResponse = async (res: Response) => {
          const contentType = res.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            return await res.json()
          }
          const text = await res.text()
          return { message: text }
        }

        // 1. Liberar la cita en el servicio regular de citas
        const citaBody = JSON.stringify(motivo.trim())
        const citaRes = await fetch(`${import.meta.env.VITE_API_CITAS_MASTER_URL}/cita/${citaId}/liberar`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'usuario': usuario
          },
          body: citaBody
        })
        const citaData = await parseReleaseResponse(citaRes)

        if (!citaRes.ok) {
          if (citaRes.status === 409) {
            setReleaseErrorMessage(citaData.message || 'No puedes liberar esta cita')
            setShowReleaseModal(false)
            setShowReleaseErrorDialog(true)
            return
          }
          throw new Error(citaData.message || `Error al liberar la cita: ${citaRes.status}`)
        }

        // 2. Para ecografía / apoyo diagnóstico, también liberar la atención usando citaId
        if (isApoyoDiagnostico) {
          const atencionBody = JSON.stringify({
            motivo: motivo.trim(),
            numero: selectedAppointment?.numero ? Number(selectedAppointment.numero) : null
          })
          const atencionRes = await fetch(`${APOYO_DIAGNOSTICO_BASE_URL}/api/apoyo-diagnostico/atenciones/${citaId}/liberar`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'usuario': usuario
            },
            body: atencionBody
          })
          const atencionData = await parseReleaseResponse(atencionRes)

          if (!atencionRes.ok) {
            if (atencionRes.status === 409) {
            } else {
              throw new Error(`Cita liberada, pero falló la liberación de atención: ${atencionData.message || atencionRes.status}`)
            }
          }
        }
        
        // Actualizar el estado local inmediatamente para reflejar la liberación visualmente
        setFilteredAppointments(prev => prev.map(a =>
          a.id === citaId
            ? { ...a, estado: 1, paciente: '', codigoPaciente: '', nombre: '', historia: null, numRef: '', entidadSis: '', idRefcon: null, fechaPago: null, pagoId: '', userLiberacion: usuario || '' }
            : a
        ))

        // Cerrar el modal de confirmación
        setShowReleaseModal(false)
        setSelectedAppointment(null)

        // Guardar ID de cita liberada y mostrar dialog de éxito
        setReleasedCitaId(citaId)
        setShowReleaseSuccessDialog(true)
      } catch (error: any) {
        setShowReleaseModal(false)
        setReleaseErrorMessage(error.message || 'No se pudo liberar la cita. Intente nuevamente.')
        setShowReleaseErrorDialog(true)
      }
    }, [selectedAppointment])
    
    const handleCloseReleaseModal = useCallback(() => {
      setShowReleaseModal(false)
    }, [])
    
    const handleShiftChange = (shift: 'MAÑANA' | 'TARDE' | 'ALL') => {
      setFilters({ ...filters, turno: shift })
      setPageParam(0) // Reset to page 0 when filter changes
    }

    // Funciones para manejar los modales de filiación (Nuevo Paciente)
    const handleNewPatientClick = () => {
      setIsNewPatientSearchModalOpen(true)
    }

    // Cuando se encuentra un paciente existente en filiación
    const handleNewPatientFound = (patientData: any) => {
      setIsNewPatientSearchModalOpen(false)
      toast({
        title: "Paciente encontrado",
        description: `Paciente ${patientData.NOMBRES || patientData.nombres} ya existe en el sistema.`,
      })
    }

    // Cuando no se encuentra y se obtienen datos de RENIEC (o null para llenado manual)
    const handleNewPatientSearchComplete = (reniecSearchData: any, sisSearchData: any) => {
      setReniecData(reniecSearchData)
      setSisData(sisSearchData)
      setDocumentType(reniecSearchData?.documentType || "DNI")
      setDocumentNumber(reniecSearchData?.document || "")
      setIsNewPatientRegistrationModalOpen(true)
      setIsNewPatientSearchModalOpen(false)
    }

    const handleNewPatientRegistrationSuccess = () => {
      setIsNewPatientRegistrationModalOpen(false)
      setReniecData(null)
      setSisData(null)
      toast({
        title: "Paciente registrado",
        description: "La historia clínica ha sido creada exitosamente.",
      })
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
                <Toaster />
    
            {/* Main Content */}
            <main className="page-shell py-8">
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
                  
                  {/* Botón Nuevo Paciente */}
                  {canNuevoPaciente && (
                    <Button
                      onClick={handleNewPatientClick}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                      title="Registrar nuevo paciente"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Nuevo Paciente
                    </Button>
                  )}

                  {canHistorial && (
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
                  )}
                  
                  {/* Botón Ver Reservas - Solo para DEVOPS y ANALISTA + permiso S028 */}
                  {canAccessReservas && canVerReservas && (
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
                  
                  {canCitaAdicional && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="font-semibold border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => setShowAdditionalPatientSearchModal(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Cita Adicional
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendario (25%) */}
                <div className="lg:col-span-1 space-y-6">
                  <Card className="shadow-lg border-0">
                    <CardHeader className="bg-blue-50 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-blue-800 font-semibold">
                          Calendario de Citas
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          {canVerPasadas && (
                          <Checkbox
                            id="showPastAppointments"
                            checked={showPastAppointments}
                            onCheckedChange={(checked) => setShowPastAppointments(checked as boolean)}
                          />
                          )}
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
                            datesWithoutAvailability={datesWithoutAvailability}
                            disablePastDates={!showPastAppointments}
                          />
                        </div>
                      </div>
                      {/* Leyenda del calendario */}
                      {filters.consultorio !== 'all' && selectedConsultorioData?.ESPECIALIDAD && (
                        <div className="p-4 border-t bg-gray-50">
                          <div className="flex flex-col gap-2 text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                                <span className="text-gray-700">Citas disponibles</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                                <span className="text-gray-700">Sin citas disponibles</span>
                              </div>
                              {loadingDates && (
                                <span className="text-gray-500 text-xs ml-2">Cargando...</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {datesWithAppointments.length > 0 || datesWithoutAvailability.length > 0
                                ? `${datesWithAppointments.length} día(s) con citas, ${datesWithoutAvailability.length} día(s) sin citas` 
                                : 'No hay programación este mes'}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg border-0">


                    {/* Botón Horario de Médicos */}
                <div className="p-4 border-t flex justify-center gap-2">
                  <a
                    href="https://citas.hospitalchosica.gob.pe/horario-medicos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                  >
                    Horario de Médicos
                  </a>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1oEWDwywEwqqhlyDC97ZA6Rn287evILLYW_vsdB3HLB4/edit?gid=0#gid=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                  >
                    Ver citas de endoscopia
                  </a>
                </div>
                                    </Card>

                </div>
    
                {/* Tabla (75%) */}
                <div className="lg:col-span-3">
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
                              setPageParam(0)
                              setSelectedTime("")
                              setSearchQuery("")
                              setShowSearchById(false)
                              setConsultorioNameSearch("")  // Limpiar búsqueda por texto libre
                              setSelectedConsultorioData(null)
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
                              // Si está buscando por ID, refrescar esa búsqueda
                              if (showSearchById && searchQuery.trim()) {
                                searchAppointmentById(searchQuery)
                              } else {
                                // Si no, refrescar con los filtros actuales
                                searchAppointmentsByParams()
                              }
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
                          <ShiftFilter 
                            onShiftChange={handleShiftChange} 
                            selectedShift={filters.turno as 'MAÑANA' | 'TARDE' | 'ALL'}
                            className="flex-shrink-0" 
                          />
                          
                          {/* Checkbox para habilitar búsqueda por ID */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Checkbox
                              id="searchById"
                              checked={showSearchById}
                              onCheckedChange={(checked) => {
                                setShowSearchById(checked as boolean)
                                if (!checked) {
                                  setSearchQuery("") // Limpiar al desmarcar
                                  // Refrescar con filtros actuales
                                  searchAppointmentsByParams()
                                } else {
                                  // Al activar búsqueda por ID, limpiar filtros de estado, consultorio y médico
                                  setFilters({
                                    estado: "all",
                                    consultorio: "all",
                                    medico: "all",
                                    turno: filters.turno
                                  })
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
                            setPageParam(0)
                            if (showSearchById) {
                              setShowSearchById(false)
                              setSearchQuery("")
                            }
                          }}
                          className="space-y-2"
                          options={ESTADO_OPTIONS}
                        />
    
                        <ConsultorioCitasSelector
                          label="Consultorio"
                          value={filters.consultorio}
                          onChange={(val: string | "all") => {
                            setFilters({ ...filters, consultorio: val, medico: val !== 'all' ? 'all' : filters.medico })
                            setPageParam(0)
                            // Limpiar búsqueda por texto libre al seleccionar consultorio específico
                            setConsultorioNameSearch("")
                            if (showSearchById) {
                              setShowSearchById(false)
                              setSearchQuery("")
                            }
                          }}
                          onConsultorioDataChange={(data: any) => {
                            setSelectedConsultorioData(data)
                            // Si se selecciona un consultorio específico, limpiar búsqueda por texto libre
                            if (data) {
                              setConsultorioNameSearch("")
                            }
                          }}
                          selectedDate={selectedDate}
                          turno={filters.turno}
                          estado={filters.estado}
                          className="space-y-2"
                        />

                        <MedicoSelector
                          label="Médico"
                          value={filters.medico}
                          onChange={(val: string | "all", consultorio?: string) => {
                            // ✅ Al seleccionar médico:
                            // - Si viene con consultorio asociado → actualizar consultorio y limpiar selectedConsultorioData
                            // - Si médico es "all" → mantener consultorio actual
                            // - Si médico específico sin consultorio → limpiar consultorio
                            if (consultorio) {
                              // Médico con consultorio asociado - actualizar ambos y limpiar data
                              setFilters({ 
                                ...filters, 
                                medico: val, 
                                consultorio: consultorio 
                              })
                              setSelectedConsultorioData(null)
                              setConsultorioNameSearch("")  // Limpiar búsqueda por texto libre
                            } else if (val === 'all') {
                              // Todos los médicos - mantener consultorio actual
                              setFilters({ ...filters, medico: val })
                            } else {
                              // Médico específico sin consultorio - limpiar consultorio
                              setFilters({ 
                                ...filters, 
                                medico: val, 
                                consultorio: 'all' 
                              })
                              setSelectedConsultorioData(null)
                              setConsultorioNameSearch("")  // Limpiar búsqueda por texto libre
                            }
                            setPageParam(0)
                            // Si está buscando por ID, desactivar búsqueda por ID
                            if (showSearchById) {
                              setShowSearchById(false)
                              setSearchQuery("")
                            }
                          }}
                          especialidad={selectedConsultorioData?.ESPECIALIDAD?.trim() || null}
                          selectedDate={selectedDate}
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
                const enriched = {...patient, _searchType: searchType}
                setSelectedPatient(enriched)
                setShowAssignModal(false)
                if (canApoyoDiagnostico && APOYO_DIAGNOSTICO_CONSULTORIOS.includes((selectedAppointment?.consultorio || '').trim())) {
                  setShowApoyoDiagnosticoAssignModal(true)
                } else {
                  setShowPatientAssignmentModal(true)
                }
              }}
            />

            {/* Patient Assignment Modal — Apoyo Diagnóstico (Ecografía) */}
            <PatientAssignDiagnosticSupportModal
              isOpen={showApoyoDiagnosticoAssignModal}
              onClose={() => {
                setShowApoyoDiagnosticoAssignModal(false)
                setSelectedPatient(null)
              }}
              onBack={() => {
                setShowApoyoDiagnosticoAssignModal(false)
                setShowAssignModal(true)
              }}
              patient={selectedPatient}
              appointment={selectedAppointment}
              searchType={selectedPatient?._searchType || 'document'}
              onAssign={async () => {}}
              onSuccess={(citaId) => {
                setShowApoyoDiagnosticoAssignModal(false)
                setShowSearchById(true)
                setSearchQuery(citaId)
                setFilters((prev) => ({ ...prev, estado: '2' }))
                searchAppointmentById(citaId, true)
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
              }}
              onSuccess={(citaId) => {
                // Actualizar estado local inmediatamente (optimistic update)
                setFilteredAppointments(prev => prev.map(a =>
                  a.id === citaId ? { ...a, estado: 2 } : a
                ))
                // Cambiar filtro a estado 2 para que la cita sea visible
                setFilters((prev) => ({ ...prev, estado: '2' }))
                // Buscar automáticamente la cita asignada
                setShowSearchById(true)
                setSearchQuery(citaId)
                searchAppointmentById(citaId)
              }}
            />

            {/* Reschedule Modal */}
            <RescheduleAppointmentModal
              isOpen={showRescheduleModal}
              onClose={() => setShowRescheduleModal(false)}
              appointment={selectedAppointment}
              onConfirm={async (_data) => {
                setShowRescheduleModal(false)
                searchAppointmentsByParams()
              }}
            />

            {/* Release Modal - Optimizado */}
            <ReleaseAppointmentModal
              isOpen={showReleaseModal}
              appointmentId={selectedAppointment?.id}
              onClose={handleCloseReleaseModal}
              onConfirm={handleReleaseAppointment}
            />

            {/* Release Success Dialog */}
            <Dialog open={showReleaseSuccessDialog} onOpenChange={setShowReleaseSuccessDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-green-700 font-semibold">
                    <CheckCircle className="w-6 h-6" />
                    ¡Cita Liberada Exitosamente!
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-700 mb-2">
                      La cita <strong className="text-green-700">{releasedCitaId}</strong> ha sido liberada correctamente.
                    </p>
                    <p className="text-sm text-gray-600">
                      La cita ya está disponible para ser asignada a otros pacientes.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => setShowReleaseSuccessDialog(false)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Entendido
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Release Error Dialog */}
            <Dialog open={showReleaseErrorDialog} onOpenChange={setShowReleaseErrorDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-700 font-semibold">
                    <XCircle className="w-6 h-6" />
                    No se puede Liberar la Cita
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-gray-700">
                      {releaseErrorMessage}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium">
                      ℹ️ Recuerda:
                    </p>
                    <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4 list-disc">
                      <li>PAGANTE (0) en estado <strong>2</strong></li>
                      <li>Seguro <strong>05 (Crédito Paciente)</strong> o <strong>13 (Programas)</strong> en estado <strong>3 (Pagado/Con FUA)</strong></li>
                    </ul>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => setShowReleaseErrorDialog(false)}
                      variant="outline"
                    >
                      Cerrar
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
                // TODO: Implement API call for medico reassignment
                setShowReassignModal(false)
              }}
            />

            {/* Additional Patient Search Modal */}
            <PatientSearchModal
              isOpen={showAdditionalPatientSearchModal}
              onClose={() => setShowAdditionalPatientSearchModal(false)}
              onPatientSelect={(patient, searchType) => {
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
              onEcoConsultorioSelected={() => {
                setShowAdditionalAppointmentModal(false)
                setShowAdditionalEcoModal(true)
              }}
              onAppointmentCreated={(appointment) => {
                const citaId = appointment?.citaId || appointment?.id || appointment?.data?.citaId
                if (citaId) {
                  setShowSearchById(true)
                  setSearchQuery(String(citaId))
                  setTimeout(() => { searchAppointmentById(String(citaId)) }, 300)
                } else {
                  searchAppointmentsByParams()
                }
              }}
            />

            {/* Additional Appointment Modal — Apoyo Diagnóstico (Ecografía 1 y 2) */}
            <AdditionalAppointmentDiagnosticSupportModal
              isOpen={showAdditionalEcoModal}
              onClose={() => {
                setShowAdditionalEcoModal(false)
                setSelectedPatientForAdditional(null)
              }}
              onBack={() => {
                setShowAdditionalEcoModal(false)
                setShowAdditionalAppointmentModal(true)
              }}
              patient={selectedPatientForAdditional}
              onAppointmentCreated={(appointment) => {
                const citaId = appointment?.citaId || appointment?.id || appointment?.data?.citaId
                if (citaId) {
                  setShowSearchById(true)
                  setSearchQuery(String(citaId))
                  setTimeout(() => { searchAppointmentById(String(citaId)) }, 300)
                } else {
                  searchAppointmentsByParams()
                }
              }}
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

            {/* Modales de Filiación - Nuevo Paciente (lazy: carga contextos solo al abrir) */}
            {(isNewPatientSearchModalOpen || isNewPatientRegistrationModalOpen) && (
              <FiliationProvider>
                {isNewPatientSearchModalOpen && (
                  <Dialog open={isNewPatientSearchModalOpen} onOpenChange={setIsNewPatientSearchModalOpen}>
                    <FiliationPatientSearchModal
                      onSearchComplete={handleNewPatientSearchComplete}
                      onPatientFound={handleNewPatientFound}
                      onCancel={() => setIsNewPatientSearchModalOpen(false)}
                      prefilledDocument={documentNumber}
                    />
                  </Dialog>
                )}

                {isNewPatientRegistrationModalOpen && (
                  <Dialog open={isNewPatientRegistrationModalOpen} onOpenChange={setIsNewPatientRegistrationModalOpen}>
                    <PatientRegistrationModal
                      reniecData={reniecData}
                      sisData={sisData}
                      documentType={documentType}
                      documentNumber={documentNumber}
                      onCancel={() => setIsNewPatientRegistrationModalOpen(false)}
                      onSuccess={handleNewPatientRegistrationSuccess}
                    />
                  </Dialog>
                )}
              </FiliationProvider>
            )}

            {/* Dialog de Reserva Activa */}
            <Dialog open={showReservaActivaDialog} onOpenChange={setShowReservaActivaDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-orange-600">
                    <CalendarClock className="h-6 w-6" />
                    Cita con Reserva Activa
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-gray-700">
                      Esta cita tiene una <strong>reserva activa</strong> pendiente de aprobación.
                    </p>
                    <p className="text-gray-700 mt-2">
                      No se puede asignar directamente hasta que la reserva sea procesada.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium">
                      ℹ️ Recomendación:
                    </p>
                    <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4 list-disc">
                      <li>Dirígete a la sección de <strong>Reservas</strong></li>
                      <li>Aprueba o deniega la solicitud pendiente</li>
                      <li>Luego podrás asignar la cita normalmente</li>
                    </ul>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      onClick={() => setShowReservaActivaDialog(false)}
                      variant="outline"
                    >
                      Cerrar
                    </Button>
                    {/* {canAccessReservas && (
                      <Button 
                        onClick={() => {
                          setShowReservaActivaDialog(false)
                          window.location.href = '/appointments/reserved'
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Ir a Reservas
                      </Button>
                    )} */}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
            </SegurosCitaProvider>
          </TipoCitaProvider>
        </RoleBasedRoute>
      </ProtectedRoute>
  )
}
