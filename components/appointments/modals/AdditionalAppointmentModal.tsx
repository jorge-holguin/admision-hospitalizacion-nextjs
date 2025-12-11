"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle } from "lucide-react"
import { PatientInfoCardAppointment } from "../patient/PatientInfoCardAppointment"
import { PatientPendingAppointmentsModal, type PendingAppointment } from "../patient/PatientPendingAppointmentsModal"
import { ConsultorioCitasSelector } from "../selectors/ConsultorioCitasSelector"
import { MedicoSelector } from "../selectors/MedicoSelector"
import { TipoSeguroSelector } from "../selectors/TipoSeguroSelector"
import { TurnoSelector } from "../selectors/TurnoSelector"
import { TipoCitaSelector } from "../selectors/TipoCitaSelector"
import { ArrowLeft, Loader2, CheckCircle, Edit, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { PatientEditModal } from "@/components/filiation/modals/PatientEditModal"
import { SimpleSISVerification } from "../patient/SimpleSISVerification"
import { EntidadSisSelector } from "../selectors/EntidadSisSelector"
import { ReferenciaSelector } from "../selectors/ReferenciaSelector"
import { ReferenciaProvider } from "@/contexts/ReferenciaContext"
import { extractDocumentFromToken, extractNombreCompletoFromToken, extractPuestoFromToken } from "@/utils/jwtUtils"
import { sincronizarCitaConRefcon, obtenerDatosCitaRefcon, esSeguroSIS, actualizarEstadoRefcon } from "@/services/appointments/refconSyncService"
import { obtenerEntidadSISPorCodigo } from "@/services/appointments/sisEntitiesService"
import { imprimirCita, CitaDto, formatDateToDDMMYYYY, formatDateTimeToDDMMYYYY } from "@/services/appointments/printService"
import { AppointmentCalendar } from "../utils/AppointmentCalendar"
import { Checkbox } from "@/components/ui/checkbox"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { availableDatesService } from "@/services/appointments/availableDatesService"
import { datetimeService } from '@/services/datetimeService'

interface AdditionalAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  patient: any
  onAppointmentCreated?: (appointment: any) => void  // Callback para posicionar en la cita creada
}

// Componente interno
function AdditionalAppointmentModalContent({
  isOpen,
  onClose,
  onBack,
  patient,
  onAppointmentCreated
}: AdditionalAppointmentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdAppointment, setCreatedAppointment] = useState<any>(null)
  const [showPatientEditModal, setShowPatientEditModal] = useState(false)
  const [isLoadingFullPatient, setIsLoadingFullPatient] = useState(false)
  const [fullPatientData, setFullPatientData] = useState<any>(null)
  const [refreshedPatient, setRefreshedPatient] = useState<any>(null)
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([])
  const [consultorioNombreSel, setConsultorioNombreSel] = useState<string>("")
  
  // Form fields
  const [fecha, setFecha] = useState<string>("")
  const [consultorio, setConsultorio] = useState<string>("")
  const [medico, setMedico] = useState<string>("")
  const [turno, setTurno] = useState<string>("")
  const [tipoCita, setTipoCita] = useState<string>("A") // A = Adicional (valor por defecto)
  const [tipoSeguro, setTipoSeguro] = useState<string>("")
  const [observacion, setObservacion] = useState<string>("")
  const [referencia, setReferencia] = useState<string>("")
  const [referenciaIdSeleccionada, setReferenciaIdSeleccionada] = useState<string>("")
  const [eessOrigenReferencia, setEessOrigenReferencia] = useState<string>("")
  const [eessNombreOrigen, setEessNombreOrigen] = useState<string>("")
  const [skipRefconSync, setSkipRefconSync] = useState(false) // Flag para omitir sincronización con REFCON (estados 5, 7, manual)
  const [selectedEntidadSis, setSelectedEntidadSis] = useState<string>("")
  const [sisVerificationResult, setSisVerificationResult] = useState<any>(null)
  
  // Estados para el resultado de sincronización REFCON
  const [refconSyncSuccess, setRefconSyncSuccess] = useState(false)
  const [refconSyncError, setRefconSyncError] = useState<string | null>(null)
  const [especialidadConsultorio, setEspecialidadConsultorio] = useState<string | null>(null)
  
  // Estados para el calendario
  const [datesWithAppointments, setDatesWithAppointments] = useState<Date[]>([])
  const [datesWithoutAppointments, setDatesWithoutAppointments] = useState<Date[]>([])
  const [showPastDates, setShowPastDates] = useState(false)
  const [loadingDates, setLoadingDates] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date())
  
  // Estado para el dialog de confirmación de conflicto de horario
  const [showTimeConflictDialog, setShowTimeConflictDialog] = useState(false)
  
  // Estados para médicos disponibles
  const [availableMedicos, setAvailableMedicos] = useState<Array<{codigo: string, nombre: string}>>([])
  const [loadingMedicos, setLoadingMedicos] = useState(false)
  
  // Estado para expandir/contraer calendario
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false)
  
  // Estado para controlar si la fecha está confirmada (desbloquea PASO 4)
  const [isFechaConfirmed, setIsFechaConfirmed] = useState(false)
  
  // Verificar si el usuario es DEVOPS
  const userPuesto = extractPuestoFromToken()
  const isDevOps = userPuesto?.toUpperCase() === 'DEVOPS'

  // Get API base URL from environment
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://localhost:8080/api'

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && patient) {
      // Set today's date
      const today = new Date()
      setSelectedCalendarDate(today)
      setIsFechaConfirmed(true) // Fecha inicial confirmada
      setFecha(today.toISOString().split('T')[0])
      
      // Set default seguro from patient data
      if (patient.SEGURO) {
        setTipoSeguro(patient.SEGURO)
      } else {
        console.warn('⚠️ Paciente no tiene SEGURO definido:', patient)
      }
      
      // Reset other fields
      setConsultorio("")
      setMedico("")
      setTurno("")
      // setTipoCita("")
      setObservacion("")
      setReferencia("")
      setReferenciaIdSeleccionada("")
      setEessOrigenReferencia("")
      setEessNombreOrigen("")
      setSelectedEntidadSis("")
      setSisVerificationResult(null)
      setShowSuccess(false)
      setCreatedAppointment(null)
      setDatesWithAppointments([])
      setShowPastDates(false)
    }
  }, [isOpen, patient])

  // Actualizar tipo de seguro cuando se recarga el paciente
  useEffect(() => {
    if (refreshedPatient && refreshedPatient.SEGURO) {
      setTipoSeguro(refreshedPatient.SEGURO)
    }
  }, [refreshedPatient])

  // Limpiar campos SIS cuando no es seguro SIS
  useEffect(() => {
    if (!isSisSeguro()) {
      setSelectedEntidadSis("")
      setReferencia("")
      setSisVerificationResult(null)
    }
  }, [tipoSeguro])

  // Cargar fechas disponibles cuando se selecciona consultorio Y turno
  useEffect(() => {
    const fetchAvailableDates = async () => {
      // Requiere consultorio, especialidad Y turno para cargar fechas
      if (!consultorio || !especialidadConsultorio || !turno || !selectedCalendarDate) {
        setDatesWithAppointments([])
        setDatesWithoutAppointments([])
        return
      }

      setLoadingDates(true)
      try {
        // Obtener el mes actual del calendario
        const monthStart = startOfMonth(selectedCalendarDate)
        const monthEnd = endOfMonth(selectedCalendarDate)
        
        // Formatear fechas para la API (YYYY-MM-DD)
        const formatDateForAPI = (date: Date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        
        const fechaInicio = formatDateForAPI(monthStart)
        const fechaFin = formatDateForAPI(monthEnd)
        
        // Convertir turno a formato API (M o T)
        const turnoConsulta = turno === 'MAÑANA' ? 'M' : 'T'
                
        // Usar el servicio availableDatesService con turno
        const availableDates = await availableDatesService.fetchAvailableDates({
          fechaInicio,
          fechaFin,
          idEspecialidad: especialidadConsultorio,
          turnoConsulta  // ✅ Agregar turno al servicio
        })
        
        // Filtrar solo las fechas del consultorio seleccionado
        const consultorioCode = consultorio.trim()
        const { available, unavailable } = availableDatesService.getDatesWithAvailability(availableDates, consultorioCode)
        
        setDatesWithAppointments(available)
        setDatesWithoutAppointments(unavailable)
      } catch (error) {
        console.error('Error al cargar fechas disponibles:', error)
        setDatesWithAppointments([])
        setDatesWithoutAppointments([])
      } finally {
        setLoadingDates(false)
      }
    }

    fetchAvailableDates()
  }, [consultorio, especialidadConsultorio, turno, selectedCalendarDate])

  // Actualizar fecha cuando se selecciona en el calendario
  const handleCalendarDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedCalendarDate(date)
      const dateString = date.toISOString().split('T')[0]
      setFecha(dateString)
      setIsFechaConfirmed(true) // ✅ Auto-confirmar cuando se selecciona del calendario
    }
  }

  // Cargar médicos disponibles cuando se selecciona una fecha
  useEffect(() => {
    const fetchAvailableMedicos = async () => {
      if (!consultorio || !selectedCalendarDate) {
        setAvailableMedicos([])
        setMedico("")  // Resetear médico seleccionado
        return
      }

      setLoadingMedicos(true)
      setMedico("")  // Resetear médico cuando cambia la fecha
      try {
        // Formatear la fecha seleccionada (DD/MM/YYYY)
        const formatDateForAPI = (date: Date) => {
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          return `${day}/${month}/${year}`
        }
        
        const fechaConsulta = formatDateForAPI(selectedCalendarDate)
                
        // Llamar al nuevo endpoint de médicos por fecha
        // El consultorio es opcional, si no se envía, retorna todos los médicos del día
        const url = consultorio 
          ? `/api/appointments/doctor-by-date?fecha=${encodeURIComponent(fechaConsulta)}&consultorio=${encodeURIComponent(consultorio)}`
          : `/api/appointments/doctor-by-date?fecha=${encodeURIComponent(fechaConsulta)}`
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Error al cargar médicos disponibles')
        }
        
        const data = await response.json()
        
        // El endpoint retorna directamente un array de { MEDICO, NOMBRE }
        const medicos = Array.isArray(data) ? data.map((item: any) => ({
          codigo: item.MEDICO,
          nombre: item.NOMBRE
        })) : []
        
        setAvailableMedicos(medicos)
      } catch (error) {
        console.error('Error al cargar médicos disponibles:', error)
        setAvailableMedicos([])
      } finally {
        setLoadingMedicos(false)
      }
    }

    fetchAvailableMedicos()
  }, [consultorio, selectedCalendarDate, apiBaseUrl])

  // Function to check if selected insurance is SIS
  const isSisSeguro = () => {
    const sisSegurosCodes = ['20', '21', '22', '23', '24', '25']
    const isSis = sisSegurosCodes.includes(tipoSeguro?.toString().trim())
    return isSis
  }

  // Función para cargar datos completos del paciente
  const loadFullPatientData = async (pacienteId: string) => {
    try {
      setIsLoadingFullPatient(true)
      console.log('🔄 Cargando datos completos del paciente:', pacienteId)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
      const response = await fetch(`${apiUrl}/historia-clinica/pacientes/${pacienteId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del paciente')
      }
      
      const data = await response.json()
      console.log('✅ Datos completos del paciente cargados:', data)
      setFullPatientData(data)
    } catch (error) {
      console.error('❌ Error al cargar datos del paciente:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos completos del paciente",
        variant: "destructive"
      })
    } finally {
      setIsLoadingFullPatient(false)
    }
  }

  const handleSave = async () => {
    // Validate required fields
    if (!consultorio || !medico || !turno || !tipoSeguro) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      })
      return
    }

    // Validate SIS specific fields
    if (isSisSeguro() && (!selectedEntidadSis || !referencia)) {
      toast({
        title: "Campos SIS requeridos",
        description: "Para seguros SIS, debe completar la entidad SIS y número de referencia",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Get user from JWT token
      const usuario = extractDocumentFromToken()
      
      // Construir fecha normalizada a medianoche (00:00:00.000) en formato ISO
      // Esto es crítico para que coincida con los filtros SQL que buscan fechas exactas
      // Ejemplo: "2025-11-15T00:00:00.000Z"
      const fechaISO = new Date(`${fecha}T00:00:00.000Z`).toISOString();
      
      // Determinar si la referencia es manual o de REFCON
      const esReferenciaManual = referenciaIdSeleccionada?.startsWith('manual-')
      
      // Prepare request body
      const requestBody = {
        consultorio: consultorio,
        medico: medico,
        fecha: fechaISO,
        turnoConsulta: turno === 'MAÑANA' ? 'M' : 'T',
        tipoCita: tipoCita, // ✅ Tipo de cita (A = Adicional por defecto)
        paciente: patient.PACIENTE,  // ✅ Código del paciente (sin HISTORIA)
        nombre: patient.NOMBRES || patient.NOMBRE || '',
        observacion: observacion || '',
        seguro: tipoSeguro,
        numRef: referencia || '',
        entidadSis: eessOrigenReferencia || selectedEntidadSis || '',
        // Campos REFCON
        idRefcon: esReferenciaManual ? 0 : (referenciaIdSeleccionada ? parseInt(referenciaIdSeleccionada) || 0 : 0),
        // recibidoRefcon: 0=manual, 1=pendiente sync (fallido), 2=synced OK (por defecto), 3=reutilizada (estado 5 o 7)
        // Inicialmente asumimos éxito (2), solo cambiamos a 1 si REFCON falla
        recibidoRefcon: esReferenciaManual ? 0 : (skipRefconSync ? 3 : 2)
      }
      
      console.log('🚀 Enviando cita adicional:', requestBody)
      
      // Extraer el ID de la cita creada primero para poder actualizar REFCON después
      // (En citas adicionales, necesitamos crear primero y luego actualizar REFCON)
      
      // Call the API
      const response = await fetch(`${apiBaseUrl}/cita/adicional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'usuario': usuario
        },
        body: JSON.stringify(requestBody)
      })
      
      // Clonar la respuesta para poder leerla múltiples veces si es necesario
      const responseClone = response.clone()
      
      // Intentar parsear la respuesta
      let responseData
      try {
        responseData = await response.json()
      } catch (e) {
        // Si falla JSON, intentar como texto con el clon
        try {
          responseData = await responseClone.text()
        } catch (textError) {
          responseData = { message: 'Error al procesar respuesta del servidor' }
        }
      }
      
      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 409 && responseData.message) {
          // Error de conflicto - Cita con solicitud pendiente
          toast({
            title: "Cita No Disponible",
            description: responseData.message,
            variant: "destructive"
          })
          return
        }
        
        // Otros errores
        const errorMessage = responseData.message || `Error al crear la cita: ${response.status}`
        toast({
          title: "Error al Crear Cita",
          description: errorMessage,
          variant: "destructive"
        })
        return
      }
      
      console.log('✅ Respuesta de la API:', responseData)
      
      // Extraer el ID de la cita creada de la respuesta
      const citaId = responseData.citaId || responseData.id || responseData.data?.citaId || null
      
      console.log('🎯 Estableciendo showSuccess = true')
      console.log('📋 Datos de cita creada:', responseData)
      
      // Guardar datos de la cita creada
      setCreatedAppointment(responseData)
      setShowSuccess(true)
      
      console.log('✅ showSuccess establecido, el modal debería aparecer')
      
      // Sincronizar con REFCON solo si hay referencia Y es seguro SIS Y NO es referencia manual Y NO es estado 5 o 7
      const esReferenciaManualSync = referenciaIdSeleccionada?.startsWith('manual-')
      
      if (referenciaIdSeleccionada && citaId && esSeguroSIS(tipoSeguro) && !esReferenciaManualSync && !skipRefconSync) {
        try {
          console.log('🔄 Iniciando sincronización con REFCON (Seguro SIS detectado)...')
          
          const usuarioDni = extractDocumentFromToken() || 'SISTEMA'
          
          // 1. Obtener datos de la cita desde REFCON
          const citaRefconResult = await obtenerDatosCitaRefcon(citaId, usuarioDni)
          
          if (!citaRefconResult.success || !citaRefconResult.data) {
            console.warn('⚠️ No se pudieron obtener datos de REFCON:', citaRefconResult.error)
          } else {
            const datosRefcon = citaRefconResult.data
            console.log('📋 Datos obtenidos de REFCON:', datosRefcon)
            
            // 2. Construir payload con datos obtenidos + idReferencia
            const refconPayload = {
              codUnicoDestino: datosRefcon.codUnicoDestino || "00005947",
              idReferencia: referenciaIdSeleccionada,
              datosCita: datosRefcon.datosCita || {},
              datosMedico: datosRefcon.datosMedico || {},
              personalRegistra: datosRefcon.personalRegistra || {}
            }
            
            console.log('📦 Payload para sincronización:', refconPayload)
            
            // 3. Sincronizar con REFCON
            const syncResult = await sincronizarCitaConRefcon(refconPayload)
            
            if (syncResult.success) {
              console.log('✅ Cita sincronizada exitosamente con REFCON')
              setRefconSyncSuccess(true)
              setRefconSyncError(null)
              // Estado REFCON 2 ya fue establecido al crear la cita, no se requiere actualización
            } else {
              console.warn('⚠️ Error al sincronizar con REFCON (no crítico):', syncResult.error)
              setRefconSyncSuccess(false)
              setRefconSyncError(syncResult.error || 'Error desconocido al sincronizar con REFCON')
              
              // Actualizar estado REFCON a 1 (API consultada, pendiente) porque la sincronización falló
              console.log('🔄 Actualizando estado REFCON a 1 (sincronización fallida)...')
              const estadoRefconResult = await actualizarEstadoRefcon(citaId, 1)
              if (estadoRefconResult.success) {
                console.log('✅ Estado REFCON actualizado a 1 (pendiente)')
              } else {
                console.warn('⚠️ No se pudo actualizar estado REFCON a 1:', estadoRefconResult.error)
              }
            }
          }
        } catch (refconError) {
          console.error('❌ Error al sincronizar con REFCON:', refconError)
          setRefconSyncSuccess(false)
          setRefconSyncError(refconError instanceof Error ? refconError.message : 'Error desconocido')
          
          // Actualizar estado REFCON a 1 por error
          if (citaId) {
            try {
              console.log('🔄 Actualizando estado REFCON a 1 (error en sincronización)...')
              const estadoRefconResult = await actualizarEstadoRefcon(citaId, 1)
              if (estadoRefconResult.success) {
                console.log('✅ Estado REFCON actualizado a 1 (pendiente)')
              }
            } catch (updateError) {
              console.warn('⚠️ No se pudo actualizar estado REFCON:', updateError)
            }
          }
        }
      } else if (referenciaIdSeleccionada && esReferenciaManualSync) {
        console.log('ℹ️ Sincronización REFCON omitida: Referencia ingresada manualmente')
      } else if (referenciaIdSeleccionada && skipRefconSync) {
        console.log('ℹ️ Sincronización REFCON omitida: Referencia con estado RECIBIDO o CITADO (no requiere sincronización)')
      } else if (referenciaIdSeleccionada && !esSeguroSIS(tipoSeguro)) {
        console.log('ℹ️ Sincronización REFCON omitida: Seguro no es SIS (código:', tipoSeguro, ')')
      }
      
      // Imprimir la cita automáticamente si tenemos el ID
      if (citaId) {
        try {
          await imprimirCitaAsignada(citaId)
        } catch (printError) {
          console.error('Error al imprimir cita:', printError)
        }
      }
      
      // Notificar al componente padre que se creó la cita
      if (onAppointmentCreated) {
        onAppointmentCreated(responseData)
      }
      
    } catch (error: any) {
      console.error('❌ Error creating additional appointment:', error)
      toast({
        title: "Error",
        description: error.message || "Hubo un error al crear la cita adicional. Intente nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const imprimirCitaAsignada = async (citaId: string) => {
    try {
      console.log('🖨️ Obteniendo datos de la cita para imprimir:', citaId)
      
      // Obtener datos completos de la cita
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL}/cita/${citaId}`)
      
      if (!response.ok) {
        throw new Error('No se pudo obtener los datos de la cita')
      }
      
      const citaData = await response.json()
      console.log('📋 Datos de cita recibidos para impresión:', citaData)
      
      // Obtener el operador desde el JWT
      const operador = extractNombreCompletoFromToken() || 'OPERADOR'
      
      // Formatear turno
      const turnoConsulta = citaData.turnoConsulta || ''
      const turnoFormateado = turnoConsulta.trim().toUpperCase() === 'M' ? 'Mañana' : 
                              turnoConsulta.trim().toUpperCase() === 'T' ? 'Tarde' : turnoConsulta
      
      // Obtener nombre de entidad SIS si existe
      let eessFormatted = ''
      if (citaData.entidadSis) {
        try {
          const entidadResponse = await fetch(`/api/appointments/sis-entities/${citaData.entidadSis.trim()}`)
          if (entidadResponse.ok) {
            const entidadData = await entidadResponse.json()
            if (entidadData.success && entidadData.data) {
              eessFormatted = `(${citaData.entidadSis.trim()}) - ${entidadData.data.NOMBRE}`
              console.log('✅ EESS formateado:', eessFormatted)
            } else {
              eessFormatted = citaData.entidadSis.trim()
            }
          } else {
            eessFormatted = citaData.entidadSis.trim()
          }
        } catch (error) {
          console.warn('⚠️ Error al obtener nombre de entidad SIS, usando solo código:', error)
          eessFormatted = citaData.entidadSis.trim()
        }
      }
      
      // Construir el DTO para impresión con fechas formateadas
      const citaDto: CitaDto = {
        numero: citaData.citaId || citaId,
        numeroAtencion: citaData.numero || '',
        paciente: citaData.nombre || '',
        consultorio: citaData.consultorioNombre || '',
        medico: citaData.medicoNombre || '',
        diaAtencion: formatDateToDDMMYYYY(citaData.fecha || new Date().toISOString()),
        turno: turnoFormateado,
        hora: citaData.hora || '',
        historiaClinica: patient?.HISTORIA ? String(patient.HISTORIA).trim() : (citaData.historia ? String(citaData.historia).trim() : null),
        emitidoEl: formatDateTimeToDDMMYYYY(new Date().toISOString()),
        operador: operador,
        seguro: citaData.seguroNombre || 'PAGANTE',
        // Incluir campos SIS si existen
        ...(citaData.numRef && { nroRef: citaData.numRef }),
        ...(eessFormatted && { eess: eessFormatted })
      }
      
      console.log('🖨️ Enviando cita a imprimir:', citaDto)
      await imprimirCita(citaDto)
      
      console.log('✅ Cita enviada a imprimir correctamente')
    } catch (error) {
      console.error('❌ Error al imprimir cita:', error)
      // No mostrar error al usuario ya que la creación fue exitosa
    }
  }

  const handleClose = () => {
    // Limpiar todos los estados
    setShowSuccess(false)
    setCreatedAppointment(null)
    setReferencia('')
    setReferenciaIdSeleccionada('')
    setSelectedEntidadSis('')
    setEessOrigenReferencia('')
    setEessNombreOrigen('')
    setSkipRefconSync(false)
    setSisVerificationResult(null)
    setRefconSyncSuccess(false)
    setRefconSyncError(null)
    onClose()
  }

  if (!patient) return null

  // Detectar coincidencias para mostrar advertencia en cabecera
  const hasConsultorioMatch = pendingAppointments?.some((apt) => {
    const curr = consultorioNombreSel?.trim().toLowerCase()
    const other = apt.consultorioNombre?.trim().toLowerCase()
    return curr && other && curr === other
  })

  const hasEspecialidadMatch = pendingAppointments?.some((apt) => {
    const currEspecialidad = especialidadConsultorio?.trim().toLowerCase()
    if (!currEspecialidad) return false
    
    // Comparar con el campo 'especialidad' (código) de las citas pendientes
    const matchCodigo = apt.especialidad?.trim().toLowerCase() === currEspecialidad
    
    return matchCodigo
  })

  // Validar ventana de 3 horas entre citas y mismo turno
  const validateTimeWindow = (): { isValid: boolean; conflictingAppointment?: any; message?: string } => {
    if (!fecha || !turno || pendingAppointments.length === 0) {
      return { isValid: true }
    }

    // Obtener hora de inicio del turno seleccionado
    let selectedHour = 0
    let selectedTurno = ''
    if (turno === 'M' || turno === 'MAÑANA') {
      selectedHour = 8 // 8:00 AM
      selectedTurno = 'MAÑANA'
    } else if (turno === 'T' || turno === 'TARDE') {
      selectedHour = 14 // 2:00 PM
      selectedTurno = 'TARDE'
    } else {
      return { isValid: true } // Si no hay turno válido, permitir
    }

    // Convertir fecha seleccionada a Date
    const selectedDate = new Date(fecha)
    const selectedDateTime = new Date(selectedDate)
    selectedDateTime.setHours(selectedHour, 0, 0, 0)

    // Verificar cada cita pendiente
    for (const apt of pendingAppointments) {
      if (!apt.fecha || !apt.hora) continue

      // Parsear fecha de la cita pendiente
      let aptDate: Date
      if (apt.fecha.includes('/')) {
        const [day, month, year] = apt.fecha.split('/')
        aptDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      } else if (apt.fecha.includes('-')) {
        // ✅ Manejar formato ISO con timestamp (ej: "2025-12-10 00:00:00" o "2025-12-10T00:00:00")
        const fechaClean = apt.fecha.split(' ')[0].split('T')[0] // Obtener solo YYYY-MM-DD
        aptDate = new Date(fechaClean + 'T00:00:00')
      } else {
        continue
      }

      // Parsear hora de la cita pendiente (formato HH:MM)
      const [hours, minutes] = apt.hora.split(':').map(Number)
      aptDate.setHours(hours, minutes || 0, 0, 0)

      // Verificar si es el mismo día
      const isSameDay = selectedDate.toDateString() === aptDate.toDateString()
      
      if (isSameDay) {
        // Determinar turno de la cita pendiente
        const aptTurno = hours < 14 ? 'MAÑANA' : 'TARDE'
        
        // Si es el mismo turno, advertir
        if (aptTurno === selectedTurno) {
          return {
            isValid: false,
            conflictingAppointment: apt,
            message: `⚠️ El paciente ya tiene una cita programada el ${apt.fecha} a las ${apt.hora} en el turno de ${aptTurno}. No se puede asignar otra cita en el mismo turno.`
          }
        }
        
        // Calcular diferencia en horas
        const diffMs = Math.abs(selectedDateTime.getTime() - aptDate.getTime())
        const diffHours = diffMs / (1000 * 60 * 60)

        // Si la diferencia es menor a 3 horas, hay conflicto
        if (diffHours < 3) {
          return {
            isValid: false,
            conflictingAppointment: apt,
            message: `⚠️ El paciente tiene una cita programada el ${apt.fecha} a las ${apt.hora}. Los horarios se cruzarían. Debe haber al menos 3 horas de diferencia entre citas para evitar conflictos.`
          }
        }
      }
    }

    return { isValid: true }
  }

  const timeValidation = validateTimeWindow()

  if (showSuccess) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-green-700 flex items-center justify-center">
              <CheckCircle className="mr-2 h-6 w-6" />
              ¡Cita Creada Exitosamente!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-gray-700">
              La cita adicional ha sido guardada correctamente.
            </p>

            {/* Bloque con información de la cita creada */}
            {createdAppointment && (
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-green-800 text-lg mb-3">
                  Información de la Cita Creada
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Número:</span> {createdAppointment.numero || 'N/A'}</div>
                  <div><span className="font-medium">Fecha:</span> {createdAppointment.fecha ? new Date(createdAppointment.fecha).toLocaleDateString('es-PE') : 'N/A'}</div>
                  <div><span className="font-medium">Hora:</span> {createdAppointment.hora || 'N/A'}</div>
                  <div><span className="font-medium">Turno:</span> {createdAppointment.turnoConsulta === 'M' ? 'MAÑANA' : 'TARDE'}</div>
                  <div><span className="font-medium">Consultorio:</span> {createdAppointment.consultorio || 'N/A'}</div>
                  <div><span className="font-medium">Médico:</span> {createdAppointment.medico || 'N/A'}</div>
                  <div className="col-span-2"><span className="font-medium">Paciente:</span> {createdAppointment.nombre || patient.NOMBRES}</div>
                  {createdAppointment.observacion && (
                    <div className="col-span-2"><span className="font-medium">Observación:</span> {createdAppointment.observacion}</div>
                  )}
                </div>
              </div>
            )}

            {/* Resultado de sincronización con REFCON */}
            {refconSyncSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm text-left">
                <p className="font-semibold mb-1">Sincronización con REFCON</p>
                <p>✅ La cita fue registrada exitosamente en el sistema de referencias (REFCON).</p>
              </div>
            )}

            {!refconSyncSuccess && refconSyncError && (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-3 text-sm text-left space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Sincronización con REFCON incompleta
                </p>
                <p>
                  ✅ La cita fue creada correctamente en el sistema local, pero REFCON devolvió un error y no se pudo registrar allí.
                </p>
                <p className="text-xs text-orange-900">
                  Por favor, informe al área responsable para que realicen la sincronización manual.
                </p>
                <details className="text-xs text-orange-900 mt-1">
                  <summary className="cursor-pointer hover:text-orange-700">Ver detalles técnicos del error</summary>
                  <pre className="mt-2 p-2 bg-orange-100 rounded overflow-auto max-h-32 whitespace-pre-wrap">
                    {refconSyncError}
                  </pre>
                </details>
              </div>
            )}

            <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700">
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl h-[90vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mr-2 p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            Confirmar Asignación de Paciente - Información del Paciente
          </DialogTitle>
          <DialogDescription>
            Complete los datos para crear una cita adicional
          </DialogDescription>
        </DialogHeader>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto min-h-0">
        {/* Advertencias */}
        <div className="space-y-3 mb-4">
          {(hasConsultorioMatch || hasEspecialidadMatch) && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-orange-800">
              {hasConsultorioMatch && hasEspecialidadMatch && (
                <>⚠️ Este paciente tiene una cita pendiente en el mismo consultorio y especialidad.</>
              )}
              {!hasEspecialidadMatch && hasConsultorioMatch && (
                <>⚠️ Este paciente tiene una cita pendiente en el mismo consultorio.</>
              )}
              {!hasConsultorioMatch && hasEspecialidadMatch && (
                <>⚠️ Este paciente tiene una cita pendiente en la misma especialidad.</>
              )}
            </div>
          )}
          
          {!timeValidation.isValid && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">⛔ Conflicto de horario</p>
                  <p className="text-sm mt-1">{timeValidation.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Info Card - Left Side */}
          <div className="lg:col-span-1 flex flex-col space-y-3">
            <PatientInfoCardAppointment 
              patient={refreshedPatient || patient}
              className="flex-1"
            />
            
            <Button
              variant="outline"
              onClick={async () => {
                console.log('🔘 Click en Actualizar Historia Clínica')
                console.log('   - patient:', patient)
                console.log('   - patient?.PACIENTE:', patient?.PACIENTE)
                console.log('   - patient?.HISTORIA:', patient?.HISTORIA)
                
                const pacienteId = patient?.PACIENTE || patient?.HISTORIA
                console.log('   - pacienteId seleccionado:', pacienteId)
                
                if (pacienteId) {
                  await loadFullPatientData(pacienteId)
                  console.log('✅ Abriendo modal de edición')
                  setShowPatientEditModal(true)
                } else {
                  console.error('❌ No se encontró pacienteId')
                  toast({
                    title: "Error",
                    description: "No se pudo identificar al paciente",
                    variant: "destructive"
                  })
                }
              }}
              disabled={isLoadingFullPatient}
              className="w-full justify-center px-6 py-2.5 h-11 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 relative z-10 mt-4"
            >
              {isLoadingFullPatient ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Cargando...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Actualizar Historia Clínica
                </>
              )}
            </Button>
          </div>
          
          {/* Appointment Form - Right Side */}
          <div className="lg:col-span-1 flex flex-col">
            <Card className="flex-1">
              <CardContent className="p-6 space-y-6">
                {/* Información de la Cita */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    Información de la Cita
                    <span className="ml-2 text-xs text-gray-500 font-normal">(Siga el orden: Consultorio → Turno → Fecha → Médico)</span>
                  </h3>
                  
                  {/* PASO 1: Consultorio */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                      <Label className="text-sm font-medium text-gray-700">
                        Consultorio <span className="text-red-500">*</span>
                      </Label>
                    </div>
                    <ConsultorioCitasSelector
                      label=""
                      value={consultorio}
                      onChange={(value) => {
                        setConsultorio(value)
                        // Resetear campos dependientes (mantener fecha seleccionada)
                        setTurno("")
                        setMedico("")
                        setDatesWithAppointments([])
                        setDatesWithoutAppointments([])
                      }}
                      onConsultorioDataChange={(data) => {
                        if (data && data.ESPECIALIDAD) {
                          setEspecialidadConsultorio(data.ESPECIALIDAD)
                          if (data.NOMBRE) setConsultorioNombreSel(data.NOMBRE)
                        } else {
                          setEspecialidadConsultorio(null)
                          setConsultorioNombreSel("")
                        }
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* PASO 2: Turno */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        consultorio ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
                      }`}>2</div>
                      <Label className="text-sm font-medium text-gray-700">
                        Turno <span className="text-red-500">*</span>
                      </Label>
                    </div>
                    {!consultorio ? (
                      <div className="border rounded-lg p-3 bg-gray-100">
                        <p className="text-sm text-gray-500 text-center">Primero seleccione un consultorio</p>
                      </div>
                    ) : (
                      <TurnoSelector
                        label=""
                        value={turno}
                        onChange={(value) => {
                          setTurno(value)
                          // Resetear campos dependientes (mantener fecha seleccionada)
                          setMedico("")
                          setDatesWithAppointments([])
                          setDatesWithoutAppointments([])
                        }}
                      />
                    )}
                  </div>

                  {/* PASO 3: Fecha de la Cita (Calendario + Entrada Manual) */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          consultorio && turno && isFechaConfirmed ? 'bg-blue-600 text-white' : consultorio && turno ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
                        }`}>3</div>
                        <Label className="text-sm font-medium text-gray-700">Fecha de la Cita <span className="text-red-500">*</span></Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {isDevOps && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="showPastDates"
                              checked={showPastDates}
                              onCheckedChange={(checked) => setShowPastDates(checked as boolean)}
                            />
                            <label
                              htmlFor="showPastDates"
                              className="text-xs font-medium text-gray-600 cursor-pointer"
                            >
                              Permitir fechas pasadas
                            </label>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                          className="h-7 text-xs"
                          disabled={!consultorio || !turno}
                        >
                          {isCalendarExpanded ? 'Contraer' : 'Expandir'}
                        </Button>
                      </div>
                    </div>

                    {!consultorio || !turno ? (
                      <div className="border rounded-lg p-3 bg-gray-100">
                        <p className="text-sm text-gray-500 text-center">
                          Primero seleccione consultorio y turno
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Vista compacta: entrada manual rápida (sin botón de confirmación) */}
                        {!isCalendarExpanded && (
                          <div className="border rounded-lg p-2.5 bg-gray-50">
                            <Input
                              type="date"
                              value={fecha}
                              onChange={(e) => {
                                const newDate = e.target.value
                                setFecha(newDate)
                                if (newDate) {
                                  const dateObj = new Date(newDate + 'T00:00:00')
                                  setSelectedCalendarDate(dateObj)
                                  setIsFechaConfirmed(true) // Auto-confirmar al cambiar fecha manualmente
                                } else {
                                  setIsFechaConfirmed(false)
                                }
                              }}
                              className="w-full"
                              min={showPastDates ? undefined : new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        )}

                        {/* Vista expandida: calendario completo + entrada manual */}
                        {isCalendarExpanded && (
                          <>
                            <div className="border rounded-lg overflow-hidden">
                              <AppointmentCalendar
                                selectedDate={selectedCalendarDate}
                                onDateSelect={handleCalendarDateSelect}
                                className="border-0 rounded-none"
                                datesWithAppointments={datesWithAppointments}
                                datesWithoutAvailability={datesWithoutAppointments}
                                disablePastDates={!showPastDates}
                              />
                            </div>

                            {/* Input manual vinculado a la misma fecha (sin botón de confirmación) */}
                            <div className="mt-3">
                              <Input
                                type="date"
                                value={fecha}
                                onChange={(e) => {
                                  const newDate = e.target.value
                                  setFecha(newDate)
                                  if (newDate) {
                                    const dateObj = new Date(newDate + 'T00:00:00')
                                    setSelectedCalendarDate(dateObj)
                                    setIsFechaConfirmed(true) // Auto-confirmar también en modo expandido
                                  } else {
                                    setIsFechaConfirmed(false)
                                  }
                                }}
                                className="w-full"
                                min={showPastDates ? undefined : new Date().toISOString().split('T')[0]}
                              />
                            </div>

                            {consultorio && turno && (datesWithAppointments.length > 0 || datesWithoutAppointments.length > 0) && (
                              <div className="mt-2 p-1.5 bg-gray-50 rounded text-xs text-gray-600 space-y-0.5">
                                {datesWithAppointments.length > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 bg-green-100 border border-green-300 rounded"></div>
                                    <span>Días con citas ({datesWithAppointments.length})</span>
                                  </div>
                                )}
                                {datesWithoutAppointments.length > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 bg-red-100 border border-red-300 rounded"></div>
                                    <span>Sin citas - Adicional permitido ({datesWithoutAppointments.length})</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                    
                    {loadingDates && consultorio && turno && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Cargando fechas disponibles para turno {turno}...
                      </div>
                    )}
                  </div>

                  {/* PASO 4: Médico */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          consultorio && turno && isFechaConfirmed ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
                        }`}>4</div>
                        <Label className="text-sm font-medium text-gray-700">
                          Médico <span className="text-red-500">*</span>
                        </Label>
                      </div>
                      <div>
                        {loadingMedicos && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Cargando...
                          </span>
                        )}
                        {!loadingMedicos && availableMedicos.length > 0 && (
                          <span className="text-xs text-green-600">
                            {availableMedicos.length} disponible{availableMedicos.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    {(!consultorio || !turno || !isFechaConfirmed) ? (
                      <div className="border rounded-lg p-3 bg-gray-100">
                        <p className="text-sm text-gray-500 text-center">Primero complete consultorio, turno y fecha</p>
                      </div>
                    ) : (
                      <MedicoSelector
                        label=""
                        value={medico}
                        onChange={setMedico}
                        especialidad={especialidadConsultorio}
                        availableMedicos={availableMedicos.length > 0 ? availableMedicos : undefined}
                        className="w-full"
                      />
                    )}
                  </div>

                  {/* Botón para ver citas pendientes del paciente */}
                  {patient?.PACIENTE && (
                    <div className="mt-4">
                      <PatientPendingAppointmentsModal
                        pacienteId={patient.PACIENTE}
                        currentConsultorio={consultorioNombreSel}
                        currentEspecialidad={especialidadConsultorio || undefined}
                        limite={5}
                        highlight={hasConsultorioMatch || hasEspecialidadMatch}
                        onAppointmentsLoaded={setPendingAppointments}
                        timeConflict={timeValidation}
                      />
                    </div>
                  )}
                </div>

                {/* Datos de Asignación */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">Datos de Asignación</h3>
                  
                  <div className="space-y-4">
                    {/* Tipo de Cita */}
                    { <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Tipo de Cita <span className="text-red-500">*</span>
                      </Label>
                      <TipoCitaSelector
                        label=""
                        value={tipoCita}
                        onChange={setTipoCita}
                        initialValue="A"
                        placeholder="A - ADICIONAL"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Por defecto: A - ADICIONAL (cita adicional fuera del cupo regular)
                      </p>
                    </div>}

                    {/* Tipo de Seguro */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Tipo de Seguro <span className="text-red-500">*</span>
                      </Label>
                      <TipoSeguroSelector
                        label=""
                        value={tipoSeguro}
                        onChange={setTipoSeguro}
                      />
                    </div>

                    {/* Observación */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Observación
                      </Label>
                      <Input
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        placeholder="Ingrese observaciones..."
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Verificación SIS - Automática cuando se selecciona un seguro SIS */}
                  {isSisSeguro() && (
                    <div className="mt-4">
                      <SimpleSISVerification
                        patientId={patient.HISTORIA}
                        documento={patient.DOCUMENTO}
                        autoVerify={true}
                        showButton={true}
                        onVerificationComplete={(result) => {
                          setSisVerificationResult(result)
                          if (result.isSuccess) {   
                            if (result.eess) {
                              // Hacer trim a los ceros del código de establecimiento
                              const trimmedEess = result.eess.replace(/^0+/, '') || result.eess
                              // Asegurar que se actualice el estado inmediatamente
                              setSelectedEntidadSis(trimmedEess)
                              
                              // Forzar un retraso para asegurar que el estado se actualice
                              setTimeout(() => {
                              }, 100)
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
                        especialidadCodigo={especialidadConsultorio || undefined}
                        value={referenciaIdSeleccionada}
                        onChange={async (refData) => {
                          setReferencia(refData.numeroReferencia)
                          setReferenciaIdSeleccionada(refData.idReferencia)
                          
                          // Guardar flag de sincronización con REFCON
                          setSkipRefconSync(refData.skipRefconSync || false)
                          
                          // Obtener nombre de la entidad SIS desde la API
                          if (refData.codigoestablecimientoOrigen) {
                            
                            // Actualizar inmediatamente el código del establecimiento
                            setEessOrigenReferencia(refData.codigoestablecimientoOrigen)
                            setSelectedEntidadSis(refData.codigoestablecimientoOrigen)
                            
                            const result = await obtenerEntidadSISPorCodigo(refData.codigoestablecimientoOrigen)
                            if (result.success && result.data) {
                              setEessNombreOrigen(result.data.NOMBRE)
                            } else {
                              console.warn('⚠️ No se pudo obtener nombre de entidad SIS, usando valor de referencia')
                              setEessNombreOrigen(refData.establecimientoOrigen || 'Establecimiento de origen')
                            }
                          } else {
                            // Si no hay código, usar el nombre que viene de la referencia
                            setEessNombreOrigen(refData.establecimientoOrigen || '')
                            setEessOrigenReferencia('')
                            setSelectedEntidadSis('')
                          }
                        }}
                        onEessChange={(eess) => {
                          setEessOrigenReferencia(eess)
                        }}
                      />
                      <EntidadSisSelector
                        value={selectedEntidadSis}
                        onChange={setSelectedEntidadSis}
                        required={true}
                        sisEstablecimiento={
                          eessOrigenReferencia ? {
                            codigo: eessOrigenReferencia,
                            nombre: eessNombreOrigen
                          } : sisVerificationResult?.isSuccess ? {
                            codigo: sisVerificationResult.eess?.replace(/^0+/, '') || '',
                            nombre: sisVerificationResult.descEESS || ''
                          } : undefined
                        }
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botón para ver citas pendientes del paciente - removido desde aquí, ahora está dentro de la tarjeta de info */}
          </div>
        </div>
        </div>

        {/* Action Buttons - Below both panels */}
        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              // Si hay conflicto de horario, mostrar diálogo de advertencia primero
              if (!timeValidation.isValid) {
                setShowTimeConflictDialog(true)
              } else {
                handleSave()
              }
            }}
            disabled={isLoading || !consultorio || !medico || !turno || !tipoCita || !tipoSeguro || (isSisSeguro() && (!selectedEntidadSis || !referencia)) || hasConsultorioMatch}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
            title={
              hasConsultorioMatch 
                ? "No se puede confirmar: el paciente ya tiene una cita en el mismo consultorio" 
                : ""
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Confirmar Cita Adicional'
            )}
          </Button>
        </div>
      </DialogContent>

      {/* Modal de edición de paciente */}
      {showPatientEditModal && fullPatientData && (
        <Dialog open={showPatientEditModal} onOpenChange={(open) => {
          if (!open) {
            setShowPatientEditModal(false)
            setFullPatientData(null)
          }
        }}>
          <PatientEditModal
            patient={fullPatientData}
            onCancel={() => {
              setShowPatientEditModal(false)
              setFullPatientData(null)
            }}
          onSuccess={async () => {
            setShowPatientEditModal(false)
            setFullPatientData(null)
            
            // Recargar datos del paciente
            const pacienteId = patient?.PACIENTE || patient?.HISTORIA
            if (pacienteId) {
              try {
                console.log('🔄 Recargando datos del paciente:', pacienteId)
                const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
                const response = await fetch(`${apiUrl}/historia-clinica/pacientes/${pacienteId}`)
                
                if (response.ok) {
                  const data = await response.json()
                  console.log('✅ Datos del paciente recargados:', data)
                  
                  // Mapear los datos al formato esperado por PatientInfoCardAppointment
                  const mappedPatient = {
                    ...patient, // Mantener campos originales
                    HISTORIA: data.historia || patient.HISTORIA,
                    NOMBRES: data.nombres ? `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''} ${data.nombres || ''}`.trim() : patient.NOMBRES,
                    NOMBRE: data.nombres || patient.NOMBRE,
                    PATERNO: data.apellidoPaterno || patient.PATERNO,
                    MATERNO: data.apellidoMaterno || patient.MATERNO,
                    SEXO: data.sexo || patient.SEXO,
                    DOCUMENTO: data.numeroDocumento || patient.DOCUMENTO,
                    TIPO_DOCUMENTO: data.tipoDocumento || patient.TIPO_DOCUMENTO,
                    FECHA_NACIMIENTO: data.fechaNacimiento || patient.FECHA_NACIMIENTO,
                    EDAD: data.edad || patient.EDAD,
                    // Estado Civil: puede venir como objeto { estadoCivil, nombre } o como string
                    ESTADO_CIVIL: (data.estadoCivil?.estadoCivil?.trim && data.estadoCivil?.estadoCivil?.trim()) || data.estadoCivil || patient.ESTADO_CIVIL,
                    DIRECCION: data.direccion || patient.DIRECCION,
                    DISTRITO: data.distrito || patient.DISTRITO,
                    Distrito_Dir: data.distritoNacimiento || data.Distrito_Dir || patient.Distrito_Dir,
                    TELEFONO1: data.telefono || patient.TELEFONO1,
                    CORREO: data.correo || patient.CORREO,
                    // Seguro: puede venir como objeto {seguro, nombre} o como string
                    SEGURO: data.seguro?.seguro?.trim() || data.seguro || patient.SEGURO,
                    NOMBRE_SEGURO: data.seguro?.nombre || data.nombreSeguro || patient.NOMBRE_SEGURO,
                    STRING_FOTO: data.foto || patient.STRING_FOTO,
                    PACIENTE: data.paciente || patient.PACIENTE
                  }
                  
                  console.log('✅ Paciente mapeado:', mappedPatient)
                  setRefreshedPatient(mappedPatient)
                } else {
                  console.error('❌ Error al recargar datos del paciente')
                }
              } catch (error) {
                console.error('❌ Error al recargar datos del paciente:', error)
              }
            }
            
            toast({
              title: "Éxito",
              description: "Historia clínica actualizada correctamente",
            })
          }}
          />
        </Dialog>
      )}
      
      {/* Diálogo de confirmación de conflicto de horario */}
      <Dialog open={showTimeConflictDialog} onOpenChange={setShowTimeConflictDialog}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-6 w-6" />
              ⚠️ Advertencia: Posible Conflicto de Horario
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Se ha detectado un posible conflicto de horario con otra cita del paciente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Mensaje de conflicto */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-2">Detalles del conflicto:</p>
                  <p>{timeValidation.message}</p>
                </div>
              </div>
            </div>

            {/* Advertencia de responsabilidad */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-semibold mb-2">
                ⚠️ IMPORTANTE - Responsabilidad del Admisionista
              </p>
              <p className="text-sm text-red-800">
                Si decide continuar con la asignación a pesar del conflicto de horario detectado, 
                <span className="font-bold"> usted será responsable de cualquier problema o inconveniente</span> que 
                pueda surgir debido a la superposición de horarios.
              </p>
            </div>

            {/* Pregunta de confirmación */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium text-center">
                ¿Está seguro de que desea continuar con la asignación de esta cita?
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTimeConflictDialog(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowTimeConflictDialog(false)
                handleSave() // Continuar con el guardado
              }}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              Sí, Continuar Bajo Mi Responsabilidad
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

      </Dialog>
  )
}

// Componente wrapper con ReferenciaProvider
export function AdditionalAppointmentModal(props: AdditionalAppointmentModalProps) {
  return (
    <ReferenciaProvider>
      <AdditionalAppointmentModalContent {...props} />
    </ReferenciaProvider>
  )
}
