"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Stethoscope, AlertCircle, RefreshCw } from "lucide-react"
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
}

interface PatientPendingAppointmentsProps {
  pacienteId: string
  currentConsultorio?: string
  currentEspecialidad?: string
  limite?: number
  onAppointmentsLoaded?: (appointments: PendingAppointment[]) => void
}

export function PatientPendingAppointments({ 
  pacienteId, 
  currentConsultorio,
  limite = 25
}: PatientPendingAppointmentsProps) {
  const [appointments, setAppointments] = useState<PendingAppointment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      
      const data = await response.json()      setAppointments(data || [])
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

  if (isLoading) {
    return (
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-800 flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4" />
            Citas Pendientes del Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Cargando...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-red-800 flex flex-wrap items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (appointments.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700 flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4" />
            Citas Pendientes del Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-2">
            No hay citas pendientes
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-800 flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4" />
            Citas Pendientes ({appointments.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadPendingAppointments}
            disabled={isLoading}
            className="h-7 px-2"
            title="Actualizar citas pendientes"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {appointments.map((appointment) => {
            const isMatching = isMatchingConsultorio(appointment.consultorioNombre)
            
            return (
              <div
                key={appointment.citaId}
                className={`p-2 rounded-lg border text-xs ${
                  isMatching 
                    ? 'bg-orange-50 border-orange-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {isMatching && (
                  <div className="flex flex-wrap items-center gap-1 text-orange-700 font-medium mb-1">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-xs">Mismo consultorio</span>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center justify-between mb-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <span className="font-medium">{formatDateToDDMMYYYY(appointment.fecha)}</span>
                    {appointment.hora && (
                      <span className="text-xs font-semibold text-blue-600 ml-1">{appointment.hora}</span>
                    )}
                  </div>
                  {getEstadoBadge(appointment.estado)}
                </div>
                
                <div className="flex flex-wrap items-center gap-1 text-gray-600 mb-1">
                  <Stethoscope className="h-3 w-3" />
                  <span className="truncate">{appointment.medicoNombre}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-1 text-gray-600">
                  <User className="h-3 w-3" />
                  <span className="truncate">{appointment.consultorioNombre}</span>
                </div>
                
                <div className="text-gray-500 mt-1">
                  ID: {appointment.citaId}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
