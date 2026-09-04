"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertCircle, Info } from "lucide-react"
import { StepIndicator } from "../register/StepIndicator"
import { Step1BasicData } from "../register/Step1BasicData"
import { Step2AdditionalData } from "../register/Step2AdditionalData"
import { Step3FamilyData } from "../register/Step3FamilyData"
import { ReniecUpdateButton } from "../ReniecUpdateButton"
import { mapSISSeguroToLocal } from "@/services/sisService"
import { transformFormDataToAPIPayload, saveHistoriaClinica } from "@/services/filiation/historiaClinicaService"
import { getUbigeoByReniecCode } from "@/utils/reniecMapper"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/components/AuthProvider"

interface PatientRegistrationModalProps {
  reniecData?: any
  sisData?: any
  documentType: string
  documentNumber: string
  onCancel: () => void
  onSuccess: () => void
  onSuccessWithDocument?: (identificador: string, extra?: { isNN?: boolean; resumenPaciente?: any; apiResponse?: any }) => void
}

export function PatientRegistrationModal({ 
  reniecData,
  sisData,
  documentType, 
  documentNumber, 
  onCancel, 
  onSuccess,
  onSuccessWithDocument
}: PatientRegistrationModalProps) {
  
  const { logout } = useAuth()

  const [selectedDocType, setSelectedDocType] = useState(documentType || "DNI")
  const [selectedDocNumber, setSelectedDocNumber] = useState(documentNumber || "")
  
  // Actualizar cuando cambien las props o reniecData
  useEffect(() => {
    if (documentType) {
      setSelectedDocType(documentType)
    }
    // Sincronizar número de documento desde props o reniecData
    const docNum = documentNumber || reniecData?.document || reniecData?.dni || ""
    if (docNum) {
      setSelectedDocNumber(docNum)
    }
  }, [documentType, documentNumber, reniecData?.document, reniecData?.dni])

  // ✅ Función para aplicar valores por defecto cuando es tipo "0" (Ninguno/RN)
  const applyDefaultValuesForNoDocument = () => {
    setFormData(prev => ({
      ...prev,
      // Datos personales - valores por defecto para RN
      apellidoPaterno: prev.apellidoPaterno || "NN", // NN = No Name
      apellidoMaterno: prev.apellidoMaterno || "NN", // NN = No Name
      nombres: prev.nombres || "NN", // NN = No Name
      // Datos básicos - valores por defecto para pacientes sin documento (RN)
      paisNacimiento: prev.paisNacimiento || "146", // 146 = PERU
      estadoCivil: prev.estadoCivil || "0", // 0 = Ninguno
      lugarNacimiento: prev.lugarNacimiento || "150118", // 150118 = Lima/Lurigancho
      distritoProcedencia: prev.distritoProcedencia || "150118", // Ubigeo (padding automático en servicio)
      direccion: prev.direccion || "POR DEFINIR", // Dirección por defecto
      // Datos adicionales - valores por defecto
      tipoSeguro: prev.tipoSeguro || "0", // 0 = Pagante
      gradoInstruccion: prev.gradoInstruccion || "00", // 00 = Ninguno
      ocupacion: prev.ocupacion || "0", // 0 = Ninguno
      religion: prev.religion || "0", // 0 = Ninguno
      etnia: prev.etnia || "58", // 58 = Mestizo
      centroPoblado: prev.centroPoblado || "L01", // L01 = Chosica (padding automático en servicio)
      telefono1: prev.telefono1 || "0", // Teléfono por defecto
    }))
  }

  // ✅ Efecto para manejar cuando el modal se abre con tipo "0" (Ninguno/RN)
  useEffect(() => {
    const isRecienNacido = reniecData?.isRecienNacido || documentType === "0" || selectedDocType === "0"
    
    if (isRecienNacido) {
      // Si es RN o tipo "0", autocompletar número con "0"
      setSelectedDocType("0")
      setSelectedDocNumber("0")
      // Pequeño delay para asegurar que formData esté inicializado
      setTimeout(() => {
        applyDefaultValuesForNoDocument()
      }, 0)
    }
  }, [reniecData, documentType]) // ✅ Agregar documentType como dependencia

  // ✅ Handler para cambio de tipo de documento
  const handleDocumentTypeChange = (newType: string) => {
    const prevType = selectedDocType
    setSelectedDocType(newType)
    
    // Si es tipo "0" (Ninguno), autocompletar con valores por defecto
    if (newType === "0") {
      setSelectedDocNumber("0")
      applyDefaultValuesForNoDocument()
      
      toast({
        title: "📋 Tipo de documento: Ninguno",
        description: "Se han autocompletado algunos campos con valores por defecto. Complete los datos del paciente manualmente.",
        duration: 5000
      })
    } else if (prevType !== newType) {
      // Solo mostrar toast informativo, NO limpiar el número de documento
      // para que persista el valor del paso anterior (búsqueda)
      const tipoNombre = newType === "D" ? "DNI" : 
                         newType === "CE" ? "Carnet de Extranjería" : 
                         newType === "PP" ? "Pasaporte" : newType
      toast({
        title: `📋 Tipo de documento: ${tipoNombre}`,
        description: "Verifique el número de documento correspondiente.",
        duration: 3000
      })
    }
  }
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [reniecPhotoHex, setReniecPhotoHex] = useState<string | null>(null)
  // ✅ Datos de RENIEC actualizados desde el botón (para que Step1BasicData muestre foto y otros cambios)
  const [localReniecData, setLocalReniecData] = useState<any>(null)
  
  // ✅ Estados para alertas visuales de APIs
  const [apiAlerts, setApiAlerts] = useState<Array<{
    type: 'success' | 'warning' | 'info'
    title: string
    message: string
  }>>([])
  
  // ✅ Verificar si es RN para inicializar con valores por defecto
  const isRNInitial = reniecData?.isRecienNacido || documentType === "0"
  
  const [formData, setFormData] = useState({
    // Datos básicos - valores iniciales para RN
    apellidoPaterno: isRNInitial ? "NN" : "",
    apellidoMaterno: isRNInitial ? "NN" : "",
    nombres: isRNInitial ? "NN" : "",
    fechaNacimiento: "",
    sexo: "",
    estadoCivil: isRNInitial ? "0" : "",
    lugarNacimiento: isRNInitial ? "150118" : "",
    lugarNacimientoReniec: "",
    paisNacimiento: isRNInitial ? "146" : "", // 146 = PERU
    direccion: isRNInitial ? "POR DEFINIR" : "",
    distritoProcedencia: isRNInitial ? "150118" : "",
    ubigeoReniec: "",
    distritoReniec: "",
    
    // Datos adicionales
    tipoSeguro: isRNInitial ? "0" : "", // 0 = Pagante
    gradoInstruccion: isRNInitial ? "00" : "", // 00 = Ninguno
    gradoInstruccionReniec: "", // Código RENIEC del grado de instrucción
    ocupacion: isRNInitial ? "0" : "", // 0 = Ninguno
    religion: isRNInitial ? "0" : "", // 0 = Ninguno
    etnia: "58", // ✅ Valor por defecto: 58 = Mestizo
    centroPoblado: isRNInitial ? "L01" : "", // L01 = Chosica
    telefono1: isRNInitial ? "0" : "",
    telefono2: "",
    hijos: "",
    correoElectronico: "",
    observacion: "",
    
    // Datos familiares
    padre: "",
    madre: "",
    conyuge: "",
    ocupacionFamiliar: isRNInitial ? "0" : "",
    nombreAcompanante: "",
    parentesco: "",
    ocupacionAcompanante: "",
    direccionAcompanante: "",
    telefonoAcompanante1: "",
    telefonoAcompanante2: "",
    // Foto desde RENIEC
    stringFoto: "",
  })

  // ✅ useEffect para aplicar seguro: SIS si existe, PAGANTE si no
  useEffect(() => {
    if (sisData && sisData.tipoSeguro) {
      // Hay datos de SIS - aplicar seguro detectado
      const nombresCompletos = `${formData.nombres || ""} ${formData.apellidoPaterno || ""} ${formData.apellidoMaterno || ""}`.trim()
      const codigoSeguroLocal = mapSISSeguroToLocal(sisData.tipoSeguro, nombresCompletos)
      
      setFormData(prev => ({
        ...prev,
        tipoSeguro: codigoSeguroLocal
      }))
      
      setApiAlerts(prev => [
        ...prev,
        {
          type: 'success',
          title: '✅ Verificación SIS Exitosa',
          message: `Seguro detectado: ${sisData.descTipoSeguro}. Estado: ${sisData.estado || 'ACTIVO'}`
        }
      ])
    } else if (sisData === null) {
      // SIS consultado pero sin datos - establecer PAGANTE
      setFormData(prev => ({
        ...prev,
        tipoSeguro: prev.tipoSeguro || "0" // 0 = PAGANTE, solo si no tiene valor
      }))
    }
  }, [sisData])
  
  // Actualizar formData con datos de RENIEC
  useEffect(() => {
    const updates: any = {}
    const alerts: Array<{ type: 'success' | 'warning' | 'info', title: string, message: string }> = []

    // Datos de RENIEC
    if (reniecData) {
      // Aviso inline cuando RENIEC respondió que el DNI no existe
      if (reniecData.reniecError === 'DNI_NO_EXISTE') {
        alerts.push({
          type: 'warning',
          title: '⚠️ DNI no encontrado en RENIEC',
          message: 'El DNI consultado no existe en la base de datos de RENIEC. Verifique el número o complete el registro manualmente.'
        })
      }

      // ✅ Alerta de éxito SOLO si hay datos reales de RENIEC (no solo documentType/document)
      // Verificar que tenga al menos nombres o apellidos (datos que solo vienen de RENIEC)
      if (reniecData.paternalSurname || reniecData.names || reniecData.dni) {
        alerts.push({
          type: 'success',
          title: '✅ Datos obtenidos de RENIEC',
          message: 'Se cargaron datos personales, dirección y ubigeos desde el servicio RENIEC.'
        })
      }
      
      // Verificar si hay código RENIEC de procedencia pero no se encontró ubigeo en BD
      if (reniecData.ubigeoReniecProcedencia && !reniecData.distritoReniec) {
        alerts.push({
          type: 'warning',
          title: '⚠️ Ubigeo no encontrado',
          message: `El código RENIEC ${reniecData.ubigeoReniecProcedencia} no existe en la base de datos. Complete manualmente el distrito de procedencia.`
        })
      }
      
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
        // Grado de instrucción desde RENIEC (código BD)
        gradoInstruccion: reniecData.educationLevel || "",
        // Código RENIEC del grado de instrucción
        gradoInstruccionReniec: reniecData.educationLevelReniec || "",
        // Ocupación del cónyuge por defecto
        ocupacionFamiliar: "0", // 0 = Ninguno
      })
    }
    
    // ✅ Aplicar alertas de RENIEC (sisData se maneja en useEffect separado)
    if (alerts.length > 0) {
      setApiAlerts(prev => [...prev, ...alerts])
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

  const validateRequiredFields = (): { isValid: boolean; missingFields: { field: string; step: number }[] } => {
    const missingFields: { field: string; step: number }[] = []
    
    // Step 1: Datos Básicos
    if (!selectedDocType || selectedDocType.trim() === '') missingFields.push({ field: 'Tipo de Documento', step: 1 })
    if (!selectedDocNumber || selectedDocNumber.trim() === '') missingFields.push({ field: 'N° Documento', step: 1 })
    if (!formData.apellidoPaterno || formData.apellidoPaterno.trim() === '') missingFields.push({ field: 'Apellido Paterno', step: 1 })
    if (!formData.apellidoMaterno || formData.apellidoMaterno.trim() === '') missingFields.push({ field: 'Apellido Materno', step: 1 })
    if (!formData.nombres || formData.nombres.trim() === '') missingFields.push({ field: 'Nombres', step: 1 })
    if (!formData.fechaNacimiento || formData.fechaNacimiento.trim() === '') missingFields.push({ field: 'Fecha de Nacimiento', step: 1 })
    if (!formData.sexo || formData.sexo.trim() === '') missingFields.push({ field: 'Sexo', step: 1 })
    if (!formData.estadoCivil || formData.estadoCivil.trim() === '') missingFields.push({ field: 'Estado Civil', step: 1 })
    if (!formData.paisNacimiento || formData.paisNacimiento.trim() === '') missingFields.push({ field: 'País de Nacimiento', step: 1 })
    if (!formData.lugarNacimiento || formData.lugarNacimiento.trim() === '') missingFields.push({ field: 'Lugar de Nacimiento', step: 1 })
    if (!formData.direccion || formData.direccion.trim() === '') missingFields.push({ field: 'Dirección', step: 1 })
    if (!formData.distritoProcedencia || formData.distritoProcedencia.trim() === '') missingFields.push({ field: 'Distrito de Procedencia', step: 1 })
    
    // Step 2: Datos Adicionales
    if (!formData.tipoSeguro || formData.tipoSeguro.trim() === '') missingFields.push({ field: 'Tipo de Seguro', step: 2 })
    if (!formData.gradoInstruccion || formData.gradoInstruccion.trim() === '') missingFields.push({ field: 'Grado de Instrucción', step: 2 })
    if (!formData.ocupacion || formData.ocupacion.trim() === '') missingFields.push({ field: 'Ocupación', step: 2 })
    if (!formData.religion || formData.religion.trim() === '') missingFields.push({ field: 'Religión', step: 2 })
    if (!formData.etnia || formData.etnia.trim() === '') missingFields.push({ field: 'Etnia', step: 2 })
    if (!formData.centroPoblado || formData.centroPoblado.trim() === '') missingFields.push({ field: 'Centro Poblado', step: 2 })
    if (!formData.telefono1 || formData.telefono1.trim() === '') missingFields.push({ field: 'Teléfono 1', step: 2 })
    
    // Step 3: Datos Familiares (Ocupación del cónyuge es opcional, quitamos esta validación)
    // if (!formData.ocupacionFamiliar || formData.ocupacionFamiliar.trim() === '') missingFields.push({ field: 'Ocupación del Cónyuge', step: 3 })
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  const handleSubmit = async () => {
    // Validar campos obligatorios
    const validation = validateRequiredFields()
    
    if (!validation.isValid) {
      // Agrupar errores por paso
      const step1Errors = validation.missingFields.filter(e => e.step === 1).map(e => e.field)
      const step2Errors = validation.missingFields.filter(e => e.step === 2).map(e => e.field)
      const step3Errors = validation.missingFields.filter(e => e.step === 3).map(e => e.field)
      
      // Ir al primer paso con errores
      if (step1Errors.length > 0) {
        setCurrentStep(1)
      } else if (step2Errors.length > 0) {
        setCurrentStep(2)
      } else if (step3Errors.length > 0) {
        setCurrentStep(3)
      }
      
      // Mostrar toast con detalles
      toast({
        title: "⚠️ Campos Obligatorios Faltantes",
        description: (
          <div className="mt-2 max-h-60 overflow-y-auto">
            <p className="font-semibold mb-2">Complete los siguientes campos para guardar:</p>
            {step1Errors.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-500">Paso 1 - Datos Básicos:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {step1Errors.map((field, index) => (
                    <li key={index} className="text-sm text-white">{field}</li>
                  ))}
                </ul>
              </div>
            )}
            {step2Errors.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-white">Paso 2 - Datos Adicionales:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {step2Errors.map((field, index) => (
                    <li key={index} className="text-sm text-white">{field}</li>
                  ))}
                </ul>
              </div>
            )}
            {step3Errors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500">Paso 3 - Datos Familiares:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {step3Errors.map((field, index) => (
                    <li key={index} className="text-sm text-white-600">{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ),
        variant: "destructive",
        duration: 10000
      })
      return
    }
    
    try {
      setIsSaving(true)
      
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
        // Extraer número de historia clínica desde la respuesta (distintos posibles campos)
        const responseData: any = result.data || {}
        const historiaClinica =
          responseData.HISTORIA ||
          responseData.historia ||
          responseData.numeroHistoria ||
          responseData.numero_historia ||
          responseData.hc ||
          responseData.HISTORIA_CLINICA ||
          ""

        const isTipoDocumentoNN = selectedDocType === "0" || documentType === "0"

        // Identificador de búsqueda: para NN usar historia, para el resto usar documento
        const searchIdentifier = isTipoDocumentoNN && historiaClinica
          ? historiaClinica
          : selectedDocNumber

        toast({
          title: "✅ Historia clínica guardada",
          description: isTipoDocumentoNN && historiaClinica
            ? `Historia clínica NN creada: ${historiaClinica}. Se realizará la búsqueda automáticamente.`
            : "El paciente ha sido registrado exitosamente. Redirigiendo a búsqueda...",
          variant: "default"
        })

        // Resumen básico del paciente para mostrar en el diálogo de confirmación
        const resumenPaciente = {
          historiaClinica,
          tipoDocumento: selectedDocType,
          documento: selectedDocNumber,
          paterno: formData.apellidoPaterno,
          materno: formData.apellidoMaterno,
          nombre: formData.nombres,
          sexo: formData.sexo,
          fechaNacimiento: formData.fechaNacimiento,
          direccion: formData.direccion,
          distrito: formData.distritoProcedencia,
        }

        // Si existe onSuccessWithDocument, pasar identificador y resumen para búsqueda automática
        if (onSuccessWithDocument && searchIdentifier) {
          onSuccessWithDocument(searchIdentifier, {
            isNN: isTipoDocumentoNN,
            resumenPaciente,
            apiResponse: responseData,
          })
        } else {
          onSuccess()
        }
      } else if (result.error === 'No se pudo obtener el usuario del token JWT') {
        // Avisar al usuario y cerrar sesión porque el token ya no es válido
        window.alert('Su sesión ha expirado o el token no es válido. Será redirigido al inicio de sesión para volver a ingresar.')
        logout()
      } else {
        toast({
          title: "❌ Error al guardar",
          description: result.error || "No se pudo guardar la historia clínica.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReniecSuccess = async (data: any) => {
    // Consultar ubigeos correctos usando códigos RENIEC
    let lugarNacimientoUbigeo = formData.lugarNacimiento
    let distritoProcedenciaUbigeo = formData.distritoProcedencia

    if (data.ubigeoReniecNacimiento) {
      const ubigeoNac = await getUbigeoByReniecCode(data.ubigeoReniecNacimiento)
      if (ubigeoNac) lugarNacimientoUbigeo = ubigeoNac
    }
    if (data.ubigeoReniecProcedencia) {
      const ubigeoProc = await getUbigeoByReniecCode(data.ubigeoReniecProcedencia)
      if (ubigeoProc) distritoProcedenciaUbigeo = ubigeoProc
    }

    setFormData(prev => ({
      ...prev,
      apellidoPaterno: data.paternalSurname || prev.apellidoPaterno,
      apellidoMaterno: data.maternalSurname || prev.apellidoMaterno,
      nombres: data.names || prev.nombres,
      fechaNacimiento: data.birthDate || prev.fechaNacimiento,
      sexo: data.sex || prev.sexo,
      estadoCivil: data.maritalStatus || prev.estadoCivil,
      direccion: data.address || data.direccionReniec || prev.direccion,
      paisNacimiento: "146",
      lugarNacimiento: lugarNacimientoUbigeo,
      distritoProcedencia: distritoProcedenciaUbigeo,
      gradoInstruccion: data.educationLevel || prev.gradoInstruccion,
      padre: data.fatherName || prev.padre,
      madre: data.motherName || prev.madre,
      lugarNacimientoReniec: data.ubigeoReniecNacimiento || "",
      ubigeoReniec: data.ubigeoReniecProcedencia || "",
      direccionReniec: data.direccionReniec || data.address || "",
      distritoReniec: data.ubigeoReniecProcedencia || "",
      ubigeoNacReniec: data.ubigeoReniecNacimiento || "",
      stringFoto: data.photoReniec || prev.stringFoto,
    }))

    setReniecPhotoHex(data.photoReniec || null)

    // ✅ Guardar datos actualizados para que Step1BasicData muestre la foto y otros cambios
    setLocalReniecData({
      photoReniec: data.photoReniec,
      document: data.document,
      dni: data.document,
      paternalSurname: data.paternalSurname,
      maternalSurname: data.maternalSurname,
      names: data.names,
      birthDate: data.birthDate,
      sex: data.sex,
      maritalStatus: data.maritalStatus,
      address: data.address,
      ubigeoReniecNacimiento: data.ubigeoReniecNacimiento,
      ubigeoReniecProcedencia: data.ubigeoReniecProcedencia,
      age: data.age,
      fatherName: data.fatherName,
      motherName: data.motherName,
    })

    setApiAlerts(prev => [
      ...prev,
      {
        type: 'success',
        title: '✅ Datos obtenidos de RENIEC',
        message: 'Se cargaron datos personales, dirección y ubigeos desde el servicio RENIEC.'
      }
    ])

    toast({
      title: "✅ Actualización desde RENIEC Exitosa",
      description: "Se actualizaron los datos personales, dirección y ubigeos desde RENIEC.",
    })
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
            reniecData={localReniecData || reniecData}
            onDocumentTypeChange={handleDocumentTypeChange}
            onDocumentNumberChange={setSelectedDocNumber}
          />
        )
      case 2:
        return (
          <Step2AdditionalData
            formData={formData}
            onInputChange={handleInputChange}
            patientData={{ documento: selectedDocNumber, DOCUMENTO: selectedDocNumber }}
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
    <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-800">
            Registro de Nuevo Paciente
          </DialogTitle>
        </DialogHeader>

        {/* ✅ Alertas visuales de APIs llamadas */}
        {apiAlerts.length > 0 && (
          <div className="space-y-2 mb-4">
            {apiAlerts.map((alert, index) => (
              <Alert 
                key={index} 
                className={
                  alert.type === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }
              >
                <div className="flex items-start gap-2">
                  {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                  {alert.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                  {alert.type === 'info' && <Info className="h-5 w-5 text-blue-600 mt-0.5" />}
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${
                      alert.type === 'success' 
                        ? 'text-green-800' 
                        : alert.type === 'warning'
                        ? 'text-yellow-800'
                        : 'text-blue-800'
                    }`}>
                      {alert.title}
                    </div>
                    <AlertDescription className={`text-sm ${
                      alert.type === 'success' 
                        ? 'text-green-700' 
                        : alert.type === 'warning'
                        ? 'text-yellow-700'
                        : 'text-blue-700'
                    }`}>
                      {alert.message}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        <StepIndicator currentStep={currentStep} />

        <div className="min-h-[400px]">
          {renderStepContent()}
          {currentStep === 1 && selectedDocType === "D" && selectedDocNumber?.trim().length === 8 && (
            <div className="flex justify-center mt-4">
              <ReniecUpdateButton
                dni={selectedDocNumber.trim()}
                onSuccess={handleReniecSuccess}
                disabled={!selectedDocNumber || selectedDocNumber.trim().length !== 8}
              />
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious} className="w-full sm:w-auto">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            {currentStep === 1 ? (
              <Button onClick={handleNext} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : currentStep === 2 ? (
              <>
                <Button 
                  onClick={handleNext} 
                  variant="outline" 
                  className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50"
                  disabled={isSaving}
                >
                  Siguiente (Opcional)
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSaving ? 'Guardando...' : 'Guardar Historia Clínica'}
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
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
