"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, User, FileText, Clock, Building2, Stethoscope } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface LaboratoryDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: any | null
  loading: boolean
}

export function LaboratoryDetailModal({
  open,
  onOpenChange,
  data,
  loading
}: LaboratoryDetailModalProps) {
  
  const getEstadoBadge = (estado: string) => {
    const estadoTrimmed = estado?.trim() || ""
    switch (estadoTrimmed) {
      case "0":
        return <Badge variant="destructive" className="text-sm">Anulado</Badge>
      case "1":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-sm">Pendiente</Badge>
      case "2":
        return <Badge className="bg-green-500 hover:bg-green-600 text-sm">Completada</Badge>
      default:
        return <Badge variant="secondary" className="text-sm">{estado}</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return format(date, "dd/MM/yyyy", { locale: es })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return format(date, "dd/MM/yyyy HH:mm:ss", { locale: es })
    } catch {
      return dateString
    }
  }

  const getOrigenLabel = (origen: string | null) => {
    if (!origen) return "-"
    const origenTrimmed = origen.trim()
    switch (origenTrimmed) {
      case "CE":
        return "Consulta Externa"
      case "E":
        return "Emergencia"
      case "H":
        return "Hospitalización"
      default:
        return origen
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-xl text-blue-800">
            <FileText className="h-5 w-5" />
            Detalle de Cita de Laboratorio
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <span className="mt-3 text-gray-500">Cargando información...</span>
          </div>
        ) : !data ? (
          <div className="text-center py-12 text-gray-500">
            No se encontró información de la cita
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header con ID y Estado */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div>
                <span className="text-sm text-gray-500">ID de Cita</span>
                <p className="font-mono text-lg font-semibold text-blue-800">{data.idCita || "-"}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">Estado</span>
                <div className="mt-1">{getEstadoBadge(data.estado)}</div>
              </div>
            </div>

            {/* Información del Paciente */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Información del Paciente
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Código Paciente</span>
                  <p className="font-medium">{data.idPaciente || data.paciente || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">N° Documento</span>
                  <p className="font-medium">{data.nroDocumento || "-"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-500">Nombre Completo</span>
                  <p className="font-medium">{(data.nombrePaciente || data.nombres || "").trim() || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Tipo Paciente</span>
                  <p className="font-medium">{data.tipoPac || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Rango Edad</span>
                  <p className="font-medium">{data.rangoEdad || data.edad || "-"}</p>
                </div>
              </div>
            </div>

            {/* Información de la Cita */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Información de la Cita
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Fecha de Cita</span>
                  <p className="font-medium">{formatDate(data.fechaCita)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Hora de Cita</span>
                  <p className="font-medium font-mono">{data.idHoraCita || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Origen</span>
                  <p className="font-medium">{getOrigenLabel(data.origen)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Orden</span>
                  <p className="font-medium">{data.orden || "0"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ID Orden</span>
                  <p className="font-medium font-mono">{data.ordenid?.trim() || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Lugar</span>
                  <p className="font-medium">{data.lugar || "-"}</p>
                </div>
              </div>
            </div>

            {/* Información del Médico */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-blue-600" />
                Información del Médico
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Código Médico</span>
                  <p className="font-medium">{data.medico || data.idMedico || "-"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-500">Nombre del Médico</span>
                  <p className="font-medium">{data.nomMedico || "-"}</p>
                </div>
              </div>
            </div>

            {/* Información de Formulario */}
            {(data.idFormulario || data.nroFormulario) && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Formulario
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-500">ID Formulario</span>
                    <p className="font-medium font-mono">{data.idFormulario || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">N° Formulario</span>
                    <p className="font-medium font-mono">{data.nroFormulario || "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Observaciones */}
            {data.obs && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700">Observaciones</h3>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-gray-700">{data.obs}</p>
                </div>
              </div>
            )}

            {/* Información Adicional */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                Información Adicional
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="text-gray-500">Código Servicio</span>
                  <p className="font-medium font-mono">{data.hisCodservicio?.trim() || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">ID Origen</span>
                  <p className="font-medium">{data.idOrigen || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Pago ID</span>
                  <p className="font-medium">{data.pagoid || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Num. Referencia</span>
                  <p className="font-medium">{data.numref || "-"}</p>
                </div>
                {data.entidadsis && (
                  <div>
                    <span className="text-gray-500">Entidad SIS</span>
                    <p className="font-medium">{data.entidadsis}</p>
                  </div>
                )}
                {data.idRefcon && (
                  <div>
                    <span className="text-gray-500">ID Ref. Consulta</span>
                    <p className="font-medium">{data.idRefcon}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
