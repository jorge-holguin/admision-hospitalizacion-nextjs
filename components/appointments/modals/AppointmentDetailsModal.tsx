"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { extractDocumentFromToken } from "@/utils/jwtUtils"
import { Calendar, Clock, User, Stethoscope, Building, CreditCard, FileText, Hospital, Hash, Shield, Clipboard, MapPin, AlertCircle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface AppointmentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
  getEstadoBadge: (estado: number) => React.ReactNode
  formatTurno?: (turno: string) => string
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  getEstadoBadge,
  formatTurno
}: AppointmentDetailsModalProps) {
  const [liberacionData, setLiberacionData] = useState<any>(null)
  const [usuarioLiberador, setUsuarioLiberador] = useState<string | null>(null)
  const [loadingLiberacion, setLoadingLiberacion] = useState(false)

  // Cargar datos de liberación si el estado es 1 (NO OTORGADO/LIBERADO)
  useEffect(() => {
    if (!isOpen || !appointment || appointment.estado != '1') {
      setLiberacionData(null)
      setUsuarioLiberador(null)
      return
    }

    const fetchLiberacionData = async () => {
      try {
        setLoadingLiberacion(true)
        const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
        
        // Obtener datos de liberación
        const resLib = await fetch(`${apiUrl}/citas-liberadas/${appointment.id}`)
        if (resLib.ok) {
          const dataLib = await resLib.json()
          if (Array.isArray(dataLib) && dataLib.length > 0) {
            const libData = dataLib[0]
            setLiberacionData(libData)
            
            // Obtener nombre del usuario que liberó
            if (libData.usuarioLiberacion) {
              const docLiberador = libData.usuarioLiberacion.trim()
              const resUser = await fetch(`/api/filiation/search?page=1&pageSize=10&documento=${docLiberador}`)
              if (resUser.ok) {
                const dataUser = await resUser.json()
                if (dataUser.data && dataUser.data.length > 0) {
                  const user = dataUser.data[0]
                  const nombreCompleto = `${user.NOMBRES || ''} ${user.APATERNO || ''} ${user.AMATERNO || ''}`.trim()
                  setUsuarioLiberador(nombreCompleto || docLiberador)
                } else {
                  setUsuarioLiberador(docLiberador)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar datos de liberación:', error)
      } finally {
        setLoadingLiberacion(false)
      }
    }

    fetchLiberacionData()
  }, [isOpen, appointment])

  if (!appointment) return null

  const currentUser = extractDocumentFromToken()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-blue-800 font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalles de la Cita
          </DialogTitle>
          
          {/* Estado como etiqueta */}
          <div className="mt-2">
            {getEstadoBadge(appointment.estado)}
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Primera fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Hash className="h-4 w-4 text-gray-500" /> ID CITA
              </Label>
              <p className="text-sm font-medium flex items-center gap-2">{appointment.id}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Calendar className="h-4 w-4 text-gray-500" /> FECHA
              </Label>
              <p className="text-sm font-medium">
                {new Date(appointment.fecha).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" /> HORA
              </Label>
              <p className="text-sm font-medium">{appointment.hora}</p>
            </div>
          </div>

          {/* Segunda fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-gray-500" /> TURNO
              </Label>
              <p className="text-sm font-medium">{formatTurno ? formatTurno(appointment.turno) : appointment.turno || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Stethoscope className="h-4 w-4 text-gray-500" /> MÉDICO
              </Label>
              <p className="text-sm font-medium">
                {(appointment.medicoNombre || appointment.MEDICO_NOMBRE)
                  ? `${appointment.medico || appointment.MEDICO} - ${appointment.medicoNombre || appointment.MEDICO_NOMBRE}`
                  : appointment.medico || appointment.MEDICO || '-'
                }
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Building className="h-4 w-4 text-gray-500" /> CONSULTORIO
              </Label>
              <p className="text-sm font-medium">
                {(appointment.consultorioNombre || appointment.CONSULTORIO_NOMBRE)
                  ? `${appointment.consultorio || appointment.CONSULTORIO} - ${appointment.consultorioNombre || appointment.CONSULTORIO_NOMBRE}`
                  : appointment.consultorio || appointment.CONSULTORIO || '-'
                }
              </p>
            </div>
          </div>

          {/* Tercera fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <User className="h-4 w-4 text-gray-500" /> PACIENTE
              </Label>
              <p className="text-sm font-medium">
                {appointment.paciente || appointment.PACIENTE || '-'} - {appointment.nombre || appointment.NOMBRE || '-'}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Shield className="h-4 w-4 text-gray-500" /> SEGURO
              </Label>
              <p className="text-sm font-medium">
                {(appointment.seguroNombre || appointment.NOMBRE_SEGURO)
                  ? `${appointment.seguro || appointment.SEGURO} - ${appointment.seguroNombre || appointment.NOMBRE_SEGURO}`
                  : appointment.seguro || appointment.SEGURO || '-'
                }
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <CreditCard className="h-4 w-4 text-gray-500" /> PAGO ID
              </Label>
              <p className="text-sm font-medium">{appointment.pagoId || '-'}</p>
            </div>
          </div>

          {/* Cuarta fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Clipboard className="h-4 w-4 text-gray-500" /> ORDEN
              </Label>
              <p className="text-sm font-medium">{appointment.numero  || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Hospital className="h-4 w-4 text-gray-500" /> ESTABLECIMIENTO
              </Label>
              <p className="text-sm font-medium">{appointment.entidadSis || appointment.ENTIDADSIS || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <MapPin className="h-4 w-4 text-gray-500" /> NUM REFERENCIA
              </Label>
              <p className="text-sm font-medium">{appointment.numRef || appointment.NUMREF || '-'}</p>
            </div>
          </div>

          {/* Usuario - Condicional según estado */}
          <div className="border-t pt-4 bg-gray-50 rounded-md p-4">
            {appointment.estado == '0' ? (
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-red-600" />
                <p className="text-base font-medium text-gray-700">
                  Usuario que anuló la cita: <span className="text-red-600 font-semibold">({appointment.userEliminacion?.trim() || '-'})</span>
                </p>
              </div>
            ) : appointment.estado == '1' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <p className="text-lg font-semibold text-orange-600">Detalles de Liberación</p>
                </div>
                {loadingLiberacion ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner className="h-6 w-6" />
                    <span className="ml-2 text-sm text-gray-500">Cargando detalles...</span>
                  </div>
                ) : liberacionData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" /> Fecha de Liberación
                      </Label>
                      <p className="text-sm font-medium">
                        {liberacionData.fechaLiberacion 
                          ? new Date(liberacionData.fechaLiberacion).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <User className="h-4 w-4 text-gray-500" /> Usuario que Liberó
                      </Label>
                      <p className="text-sm font-medium">
                        <span className="text-orange-600 font-semibold">
                          {liberacionData.usuarioLiberacion?.trim() || '-'}
                        </span>
                        {usuarioLiberador && usuarioLiberador !== liberacionData.usuarioLiberacion?.trim() && (
                          <span className="block text-xs text-gray-600 mt-1">{usuarioLiberador}</span>
                        )}
                      </p>
                    </div>
                    {liberacionData.observacion && liberacionData.observacion.trim() !== '""' && (
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                          <FileText className="h-4 w-4 text-gray-500" /> Motivo de Liberación
                        </Label>
                        <p className="text-sm font-medium bg-white p-2 rounded border">
                          {liberacionData.observacion.replace(/^"|"$/g, '')}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-600" />
                    <p className="text-base font-medium text-gray-700">
                      Usuario que liberó la cita: <span className="text-orange-600 font-semibold">({appointment.userLiberacion?.trim() || '-'})</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <p className="text-base font-medium text-gray-700">
                  Usuario que asignó la cita: <span className="text-blue-600 font-semibold">({appointment.usuario?.trim() || '-'})</span>
                </p>
              </div>
            )}
          </div>
          {/* Botones */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
