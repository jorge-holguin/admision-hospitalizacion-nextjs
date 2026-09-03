"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, Stethoscope, Building, FileText, Hospital, Hash, Clipboard, MapPin, AlertCircle, Activity, Phone, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { filiacionService } from "@/services/hospitalizacion/filiacionService"
import { API_ENDPOINTS } from "@/lib/api-config"

interface AppointmentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
  getEstadoBadge: (estado: number) => React.ReactNode
  formatTurno?: (turno: string) => string
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
        {icon}
        {label}
      </span>
      <p className="text-sm font-medium text-gray-900">{value || '-'}</p>
    </div>
  )
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
  const [patientData, setPatientData] = useState<any>(null)
  const [loadingPatient, setLoadingPatient] = useState(false)
  const [diagnosticos, setDiagnosticos] = useState<any[]>([])
  const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(false)

  // Cargar datos del paciente (teléfonos y código) cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !appointment) {
      setPatientData(null)
      return
    }

    const fetchPatientData = async () => {
      try {
        setLoadingPatient(true)

        // Buscar al paciente por documento en lugar de por nombre
        const documento = appointment.documento || appointment.DOCUMENTO
        const tipoDocumento = appointment.tipoDocumento || appointment.TIPO_DOCUMENTO || 'D'

        if (documento) {
          const pacientes = await filiacionService.searchByDocumento(documento, tipoDocumento)

          if (pacientes.length > 0) {
            const p = pacientes[0] as any
            setPatientData({
              ...p,
              nombres: p.NOMBRES || p.nombres || '',
              paciente: p.PACIENTE || p.paciente || '',
              telefono1: p.TELEFONO1 || p.telefono1 || '',
              telefono2: p.TELEFONO2 || p.telefono2 || '',
            })
          }
        }
      } catch (error) {
        console.error('Error al cargar datos del paciente:', error)
      } finally {
        setLoadingPatient(false)
      }
    }

    fetchPatientData()
  }, [isOpen, appointment])

  // Cargar diagnósticos de la cita
  useEffect(() => {
    if (!isOpen || !appointment) {
      setDiagnosticos([])
      return
    }

    const fetchDiagnosticos = async () => {
      try {
        setLoadingDiagnosticos(true)
        const url = API_ENDPOINTS.citas.diagnosticos(appointment.id)
        console.log(`🌐 Cargando diagnósticos desde Spring:`, url)
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          const diagnosticos = data.diagnosticos ?? data ?? []
          if (Array.isArray(diagnosticos)) {
            setDiagnosticos(diagnosticos)
          }
        } else {
          console.error('Error fetching diagnosticos:', await res.text())
        }
      } catch (error) {
        console.error('Error al cargar diagnósticos:', error)
      } finally {
        setLoadingDiagnosticos(false)
      }
    }

    fetchDiagnosticos()
  }, [isOpen, appointment])

  // Cargar datos de liberación en cualquier estado (para saber quién liberó inicialmente)
  useEffect(() => {
    if (!isOpen || !appointment) {
      setLiberacionData(null)
      setUsuarioLiberador(null)
      return
    }

    const fetchLiberacionData = async () => {
      try {
        setLoadingLiberacion(true)
        const apiUrl = import.meta.env.VITE_API_CITAS_MASTER_URL
        
        // Obtener datos de liberación
        const resLib = await fetch(`${apiUrl}/citas-liberadas/${appointment.id}`)
        if (resLib.ok) {
          const dataLib = await resLib.json()
          if (Array.isArray(dataLib) && dataLib.length > 0) {
            // Seleccionar la liberación más reciente (mayor idLiberacion)
            const libData = dataLib.reduce((latest, current) => {
              const latestId = parseInt(latest.idLiberacion || latest.IDLIBERACION || '0')
              const currentId = parseInt(current.idLiberacion || current.IDLIBERACION || '0')
              return currentId > latestId ? current : latest
            }, dataLib[0])
            
            setLiberacionData(libData)
            
            // Obtener nombre del usuario que liberó
            if (libData.usuarioLiberacion) {
              const docLiberador = libData.usuarioLiberacion.trim()
              try {
                const users = await filiacionService.searchByDocumento(docLiberador)
                if (users && users.length > 0) {
                  const user = users[0] as any
                  const paterno = (user as any).APATERNO || (user as any).PATERNO || ''
                  const materno = (user as any).AMATERNO || (user as any).MATERNO || ''
                  const nombreCompleto = `${user.NOMBRES || ''} ${paterno} ${materno}`.trim()
                  setUsuarioLiberador(nombreCompleto || docLiberador)
                } else {
                  setUsuarioLiberador(docLiberador)
                }
              } catch {
                setUsuarioLiberador(docLiberador)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-2">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Detalles de la Cita</h2>
                <p className="text-blue-100 text-sm">ID #{appointment.id}</p>
              </div>
            </div>
            <div className="shrink-0 pt-1">
              {getEstadoBadge(appointment.estado)}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Cita - Card azul */}
          <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50/70 px-4 py-2 border-b border-blue-100 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Información de la Cita</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoItem icon={<Hash className="h-4 w-4" />} label="ID Cita" value={appointment.id} />
              <InfoItem icon={<Calendar className="h-4 w-4" />} label="Fecha" value={new Date(appointment.fecha).toLocaleDateString('es-ES')} />
              <InfoItem icon={<Clock className="h-4 w-4" />} label="Hora" value={appointment.hora} />
              <InfoItem icon={<AlertCircle className="h-4 w-4" />} label="Turno" value={formatTurno ? formatTurno(appointment.turno) : appointment.turno || '-'} />
            </div>
          </div>

          {/* Ubicación y médico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-indigo-100 p-1.5 rounded-lg">
                  <Stethoscope className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Médico</h3>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {(appointment.medicoNombre || appointment.MEDICO_NOMBRE)
                  ? `${appointment.medicoNombre || appointment.MEDICO_NOMBRE}`
                  : appointment.medico || appointment.MEDICO || '-'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">Código: {appointment.medico || appointment.MEDICO || '-'}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-emerald-100 p-1.5 rounded-lg">
                  <Building className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Consultorio</h3>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {(appointment.consultorioNombre || appointment.CONSULTORIO_NOMBRE)
                  ? `${appointment.consultorioNombre || appointment.CONSULTORIO_NOMBRE}`
                  : appointment.consultorio || appointment.CONSULTORIO || '-'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">Código: {appointment.consultorio || appointment.CONSULTORIO || '-'}</p>
            </div>
          </div>

          {/* Paciente */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50/70 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-800">Paciente</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Nombre</span>
                {loadingPatient ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Spinner className="h-4 w-4" /> Cargando...
                  </div>
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {patientData?.nombres || appointment.nombre || appointment.NOMBRE || '-'}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Código Paciente</span>
                <p className="text-sm font-medium text-gray-900">
                  {patientData?.paciente || appointment.PACIENTE || appointment.paciente || '-'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Seguro</span>
                <p className="text-sm font-medium text-gray-900">
                  {(appointment.seguroNombre || appointment.NOMBRE_SEGURO)
                    ? `${(appointment.seguro || appointment.SEGURO || '').trim()} - ${appointment.seguroNombre || appointment.NOMBRE_SEGURO}`
                    : appointment.seguro || appointment.SEGURO || '-'
                  }
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Phone className="h-3 w-3" /> Teléfono 1</span>
                <p className="text-sm font-medium text-gray-900">{patientData?.telefono1 || appointment.telefono1 || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Phone className="h-3 w-3" /> Teléfono 2</span>
                <p className="text-sm font-medium text-gray-900">{patientData?.telefono2 || appointment.telefono2 || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Pago ID</span>
                <p className="text-sm font-medium text-gray-900">{appointment.pagoId || '-'}</p>
              </div>
            </div>
          </div>

          {/* Adicionales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clipboard className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Orden</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{appointment.numero || '-'}</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Hospital className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-800 uppercase tracking-wide">Establecimiento</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{appointment.entidadSis || appointment.ENTIDADSIS || '-'}</p>
            </div>
            <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-cyan-600" />
                <span className="text-xs font-semibold text-cyan-800 uppercase tracking-wide">N° Referencia</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{appointment.numRef || appointment.NUMREF || '-'}</p>
            </div>
          </div>

          {/* Diagnósticos */}
          <div className="bg-white border border-green-100 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-green-50/70 px-4 py-2 border-b border-green-100 flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-800">Diagnósticos</span>
            </div>
            <div className="p-4">
              {(() => {
                if (loadingDiagnosticos) {
                  return (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Spinner className="h-4 w-4" />
                      Cargando diagnósticos...
                    </div>
                  )
                }
                if (diagnosticos.length > 0) {
                  return (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">DX</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Descripción</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-700">Tipo</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-700">Lab</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-700">Ord</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {diagnosticos.map((d) => (
                            <tr key={`${d.dx}-${d.dxDes}-${d.ord}`} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-blue-700 whitespace-nowrap">{d.dx}</td>
                              <td className="px-3 py-2">{d.dxDes}</td>
                              <td className="px-3 py-2 text-center">{d.tipodx || '-'}</td>
                              <td className="px-3 py-2 text-center">{d.lab || '-'}</td>
                              <td className="px-3 py-2 text-center">{d.ord || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }
                if (appointment.diagnostico) {
                  return <p className="text-sm font-medium text-gray-800">{appointment.diagnostico}</p>
                }
                return <p className="text-sm text-gray-500">No se encontraron diagnósticos para esta cita.</p>
              })()}
            </div>
          </div>

          {/* Usuario y Liberación */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${appointment.estado == '0' ? 'bg-red-100' : 'bg-blue-100'}`}>
                <User className={`h-4 w-4 ${appointment.estado == '0' ? 'text-red-600' : 'text-blue-600'}`} />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {appointment.estado == '0' ? 'Usuario que anuló la cita' : 'Usuario que asignó la cita'}
                <span className={`ml-2 font-mono ${appointment.estado == '0' ? 'text-red-600' : 'text-blue-600'}`}>
                  ({appointment.userEliminacion?.trim() || appointment.usuario?.trim() || '-'})
                </span>
              </p>
            </div>

            {loadingLiberacion ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-white p-3 rounded-lg border">
                <Spinner className="h-4 w-4" /> Cargando historial de liberación...
              </div>
            ) : liberacionData ? (
              <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 border-b border-orange-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-800">Historial de Liberación</span>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Fecha de Liberación</span>
                    <p className="text-sm font-medium text-gray-900">
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
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Usuario que Liberó</span>
                    <p className="text-sm font-medium">
                      <span className="text-orange-700 font-semibold">{liberacionData.usuarioLiberacion?.trim() || '-'}</span>
                      {usuarioLiberador && usuarioLiberador !== liberacionData.usuarioLiberacion?.trim() && (
                        <span className="block text-xs text-gray-600 mt-1">{usuarioLiberador}</span>
                      )}
                    </p>
                  </div>
                  {liberacionData.observacion && liberacionData.observacion.trim() !== '""' && (
                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Motivo de Liberación</span>
                      <p className="text-sm font-medium bg-gray-50 p-3 rounded border text-gray-800">
                        {liberacionData.observacion.replace(/^"|"$/g, '')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-white p-3 rounded-lg border">
                <AlertCircle className="h-4 w-4" />
                No se encontraron registros de liberación para esta cita
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <Button variant="outline" onClick={onClose} className="gap-1">
            <X className="h-4 w-4" /> Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
