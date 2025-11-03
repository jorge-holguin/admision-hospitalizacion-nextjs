"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Stethoscope, AlertCircle, Eye, X } from "lucide-react"
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
}

export function PatientPendingAppointmentsModal({ 
  pacienteId, 
  currentConsultorio,
  currentEspecialidad,
  limite = 5,
  onAppointmentsLoaded,
  highlight = false
}: PatientPendingAppointmentsModalProps) {
  const [appointments, setAppointments] = useState<PendingAppointment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (pacienteId) {
      loadPendingAppointments()
    }
  }, [pacienteId])

  const loadPendingAppointments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
      const response = await fetch(
        `${apiUrl}/cita/cita-valida-paciente?paciente=${pacienteId}&limite=${limite}`
      )
      
      if (!response.ok) {
        throw new Error('Error al cargar citas pendientes')
      }
      
      const data = await response.json()
      console.log('📋 Citas pendientes del paciente:', data)
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

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={`w-full justify-center ${highlight ? 'border-orange-600 text-orange-700 bg-orange-50 hover:bg-orange-100' : 'border-blue-600 text-blue-600 hover:bg-blue-50'}`}
      >
        <Eye className="h-4 w-4 mr-2" />
        {highlight ? '⚠️ Ver Citas Pendientes del Paciente' : 'Ver Citas Pendientes del Paciente'}
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
              {appointments.map((appointment) => {
                const matchType = getMatchType(appointment)
                const hasMatch = matchType !== 'none'
                
                return (
                  <div
                    key={appointment.citaId}
                    className={`p-4 rounded-lg border ${
                      hasMatch 
                        ? 'bg-orange-50 border-orange-300' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {hasMatch && (
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

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsOpen(false)} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
