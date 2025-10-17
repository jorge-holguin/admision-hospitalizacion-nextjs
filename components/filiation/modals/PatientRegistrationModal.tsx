"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { StepIndicator } from "../register/StepIndicator"
import { Step1BasicData } from "../register/Step1BasicData"
import { Step2AdditionalData } from "../register/Step2AdditionalData"
import { Step3FamilyData } from "../register/Step3FamilyData"
import { mapSISSeguroToLocal } from "@/services/sisService"
import { transformFormDataToAPIPayload, saveHistoriaClinica } from "@/services/filiation/historiaClinicaService"
import { toast } from "@/hooks/use-toast"

interface PatientRegistrationModalProps {
  reniecData?: any
  sisData?: any
  documentType: string
  documentNumber: string
  onCancel: () => void
  onSuccess: () => void
}

export function PatientRegistrationModal({ 
  reniecData,
  sisData,
  documentType, 
  documentNumber, 
  onCancel, 
  onSuccess 
}: PatientRegistrationModalProps) {
  
  console.log('📝 PatientRegistrationModal recibido:')
  console.log('   - documentType:', documentType)
  console.log('   - documentNumber:', documentNumber)
  console.log('   - reniecData:', reniecData ? 'Presente' : 'Ausente')

  const [selectedDocType, setSelectedDocType] = useState(documentType || "DNI")
  const [selectedDocNumber, setSelectedDocNumber] = useState(documentNumber || "")
  
  // Actualizar cuando cambien las props
  useEffect(() => {
    console.log('🔄 Actualizando tipo y número de documento:')
    console.log('   - documentType prop:', documentType)
    console.log('   - documentNumber prop:', documentNumber)
    if (documentType) {
      setSelectedDocType(documentType)
      console.log('   - selectedDocType actualizado a:', documentType)
    }
    if (documentNumber) {
      setSelectedDocNumber(documentNumber)
      console.log('   - selectedDocNumber actualizado a:', documentNumber)
    }
  }, [documentType, documentNumber])
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    // Datos básicos
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombres: "",
    fechaNacimiento: "",
    sexo: "",
    estadoCivil: "",
    lugarNacimiento: "",
    lugarNacimientoReniec: "",
    paisNacimiento: "", // Vacío por defecto para modo manual
    direccion: "",
    distritoProcedencia: "",
    ubigeoReniec: "",
    
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
    correoElectronico: "",
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

  // Actualizar formData 
  useEffect(() => {
    console.log('🔍 useEffect ejecutado en PatientRegistrationModal')
    console.log('   - reniecData:', reniecData ? 'Presente' : 'Ausente')
    console.log('   - sisData:', sisData ? 'Presente' : 'Ausente')
    if (sisData) {
      console.log('   - sisData completo:', sisData)
    }
    
    const updates: any = {}

    // Datos de RENIEC
    if (reniecData) {
      console.log('📋 Datos de RENIEC recibidos en modal:', reniecData)
      Object.assign(updates, {
        apellidoPaterno: reniecData.paternalSurname || "",
        apellidoMaterno: reniecData.maternalSurname || "",
        nombres: reniecData.names || "",
        fechaNacimiento: reniecData.birthDate || "",
        sexo: reniecData.sex || "",
        estadoCivil: reniecData.maritalStatus || "",
        // NO llenar lugarNacimiento y distritoProcedencia aquí
        // Dejar que UbigeoSelector los llene desde ubigeoReniecInitial
        // lugarNacimiento: "", // Se llenará automáticamente por UbigeoSelector
        paisNacimiento: "146", // PERU - código 146 cuando hay datos de RENIEC (DNI)
        direccion: reniecData.address || "",
        // distritoProcedencia: "", // Se llenará automáticamente por UbigeoSelector
        padre: reniecData.fatherName || "",
        madre: reniecData.motherName || "",
        // Guardar códigos RENIEC para que UbigeoSelector los use
        lugarNacimientoReniec: reniecData.ubigeoReniecNacimiento || "",
        ubigeoReniec: reniecData.ubigeoReniecProcedencia || "",
      })
    }
    
    // Datos del SIS - mapear tipo de seguro
    if (sisData && sisData.tipoSeguro) {
      console.log('🏥 Datos del SIS recibidos en modal:', sisData)
      console.log(`📋 Tipo de seguro SIS: ${sisData.tipoSeguro} - ${sisData.descTipoSeguro}`)
      
      // Obtener nombres completos para detectar RN
      const nombresCompletos = `${updates.nombres || ""} ${updates.apellidoPaterno || ""} ${updates.apellidoMaterno || ""}`.trim()
      const codigoSeguroLocal = mapSISSeguroToLocal(sisData.tipoSeguro, nombresCompletos)
      
      console.log(`🔄 Mapeando seguro SIS ${sisData.tipoSeguro} → ${codigoSeguroLocal}`)
      console.log(`✅ Seguro establecido: ${codigoSeguroLocal}`)
      
      Object.assign(updates, {
        tipoSeguro: codigoSeguroLocal
      })
    } else {
      // Si NO hay datos del SIS, establecer PAGANTE por defecto
      console.log('⚠️ No hay datos del SIS, estableciendo seguro PAGANTE por defecto')
      Object.assign(updates, {
        tipoSeguro: '0' // PAGANTE
      })
    }
    
    // Aplicar actualizaciones si hay datos
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...updates
      }))
    }
  }, [reniecData, sisData])

  // Resetear al paso 1 cuando se abre el modal
  useEffect(() => {
    if (documentNumber) {
      setCurrentStep(1)
    }
  }, [documentNumber])

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
      setIsSaving(true)
      console.log('💾 Guardando historia clínica...', formData)
      console.log('📄 Datos RENIEC crudos:', reniecData?.rawData)
      
      // Transformar los datos del formulario al formato de la API
      const payload = await transformFormDataToAPIPayload(
        formData,
        selectedDocType,
        selectedDocNumber,
        reniecData?.photoReniec || '',
        !!reniecData, // validadoReniec: true si hay datos de RENIEC, false si es manual
        reniecData ? (formData.lugarNacimientoReniec || reniecData?.ubigeoReniecNacimiento) : null,
        reniecData ? (formData.ubigeoReniec || reniecData?.ubigeoReniecProcedencia) : null,
        reniecData?.rawData // Pasar datos crudos de RENIEC para construir dirección
      )
      
      // Guardar en la API
      const result = await saveHistoriaClinica(payload)
      
      if (result.success) {
        toast({
          title: "✅ Historia clínica guardada",
          description: "El paciente ha sido registrado exitosamente.",
          variant: "default"
        })
        onSuccess()
      } else {
        toast({
          title: "❌ Error al guardar",
          description: result.error || "No se pudo guardar la historia clínica.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ Error al crear paciente:', error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicData
            formData={formData}
            onInputChange={handleInputChange}
            documentType={selectedDocType}
            documentNumber={selectedDocNumber}
            reniecData={reniecData}
            onDocumentTypeChange={setSelectedDocType}
            onDocumentNumberChange={setSelectedDocNumber}
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
            {currentStep === 1 ? (
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : currentStep === 2 ? (
              <>
                <Button 
                  onClick={handleNext} 
                  variant="outline" 
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  disabled={isSaving}
                >
                  Siguiente (Opcional)
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSaving ? 'Guardando...' : 'Guardar Historia Clínica'}
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSaving ? 'Guardando...' : 'Guardar Historia Clínica'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
  )
}
