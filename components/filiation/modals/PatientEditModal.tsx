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
        apellidoPaterno: patient.PATERNO?.trim() || patient.apellidoPaterno || "",
        apellidoMaterno: patient.MATERNO?.trim() || patient.apellidoMaterno || "",
        nombres: patient.NOMBRE?.trim() || patient.nombres || patient.name || "",
        fechaNacimiento: patient.FECHA_NACIMIENTO || patient.fechaNacimiento || patient.birthDate || "",
        sexo: patient.SEXO || patient.sexo || patient.sex || "",
        estadoCivil: patient.ESTADO_CIVIL?.trim() || patient.estadoCivil || "",
        lugarNacimiento: patient.LUGAR_NACIMIENTO?.trim() || patient.lugarNacimiento || "",
        paisNacimiento: mapPaisValue(patient.PAIS) || "PERU",
        direccion: patient.DIRECCION || patient.DIRECCION_RENIEC || patient.direccion || patient.address || "",
        distritoProcedencia: mapDistritoValue(patient.Distrito_Dir || patient.DISTRITO_RENIEC || patient.distritoProcedencia || patient.district),
        
        // Datos Adicionales
        tipoSeguro: patient.SEGURO?.trim() || patient.tipoSeguro || "",
        gradoInstruccion: patient.GRADO_INSTRUCCION?.trim() || patient.gradoInstruccion || "",
        ocupacion: patient.OCUPACION?.trim() || patient.ocupacion || "",
        religion: mapReligionValue(patient.DESRELIGION || patient.religion),
        etnia: patient.COD_ETNIA?.trim() || patient.etnia || "",
        centroPoblado: patient.LOCALIDAD?.trim() || patient.Nombre_Localidad || patient.centroPoblado || "",
        telefono1: patient.TELEFONO1?.trim() || patient.telefono1 || "",
        telefono2: patient.TELEFONO2?.trim() || patient.telefono2 || "",
        hijos: String(patient.HIJOS?.s || patient.HIJOS?.d?.[0] || patient.hijos || ""),
        observacion: patient.EMAIL?.trim() || patient.observacion || "",
        
        // Datos Familiares
        padre: patient.PADRE?.trim() || patient.padre || "",
        madre: patient.MADRE?.trim() || patient.madre || "",
        conyuge: patient.CONYUGE_NOMBRE?.trim() || patient.conyuge || "",
        ocupacionFamiliar: patient.CONYUGE_OCUPACION?.trim() || patient.ocupacionFamiliar || "",
        
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
      // Aquí iría la llamada a la API para actualizar el paciente
      console.log('Actualizando paciente:', { patientId: patient.id, ...formData })
      
      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSuccess()
    } catch (error) {
      console.error('Error al actualizar paciente:', error)
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
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              Guardar Cambios
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  )
}
