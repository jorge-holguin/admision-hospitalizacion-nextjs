"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, FileText, Calendar, Home, Phone, Users, Heart } from "lucide-react"

interface Patient {
  id?: string
  hc?: string
  name?: string
  sex?: string
  birthDate?: string
  address?: string
  dni?: string
  location?: string
  district?: string
  // Datos adicionales (camelCase)
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
  // Campos de la API (UPPERCASE)
  HISTORIA?: string
  NOMBRES?: string
  PATERNO?: string
  MATERNO?: string
  NOMBRE?: string
  DOCUMENTO?: string
  SEXO?: string
  FECHA_NACIMIENTO?: string
  EDAD?: string
  NOMBRE_ESTADO_CIVIL?: string
  DIRECCION?: string
  DISTRITO?: string
  TELEFONO1?: string
  TELEFONO2?: string
  NOMBRE_SEGURO?: string
  DESRELIGION?: string
  PADRE?: string
  MADRE?: string
  Nombre_Localidad?: string
  Distrito_Dir?: string
  PACIENTE?: string
  [key: string]: any
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

  // Mapear datos de la API al formato del componente
  const mappedPatient = {
    ...patient,
    // Información del Sistema
    hc: patient.HISTORIA?.trim() || patient.hc || '',
    tipoDocumento: patient.NOMBRE_DOCUMENTO || 'DNI',
    dni: patient.DOCUMENTO || patient.dni || '',
    edad: patient.EDAD || '',
    codigoPaciente: patient.PACIENTE || patient.id || '',
    fechaApertura: patient.FECHA_APERTURA || '',
    horaApertura: patient.HORA_APERTURA || '',
    photo: patient.STRING_FOTO || patient.photo || '',
    
    // Datos Personales
    apellidoPaterno: patient.PATERNO?.trim() || patient.apellidoPaterno || '',
    apellidoMaterno: patient.MATERNO?.trim() || patient.apellidoMaterno || '',
    nombres: patient.NOMBRE?.trim() || patient.nombres || '',
    fechaNacimiento: patient.FECHA_NACIMIENTO || patient.birthDate || '',
    sexo: patient.SEXO || patient.sex || '',
    estadoCivil: patient.NOMBRE_ESTADO_CIVIL || patient.estadoCivil || '',
    codigoEstadoCivil: patient.ESTADO_CIVIL || '',
    paisNacimiento: patient.PAIS || '',
    lugarNacimiento: patient.LUGAR_NACIMIENTO || '',
    distrito: patient.DISTRITO || patient.district || '',
    direccion: patient.DIRECCION || patient.DIRECCION_RENIEC || patient.address || '',
    distritoProcedencia: patient.Distrito_Dir || patient.DISTRITO_RENIEC || patient.distritoProcedencia || '',
    
    // Datos Adicionales
    tipoSeguro: patient.NOMBRE_SEGURO || patient.tipoSeguro || '',
    codigoSeguro: patient.SEGURO || '',
    gradoInstruccion: patient.GRADO_INSTRUCCION || '',
    ocupacion: patient.OCUPACION || '',
    religion: patient.DESRELIGION || patient.religion || '',
    codigoReligion: patient.RELIGION || '',
    etnia: patient.COD_ETNIA || '',
    centroPoblado: patient.LOCALIDAD || patient.Nombre_Localidad || '',
    telefono1: patient.TELEFONO1?.trim() || '',
    telefono2: patient.TELEFONO2?.trim() || '',
    hijos: patient.HIJOS?.s || patient.HIJOS?.d?.[0] || 0,
    observacion: patient.EMAIL || '',
    
    // Datos Familiares
    padre: patient.PADRE || '',
    madre: patient.MADRE || '',
    conyuge: patient.CONYUGE_NOMBRE || '',
    ocupacionFamiliar: patient.CONYUGE_OCUPACION || '',
    
    // Datos de Acompañante/Responsable
    nombreAcompanante: patient.RESPONSABLE_NOMBRE || '',
    parentesco: patient.RESPONSABLE_PARENTESCO || '',
    ocupacionAcompanante: patient.RESPONSABLE_OCUPACION || '',
    direccionAcompanante: patient.RESPONSABLE_DIRECCION || '',
    telefonoAcompanante: patient.RESPONSABLE_TELEFONO || '',
  };

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
            Información del Paciente - H.C. {mappedPatient?.hc || 'N/A'}
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
              <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-48 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                  {mappedPatient.photo ? (
                    <img 
                      src={`data:image/jpeg;base64,${mappedPatient.photo}`} 
                      alt="Foto del paciente"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center max-w-32">Foto RENIEC</p>
              </div>

              {/* Datos del sistema */}
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">N° Historia Clínica</p>
                  <p className="text-lg font-semibold text-blue-800">{mappedPatient.hc}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo de Documento</p>
                  <p className="font-medium">{mappedPatient.tipoDocumento}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">N° Documento</p>
                  <p className="font-medium">{mappedPatient.dni}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Edad</p>
                  <p className="font-medium">{mappedPatient.edad || calculateAge(mappedPatient.fechaNacimiento || '')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Código de Paciente</p>
                  <p className="font-medium">{mappedPatient.codigoPaciente}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha y Hora de Apertura</p>
                  <p className="font-medium">{mappedPatient.horaApertura || 'N/A'}</p>
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
                <p className="font-medium">{mappedPatient.apellidoPaterno || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Apellido Materno</p>
                <p className="font-medium">{mappedPatient.apellidoMaterno || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-600">Nombres</p>
                <p className="font-medium">{mappedPatient.nombres || mappedPatient.name}</p>
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
                <p className="font-medium">{mappedPatient.fechaNacimiento || mappedPatient.birthDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Sexo</p>
                <p className="font-medium">
                  {mappedPatient.sexo === "M" || mappedPatient.sex === "M" ? "Masculino" : 
                   mappedPatient.sexo === "F" || mappedPatient.sex === "F" ? "Femenino" : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Estado Civil</p>
                <p className="font-medium">{mappedPatient.estadoCivil || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">País de Nacimiento</p>
                <p className="font-medium">{mappedPatient.paisNacimiento || "PERÚ"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-600">Lugar Nacimiento</p>
                <p className="font-medium">{mappedPatient.lugarNacimiento || "N/A"}</p>
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
                <p className="font-medium">{mappedPatient.direccion || mappedPatient.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Distrito de Procedencia</p>
                  <p className="font-medium">{mappedPatient.distritoProcedencia || mappedPatient.district}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Localidad</p>
                  <p className="font-medium">{mappedPatient.location || "N/A"}</p>
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
                <p className="font-medium">{mappedPatient.tipoSeguro || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Grado de Instrucción</p>
                <p className="font-medium">{mappedPatient.gradoInstruccion || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ocupación</p>
                <p className="font-medium">{mappedPatient.ocupacion || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Religión</p>
                <p className="font-medium">{mappedPatient.religion || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Etnia</p>
                <p className="font-medium">{mappedPatient.etnia || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Centro Poblado</p>
                <p className="font-medium">{mappedPatient.centroPoblado || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Teléfono 1</p>
                <p className="font-medium">{mappedPatient.telefono1 || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Teléfono 2</p>
                <p className="font-medium">{mappedPatient.telefono2 || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">N° de Hijos</p>
                <p className="font-medium">{mappedPatient.hijos || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-600">Observaciones</p>
                <p className="font-medium">{mappedPatient.observacion || "N/A"}</p>
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
                <p className="font-medium">{mappedPatient.padre || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Madre</p>
                <p className="font-medium">{mappedPatient.madre || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cónyuge</p>
                <p className="font-medium">{mappedPatient.conyuge || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ocupación Familiar</p>
                <p className="font-medium">{mappedPatient.ocupacionFamiliar || "N/A"}</p>
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
                <p className="font-medium">{mappedPatient.nombreAcompanante || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Parentesco</p>
                  <p className="font-medium">{mappedPatient.parentesco || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Ocupación</p>
                  <p className="font-medium">{mappedPatient.ocupacionAcompanante || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Dirección</p>
                <p className="font-medium">{mappedPatient.direccionAcompanante || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Teléfono</p>
                <p className="font-medium">{mappedPatient.telefonoAcompanante || "N/A"}</p>
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
