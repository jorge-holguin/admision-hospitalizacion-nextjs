"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, FileText, Calendar, Home, Phone, Users, Heart } from "lucide-react"

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
  // Datos adicionales
  apellidoPaterno?: string
  apellidoMaterno?: string
  nombres?: string
  fechaNacimiento?: string
  sexo?: string
  estadoCivil?: string
  paisNacimiento?: string
  lugarNacimiento?: string
  direccion?: string
  distritoProcedencia?: string
  tipoSeguro?: string
  gradoInstruccion?: string
  ocupacion?: string
  religion?: string
  etnia?: string
  centroPoblado?: string
  telefono1?: string
  telefono2?: string
  hijos?: string
  observacion?: string
  padre?: string
  madre?: string
  conyuge?: string
  ocupacionFamiliar?: string
  nombreAcompanante?: string
  parentesco?: string
  ocupacionAcompanante?: string
  direccionAcompanante?: string
  telefonoAcompanante1?: string
  telefonoAcompanante2?: string
}

interface PatientViewModalProps {
  patient: Patient
  onClose: () => void
  onEdit: () => void
}

export function PatientViewModal({ patient, onClose, onEdit }: PatientViewModalProps) {
  // Si patient es null o undefined, mostrar mensaje o retornar null
  if (!patient) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error</DialogTitle>
        </DialogHeader>
        <div className="py-6 text-center">
          <p>No se pudo cargar la información del paciente.</p>
          <Button onClick={onClose} className="mt-4">Cerrar</Button>
        </div>
      </DialogContent>
    );
  }
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "N/A"
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return `${age} años`
  }
  
  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-800 flex items-center">
            <User className="w-6 h-6 mr-2" />
            Información del Paciente - H.C. {patient?.hc || 'N/A'}
          </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Información del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-700 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              {/* Foto del Paciente */}
              <div className="flex flex-col items-center space-y-2">
                <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 text-center max-w-20">Foto RENIEC</p>
              </div>

              {/* Datos del sistema */}
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">N° Historia Clínica</p>
                  <p className="text-lg font-semibold text-blue-800">{patient.hc}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo de Documento</p>
                  <p className="font-medium">DNI</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">N° Documento</p>
                  <p className="font-medium">{patient.dni}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Edad</p>
                  <p className="font-medium">{calculateAge(patient.birthDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Código de Paciente</p>
                  <p className="font-medium">{patient.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <p className="font-medium text-green-600">ACTIVO</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos de Identificación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-700 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Datos de Identificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Apellido Paterno</p>
                <p className="font-medium">{patient.apellidoPaterno || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Apellido Materno</p>
                <p className="font-medium">{patient.apellidoMaterno || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-600">Nombres</p>
                <p className="font-medium">{patient.nombres || patient.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos Personales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-700 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Fecha Nacimiento</p>
                <p className="font-medium">{patient.fechaNacimiento || patient.birthDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Sexo</p>
                <p className="font-medium">
                  {patient.sexo === "M" || patient.sex === "M" ? "Masculino" : 
                   patient.sexo === "F" || patient.sex === "F" ? "Femenino" : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Estado Civil</p>
                <p className="font-medium">{patient.estadoCivil || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">País de Nacimiento</p>
                <p className="font-medium">{patient.paisNacimiento || "PERÚ"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-600">Lugar Nacimiento</p>
                <p className="font-medium">{patient.lugarNacimiento || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos de Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-700 flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Datos de Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Dirección</p>
                <p className="font-medium">{patient.direccion || patient.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Distrito de Procedencia</p>
                  <p className="font-medium">{patient.distritoProcedencia || patient.district}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Localidad</p>
                  <p className="font-medium">{patient.location || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos Adicionales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-700 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Datos Adicionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Tipo de Seguro</p>
                <p className="font-medium">{patient.tipoSeguro || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Grado de Instrucción</p>
                <p className="font-medium">{patient.gradoInstruccion || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ocupación</p>
                <p className="font-medium">{patient.ocupacion || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Religión</p>
                <p className="font-medium">{patient.religion || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Etnia</p>
                <p className="font-medium">{patient.etnia || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Centro Poblado</p>
                <p className="font-medium">{patient.centroPoblado || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Teléfono 1</p>
                <p className="font-medium">{patient.telefono1 || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Teléfono 2</p>
                <p className="font-medium">{patient.telefono2 || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">N° de Hijos</p>
                <p className="font-medium">{patient.hijos || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-600">Observaciones</p>
                <p className="font-medium">{patient.observacion || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos Familiares */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-700 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Datos Familiares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Padre</p>
                <p className="font-medium">{patient.padre || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Madre</p>
                <p className="font-medium">{patient.madre || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cónyuge</p>
                <p className="font-medium">{patient.conyuge || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ocupación Familiar</p>
                <p className="font-medium">{patient.ocupacionFamiliar || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos de Acompañante */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-700 flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Datos de Acompañante/Responsable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Nombre del Acompañante</p>
                <p className="font-medium">{patient.nombreAcompanante || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Parentesco</p>
                  <p className="font-medium">{patient.parentesco || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Ocupación</p>
                  <p className="font-medium">{patient.ocupacionAcompanante || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Dirección</p>
                <p className="font-medium">{patient.direccionAcompanante || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Teléfono 1</p>
                  <p className="font-medium">{patient.telefonoAcompanante1 || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Teléfono 2</p>
                  <p className="font-medium">{patient.telefonoAcompanante2 || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer con acciones */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div>
          <p className="text-sm text-gray-500">
            Historia clínica creada el: {new Date().toLocaleDateString("es-PE")}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onEdit} className="bg-orange-600 hover:bg-orange-700">
            Editar Información
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}
