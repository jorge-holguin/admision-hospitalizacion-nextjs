"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Home, Edit, Eye, Search } from "lucide-react"

interface Patient {
  id: string
  hc: string
  name: string
  sex: string
  birthDate: string
  address: string
  dni: string
  location: string
  district: string
}

interface PatientResultsTableProps {
  patients: Patient[]
  onHospitalize: (patientId: string) => void
  onEdit: (patient: Patient) => void
  onView: (patient: Patient) => void
  onEmergency: (patient: Patient) => void
}

export function PatientResultsTable({ 
  patients, 
  onHospitalize, 
  onEdit, 
  onView, 
  onEmergency 
}: PatientResultsTableProps) {
  if (patients.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Realice una búsqueda para ver resultados</p>
        <p className="text-sm mt-2">Ingrese al menos 8 dígitos del DNI</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">H.C.</TableHead>
            <TableHead className="font-semibold">HC ANT</TableHead>
            <TableHead className="font-semibold">Apellidos y Nombres</TableHead>
            <TableHead className="font-semibold">Sexo</TableHead>
            <TableHead className="font-semibold">Fecha Nacimiento</TableHead>
            <TableHead className="font-semibold">Dirección</TableHead>
            <TableHead className="font-semibold">DNI</TableHead>
            <TableHead className="font-semibold">Localidad</TableHead>
            <TableHead className="font-semibold">Distrito</TableHead>
            <TableHead className="font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id} className="hover:bg-blue-50 transition-colors">
              <TableCell className="font-medium">{patient.id}</TableCell>
              <TableCell>{patient.hc}</TableCell>
              <TableCell className="font-medium text-blue-800">{patient.name}</TableCell>
              <TableCell>{patient.sex}</TableCell>
              <TableCell>{patient.birthDate}</TableCell>
              <TableCell>{patient.address}</TableCell>
              <TableCell>{patient.dni}</TableCell>
              <TableCell>{patient.location}</TableCell>
              <TableCell>{patient.district}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => onEmergency(patient)}
                  >
                    EMERGENCIA
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => onHospitalize(patient.id)}
                  >
                    <Home className="w-4 h-4 mr-1" />
                    Hospitalizar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50 bg-transparent"
                    onClick={() => onEdit(patient)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50 bg-transparent"
                    onClick={() => onView(patient)}
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
  )
}
