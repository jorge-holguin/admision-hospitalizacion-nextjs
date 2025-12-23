"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Printer, FileText, Droplet, Eye } from "lucide-react"
import { format } from "date-fns"

interface LaboratoryTableProps {
  fecha: Date
  origen: string
  estado: string
  searchType: string
  searchValue: string
  useIdCita: boolean
  idCita: string
}

interface LaboratoryCita {
  ID_CITA: string
  NOMBRES: string
  ESTADO: string
  NRO_DOCUMENTO: string
  FECHA_REGISTRO: string
  USUARIO_REGISTRO: string
  TIPO_SEGURO: string
}

const mockData: LaboratoryCita[] = [
  {
    ID_CITA: "00043252",
    NOMBRES: "VALDEZ CHACON FEDERICO",
    ESTADO: "1",
    NRO_DOCUMENTO: "47895471",
    FECHA_REGISTRO: "2025-12-22T13:26:58",
    USUARIO_REGISTRO: "73101361",
    TIPO_SEGURO: "PAGANTE"
  },
  {
    ID_CITA: "00043253",
    NOMBRES: "BERROCAL HUARCAYA CARLA JESUS",
    ESTADO: "1",
    NRO_DOCUMENTO: "74881286",
    FECHA_REGISTRO: "2025-12-22T13:26:14",
    USUARIO_REGISTRO: "73101361",
    TIPO_SEGURO: "SIS"
  },
  {
    ID_CITA: "00043254",
    NOMBRES: "HUAMAN TORRES ALISSON SHOMARA",
    ESTADO: "2",
    NRO_DOCUMENTO: "76481286",
    FECHA_REGISTRO: "2025-12-22T13:26:14",
    USUARIO_REGISTRO: "73101361",
    TIPO_SEGURO: "SOAT"
  },
  {
    ID_CITA: "04233100",
    NOMBRES: "MORALES IBAÑEZ CATALINA",
    ESTADO: "1",
    NRO_DOCUMENTO: "04233100",
    FECHA_REGISTRO: "2025-12-22T14:12:54",
    USUARIO_REGISTRO: "73101361",
    TIPO_SEGURO: "PAGANTE"
  },
  {
    ID_CITA: "71820900",
    NOMBRES: "IBAÑEZ GUTIERREZ NATALY KARLA",
    ESTADO: "0",
    NRO_DOCUMENTO: "71820900",
    FECHA_REGISTRO: "2025-12-22T14:10:27",
    USUARIO_REGISTRO: "73101361",
    TIPO_SEGURO: "SIS"
  }
]

export function LaboratoryTable({
  fecha,
  origen,
  estado,
  searchType,
  searchValue,
  useIdCita,
  idCita
}: LaboratoryTableProps) {
  const [data] = useState<LaboratoryCita[]>(mockData)

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
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

  const handleEdit = (idCita: string) => {
  }

  const handleDelete = (idCita: string) => {
  }

  const handlePrint = (idCita: string) => {
  }

  const handleCargarCallis = (idCita: string) => {
  }

  const handleCargarOrina = (idCita: string) => {
  }

  const handleVerPDF = (idCita: string) => {
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-blue-800">
          Resultados de Búsqueda ({data.length} registros)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50">
                <TableHead className="font-semibold text-blue-900">ID Cita</TableHead>
                <TableHead className="font-semibold text-blue-900">Nombres</TableHead>
                <TableHead className="font-semibold text-blue-900">Estado</TableHead>
                <TableHead className="font-semibold text-blue-900">N° Documento</TableHead>
                <TableHead className="font-semibold text-blue-900">Fecha Registro</TableHead>
                <TableHead className="font-semibold text-blue-900">Usuario</TableHead>
                <TableHead className="font-semibold text-blue-900">Tipo Seguro</TableHead>
                <TableHead className="font-semibold text-blue-900 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No se encontraron resultados
                  </TableCell>
                </TableRow>
              ) : (
                data.map((cita) => (
                  <TableRow key={cita.ID_CITA} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{cita.ID_CITA}</TableCell>
                    <TableCell>{cita.NOMBRES}</TableCell>
                    <TableCell>{getEstadoBadge(cita.ESTADO)}</TableCell>
                    <TableCell>{cita.NRO_DOCUMENTO}</TableCell>
                    <TableCell>
                      {format(new Date(cita.FECHA_REGISTRO), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{cita.USUARIO_REGISTRO}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cita.TIPO_SEGURO}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                          onClick={() => handleEdit(cita.ID_CITA)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-100"
                          onClick={() => handleDelete(cita.ID_CITA)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => handlePrint(cita.ID_CITA)}
                          title="Imprimir"
                        >
                          <Printer className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-purple-100"
                          onClick={() => handleCargarCallis(cita.ID_CITA)}
                          title="Cargar Callis"
                        >
                          <FileText className="h-4 w-4 text-purple-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-cyan-100"
                          onClick={() => handleCargarOrina(cita.ID_CITA)}
                          title="Cargar Orina"
                        >
                          <Droplet className="h-4 w-4 text-cyan-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-green-100"
                          onClick={() => handleVerPDF(cita.ID_CITA)}
                          title="Ver PDF"
                        >
                          <Eye className="h-4 w-4 text-green-600" />
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
