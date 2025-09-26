"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { StepIndicator } from "../register/StepIndicator"
import { Step1BasicData } from "../register/Step1BasicData"
import { Step2AdditionalData } from "../register/Step2AdditionalData"
import { Step3FamilyData } from "../register/Step3FamilyData"
import { Step4Confirmation } from "../register/Step4Confirmation"

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

  // Cargar datos del paciente al inicializar
  useEffect(() => {
    if (patient) {
      setFormData({
        apellidoPaterno: patient.apellidoPaterno || "",
        apellidoMaterno: patient.apellidoMaterno || "",
        nombres: patient.nombres || patient.name || "",
        fechaNacimiento: patient.fechaNacimiento || patient.birthDate || "",
        sexo: patient.sexo || patient.sex || "",
        estadoCivil: patient.estadoCivil || "",
        lugarNacimiento: patient.lugarNacimiento || "",
        paisNacimiento: patient.paisNacimiento || "PERÚ",
        direccion: patient.direccion || patient.address || "",
        distritoProcedencia: patient.distritoProcedencia || patient.district || "",
        
        tipoSeguro: patient.tipoSeguro || "",
        gradoInstruccion: patient.gradoInstruccion || "",
        ocupacion: patient.ocupacion || "",
        religion: patient.religion || "",
        etnia: patient.etnia || "",
        centroPoblado: patient.centroPoblado || "",
        telefono1: patient.telefono1 || "",
        telefono2: patient.telefono2 || "",
        hijos: patient.hijos || "",
        observacion: patient.observacion || "",
        
        padre: patient.padre || "",
        madre: patient.madre || "",
        conyuge: patient.conyuge || "",
        ocupacionFamiliar: patient.ocupacionFamiliar || "",
        nombreAcompanante: patient.nombreAcompanante || "",
        parentesco: patient.parentesco || "",
        ocupacionAcompanante: patient.ocupacionAcompanante || "",
        direccionAcompanante: patient.direccionAcompanante || "",
        telefonoAcompanante1: patient.telefonoAcompanante1 || "",
        telefonoAcompanante2: patient.telefonoAcompanante2 || "",
      })
    }
  }, [patient])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < 4) {
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
            documentNumber={patient.dni}
            reniecData={{
              dni: patient.dni,
              apellidoPaterno: patient.apellidoPaterno,
              apellidoMaterno: patient.apellidoMaterno,
              nombres: patient.nombres || patient.name,
            }}
          />
        )
      case 2:
        return (
          <Step2AdditionalData
            formData={formData}
            onInputChange={handleInputChange}
          />
        )
      case 3:
        return (
          <Step3FamilyData
            formData={formData}
            onInputChange={handleInputChange}
          />
        )
      case 4:
        return (
          <Step4Confirmation
            formData={formData}
            documentType="DNI"
            documentNumber={patient.dni}
            reniecData={{
              dni: patient.dni,
              apellidoPaterno: patient.apellidoPaterno,
              apellidoMaterno: patient.apellidoMaterno,
              nombres: patient.nombres || patient.name,
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-orange-800">
          Editar Información del Paciente - H.C. {patient.hc}
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

          {currentStep < 4 ? (
            <Button onClick={handleNext} className="bg-orange-600 hover:bg-orange-700">
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              Guardar Cambios
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  )
}
