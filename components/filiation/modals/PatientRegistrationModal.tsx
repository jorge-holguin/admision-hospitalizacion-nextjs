"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { StepIndicator } from "../register/StepIndicator"
import { Step1BasicData } from "../register/Step1BasicData"
import { Step2AdditionalData } from "../register/Step2AdditionalData"
import { Step3FamilyData } from "../register/Step3FamilyData"

interface PatientRegistrationModalProps {
  reniecData?: any
  documentType: string
  documentNumber: string
  onCancel: () => void
  onSuccess: () => void
}

export function PatientRegistrationModal({ 
  reniecData, 
  documentType, 
  documentNumber, 
  onCancel, 
  onSuccess 
}: PatientRegistrationModalProps) {
  // Asegurarse de que documentType y documentNumber tengan valores por defecto
  const docType = documentType || "DNI";
  const docNumber = documentNumber || "";
  const [currentStep, setCurrentStep] = useState(1)
  
  // Resetear al paso 1 cuando se abre el modal
  useEffect(() => {
    if (documentNumber) {
      setCurrentStep(1)
    }
  }, [documentNumber])
  const [formData, setFormData] = useState({
    // Datos básicos
    apellidoPaterno: reniecData?.apellidoPaterno || "",
    apellidoMaterno: reniecData?.apellidoMaterno || "",
    nombres: reniecData?.nombres || "",
    fechaNacimiento: reniecData?.fechaNacimiento || "",
    sexo: reniecData?.sexo || "",
    estadoCivil: reniecData?.estadoCivil || "",
    lugarNacimiento: reniecData?.departamento || "",
    paisNacimiento: "PERÚ",
    direccion: reniecData?.direccion || "",
    distritoProcedencia: reniecData?.distrito || "",
    
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
      // Aquí iría la llamada a la API para crear el paciente
      console.log('Creando paciente:', formData)
      
      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSuccess()
    } catch (error) {
      console.error('Error al crear paciente:', error)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicData
            formData={formData}
            onInputChange={handleInputChange}
            documentType={docType}
            documentNumber={docNumber}
            reniecData={reniecData}
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
      default:
        return null
    }
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-blue-800">
          Registro de Nuevo Paciente
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
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              Crear Historia Clínica
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  )
}
