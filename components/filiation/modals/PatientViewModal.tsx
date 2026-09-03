"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, FileText, Calendar, Home, Phone, Users, Heart, Printer, CheckCircle } from "lucide-react"
import { calculateAge, formatAgeReadable } from "@/lib/ageCalculator"
import { extractDocumentFromToken } from "@/utils/jwtUtils"

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
  estadoCivil?: string | { estadoCivil: string; nombre: string }
  paisNacimiento?: string
  pais?: string
  lugarNacimiento?: string | { ubigeo: string; distrito: string; provincia: string; departamento: string }
  direccion?: string
  direccionReniec?: string
  distritoProcedencia?: string
  distrito?: string | { ubigeo: string; distrito: string; provincia: string; departamento: string }
  tipoSeguro?: string
  tipoDocumento?: string | { tipoDocumento: string; nombre: string }
  seguro?: { seguro: string; nombre: string }
  localidad?: string
  stringFoto?: string
  fechaApertura?: string
  horaApertura?: string
  gradoInstruccion?: string | { gradoInstruccion: string; nombre: string }
  ocupacion?: string | { ocupacion: string; nombre: string }
  religion?: string
  etnia?: string
  codEtnia?: { codEtnia: string; etPueInd: string; lengua: string }
  conyugeOcupacion?: string | { ocupacion: string; nombre: string }
  conyugeNombre?: string
  email?: string
  centroPoblado?: string
  telefono1?: string
  telefono2?: string
  hijos?: string | number
  observacion?: string
  padre?: string
  madre?: string
  conyuge?: string
  ocupacionFamiliar?: string
  correo?: string
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
  // Campos de la API Spring (camelCase)
  historia?: string
  documento?: string
  paciente?: string
  paterno?: string
  materno?: string
  validadoReniec?: boolean
  [key: string]: any
}

interface PatientViewModalProps {
  patient: Patient
  onClose: () => void
  onEdit: () => void
}

export function PatientViewModal({ patient, onClose, onEdit }: PatientViewModalProps) {
  const [localidadNombre, setLocalidadNombre] = useState<string>('')
  const API_BASE_URL = import.meta.env.VITE_API_CITAS_MASTER_URL

  // Cargar nombre de localidad desde API
  useEffect(() => {
    const loadLocalidadNombre = async () => {
      if (!patient) return
      
      const localidadCode = patient.localidad?.trim() || patient.LOCALIDAD?.trim()
      if (!localidadCode) return

      try {
        const response = await fetch(`${API_BASE_URL}/maestro/localidad/${encodeURIComponent(localidadCode)}`)
        if (response.ok) {
          const data = await response.json()
          setLocalidadNombre(data.nombre || '')
        }
      } catch (error) {
        console.error('Error al cargar localidad:', error)
      }
    }

    loadLocalidadNombre()
  }, [patient, API_BASE_URL])

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
    hc: patient.HISTORIA?.trim() || patient.historia?.trim() || patient.hc || '',
    tipoDocumento: typeof patient.tipoDocumento === 'object' && patient.tipoDocumento?.nombre 
      ? patient.tipoDocumento.nombre 
      : (typeof patient.tipoDocumento === 'string' ? patient.tipoDocumento : patient.NOMBRE_DOCUMENTO || patient.TIPO_DOCUMENTO || 'DNI'),
    dni: patient.DOCUMENTO || patient.documento || patient.dni || '',
    // Edad: priorizar siempre la edad calculada por el backend (mayúsculas o minúsculas)
    edad: patient.EDAD || patient.edad || '',
    codigoPaciente: patient.PACIENTE || patient.paciente || patient.id || '',
    // Fecha y Hora de Apertura: formatear la fecha completa
    fechaApertura: patient.fechaApertura ? new Date(patient.fechaApertura).toLocaleString('es-PE', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    }) : patient.FECHA_APERTURA || '',
    horaApertura: patient.horaApertura || patient.HORA_APERTURA || '',
    photo: patient.stringFoto || patient.STRING_FOTO || patient.photo || '',
    validadoReniec: patient.validadoReniec === true || patient.VALIDADO_RENIEC === true,
    
    // Datos Personales
    apellidoPaterno: patient.PATERNO?.trim() || patient.paterno?.trim() || patient.apellidoPaterno || '',
    apellidoMaterno: patient.MATERNO?.trim() || patient.materno?.trim() || patient.apellidoMaterno || '',
    nombres: patient.NOMBRE?.trim() || patient.NOMBRES?.trim() || patient.nombres || '',
    fechaNacimiento: patient.FECHA_NACIMIENTO || patient.fechaNacimiento || patient.birthDate || '',
    sexo: patient.SEXO || patient.sexo || patient.sex || '',
    estadoCivil: typeof patient.estadoCivil === 'object' ? patient.estadoCivil?.nombre : patient.NOMBRE_ESTADO_CIVIL || patient.estadoCivil || '',
    codigoEstadoCivil: typeof patient.estadoCivil === 'object' ? patient.estadoCivil?.estadoCivil : patient.ESTADO_CIVIL || '',
    // País: mapear código a nombre
    paisNacimiento: patient.pais === '146' ? 'PERÚ' : patient.PAIS || 'PERÚ',
    // Lugar de Nacimiento: extraer distrito del objeto
    lugarNacimiento: typeof patient.lugarNacimiento === 'object' ? patient.lugarNacimiento?.distrito : patient.LUGAR_NACIMIENTO || '',
    distrito: typeof patient.distrito === 'object' ? patient.distrito?.distrito : patient.DISTRITO || patient.district || '',
    // ✅ PRIORIDAD: DIRECCION primero, luego DIRECCION_RENIEC
    direccion: patient.direccion || patient.DIRECCION || patient.direccionReniec || patient.DIRECCION_RENIEC || patient.address || '',
    distritoProcedencia: typeof patient.distrito === 'object' ? patient.distrito?.distrito : patient.Distrito_Dir || patient.DISTRITO_RENIEC || patient.distritoProcedencia || '',
    
    // Datos Adicionales
    // Tipo de Seguro: mostrar código - nombre
    tipoSeguro: typeof patient.seguro === 'object' 
      ? `${patient.seguro?.seguro?.trim()} - ${patient.seguro?.nombre}` 
      : patient.NOMBRE_SEGURO || patient.tipoSeguro || '',
    codigoSeguro: typeof patient.seguro === 'object' ? patient.seguro?.seguro : patient.SEGURO || '',
    gradoInstruccion: typeof patient.gradoInstruccion === 'object' ? patient.gradoInstruccion?.nombre : patient.gradoInstruccion || patient.GRADO_INSTRUCCION || '',
    ocupacion: typeof patient.ocupacion === 'object' ? patient.ocupacion?.nombre : patient.ocupacion || patient.OCUPACION || '',
    religion: patient.DESRELIGION || patient.religion || '',
    codigoReligion: patient.RELIGION || '',
    // Etnia: mostrar solo etPueInd (nombre del pueblo indígena)
    etnia: (() => {
      if (typeof patient.codEtnia === 'object' && patient.codEtnia?.etPueInd) {
        return patient.codEtnia.etPueInd;
      }
      // Si es un string JSON, parsearlo
      if (typeof patient.codEtnia === 'string') {
        try {
          const parsed = JSON.parse(patient.codEtnia);
          return parsed.etPueInd || patient.codEtnia;
        } catch {
          return patient.codEtnia;
        }
      }
      return '';
    })(),
    // Centro Poblado: mostrar código - nombre (nombre se carga desde API)
    centroPoblado: localidadNombre 
      ? `${(patient.localidad || patient.LOCALIDAD)?.trim()} - ${localidadNombre}`
      : patient.LOCALIDAD || patient.Nombre_Localidad || '',
    telefono1: patient.TELEFONO1?.trim() || patient.telefono1?.trim() || '',
    telefono2: patient.TELEFONO2?.trim() || patient.telefono2?.trim() || '',
    hijos: patient.hijos || patient.HIJOS?.s || patient.HIJOS?.d?.[0] || 0,
    observacion: patient.email || patient.EMAIL || '',
    correo: patient.correo || '',
    
    // Datos Familiares
    padre: patient.padre || patient.PADRE || '',
    madre: patient.madre || patient.MADRE || '',
    conyuge: patient.conyugeNombre || patient.CONYUGE_NOMBRE || '',
    ocupacionFamiliar: typeof patient.conyugeOcupacion === 'object' ? patient.conyugeOcupacion?.nombre : patient.conyugeOcupacion || patient.CONYUGE_OCUPACION || '',
    
    // Datos de Acompañante/Responsable
    nombreAcompanante: patient.RESPONSABLE_NOMBRE || '',
    parentesco: patient.RESPONSABLE_PARENTESCO || '',
    ocupacionAcompanante: patient.RESPONSABLE_OCUPACION || '',
    direccionAcompanante: patient.RESPONSABLE_DIRECCION || '',
    telefonoAcompanante: patient.RESPONSABLE_TELEFONO || '',
  };

  // Obtener edad en formato legible priorizando la edad que viene del backend
  const getReadableAge = (edadBackend: string | undefined, birthDate: string) => {
    // 1) Si el backend envía edad en formato 000a00m00d, usamos esa edad tal cual
    if (edadBackend && typeof edadBackend === 'string') {
      return formatAgeReadable(edadBackend)
    }

    // 2) Si no hay edad en el backend, calculamos desde la fecha de nacimiento
    if (!birthDate) return 'N/A'
    const ageResult = calculateAge(birthDate)
    return formatAgeReadable(ageResult.formatted)
  }
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
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

              {/* Datos del sistema - 2 filas x 3 columnas */}
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
                  <p className="font-medium">{getReadableAge(mappedPatient.edad, mappedPatient.fechaNacimiento || '')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Código de Paciente</p>
                  <p className="font-medium">{mappedPatient.codigoPaciente}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha y Hora de Apertura</p>
                  <p className="font-medium">{mappedPatient.fechaApertura || 'N/A'}</p>
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
                <p className="font-medium">{mappedPatient.hijos || "0"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Correo Electrónico</p>
                <p className="font-medium">{mappedPatient.correo || "N/A"}</p>
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
                <p className="text-sm font-medium text-gray-600">Ocupación Conyuge</p>
                <p className="font-medium">{mappedPatient.ocupacionFamiliar || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validación RENIEC */}
        {mappedPatient.validadoReniec && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">VALIDADO POR RENIEC</span>
          </div>
        )}

        {/* Datos de Acompañante */}
     {/*    <Card>
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
        </Card> */}
      </div>
      {/* Footer con acciones */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div>
          <p className="text-sm text-gray-500">
            Historia clínica creada el: {new Date().toLocaleDateString("es-PE")}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={async () => {
              const historia = (patient.HISTORIA || '').toString().trim()
              if (!historia) return
              if (!API_BASE_URL) {
                console.error('NEXT_PUBLIC_API_CITAS_MASTER_URL no está configurado')
                return
              }

              const usuario = extractDocumentFromToken().toString().trim()
              if (!usuario) {
                console.error('No se pudo obtener el usuario (DNI) desde el token JWT')
                return
              }

              const url = `${API_BASE_URL}/reporte/pdf/hoja-filiacion/historia/${encodeURIComponent(historia)}?usuario=${encodeURIComponent(usuario)}`
              
              try {
                // Descargar el PDF como blob
                const response = await fetch(url)
                if (!response.ok) throw new Error('Error al obtener el PDF')
                
                const blob = await response.blob()
                const blobUrl = URL.createObjectURL(blob)
                
                // Crear iframe oculto para imprimir
                const iframe = document.createElement('iframe')
                iframe.style.display = 'none'
                iframe.src = blobUrl
                document.body.appendChild(iframe)
                
                iframe.onload = () => {
                  setTimeout(() => {
                    iframe.contentWindow?.focus()
                    iframe.contentWindow?.print()
                    // Limpiar después de imprimir
                    setTimeout(() => {
                      document.body.removeChild(iframe)
                      URL.revokeObjectURL(blobUrl)
                    }, 1000)
                  }, 500)
                }
              } catch (error) {
                console.error('Error al imprimir:', error)
                // Fallback: abrir en nueva pestaña si falla
                window.open(url, '_blank', 'noopener,noreferrer')
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Hoja de Filiación
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {/* <Button onClick={onEdit} className="bg-orange-600 hover:bg-orange-700">
            Editar Información
          </Button> */}
        </div>
      </div>
    </DialogContent>
    </Dialog>
  )
}
