"use client"

import React, { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Unlock, CalendarClock, UserPlus, Eye, RefreshCw, Printer } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useMedicos } from "@/contexts/MedicosContext"
import { useConsultorios } from "@/contexts/ConsultoriosContext"
import { usePermissions } from "@/contexts/PermissionsContext"
import { PERMISOS } from "@/lib/permissions"

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
  onAction: (action: "release" | "reschedule" | "assign" | "details" | "reassign" | "print", appointment: AppointmentRow) => void
}

export function AppointmentsTable({ appointments, getEstadoBadge, onAction }: AppointmentsTableProps) {
  const { getMedicoInfo, loadMedicosByCodigos } = useMedicos()
  const { getConsultorioNombre } = useConsultorios()
  const { hasPermission } = usePermissions()

  const canLiberar       = hasPermission(PERMISOS.CITAS.LIBERAR)
  const canAsignar       = hasPermission(PERMISOS.CITAS.ASIGNAR)
  const canAsignarPasadas = hasPermission(PERMISOS.CITAS.ASG_CITAS_PASADAS)
  const canVerDetalle    = hasPermission(PERMISOS.CITAS.VER_DETALLE)
  const canImprimir      = hasPermission(PERMISOS.CITAS.IMPRIMIR)
  const canReagendar     = hasPermission(PERMISOS.CITAS.REAGENDAR)

  const isPastDate = (dateStr?: string | null) => {
    if (!dateStr) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(dateStr) < today
  }

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

  const getSeguroCode = (apt: AppointmentRow): string => {
    const raw = (apt.seguro ?? '').toString().trim()
    const codePart = raw.split('-')[0].trim()
    const name = (apt.seguroNombre ?? '').toString().trim().toUpperCase()

    if (codePart === '0' || codePart === '00' || name.includes('PAGANTE')) return '0'
    if (codePart === '02' || codePart === '2' || name.includes('SOAT')) return '02'
    if (codePart === '05' || name.includes('CRÉDITO') || name.includes('CREDITO')) return '05'
    if (codePart === '13' || name.includes('PROGRAMA')) return '13'
    return ''
  }

  const canReprogramarApt = (apt: AppointmentRow): boolean => {
    const estado = Number(apt.estado)
    const segCode = getSeguroCode(apt)
    return estado === 3 && (segCode === '0' || segCode === '02')
  }

  // No longer needed since medicoNombre and consultorioNombre come directly from API
  // React.useEffect(() => {
  //   // This effect has been removed because the API now returns medicoNombre and consultorioNombre directly
  // }, [appointments, loadMedicosByCodigos]);

  return (
    <div className="overflow-x-auto table-responsive">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table className="min-w-[700px]">
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
                  <div className="flex flex-wrap gap-1">
                    {canLiberar && (() => {
                      const seguroCode = getSeguroCode(appointment)
                      const estado = Number(appointment.estado)
                      const puedeLiberar =
                        (estado === 2 || (estado === 3 && (seguroCode === '05' || seguroCode === '13'))) &&
                        (!isPastDate(appointment.fecha) || canAsignarPasadas)
                      return (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAction("release", appointment)}
                          title="Liberar"
                          disabled={!puedeLiberar}
                        >
                          <Unlock className="w-4 h-4" />
                        </Button>
                      )
                    })()}
                    {canAsignar && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction("assign", appointment)}
                        title="Asignar"
                        disabled={
                          Number(appointment.estado) !== 1 ||
                          (isPastDate(appointment.fecha) && !canAsignarPasadas)
                        }
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    )}
                    {canVerDetalle && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction("details", appointment)}
                        title="Ver más"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {canImprimir && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction("print", appointment)}
                        title="Imprimir"
                        disabled={
                          !(Number(appointment.estado) === 2 || 
                            Number(appointment.estado) === 3 || 
                            Number(appointment.estado) === 4)
                        }
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    )}
                    {canReagendar && canReprogramarApt(appointment) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction("reschedule", appointment)}
                        title="Reprogramar"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <CalendarClock className="w-4 h-4" />
                      </Button>
                    )}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-600">
                  {new Date(appointment.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {appointment.hora}
                </div>
                {getEstadoBadge(appointment.estado)}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div><span className="text-gray-600">ID:</span> <span className="font-medium">{appointment.id}</span></div>
                <div><span className="text-gray-600">Orden:</span> <span className="font-medium">{appointment.numero || '-'}</span></div>
                <div><span className="text-gray-600">Turno:</span> <span className="font-medium">{turnode(appointment)}</span></div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
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
                {canLiberar && (() => {
                  const seguroCode = getSeguroCode(appointment)
                  const estado = Number(appointment.estado)
                  const puedeLiberar =
                    (estado === 2 || (estado === 3 && (seguroCode === '05' || seguroCode === '13'))) &&
                    (!isPastDate(appointment.fecha) || canAsignarPasadas)
                  return (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction("release", appointment)}
                      className="text-xs"
                      disabled={!puedeLiberar}
                    >
                      Liberar
                    </Button>
                  )
                })()}
                {canAsignar && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onAction("assign", appointment)} 
                    className="text-xs"
                    disabled={
                      Number(appointment.estado) !== 1 ||
                      (isPastDate(appointment.fecha) && !canAsignarPasadas)
                    }
                  >
                    Asignar
                  </Button>
                )}
                {canVerDetalle && (
                  <Button size="sm" variant="outline" onClick={() => onAction("details", appointment)} className="text-xs">Ver más</Button>
                )}
                {canImprimir && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onAction("print", appointment)} 
                    className="text-xs"
                    disabled={
                      !(Number(appointment.estado) === 2 || 
                        Number(appointment.estado) === 3 || 
                        Number(appointment.estado) === 4)
                    }
                  >
                    Imprimir
                  </Button>
                )}
                {canReagendar && canReprogramarApt(appointment) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction("reschedule", appointment)}
                    className="text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    Reprogramar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
