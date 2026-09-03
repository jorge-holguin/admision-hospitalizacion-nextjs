"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Stethoscope, AlertCircle, Eye, X, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDateToDDMMYYYY } from "@/services/appointments/printService"

export interface PendingAppointment {
  paciente: string
  fecha: string
  hora?: string
  usuario: string
  nombre: string
  estado: string
  citaId: string
  medicoNombre: string
  consultorioNombre: string
  consultorio?: string
  especialidad?: string
  especialidadNombre?: string
  especialidadSolicitud?: string
}

interface PatientPendingAppointmentsModalProps {
  pacienteId: string
  currentConsultorio?: string
  currentEspecialidad?: string
  limite?: number
  onAppointmentsLoaded?: (appointments: PendingAppointment[]) => void
  highlight?: boolean
  timeConflict?: {
    isValid: boolean
    conflictingAppointment?: PendingAppointment
    message?: string
  }
}

export function PatientPendingAppointmentsModal({ 
  pacienteId, 
  currentConsultorio,
  currentEspecialidad,
  limite = 100,
  onAppointmentsLoaded,
  highlight = false,
  timeConflict
}: PatientPendingAppointmentsModalProps) {
  const [appointments, setAppointments] = useState<PendingAppointment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const PAGE_SIZE = 10

  const totalPages = useMemo(() => Math.ceil(appointments.length / PAGE_SIZE), [appointments])

  const pagedAppointments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return appointments.slice(start, start + PAGE_SIZE)
  }, [appointments, currentPage])

  useEffect(() => {
    if (pacienteId) {
      loadPendingAppointments()
    }
  }, [pacienteId])

  const loadPendingAppointments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const apiUrl = import.meta.env.VITE_API_CITAS_MASTER_URL
      const response = await fetch(
        `${apiUrl}/cita/cita-valida-paciente?paciente=${pacienteId}&limite=${limite}`
      )
      
      if (!response.ok) {
        throw new Error('Error al cargar citas pendientes')
      }
      
      const data = await response.json()
      setAppointments(data || [])
      
      if (onAppointmentsLoaded) {
        onAppointmentsLoaded(data || [])
      }
    } catch (error) {
      console.error('❌ Error cargando citas pendientes:', error)
      setError('No se pudieron cargar las citas pendientes')
    } finally {
      setIsLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const estadoMap: Record<string, { label: string; color: string }> = {
      '1': { label: 'No Otorgado', color: 'bg-gray-500' },
      '2': { label: 'Asignado', color: 'bg-blue-500' },
      '3': { label: 'Pagado/Con FUA', color: 'bg-green-500' },
      '4': { label: 'Atendido', color: 'bg-purple-500' },
      '5': { label: 'Anulado', color: 'bg-red-500' },
    }
    
    const info = estadoMap[estado] || { label: 'Desconocido', color: 'bg-gray-400' }
    return <Badge className={`${info.color} text-white text-xs`}>{info.label}</Badge>
  }

  const isMatchingConsultorio = (consultorio: string) => {
    if (!currentConsultorio) return false
    return consultorio.trim().toLowerCase() === currentConsultorio.trim().toLowerCase()
  }

  const isMatchingEspecialidad = (appointment: PendingAppointment) => {
    if (!currentEspecialidad) return false
    const current = currentEspecialidad.trim().toLowerCase()
    
    // currentEspecialidad es el código (ej: "0001") del appointment actual
    // Comparar con "especialidad" (código) de las citas pendientes
    if (appointment.especialidad) {
      if (appointment.especialidad.trim().toLowerCase() === current) return true
    }
    
    return false
  }

  const getMatchType = (appointment: PendingAppointment) => {
    const matchConsultorio = currentConsultorio && isMatchingConsultorio(appointment.consultorioNombre)
    const matchEspecialidad = currentEspecialidad && isMatchingEspecialidad(appointment)
    
    if (matchConsultorio && matchEspecialidad) return 'both'
    if (matchConsultorio) return 'consultorio'
    if (matchEspecialidad) return 'especialidad'
    return 'none'
  }

  // Determinar el estilo del botón basado en conflictos
  const hasTimeConflict = timeConflict && !timeConflict.isValid
  const buttonStyle = hasTimeConflict 
    ? 'border-red-600 text-red-700 bg-red-50 hover:bg-red-100 animate-pulse'
    : highlight 
    ? 'border-orange-600 text-orange-700 bg-orange-50 hover:bg-orange-100 animate-pulse'
    : 'border-blue-600 text-blue-600 hover:bg-blue-50'
  
  const buttonText = hasTimeConflict
    ? '⛔ ¡Conflicto de horario! Ver Citas Pendientes'
    : highlight 
    ? '⚠️ Ver Citas Pendientes del Paciente' 
    : 'Ver Citas Pendientes del Paciente'

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={`w-full justify-center font-semibold ${buttonStyle}`}
      >
        <Eye className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800">
              <Calendar className="h-5 w-5" />
              Citas Pendientes del Paciente
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando citas pendientes...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No hay citas pendientes</p>
              <p className="text-sm text-gray-500 mt-1">Este paciente no tiene citas programadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-600 pb-2 border-b">
                  <span>{appointments.length} citas en total — Página {currentPage} de {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {pagedAppointments.map((appointment) => {
                const matchType = getMatchType(appointment)
                const hasMatch = matchType !== 'none'
                const isConflicting = timeConflict?.conflictingAppointment?.citaId === appointment.citaId
                
                return (
                  <div
                    key={appointment.citaId}
                    className={`p-4 rounded-lg border ${
                      isConflicting
                        ? 'bg-red-100 border-red-500 border-2 shadow-lg'
                        : hasMatch 
                        ? 'bg-orange-50 border-orange-300' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {isConflicting && (
                      <div className="flex items-center gap-2 text-red-800 font-bold mb-3 pb-2 border-b-2 border-red-400 bg-red-50 -m-4 mb-3 p-3">
                        <AlertCircle className="h-5 w-5 animate-pulse" />
                        <div>
                          <div className="text-sm font-bold">⛔ CONFLICTO DE HORARIO</div>
                          <div className="text-xs font-normal mt-1">Esta cita se cruza con la cita que estás intentando crear</div>
                        </div>
                      </div>
                    )}
                    
                    {!isConflicting && hasMatch && (
                      <div className="flex items-center gap-2 text-orange-700 font-medium mb-3 pb-2 border-b border-orange-200">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">
                          {matchType === 'both' && '⚠️ Mismo consultorio y especialidad'}
                          {matchType === 'consultorio' && '⚠️ Mismo consultorio'}
                          {matchType === 'especialidad' && '⚠️ Misma especialidad'}
                        </span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{formatDateToDDMMYYYY(appointment.fecha)}</span>
                          {appointment.hora && (
                            <span className="text-sm font-semibold text-blue-600 ml-2">{appointment.hora}</span>
                          )}
                          {getEstadoBadge(appointment.estado)}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Stethoscope className="h-3 w-3" />
                          <span className="truncate">{appointment.medicoNombre}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-3 w-3" />
                          <span className="truncate">{appointment.consultorioNombre}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {appointment.especialidadNombre && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Especialidad:</span>
                            <br />
                            {appointment.especialidadNombre}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          ID: {appointment.citaId}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                </Button>
                <span className="text-sm text-gray-500">{currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  Siguiente<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
            <div className="ml-auto">
              <Button onClick={() => setIsOpen(false)} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
