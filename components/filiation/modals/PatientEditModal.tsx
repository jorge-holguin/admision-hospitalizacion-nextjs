"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { StepIndicator } from "../register/StepIndicator"
import { Step1BasicData } from "../register/Step1BasicData"
import { Step2AdditionalData } from "../register/Step2AdditionalData"
import { Step3FamilyData } from "../register/Step3FamilyData"

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
  seguro?: { seguro: string; nombre: string }
  gradoInstruccion?: string | { gradoInstruccion: string; nombre: string }
  ocupacion?: string | { ocupacion: string; nombre: string }
  religion?: string
  etnia?: string
  codEtnia?: { codEtnia: string; etPueInd: string; lengua: string }
  conyugeOcupacion?: string | { ocupacion: string; nombre: string }
  conyugeNombre?: string
  email?: string
  correo?: string
  localidad?: string
  paterno?: string
  materno?: string
  nombre?: string
  paciente?: string
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

interface PatientEditModalProps {
  patient: Patient
  onCancel: () => void
  onSuccess: () => void
}

export function PatientEditModal({ patient, onCancel, onSuccess }: PatientEditModalProps) {
  // Si patient es null o undefined, mostrar mensaje o retornar null
  if (!patient) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error</DialogTitle>
        </DialogHeader>
        <div className="py-6 text-center">
          <p>No se pudo cargar la información del paciente para editar.</p>
          <Button onClick={onCancel} className="mt-4">Cerrar</Button>
        </div>
      </DialogContent>
    );
  }
  const [currentStep, setCurrentStep] = useState(1)
  
  // Resetear al paso 1 cuando se abre el modal
  useEffect(() => {
    if (patient) {
      setCurrentStep(1)
    }
  }, [patient])
  
  const [formData, setFormData] = useState({
    // Datos básicos
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombres: "",
    fechaNacimiento: "",
    sexo: "",
    estadoCivil: "",
    lugarNacimiento: "",
    paisNacimiento: "PERÚ",
    direccion: "",
    distritoProcedencia: "",
    
    // Datos adicionales
    tipoSeguro: "",
    gradoInstruccion: "",
    ocupacion: "",
    religion: "",
    etnia: "",
    centroPoblado: "",
    telefono1: "",
    telefono2: "",
    hijos: "",
    observacion: "",
    correoElectronico: "",
    
    // Datos familiares
    padre: "",
    madre: "",
    conyuge: "",
    ocupacionFamiliar: "",
    nombreAcompanante: "",
    parentesco: "",
    ocupacionAcompanante: "",
    direccionAcompanante: "",
    telefonoAcompanante1: "",
    telefonoAcompanante2: "",
  })

  // Función para mapear valores de la API a valores de las opciones
  const mapReligionValue = (value?: string) => {
    const upperValue = value?.toUpperCase().trim();
    if (!upperValue) return "";
    if (upperValue.includes("CATOLICA") || upperValue.includes("CATÓLICA")) return "CATOLICA";
    if (upperValue.includes("EVANGELICA") || upperValue.includes("EVANGÉLICA")) return "EVANGELICA";
    if (upperValue.includes("NO ESPECIFICA")) return "NO_ESPECIFICA";
    return upperValue.replace(/\s+/g, "_");
  };

  const mapPaisValue = (value?: string) => {
    const upperValue = value?.toUpperCase().trim();
    if (!upperValue || upperValue === "PERÚ" || upperValue === "PERU") return "PERU";
    return upperValue.replace(/\s+/g, "_");
  };

  const mapDistritoValue = (value?: string) => {
    const upperValue = value?.toUpperCase().trim();
    if (!upperValue) return "";
    return upperValue.replace(/\s+/g, "_");
  };

  // Cargar datos del paciente al inicializar (mapear desde API)
  useEffect(() => {
    if (patient) {
      setFormData({
        // Datos Personales
        apellidoPaterno: patient.paterno?.trim() || patient.PATERNO?.trim() || patient.apellidoPaterno || "",
        apellidoMaterno: patient.materno?.trim() || patient.MATERNO?.trim() || patient.apellidoMaterno || "",
        nombres: patient.nombre?.trim() || patient.NOMBRE?.trim() || patient.nombres || patient.name || "",
        fechaNacimiento: patient.fechaNacimiento || patient.FECHA_NACIMIENTO || patient.birthDate || "",
        sexo: patient.sexo || patient.SEXO || patient.sex || "",
        estadoCivil: typeof patient.estadoCivil === 'object' ? patient.estadoCivil?.estadoCivil?.trim() : patient.ESTADO_CIVIL?.trim() || patient.estadoCivil || "",
        // Lugar de Nacimiento: extraer ubigeo del objeto
        lugarNacimiento: typeof patient.lugarNacimiento === 'object' ? patient.lugarNacimiento?.ubigeo?.trim() : patient.LUGAR_NACIMIENTO?.trim() || patient.lugarNacimiento || "",
        // País: extraer código del objeto o campo directo
        paisNacimiento: patient.pais || mapPaisValue(patient.PAIS) || "PERU",
        direccion: patient.direccionReniec || patient.direccion || patient.DIRECCION || patient.DIRECCION_RENIEC || patient.address || "",
        // Distrito: extraer ubigeo del objeto distrito
        distritoProcedencia: typeof patient.distrito === 'object' ? patient.distrito?.ubigeo?.trim() : mapDistritoValue(patient.Distrito_Dir || patient.DISTRITO_RENIEC || patient.distritoProcedencia || patient.district),
        
        // Datos Adicionales
        tipoSeguro: typeof patient.seguro === 'object' ? patient.seguro?.seguro?.trim() : patient.SEGURO?.trim() || patient.tipoSeguro || "",
        // Grado de Instrucción: extraer código del objeto
        gradoInstruccion: typeof patient.gradoInstruccion === 'object' ? patient.gradoInstruccion?.gradoInstruccion?.trim() : patient.GRADO_INSTRUCCION?.trim() || patient.gradoInstruccion || "",
        // Ocupación: extraer código del objeto
        ocupacion: typeof patient.ocupacion === 'object' ? patient.ocupacion?.ocupacion?.trim() : patient.OCUPACION?.trim() || patient.ocupacion || "",
        // Religión: usar código directo
        religion: patient.religion || mapReligionValue(patient.DESRELIGION),
        // Etnia: extraer código del objeto
        etnia: typeof patient.codEtnia === 'object' ? patient.codEtnia?.codEtnia?.trim() : patient.COD_ETNIA?.trim() || patient.etnia || "",
        // Localidad: usar código directo
        centroPoblado: patient.localidad?.trim() || patient.LOCALIDAD?.trim() || patient.Nombre_Localidad || patient.centroPoblado || "",
        telefono1: patient.TELEFONO1?.trim() || patient.telefono1 || "",
        telefono2: patient.TELEFONO2?.trim() || patient.telefono2 || "",
        hijos: String(patient.hijos || patient.HIJOS?.s || patient.HIJOS?.d?.[0] || ""),
        // Observación: campo email
        observacion: patient.email?.trim() || patient.EMAIL?.trim() || patient.observacion || "",
        // Correo Electrónico: campo correo
        correoElectronico: patient.correo?.trim() || "",
        
        // Datos Familiares
        padre: patient.padre?.trim() || patient.PADRE?.trim() || "",
        madre: patient.madre?.trim() || patient.MADRE?.trim() || "",
        // Cónyuge: campo conyugeNombre
        conyuge: patient.conyugeNombre?.trim() || patient.CONYUGE_NOMBRE?.trim() || patient.conyuge || "",
        // Ocupación Cónyuge: extraer código del objeto
        ocupacionFamiliar: typeof patient.conyugeOcupacion === 'object' ? patient.conyugeOcupacion?.ocupacion?.trim() : patient.CONYUGE_OCUPACION?.trim() || patient.ocupacionFamiliar || "",
        
        // Datos de Acompañante/Responsable
        nombreAcompanante: patient.RESPONSABLE_NOMBRE?.trim() || patient.nombreAcompanante || "",
        parentesco: patient.RESPONSABLE_PARENTESCO?.trim() || patient.parentesco || "",
        ocupacionAcompanante: patient.RESPONSABLE_OCUPACION?.trim() || patient.ocupacionAcompanante || "",
        direccionAcompanante: patient.RESPONSABLE_DIRECCION?.trim() || patient.direccionAcompanante || "",
        telefonoAcompanante1: patient.RESPONSABLE_TELEFONO?.trim() || patient.telefonoAcompanante1 || "",
        telefonoAcompanante2: "", // No existe en la API, campo legacy
      })
    }
  }, [patient])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      const pacienteId = patient.PACIENTE || patient.paciente || patient.id
      
      if (!pacienteId) {
        console.error('No se encontró el ID del paciente')
        return
      }

      // Preparar datos para enviar a la API - SOLO CAMPOS EDITABLES
      const updateData: any = {}
      
      // Solo agregar campos que tienen valor y son diferentes del original
      if (formData.apellidoPaterno?.trim()) updateData.paterno = formData.apellidoPaterno.trim()
      if (formData.apellidoMaterno?.trim()) updateData.materno = formData.apellidoMaterno.trim()
      if (formData.nombres?.trim()) updateData.nombre = formData.nombres.trim()
      if (formData.fechaNacimiento) updateData.fechaNacimiento = formData.fechaNacimiento
      if (formData.sexo) updateData.sexo = formData.sexo
      if (formData.estadoCivil?.trim()) updateData.estadoCivil = formData.estadoCivil.trim()
      if (formData.lugarNacimiento?.trim()) updateData.lugarNacimiento = formData.lugarNacimiento.trim()
      if (formData.paisNacimiento) updateData.pais = formData.paisNacimiento
      if (formData.direccion?.trim()) updateData.direccion = formData.direccion.trim()
      if (formData.distritoProcedencia?.trim()) updateData.distrito = formData.distritoProcedencia.trim()
      if (formData.tipoSeguro?.trim()) updateData.seguro = formData.tipoSeguro.trim()
      if (formData.gradoInstruccion?.trim()) updateData.gradoInstruccion = formData.gradoInstruccion.trim()
      if (formData.ocupacion?.trim()) updateData.ocupacion = formData.ocupacion.trim()
      if (formData.religion?.trim()) updateData.religion = formData.religion.trim()
      if (formData.etnia?.trim()) updateData.etnia = formData.etnia.trim()
      if (formData.centroPoblado?.trim()) updateData.localidad = formData.centroPoblado.trim()
      if (formData.telefono1?.trim()) updateData.telefono1 = formData.telefono1.trim()
      if (formData.telefono2?.trim()) updateData.telefono2 = formData.telefono2.trim()
      if (formData.hijos) updateData.hijos = parseInt(formData.hijos) || 0
      if (formData.observacion?.trim()) updateData.email = formData.observacion.trim()
      if (formData.correoElectronico?.trim()) updateData.correo = formData.correoElectronico.trim()
      if (formData.padre?.trim()) updateData.padre = formData.padre.trim()
      if (formData.madre?.trim()) updateData.madre = formData.madre.trim()
      if (formData.conyuge?.trim()) updateData.conyugeNombre = formData.conyuge.trim()
      if (formData.ocupacionFamiliar?.trim()) updateData.conyugeOcupacion = formData.ocupacionFamiliar.trim()

      console.log('Actualizando paciente:', pacienteId)
      console.log('Datos a enviar (solo campos editados):', updateData)
      
      const response = await fetch(`http://192.168.0.252:9011/api/historia-clinica/pacientes/${pacienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el paciente')
      }

      const result = await response.json()
      console.log('Paciente actualizado:', result)
      
      onSuccess()
    } catch (error) {
      console.error('Error al actualizar paciente:', error)
      alert('Error al actualizar el paciente. Por favor, intente nuevamente.')
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicData
            formData={formData}
            onInputChange={handleInputChange}
            documentType="DNI"
            documentNumber={patient.DOCUMENTO || patient.dni || ''}
            patientData={patient}
            reniecData={{
              dni: patient.DOCUMENTO || patient.dni || '',
              apellidoPaterno: patient.PATERNO?.trim() || patient.apellidoPaterno || '',
              apellidoMaterno: patient.MATERNO?.trim() || patient.apellidoMaterno || '',
              nombres: patient.NOMBRE?.trim() || patient.nombres || patient.name || '',
            }}
          />
        )
      case 2:
        return (
          <Step2AdditionalData
            formData={formData}
            onInputChange={handleInputChange}
            patientData={patient}
          />
        )
      case 3:
        return (
          <Step3FamilyData
            formData={formData}
            onInputChange={handleInputChange}
            patientData={patient}
          />
        )
      default:
        return null
    }
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-blue-800">
          Editar Información del Paciente - H.C. {patient.HISTORIA || patient.hc || 'N/A'}
        </DialogTitle>
      </DialogHeader>

      <StepIndicator currentStep={currentStep} />

      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
          )}
        </div>

        <div className="flex space-x-3">

          {currentStep === 1 ? (
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : currentStep === 2 ? (
            <>
              <Button onClick={handleNext} variant="outline" className="bg-gray-100 hover:bg-gray-200">
                Siguiente (Opcional)
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                Actualizar
              </Button>
            </>
          ) : (
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              Actualizar
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  )
}
