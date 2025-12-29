"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, Loader2 } from "lucide-react"

// Interface exportada para usar en page.tsx
export interface LaboratoryCita {
  idCita: string
  idPaciente: string
  nombrePaciente: string
  nroDocumento: string
  estado: string
  ordenx: number
  hora: string
  origen: string
}

interface LaboratoryTableProps {
  data: LaboratoryCita[]
  isLoading: boolean
  hasSearched: boolean
  onViewDetail: (cita: LaboratoryCita) => void
  onEdit: (cita: LaboratoryCita) => void
  onDelete: (cita: LaboratoryCita) => void
}

export function LaboratoryTable({
  data,
  isLoading,
  hasSearched,
  onViewDetail,
  onEdit,
  onDelete
}: LaboratoryTableProps) {

  const getEstadoBadge = (estado: string) => {
    const estadoTrimmed = estado?.trim() || ""
    switch (estadoTrimmed) {
      case "0":
        return <Badge variant="destructive">Anulado</Badge>
      case "1":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>
      case "2":
        return <Badge className="bg-green-500 hover:bg-green-600">Completada</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const getOrigenLabel = (origen: string) => {
    const origenTrimmed = origen?.trim() || ""
    switch (origenTrimmed) {
      case "CE":
        return "Cons. Ext."
      case "E":
        return "Emergencia"
      case "H":
        return "Hospitalización"
      default:
        return origen || "-"
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-blue-800">
            Resultados de Búsqueda
          </CardTitle>
          {hasSearched && (
            <Badge variant="outline" className="text-blue-600">
              {data.length} registro{data.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-50 to-blue-100">
                <TableHead className="font-semibold text-blue-900">ID Cita</TableHead>
                <TableHead className="font-semibold text-blue-900">Cód. Paciente</TableHead>
                <TableHead className="font-semibold text-blue-900">N° Documento</TableHead>
                <TableHead className="font-semibold text-blue-900">Nombre Paciente</TableHead>
                <TableHead className="font-semibold text-blue-900 text-center">Hora</TableHead>
                <TableHead className="font-semibold text-blue-900 text-center">Estado</TableHead>
                <TableHead className="font-semibold text-blue-900 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                      <span className="text-gray-500 font-medium">Buscando citas de laboratorio...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !hasSearched ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                        <Eye className="h-8 w-8 text-blue-400" />
                      </div>
                      <span className="text-lg font-medium">Utilice los filtros para buscar citas</span>
                      <span className="text-sm text-gray-400">Seleccione fecha, origen y presione "Buscar"</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-lg">No se encontraron resultados</span>
                      <span className="text-sm text-gray-400">Intente con otros filtros de búsqueda</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((cita, index) => (
                  <TableRow 
                    key={cita.idCita || index} 
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-gray-600">
                      {cita.idCita || "-"}
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">
                      {cita.idPaciente || "-"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {cita.nroDocumento || "-"}
                    </TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate" title={cita.nombrePaciente}>
                      {cita.nombrePaciente || "-"}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {cita.hora || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {getEstadoBadge(cita.estado)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                          onClick={() => onViewDetail(cita)}
                          title="Ver Detalle"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-amber-100"
                          onClick={() => onEdit(cita)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-100"
                          onClick={() => onDelete(cita)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
