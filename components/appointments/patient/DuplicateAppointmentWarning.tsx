"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import type { PendingAppointment } from "./PatientPendingAppointmentsModal"

interface DuplicateAppointmentWarningProps {
  appointments: PendingAppointment[]
  currentConsultorio?: string
  currentEspecialidad?: string
}

export function DuplicateAppointmentWarning({
  appointments,
  currentConsultorio,
  currentEspecialidad
}: DuplicateAppointmentWarningProps) {
  if (!appointments || appointments.length === 0) return null

  const duplicates = appointments.filter(apt => {
    const matchConsultorio = currentConsultorio && 
      apt.consultorioNombre?.trim().toLowerCase() === currentConsultorio.trim().toLowerCase()
    
    const matchEspecialidad = currentEspecialidad && apt.especialidadNombre &&
      apt.especialidadNombre.trim().toLowerCase() === currentEspecialidad.trim().toLowerCase()
    
    return matchConsultorio || matchEspecialidad
  })

  if (duplicates.length === 0) return null

  // Determinar el tipo de coincidencia
  const hasBothMatches = duplicates.some(apt => {
    const matchConsultorio = currentConsultorio && 
      apt.consultorioNombre?.trim().toLowerCase() === currentConsultorio.trim().toLowerCase()
    const matchEspecialidad = currentEspecialidad && apt.especialidadNombre &&
      apt.especialidadNombre.trim().toLowerCase() === currentEspecialidad.trim().toLowerCase()
    return matchConsultorio && matchEspecialidad
  })

  const hasConsultorioMatch = duplicates.some(apt => 
    currentConsultorio && 
    apt.consultorioNombre?.trim().toLowerCase() === currentConsultorio.trim().toLowerCase()
  )

  const hasEspecialidadMatch = duplicates.some(apt => 
    currentEspecialidad && apt.especialidadNombre &&
    apt.especialidadNombre.trim().toLowerCase() === currentEspecialidad.trim().toLowerCase()
  )

  let warningMessage = ""
  if (hasBothMatches) {
    warningMessage = `Este paciente ya tiene ${duplicates.length} cita(s) pendiente(s) en el mismo consultorio y especialidad`
  } else if (hasConsultorioMatch && hasEspecialidadMatch) {
    warningMessage = `Este paciente ya tiene ${duplicates.length} cita(s) pendiente(s) en el mismo consultorio o especialidad`
  } else if (hasConsultorioMatch) {
    warningMessage = `Este paciente ya tiene ${duplicates.length} cita(s) pendiente(s) en el mismo consultorio`
  } else if (hasEspecialidadMatch) {
    warningMessage = `Este paciente ya tiene ${duplicates.length} cita(s) pendiente(s) en la misma especialidad`
  }

  return (
    <Alert className="bg-orange-50 border-orange-300 mb-4">
      <AlertTriangle className="h-5 w-5 text-orange-600" />
      <AlertDescription className="text-orange-800 font-medium ml-2">
        {warningMessage}
      </AlertDescription>
    </Alert>
  )
}
