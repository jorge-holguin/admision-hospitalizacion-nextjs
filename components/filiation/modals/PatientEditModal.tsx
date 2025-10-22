"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle, Dialog } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, RefreshCw, CheckCircle } from "lucide-react"
import { StepIndicator } from "../register/StepIndicator"
import { Step1BasicData } from "../register/Step1BasicData"
import { Step2AdditionalData } from "../register/Step2AdditionalData"
import { Step3FamilyData } from "../register/Step3FamilyData"
import { extractDocumentFromToken } from "@/utils/jwtUtils"
import { toast } from "@/hooks/use-toast"
import { useReniec } from "@/hooks/useReniec"
import { convertToLocalDateTime } from "@/utils/dateFormatUtils"
import { getUbigeoByReniecCode } from "@/utils/reniecMapper"

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
  // Hooks deben estar antes de cualquier return condicional
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoadingReniec, setIsLoadingReniec] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [reniecData, setReniecData] = useState<any>(null)
  const [reniecPhotoHex, setReniecPhotoHex] = useState<string | null>(null) // ✅ Foto en hexadecimal de RENIEC
  const [reniecButtonUsed, setReniecButtonUsed] = useState(false) // ✅ Bloquear botón después de usar
  const { consultarReniec } = useReniec()
  
  // Resetear al paso 1 cuando se abre el modal
  useEffect(() => {
    if (patient) {
      setCurrentStep(1)
      setReniecButtonUsed(false) // Resetear estado del botón
      setReniecPhotoHex(null) // Limpiar foto anterior
    }
  }, [patient])
  
  // ✅ Consultar RENIEC automáticamente si STRING_FOTO es null y tiene DNI
  useEffect(() => {
    const autoConsultReniec = async () => {
      if (patient && !patient.STRING_FOTO && patient.TIPO_DOCUMENTO?.trim() === 'D') {
        const dni = patient.DOCUMENTO || patient.dni || patient.documento;
        if (dni && !reniecButtonUsed) {
          console.log('📸 STRING_FOTO es null, consultando RENIEC automáticamente...');
          await handleUpdateFromReniec();
        }
      }
    };
    
    autoConsultReniec();
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
    
    // Campos especiales para RENIEC (permiten autocompletar ubigeos)
    lugarNacimientoReniec: "",
    ubigeoReniec: "",
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
        // Fecha de Nacimiento: convertir al formato YYYY-MM-DD si viene en otro formato
        fechaNacimiento: (() => {
          const fecha = patient.fechaNacimiento || patient.FECHA_NACIMIENTO || patient.birthDate;
          if (!fecha) return "";
          try {
            // Si ya está en formato YYYY-MM-DD, devolverlo
            if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
              return fecha.split('T')[0];
            }
            // Intentar crear una fecha y formatearla
            const date = new Date(fecha);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          } catch {
            return "";
          }
          return "";
        })(),
        sexo: patient.sexo || patient.SEXO || patient.sex || "",
        estadoCivil: typeof patient.estadoCivil === 'object' ? patient.estadoCivil?.estadoCivil?.trim() : patient.ESTADO_CIVIL?.trim() || patient.estadoCivil || "",
        // Lugar de Nacimiento (Distrito de Procedencia): extraer ubigeo del objeto lugarNacimiento
        lugarNacimiento: typeof patient.lugarNacimiento === 'object' ? patient.lugarNacimiento?.ubigeo?.trim() : patient.LUGAR_NACIMIENTO?.trim() || patient.lugarNacimiento || "",
        // País: extraer código del objeto o campo directo
        paisNacimiento: patient.pais || mapPaisValue(patient.PAIS) || "PERU",
        direccion: patient.direccionReniec || patient.direccion || patient.DIRECCION || patient.DIRECCION_RENIEC || patient.address || "",
        // Distrito: extraer ubigeo del objeto distrito
        distritoProcedencia: (() => {
          const codigo = typeof patient.distrito === 'object' 
            ? patient.distrito?.ubigeo?.trim() 
            : mapDistritoValue(patient.Distrito_Dir || patient.DISTRITO_RENIEC || patient.distritoProcedencia || patient.district);
          console.log('📍 Distrito cargado:', codigo, 'desde:', patient.distrito);
          return codigo;
        })(),
        
        // Datos Adicionales
        tipoSeguro: typeof patient.seguro === 'object' ? patient.seguro?.seguro?.trim() : patient.SEGURO?.trim() || patient.tipoSeguro || "",
        // Grado de Instrucción: extraer código del objeto
        gradoInstruccion: (() => {
          const codigo = typeof patient.gradoInstruccion === 'object' 
            ? patient.gradoInstruccion?.gradoInstruccion?.trim() 
            : patient.GRADO_INSTRUCCION?.trim() || patient.gradoInstruccion || "";
          console.log('🎓 Grado Instrucción cargado:', codigo, 'desde:', patient.gradoInstruccion);
          return codigo;
        })(),
        // Ocupación: extraer código del objeto
        ocupacion: (() => {
          const codigo = typeof patient.ocupacion === 'object' 
            ? patient.ocupacion?.ocupacion?.trim() 
            : patient.OCUPACION?.trim() || patient.ocupacion || "";
          console.log('💼 Ocupación cargada:', codigo, 'desde:', patient.ocupacion);
          return codigo;
        })(),
        // Religión: usar código directo
        religion: patient.religion || mapReligionValue(patient.DESRELIGION),
        // Etnia: extraer código del objeto
        etnia: (() => {
          const codigo = typeof patient.codEtnia === 'object' 
            ? patient.codEtnia?.codEtnia?.trim() 
            : patient.COD_ETNIA?.trim() || patient.etnia || "";
          console.log('🌍 Etnia cargada:', codigo, 'desde:', patient.codEtnia);
          return codigo;
        })(),
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
        // Ocupación Cónyuge: extraer código del objeto - asegurar que se obtenga correctamente
        ocupacionFamiliar: (() => {
          if (typeof patient.conyugeOcupacion === 'object' && patient.conyugeOcupacion?.ocupacion) {
            return patient.conyugeOcupacion.ocupacion.trim();
          }
          if (patient.CONYUGE_OCUPACION) return patient.CONYUGE_OCUPACION.trim();
          if (patient.ocupacionFamiliar) return patient.ocupacionFamiliar;
          return "";
        })(),
        
        // Datos de Acompañante/Responsable
        nombreAcompanante: patient.RESPONSABLE_NOMBRE?.trim() || patient.nombreAcompanante || "",
        parentesco: patient.RESPONSABLE_PARENTESCO?.trim() || patient.parentesco || "",
        ocupacionAcompanante: patient.RESPONSABLE_OCUPACION?.trim() || patient.ocupacionAcompanante || "",
        direccionAcompanante: patient.RESPONSABLE_DIRECCION?.trim() || patient.direccionAcompanante || "",
        telefonoAcompanante1: patient.RESPONSABLE_TELEFONO?.trim() || patient.telefonoAcompanante1 || "",
        telefonoAcompanante2: "", // No existe en la API, campo legacy
        
        // Campos especiales para RENIEC (inicialmente vacíos)
        lugarNacimientoReniec: "",
        ubigeoReniec: "",
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

  const handleUpdateFromReniec = async () => {
    try {
      setIsLoadingReniec(true);
      const dni = patient.DOCUMENTO || patient.dni || patient.documento;
      
      if (!dni) {
        toast({
          title: "Error",
          description: "No se encontró el DNI del paciente",
          variant: "destructive"
        });
        return;
      }

      console.log('🔄 Consultando RENIEC con useReniec hook...');
      
      // Usar el hook useReniec que llama a la API correcta
      const result = await consultarReniec(dni);
      
      if (result.success && result.data) {
        setReniecData(result.data);
        
        // ✅ Guardar foto en hexadecimal si existe (viene como photoReniec desde el mapper)
        if (result.data.photoReniec) {
          setReniecPhotoHex(result.data.photoReniec);
          console.log('📸 Foto RENIEC guardada (hexadecimal):', result.data.photoReniec.substring(0, 50) + '...');
        }
        
        // ✅ Bloquear botón después de consultar
        setReniecButtonUsed(true);
        
        console.log('✅ Datos de RENIEC obtenidos:', result.data);
        console.log('📋 Datos mapeados completos:', result.data);
        
        // ✅ Consultar ubigeos correctos usando códigos RENIEC
        let lugarNacimientoUbigeo = formData.lugarNacimiento;
        let distritoProcedenciaUbigeo = formData.distritoProcedencia;
        
        // Consultar Lugar de Nacimiento si hay código RENIEC
        if (result.data.ubigeoReniecNacimiento) {
          console.log('🗺️ Consultando UBIGEO para lugar de nacimiento:', result.data.ubigeoReniecNacimiento);
          const ubigeoNac = await getUbigeoByReniecCode(result.data.ubigeoReniecNacimiento);
          if (ubigeoNac) {
            lugarNacimientoUbigeo = ubigeoNac;
            console.log('✅ UBIGEO Lugar de Nacimiento:', ubigeoNac);
          }
        }
        
        // Consultar Distrito de Procedencia si hay código RENIEC
        if (result.data.ubigeoReniecProcedencia) {
          console.log('🗺️ Consultando UBIGEO para distrito de procedencia:', result.data.ubigeoReniecProcedencia);
          const ubigeoProc = await getUbigeoByReniecCode(result.data.ubigeoReniecProcedencia);
          if (ubigeoProc) {
            distritoProcedenciaUbigeo = ubigeoProc;
            console.log('✅ UBIGEO Distrito de Procedencia:', ubigeoProc);
          }
        }
        
        // ✅ Actualizar formData con TODOS los datos importantes de RENIEC
        setFormData(prev => ({
          ...prev,
          // Datos Personales
          apellidoPaterno: result.data.paternalSurname || prev.apellidoPaterno,
          apellidoMaterno: result.data.maternalSurname || prev.apellidoMaterno,
          nombres: result.data.names || prev.nombres,
          fechaNacimiento: result.data.birthDate || prev.fechaNacimiento,
          sexo: result.data.sex || prev.sexo,
          estadoCivil: result.data.maritalStatus || prev.estadoCivil,
          
          // Dirección completa construida por el mapper
          direccion: result.data.address || prev.direccion,
          
          // País de nacimiento (siempre PERÚ = 146 cuando hay datos RENIEC)
          paisNacimiento: "146",
          
          // ✅ Ubigeos consultados desde tabla UBIGEO
          lugarNacimiento: lugarNacimientoUbigeo,
          distritoProcedencia: distritoProcedenciaUbigeo,
          
          // Datos Familiares
          padre: result.data.fatherName || prev.padre,
          madre: result.data.motherName || prev.madre,
          
          // Campos especiales RENIEC (para referencia)
          lugarNacimientoReniec: result.data.ubigeoReniecNacimiento || "",
          ubigeoReniec: result.data.ubigeoReniecProcedencia || "",
        }));

        toast({
          title: "✅ Datos Actualizados",
          description: "Información obtenida de RENIEC correctamente. Se han actualizado los ubigeos.",
        });
      } else {
        throw new Error(result.error || 'No se encontraron datos');
      }
    } catch (error: any) {
      console.error('Error al consultar RENIEC:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron obtener los datos de RENIEC",
        variant: "destructive"
      });
    } finally {
      setIsLoadingReniec(false);
    }
  };

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
      // ✅ Convertir fecha a formato LocalDateTime que acepta el backend
      if (formData.fechaNacimiento) {
        updateData.fechaNacimiento = convertToLocalDateTime(formData.fechaNacimiento)
        console.log('📅 Fecha convertida:', formData.fechaNacimiento, '→', updateData.fechaNacimiento)
        
        // ✅ Calcular edad en formato '000a00m00d' (campo obligatorio)
        const birthDate = new Date(formData.fechaNacimiento)
        const today = new Date()
        
        // Calcular años
        let years = today.getFullYear() - birthDate.getFullYear()
        let months = today.getMonth() - birthDate.getMonth()
        let days = today.getDate() - birthDate.getDate()
        
        // Ajustar si los días son negativos
        if (days < 0) {
          months--
          const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
          days += lastMonth.getDate()
        }
        
        // Ajustar si los meses son negativos
        if (months < 0) {
          years--
          months += 12
        }
        
        // Formatear como '000a00m00d'
        const edadFormatted = `${String(years).padStart(3, '0')}a${String(months).padStart(2, '0')}m${String(days).padStart(2, '0')}d`
        updateData.edad = edadFormatted
        console.log('🎂 Edad calculada:', updateData.edad, `(${years} años, ${months} meses, ${days} días)`)
      }
      if (formData.sexo) updateData.sexo = formData.sexo
      if (formData.estadoCivil?.trim()) updateData.estadoCivil = formData.estadoCivil.trim()
      if (formData.lugarNacimiento?.trim()) updateData.lugarNacimiento = formData.lugarNacimiento.trim()
      if (formData.paisNacimiento) updateData.pais = formData.paisNacimiento
      if (formData.direccion?.trim()) updateData.direccion = formData.direccion.trim()
      // ✅ Campos obligatorios: documento y tipoDocumento
      if (patient.DOCUMENTO || patient.dni || patient.documento) {
        const documentoValue = (patient.DOCUMENTO || patient.dni || patient.documento).trim()
        updateData.documento = documentoValue
        console.log('📄 Documento:', updateData.documento)
      }
      
      // Tipo de documento: extraer del paciente o usar 'D' por defecto para DNI
      const tipoDocValue = patient.TIPO_DOCUMENTO || patient.tipoDocumento || 'D'
      updateData.tipoDocumento = tipoDocValue.trim()
      console.log('📋 Tipo Documento:', updateData.tipoDocumento)
      
      // ✅ IMPORTANTE: Enviar CÓDIGOS con PADDING, no nombres
      if (formData.distritoProcedencia?.trim()) {
        // distrito debe tener exactamente 7 caracteres con padding de espacios
        updateData.distrito = formData.distritoProcedencia.trim().padEnd(7, ' ')
        console.log('📍 Distrito (ubigeo con padding):', `"${updateData.distrito}"`, `Length: ${updateData.distrito.length}`)
      }
      if (formData.tipoSeguro?.trim()) updateData.seguro = formData.tipoSeguro.trim()
      if (formData.gradoInstruccion?.trim()) {
        // gradoInstruccion debe ser el código (ej: "05")
        updateData.gradoInstruccion = formData.gradoInstruccion.trim()
        console.log('🎓 Grado Instrucción (código):', updateData.gradoInstruccion)
      }
      if (formData.ocupacion?.trim()) {
        // ocupacion debe ser el código (ej: "0")
        updateData.ocupacion = formData.ocupacion.trim()
        console.log('💼 Ocupación (código):', updateData.ocupacion)
      }
      if (formData.religion?.trim()) updateData.religion = formData.religion.trim()
      if (formData.etnia?.trim()) {
        // codEtnia debe ser el código (ej: "58")
        updateData.codEtnia = formData.etnia.trim()
        console.log('🌍 Etnia (código):', updateData.codEtnia)
      }
      if (formData.centroPoblado?.trim()) {
        // localidad debe tener exactamente 12 caracteres con padding de espacios
        updateData.localidad = formData.centroPoblado.trim().padEnd(12, ' ')
        console.log('🏘️ Localidad (con padding):', `"${updateData.localidad}"`, `Length: ${updateData.localidad.length}`)
      }
      if (formData.telefono1?.trim()) updateData.telefono1 = formData.telefono1.trim()
      if (formData.telefono2?.trim()) updateData.telefono2 = formData.telefono2.trim()
      if (formData.hijos) updateData.hijos = parseInt(formData.hijos) || 0
      if (formData.observacion?.trim()) updateData.email = formData.observacion.trim()
      if (formData.correoElectronico?.trim()) updateData.correo = formData.correoElectronico.trim()
      if (formData.padre?.trim()) updateData.padre = formData.padre.trim()
      if (formData.madre?.trim()) updateData.madre = formData.madre.trim()
      if (formData.conyuge?.trim()) updateData.conyugeNombre = formData.conyuge.trim()
      if (formData.ocupacionFamiliar?.trim()) updateData.conyugeOcupacion = formData.ocupacionFamiliar.trim()
      
      // ✅ Enviar foto RENIEC en hexadecimal si existe
      if (reniecPhotoHex) {
        updateData.stringFoto = reniecPhotoHex
        console.log('📸 Enviando foto RENIEC (hexadecimal):', reniecPhotoHex.substring(0, 50) + '...')
      }

      console.log('Actualizando paciente:', pacienteId)
      console.log('Datos a enviar (solo campos editados):', updateData)
      
      // Obtener usuario del JWT
      const usuario = extractDocumentFromToken();
      
      const response = await fetch(`http://192.168.0.252:9011/api/historia-clinica/pacientes/${pacienteId}?usuario=${encodeURIComponent(usuario || '')}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al actualizar el paciente: ${errorText}`);
      }

      const result = await response.json()
      console.log('Paciente actualizado:', result)
      
      // Mostrar dialog de éxito
      setShowSuccessDialog(true)
    } catch (error) {
      console.error('Error al actualizar paciente:', error)
      alert('Error al actualizar el paciente. Por favor, intente nuevamente.')
    }
  }

  // Si patient es null o undefined, mostrar mensaje
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Step1BasicData
              formData={formData}
              onInputChange={handleInputChange}
              documentType={patient.TIPO_DOCUMENTO || patient.tipoDocumento || "DNI"}
              documentNumber={patient.DOCUMENTO || patient.dni || ''}
              patientData={patient}
              reniecData={reniecData || {
                dni: patient.DOCUMENTO || patient.dni || '',
                apellidoPaterno: patient.PATERNO?.trim() || patient.apellidoPaterno || '',
                apellidoMaterno: patient.MATERNO?.trim() || patient.apellidoMaterno || '',
                nombres: patient.NOMBRE?.trim() || patient.nombres || patient.name || '',
              }}
            />
            {/* ✅ Botón RENIEC solo visible para pacientes con tipo de documento 'D' (DNI) */}
            {(patient.TIPO_DOCUMENTO?.trim() === 'D' || patient.tipoDocumento?.trim() === 'D') && (
              <div className="flex justify-center mt-4">
                <Button 
                  onClick={handleUpdateFromReniec}
                  disabled={isLoadingReniec || reniecButtonUsed}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingReniec ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Consultando RENIEC...
                    </>
                  ) : reniecButtonUsed ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Datos Actualizados desde RENIEC
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Actualizar con Datos de RENIEC
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
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

      {/* Dialog de éxito */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Actualización Exitosa
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-gray-700">
              Los datos del paciente se han actualizado correctamente.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button 
              onClick={() => {
                setShowSuccessDialog(false);
                onSuccess();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DialogContent>
  )
}
