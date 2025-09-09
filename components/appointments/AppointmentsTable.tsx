"use client"

import React, { useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Unlock, CalendarClock, UserPlus, Eye } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useMedicos } from "@/contexts/MedicosContext"
import { useConsultorios } from "@/contexts/ConsultoriosContext"

export interface AppointmentRow {
  id: string
  estado: number
  fecha: string
  hora: string
  turno?: string
  turnoConsulta?: "M" | "T" | string
  consultorio: string
  medico: string
  seguro?: string
  paciente?: string
  fechaProgramada?: string | null
  fechaPago?: string | null
  [key: string]: any
}

interface AppointmentsTableProps {
  appointments: AppointmentRow[]
  getEstadoBadge: (estado: number) => React.ReactNode
  onAction: (action: "release" | "reschedule" | "assign" | "details", appointment: AppointmentRow) => void
}

export function AppointmentsTable({ appointments, getEstadoBadge, onAction }: AppointmentsTableProps) {
  const { getMedicoInfo, loadMedicosByCodigos } = useMedicos()
  const { getConsultorioNombre } = useConsultorios()

  const displayMedico = (row: AppointmentRow) => {
    // Prefer explicit name fields from backend, if any
    const direct = (row as any).medicoNombre || (row as any).MEDICO_NOMBRE || (row as any).NOMBRE_MEDICO || (row as any).NOMBRE
    if (direct && typeof direct === 'string' && direct.trim().length > 0) return String(direct)
    const code = String(row.medico || '').trim()
    if (!code) return "-"
    // getMedicoInfo ahora devuelve solo el nombre
    return getMedicoInfo(code)
  }

  const displayConsultorio = (row: AppointmentRow) => {
    const direct = (row as any).consultorioNombre || (row as any).CONSULTORIO_NOMBRE || (row as any).NOMBRE_CONSULTORIO || (row as any).NOMBRE
    if (direct && typeof direct === 'string' && direct.trim().length > 0) return String(direct)
    const code = String(row.consultorio || '').trim()
    if (!code) return "-"
    return getConsultorioNombre(code)
  }
  const turnode = (apt: AppointmentRow) => {
    if (apt.turnoConsulta && typeof apt.turnoConsulta === "string") return apt.turnoConsulta.trim().toUpperCase()
    if (apt.turno && apt.turno.toUpperCase().startsWith("M")) return "M"
    if (apt.turno && apt.turno.toUpperCase().startsWith("T")) return "T"
    return ""
  }

  // Cargar los médicos necesarios cuando cambian las citas
  React.useEffect(() => {
    if (appointments.length > 0) {
      // Extraer códigos únicos de médicos
      const codigosMedicos = appointments
        .map(apt => String(apt.medico || '').trim())
        .filter(codigo => codigo.length > 0)
        .filter((codigo, index, self) => self.indexOf(codigo) === index);
      
      // Cargar los médicos necesarios
      if (codigosMedicos.length > 0) {
        console.log('Cargando médicos para las citas:', codigosMedicos);
        loadMedicosByCodigos(codigosMedicos);
      }
    }
  }, [appointments, loadMedicosByCodigos]);

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold">Hora</TableHead>
              <TableHead className="font-semibold">Turno</TableHead>
              <TableHead className="font-semibold">Consultorio</TableHead>
              <TableHead className="font-semibold">Médico</TableHead>
              <TableHead className="font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-blue-50 transition-colors">
                <TableCell>{getEstadoBadge(appointment.estado)}</TableCell>
                <TableCell className="font-medium">{appointment.hora}</TableCell>
                <TableCell className="font-medium">{turnode(appointment)}</TableCell>
                <TableCell className="font-medium">{displayConsultorio(appointment)}</TableCell>
                <TableCell className="text-sm">{displayMedico(appointment)}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction("release", appointment)}
                      title="Liberar"
                    >
                      <Unlock className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction("reschedule", appointment)}
                      title="Reprogramar"
                    >
                      <CalendarClock className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction("assign", appointment)}
                      title="Asignar"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction("details", appointment)}
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="border border-gray-200">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-600">
                  {new Date(appointment.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {appointment.hora}
                </div>
                {getEstadoBadge(appointment.estado)}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div><span className="text-gray-600">Turno:</span> <span className="font-medium">{turnode(appointment)}</span></div>
                <div><span className="text-gray-600">Consultorio:</span> <span className="font-medium">{displayConsultorio(appointment)}</span></div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Médico:</div>
                <div className="font-medium text-sm">{displayMedico(appointment)}</div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => onAction("release", appointment)} className="text-xs">Liberar</Button>
                <Button size="sm" variant="outline" onClick={() => onAction("reschedule", appointment)} className="text-xs">Reprogramar</Button>
                <Button size="sm" variant="outline" onClick={() => onAction("assign", appointment)} className="text-xs">Asignar</Button>
                <Button size="sm" variant="outline" onClick={() => onAction("details", appointment)} className="text-xs">Ver más</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
