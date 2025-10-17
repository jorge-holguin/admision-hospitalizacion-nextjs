"use client"

import React, { useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Unlock, CalendarClock, UserPlus, Eye, RefreshCw } from "lucide-react"
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
  nombre?: string
  paciente?: string
  numero?: string
  fechaProgramada?: string | null
  usuario?: string
  userLiberacion?: string | null
  userEliminacion?: string | null
  fechaPago?: string | null
  pagoId?: string | null
  PAGOID?: string | null
  [key: string]: any
}

interface AppointmentsTableProps {
  appointments: AppointmentRow[]
  getEstadoBadge: (estado: number) => React.ReactNode
  onAction: (action: "release" | "reschedule" | "assign" | "details" | "reassign", appointment: AppointmentRow) => void
}

export function AppointmentsTable({ appointments, getEstadoBadge, onAction }: AppointmentsTableProps) {
  const { getMedicoInfo, loadMedicosByCodigos } = useMedicos()
  const { getConsultorioNombre } = useConsultorios()

  const displayMedico = (row: AppointmentRow) => {
    // Use the medicoNombre field directly from the API response
    const direct = (row as any).medicoNombre || (row as any).MEDICO_NOMBRE || (row as any).NOMBRE_MEDICO || (row as any).NOMBRE
    if (direct && typeof direct === 'string' && direct.trim().length > 0) return String(direct).trim()
    
    // Fallback to code display if no name is available
    const code = String(row.medico || '').trim()
    return code || "-"
  }

  const displayConsultorio = (row: AppointmentRow) => {
    // Use the consultorioNombre field directly from the API response
    const direct = (row as any).consultorioNombre || (row as any).CONSULTORIO_NOMBRE || (row as any).NOMBRE_CONSULTORIO || (row as any).NOMBRE
    if (direct && typeof direct === 'string' && direct.trim().length > 0) return String(direct).trim()
    
    // Fallback to code display if no name is available
    const code = String(row.consultorio || '').trim()
    return code || "-"
  }
  const turnode = (apt: AppointmentRow) => {
    if (apt.turnoConsulta && typeof apt.turnoConsulta === "string") return apt.turnoConsulta.trim().toUpperCase()
    if (apt.turno && apt.turno.toUpperCase().startsWith("M")) return "M"
    if (apt.turno && apt.turno.toUpperCase().startsWith("T")) return "T"
    return ""
  }

  // No longer needed since medicoNombre and consultorioNombre come directly from API
  // React.useEffect(() => {
  //   // This effect has been removed because the API now returns medicoNombre and consultorioNombre directly
  // }, [appointments, loadMedicosByCodigos]);

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Orden</TableHead>
              <TableHead className="font-semibold">Hora</TableHead>
              <TableHead className="font-semibold">Turno</TableHead>
              <TableHead className="font-semibold">Consultorio</TableHead>
              <TableHead className="font-semibold">Médico</TableHead>
              <TableHead className="font-semibold">Paciente</TableHead>
              <TableHead className="font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-blue-50 transition-colors">
                <TableCell>{getEstadoBadge(appointment.estado)}</TableCell>
                <TableCell className="font-medium">{appointment.id}</TableCell>
                <TableCell className="font-medium">{appointment.numero || '-'}</TableCell>
                <TableCell className="font-medium">{appointment.hora}</TableCell>
                <TableCell className="font-medium">{turnode(appointment)}</TableCell>
                <TableCell className="font-medium">{displayConsultorio(appointment)}</TableCell>
                <TableCell className="text-sm">{displayMedico(appointment)}</TableCell>
                <TableCell className="text-sm">{appointment.nombre || appointment.paciente || '-'}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction("release", appointment)}
                      title="Liberar"
                      disabled={Number(appointment.estado) !== 2}
                    >
                      <Unlock className="w-4 h-4" />
                    </Button>
                    {/* <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction("reschedule", appointment)}
                      title="Reprogramar"
                      disabled={Number(appointment.estado) !== 3 || !(appointment.pagoId || appointment.PAGOID || (appointment as any).pagoId || (appointment as any).PAGOID)}
                    >
                      <CalendarClock className="w-4 h-4" />
                    </Button> */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction("assign", appointment)}
                      title="Asignar"
                      disabled={Number(appointment.estado) !== 1}
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
                <div><span className="text-gray-600">ID:</span> <span className="font-medium">{appointment.id}</span></div>
                <div><span className="text-gray-600">Orden:</span> <span className="font-medium">{appointment.numero || '-'}</span></div>
                <div><span className="text-gray-600">Turno:</span> <span className="font-medium">{turnode(appointment)}</span></div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div><span className="text-gray-600">Consultorio:</span> <span className="font-medium">{displayConsultorio(appointment)}</span></div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Médico:</div>
                <div className="font-medium text-sm">{displayMedico(appointment)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Paciente:</div>
                <div className="font-medium text-sm">{appointment.paciente || '-'}</div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onAction("release", appointment)} 
                  className="text-xs"
                  disabled={Number(appointment.estado) !== 2 && Boolean(appointment.fechaPago)}
                >
                  Liberar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onAction("reschedule", appointment)} 
                  className="text-xs"
                  disabled={Number(appointment.estado) !== 3 || !(appointment.pagoId || appointment.PAGOID || (appointment as any).pagoId || (appointment as any).PAGOID)}
                >
                  Reprogramar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onAction("assign", appointment)} 
                  className="text-xs"
                  disabled={Number(appointment.estado) !== 1}
                >
                  Asignar
                </Button>
                <Button size="sm" variant="outline" onClick={() => onAction("details", appointment)} className="text-xs">Ver más</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
