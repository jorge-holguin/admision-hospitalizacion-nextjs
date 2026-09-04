"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle, Dialog } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, ChevronRight, RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react"
import { StepIndicator } from "../register/StepIndicator"
import { Step1BasicData } from "../register/Step1BasicData"
import { Step2AdditionalData } from "../register/Step2AdditionalData"
import { Step3FamilyData } from "../register/Step3FamilyData"
import { extractDocumentFromToken } from '@/utils/jwtUtils'
import { normalizeTipoDocumento } from '@/utils/documentTypeUtils'
import { toast } from "@/hooks/use-toast"
import { useReniec } from "@/hooks/useReniec"
import { convertToLocalDateTime } from "@/utils/dateFormatUtils"
import { getUbigeoByReniecCode } from "@/utils/reniecMapper"
import { consultarSIS, mapSISSeguroToLocal } from "@/services/sisService"
import { EditHistoryNumberModal } from "./EditHistoryNumberModal"

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
  
  // ✅ Estados para tipo y número de documento editables
  const [selectedDocType, setSelectedDocType] = useState<string>('')
  const [selectedDocNumber, setSelectedDocNumber] = useState<string>('')
  
  // Estados para editar número de historia clínica
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false)
  const [currentHistoryNumber, setCurrentHistoryNumber] = useState<string>('')
  const [historyUpdateKey, setHistoryUpdateKey] = useState(0) // Para forzar re-render
  
  // ✅ Estados para alertas visuales de APIs
  const [apiAlerts, setApiAlerts] = useState<Array<{
    type: 'success' | 'warning' | 'info'
    title: string
    message: string
  }>>([])
  
  // Resetear al paso 1 cuando se abre el modal
  useEffect(() => {
    if (patient) {
      setCurrentStep(1)
      setReniecButtonUsed(false) // Resetear estado del botón
      setReniecPhotoHex(null) // Limpiar foto anterior
      
      // ✅ Inicializar tipo y número de documento desde el paciente
      const tipoDoc = (() => {
        if (typeof patient.TIPO_DOCUMENTO === 'string') return patient.TIPO_DOCUMENTO.trim()
        if (typeof patient.tipoDocumento === 'string') return patient.tipoDocumento.trim()
        if (typeof patient.tipoDocumento === 'object' && patient.tipoDocumento?.tipoDocumento) {
          return patient.tipoDocumento.tipoDocumento.trim()
        }
        return 'D' // Default DNI
      })()
      setSelectedDocType(tipoDoc)
      setSelectedDocNumber(patient.DOCUMENTO || patient.documento || patient.dni || '')
      
      // Inicializar número de historia clínica
      const historia = patient.HISTORIA || patient.hc || patient.historia || ''
      setCurrentHistoryNumber(historia)
    }
  }, [patient])
  
  // ✅ Handler para cambio de tipo de documento
  // NOTA: El número de documento NO se puede cambiar, solo el tipo
  const handleDocumentTypeChange = (newType: string) => {
    setSelectedDocType(newType)
    
    const tipoNombre = newType === "D" ? "DNI" : 
                       newType === "CE" ? "Carnet de Extranjería" : 
                       newType === "PP" ? "Pasaporte" : 
                       newType === "0" ? "Ninguno" : newType
    toast({
      title: `📋 Tipo de documento cambiado`,
      description: `Nuevo tipo: ${tipoNombre}`,
      duration: 3000
    })
  }
  
  // Handler para abrir modal de edición de historia
  const handleOpenEditHistory = () => {
    setShowEditHistoryModal(true)
  }

  // Handler para éxito al actualizar historia
  const handleHistoryUpdateSuccess = (newHistory: string) => {
    setCurrentHistoryNumber(newHistory)
    
    // Actualizar el objeto patient para que se refleje inmediatamente en el frontend
    if (patient) {
      patient.HISTORIA = newHistory
      patient.historia = newHistory
      patient.hc = newHistory
    }
    
    // Forzar re-render del componente
    setHistoryUpdateKey(prev => prev + 1)
    
    toast({
      title: "✅ Historia clínica actualizada",
      description: `Nuevo número: ${newHistory}`,
      duration: 5000
    })
  }
  
  // ✅ Consultar RENIEC automáticamente SOLO si no hay foto y es DNI
  useEffect(() => {
    const autoConsultReniec = async () => {
      // Solo consultar automáticamente si no tiene foto
      const fotoBase64 = patient.STRING_FOTO || patient.stringFoto;
      const noTieneFoto = !fotoBase64 || fotoBase64 === null || fotoBase64 === '';
      // Soportar tanto string como objeto { tipoDocumento }
      const tipoDocStr = (typeof patient.TIPO_DOCUMENTO === 'string' ? patient.TIPO_DOCUMENTO : '')
        || (typeof patient.tipoDocumento === 'string' ? patient.tipoDocumento : '')
        || (typeof patient.tipoDocumento === 'object' ? (patient.tipoDocumento?.tipoDocumento || '').trim() : '');
      const esDNI = tipoDocStr.trim() === 'D' || tipoDocStr.toUpperCase() === 'DNI';
      const dni = patient.DOCUMENTO || patient.dni || patient.documento;
      
      if (patient && noTieneFoto && esDNI && dni && !reniecButtonUsed) {
        await handleUpdateFromReniec();
      } else {
      }
    };
    
    autoConsultReniec();
  }, [patient])

  // ✅ Auto-validar SIS al abrir el modal (independiente de RENIEC).
  //    Antes, la validación SIS solo ocurría dentro del flujo de RENIEC,
  //    por lo que cuando el paciente ya tenía foto, el tipo de seguro nunca
  //    se sincronizaba con la API /api/sis/validar.
  //    Ahora siempre se consulta al abrir el modal si hay DNI disponible.
  useEffect(() => {
    if (!patient) return
    const dni = patient.DOCUMENTO || patient.dni || patient.documento
    if (!dni) return
    // Tipo de documento: solo DNI o Carné de Extranjería (9 dígitos) son soportados por SIS
    const tipoDocStr = (typeof patient.TIPO_DOCUMENTO === 'string' ? patient.TIPO_DOCUMENTO : '')
      || (typeof patient.tipoDocumento === 'string' ? patient.tipoDocumento : '')
      || (typeof patient.tipoDocumento === 'object' ? (patient.tipoDocumento?.tipoDocumento || '').trim() : '')
    const esDNI = tipoDocStr.trim() === 'D' || tipoDocStr.toUpperCase() === 'DNI'
    const esCE = tipoDocStr.trim() === 'CE' || String(dni).trim().length === 9
    if (!esDNI && !esCE) return
    validateSISAndUpdateSeguro(String(dni).trim(), false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    direccionReniec: "",
    distritoReniec: "",
    ubigeoNacReniec: "",
    stringFoto: "",
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
        // ✅ PRIORIDAD: DIRECCION primero, luego DIRECCION_RENIEC
        direccion: patient.direccion || patient.DIRECCION || patient.direccionReniec || patient.DIRECCION_RENIEC || patient.address || "",
        // Distrito: extraer ubigeo del objeto distrito
        distritoProcedencia: (() => {
          const codigo = typeof patient.distrito === 'object' 
            ? patient.distrito?.ubigeo?.trim() 
            : mapDistritoValue(patient.Distrito_Dir || patient.DISTRITO_RENIEC || patient.distritoProcedencia || patient.district);
          return codigo;
        })(),

        stringFoto: patient.STRING_FOTO || patient.stringFoto || "",
        
        // Datos Adicionales
        tipoSeguro: typeof patient.seguro === 'object' ? patient.seguro?.seguro?.trim() : patient.SEGURO?.trim() || patient.tipoSeguro || "",
        // Grado de Instrucción: extraer código del objeto
        gradoInstruccion: (() => {
          const codigo = typeof patient.gradoInstruccion === 'object' 
            ? patient.gradoInstruccion?.gradoInstruccion?.trim() 
            : patient.GRADO_INSTRUCCION?.trim() || patient.gradoInstruccion || "";
          return codigo;
        })(),
        // Ocupación: extraer código del objeto
        ocupacion: (() => {
          const codigo = typeof patient.ocupacion === 'object' 
            ? patient.ocupacion?.ocupacion?.trim() 
            : patient.OCUPACION?.trim() || patient.ocupacion || "";
          return codigo;
        })(),
        // Religión: usar código directo
        religion: patient.religion || mapReligionValue(patient.DESRELIGION),
        // Etnia: extraer código del objeto, por defecto "58" (Mestizo)
        etnia: (() => {
          const codigo = typeof patient.codEtnia === 'object' 
            ? patient.codEtnia?.codEtnia?.trim() 
            : patient.COD_ETNIA?.trim() || patient.etnia || "58"; // ✅ Default: 58 = Mestizo
          return codigo;
        })(),
        // Localidad: usar código directo
        centroPoblado: patient.localidad?.trim() || patient.LOCALIDAD?.trim() || patient.Nombre_Localidad || patient.centroPoblado || "",
        telefono1: patient.TELEFONO1?.trim() || patient.telefono1 || "",
        telefono2: patient.TELEFONO2?.trim() || patient.telefono2 || "",
        hijos: String(patient.hijos || patient.HIJOS?.s || patient.HIJOS?.d?.[0] || ""),
        // Observación: campo email
        observacion: patient.email?.trim() || patient.EMAIL?.trim() || patient.observacion || " ",
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
          return " ";
        })(),
        
        // Datos de Acompañante/Responsable
        nombreAcompanante: patient.RESPONSABLE_NOMBRE?.trim() || patient.nombreAcompanante || "",
        parentesco: patient.RESPONSABLE_PARENTESCO?.trim() || patient.parentesco || "",
        ocupacionAcompanante: patient.RESPONSABLE_OCUPACION?.trim() || patient.ocupacionAcompanante || "",
        direccionAcompanante: patient.RESPONSABLE_DIRECCION?.trim() || patient.direccionAcompanante || "",
        telefonoAcompanante1: patient.RESPONSABLE_TELEFONO?.trim() || patient.telefonoAcompanante1 || "",
        telefonoAcompanante2: " ", // No existe en la API, campo legacy
        
        // Campos especiales para RENIEC (inicialmente vacíos)
        lugarNacimientoReniec: "",
        ubigeoReniec: "",
        direccionReniec: patient.direccionReniec || "",
        distritoReniec: patient.distritoReniec || "",
        ubigeoNacReniec: patient.ubigeoNacReniec || patient.UBIGEO_NAC_RENIEC || "",
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

  // ✅ Función para validar SIS y actualizar seguro automáticamente usando el servicio
  const validateSISAndUpdateSeguro = async (dni: string, showToast: boolean = false) => {
    try {
      // Usar el servicio consultarSIS existente
      const result = await consultarSIS(dni);

      if (result.success && result.data) {
        // Mapear tipoSeguro (CODSIS) a SEGURO usando el servicio
        const nombreCompleto = formData.nombres || patient.NOMBRES || patient.nombres || '';
        const seguroId = mapSISSeguroToLocal(result.data.tipoSeguro, nombreCompleto);
        setFormData(prev => ({
          ...prev,
          tipoSeguro: seguroId
        }));
        
        // ✅ Mensaje informativo para el usuario cuando la verificación SIS es exitosa
        if (showToast) {
          toast({
            title: "✅ Verificación SIS Exitosa",
            description: `Seguro detectado: ${result.data.descTipoSeguro}. Estado: ${result.data.estado}`,
            variant: "default"
          });
        }
      } else {
        setFormData(prev => ({
          ...prev,
          tipoSeguro: '0' // PAGANTE
        }));
        
        if (showToast) {
          toast({
            title: "ℹ️ Información",
            description: "No se encontró seguro SIS para este paciente. Se asignó como PAGANTE.",
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('❌ Error validando SIS:', error);
      if (showToast) {
        toast({
          title: "⚠️ Advertencia",
          description: "No se pudo verificar el seguro SIS en este momento.",
          variant: "default"
        });
      }
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
      // Usar el hook useReniec que llama a la API correcta
      const result = await consultarReniec(dni);
      
      if (result.success && result.data) {
        if ((result as any).degraded) {
          // ⚠️ Caso degradado: 200 pero sin datos útiles → no sobreescribir formulario
          setReniecButtonUsed(true);
          setApiAlerts(prev => ([
            ...prev,
            {
              type: 'warning',
              title: '⚠️ RENIEC sin datos',
              message: 'El servicio de RENIEC respondió sin datos útiles. Continúe completando la información manualmente.'
            }
          ]));
          // 🚫 No continuar con el procesamiento que usa result.data
          return;
        } else {
          // ✅ Caso normal: setear datos de RENIEC
          setReniecData(result.data);
          setReniecButtonUsed(true);
          setApiAlerts(prev => ([
            ...prev,
            {
              type: 'success',
              title: '✅ Datos obtenidos de RENIEC',
              message: 'Se cargaron datos personales, dirección y ubigeos desde el servicio RENIEC.'
            }
          ]));
        }
      } else {
        setApiAlerts(prev => ([
          ...prev,
          {
            type: 'warning',
            title: '⚠️ No se pudo actualizar desde RENIEC',
            message: 'Intente nuevamente más tarde o complete los datos manualmente.'
          }
        ]));
      }

      // ✅ Continuar SOLO cuando éxito y no degradado
      if (result.success && result.data && !(result as any).degraded) {
        // ✅ Consultar ubigeos correctos usando códigos RENIEC
        let lugarNacimientoUbigeo = formData.lugarNacimiento;
        let distritoProcedenciaUbigeo = formData.distritoProcedencia;
        
        // ✅ Consultar Lugar de Nacimiento si hay código RENIEC
        let ubigeoWarnings: string[] = [];
        
        if (result.data.ubigeoReniecNacimiento) {
          const ubigeoNac = await getUbigeoByReniecCode(result.data.ubigeoReniecNacimiento);
          if (ubigeoNac) {
            lugarNacimientoUbigeo = ubigeoNac;
          } else {
            ubigeoWarnings.push(`Lugar de Nacimiento (código RENIEC: ${result.data.ubigeoReniecNacimiento})`);
          }
        }
        
        // ✅ Consultar Distrito de Procedencia si hay código RENIEC
        if (result.data.ubigeoReniecProcedencia) {
          const ubigeoProc = await getUbigeoByReniecCode(result.data.ubigeoReniecProcedencia);
          if (ubigeoProc) {
            distritoProcedenciaUbigeo = ubigeoProc;
          } else {
            ubigeoWarnings.push(`Distrito de Procedencia (código RENIEC: ${result.data.ubigeoReniecProcedencia})`);
          }
        }
        
        // ✅ Mostrar advertencia informativa si hay UBIGEOs no encontrados
        if (ubigeoWarnings.length > 0) {
          toast({
            title: "⚠️ Información",
            description: `No se encontró UBIGEO para: ${ubigeoWarnings.join(', ')}. Puede continuar y completar manualmente estos campos.`,
            variant: "default"
          });
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
          
          // ✅ RENIEC SYNC: Reemplazar direccion con direccionReniec cuando se actualiza desde RENIEC
          direccion: result.data.address || result.data.direccionReniec || prev.direccion,
          
          // País de nacimiento (siempre PERÚ = 146 cuando hay datos RENIEC)
          paisNacimiento: "146",
          
          // ✅ Ubigeos consultados desde tabla UBIGEO
          lugarNacimiento: lugarNacimientoUbigeo,
          distritoProcedencia: distritoProcedenciaUbigeo,
          
          // ✅ Grado de instrucción mapeado desde RENIEC
          gradoInstruccion: result.data.educationLevel || prev.gradoInstruccion,
          
          // Datos Familiares
          padre: result.data.fatherName || prev.padre,
          madre: result.data.motherName || prev.madre,
          
          // Campos especiales RENIEC (para referencia)
          lugarNacimientoReniec: result.data.ubigeoReniecNacimiento || "",
          ubigeoReniec: result.data.ubigeoReniecProcedencia || "",
          direccionReniec: result.data.direccionReniec || result.data.address || "",
          // ✅ distritoReniec debe ser el código RENIEC (070101), NO el ubigeo de BD
          distritoReniec: result.data.ubigeoReniecProcedencia || "",
          // ✅ ubigeoNacReniec: código de 6 dígitos del lugar de nacimiento
          ubigeoNacReniec: result.data.ubigeoReniecNacimiento || "",
          // ✅ stringFoto: imagen en base64 desde RENIEC
          stringFoto: result.data.photoReniec || prev.stringFoto,
        }));

        // ✅ Validar SIS automáticamente después de actualizar RENIEC (sin toast aquí)
        await validateSISAndUpdateSeguro(dni, false);
        
        // ✅ Agregar alertas visuales dentro del modal
        const alerts: Array<{ type: 'success' | 'warning' | 'info', title: string, message: string }> = []
        
        alerts.push({
          type: 'success',
          title: '✅ Actualización desde RENIEC Exitosa',
          message: 'Se actualizaron los datos personales, dirección y ubigeos desde el servicio RENIEC.'
        })
        
        // Verificar si se validó SIS
        if (formData.tipoSeguro && formData.tipoSeguro !== '0') {
          alerts.push({
            type: 'success',
            title: '✅ Verificación SIS Exitosa',
            message: 'El seguro SIS fue verificado y actualizado automáticamente.'
          })
        } else {
          alerts.push({
            type: 'info',
            title: 'ℹ️ Sin seguro SIS',
            message: 'No se encontró seguro SIS activo para este paciente.'
          })
        }
        
        setApiAlerts(alerts)
        
        // ✅ Mensaje informativo para el usuario sobre la actualización desde RENIEC
        toast({
          title: "✅ Actualización desde RENIEC Exitosa",
          description: "Se actualizaron los datos personales, dirección y ubigeos desde RENIEC. El seguro SIS fue verificado automáticamente.",
        });
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

  const validateRequiredFields = (): { isValid: boolean; missingFields: string[] } => {
    const missingFields: string[] = []
    
    // Step 1: Datos Básicos
    // Tipo de documento: usar estado editable
    if (!selectedDocType || selectedDocType.trim() === '') missingFields.push('Tipo de Documento')
    // Número de documento: usar el original del paciente (no es editable)
    const docNumber = patient.DOCUMENTO || patient.dni || patient.documento || ''
    if (!docNumber || (typeof docNumber === 'string' && docNumber.trim() === '')) missingFields.push('N° Documento')
    if (!formData.apellidoPaterno || formData.apellidoPaterno.trim() === '') missingFields.push('Apellido Paterno')
    if (!formData.apellidoMaterno || formData.apellidoMaterno.trim() === '') missingFields.push('Apellido Materno')
    if (!formData.nombres || formData.nombres.trim() === '') missingFields.push('Nombres')
    if (!formData.fechaNacimiento || formData.fechaNacimiento.trim() === '') missingFields.push('Fecha de Nacimiento')
    if (!formData.sexo || formData.sexo.trim() === '') missingFields.push('Sexo')
    if (!formData.estadoCivil || formData.estadoCivil.trim() === '') missingFields.push('Estado Civil')
    if (!formData.paisNacimiento || formData.paisNacimiento.trim() === '') missingFields.push('País de Nacimiento')
    if (!formData.lugarNacimiento || formData.lugarNacimiento.trim() === '') missingFields.push('Lugar de Nacimiento')
    if (!formData.direccion || formData.direccion.trim() === '') missingFields.push('Dirección')
    if (!formData.distritoProcedencia || formData.distritoProcedencia.trim() === '') missingFields.push('Distrito de Procedencia')
    
    // Step 2: Datos Adicionales
    if (!formData.tipoSeguro || formData.tipoSeguro.trim() === '') missingFields.push('Tipo de Seguro')
    if (!formData.gradoInstruccion || formData.gradoInstruccion.trim() === '') missingFields.push('Grado de Instrucción')
    if (!formData.ocupacion || formData.ocupacion.trim() === '') missingFields.push('Ocupación')
    if (!formData.religion || formData.religion.trim() === '') missingFields.push('Religión')
    if (!formData.etnia || formData.etnia.trim() === '') missingFields.push('Etnia')
    if (!formData.centroPoblado || formData.centroPoblado.trim() === '') missingFields.push('Centro Poblado')
    if (!formData.telefono1 || formData.telefono1.trim() === '') missingFields.push('Teléfono 1')
    
    // Step 3: Datos Familiares
    if (!formData.ocupacionFamiliar || formData.ocupacionFamiliar.trim() === '') missingFields.push('Ocupación del Cónyuge')
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  const handleSubmit = async () => {
    // Validar campos obligatorios
    const validation = validateRequiredFields()
    
    if (!validation.isValid) {
      toast({
        title: "⚠️ Campos Obligatorios Faltantes",
        description: (
          <div className="mt-2">
            <p className="font-semibold mb-2">Por favor complete los siguientes campos:</p>
            <ul className="list-disc list-inside space-y-1">
              {validation.missingFields.map((field, index) => (
                <li key={index} className="text-sm">{field}</li>
              ))}
            </ul>
          </div>
        ),
        variant: "destructive",
        duration: 8000
      })
      return
    }
    
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
      }
      if (formData.sexo) updateData.sexo = formData.sexo
      if (formData.estadoCivil?.trim()) updateData.estadoCivil = formData.estadoCivil.trim()
      if (formData.lugarNacimiento?.trim()) updateData.lugarNacimiento = formData.lugarNacimiento.trim()
      if (formData.paisNacimiento) updateData.pais = formData.paisNacimiento
      if (formData.direccion?.trim()) updateData.direccion = formData.direccion.trim()
      // ✅ Campos obligatorios: documento y tipoDocumento
      // Usar el número de documento desde el estado editable
      const documentoValue = (selectedDocNumber || '').trim()
      if (documentoValue) {
        updateData.documento = documentoValue
      }
      
      // ✅ Tipo de documento: usar el estado editable selectedDocType
      // Normalizar nombres largos a códigos cortos para el backend antiguo
      updateData.tipoDocumento = normalizeTipoDocumento(selectedDocType)
      
      // ✅ IMPORTANTE: Enviar CÓDIGOS con PADDING, no nombres
      if (formData.distritoProcedencia?.trim()) {
        // distrito debe tener exactamente 7 caracteres con padding de espacios
        updateData.distrito = formData.distritoProcedencia.trim().padEnd(7, ' ')
      }
      if (formData.tipoSeguro?.trim()) {
        // Extraer solo el código del seguro (antes del guión si existe)
        // Ejemplo: "0   - PAGANTE" -> "0"
        const seguroValue = formData.tipoSeguro.trim().split('-')[0].trim()
        updateData.seguro = seguroValue
      }
      if (formData.gradoInstruccion?.trim()) {
        // gradoInstruccion debe ser el código (ej: "05")
        updateData.gradoInstruccion = formData.gradoInstruccion.trim()
      }
      if (formData.ocupacion?.trim()) {
        // ocupacion debe ser el código (ej: "0")
        updateData.ocupacion = formData.ocupacion.trim()
      }
      if (formData.religion?.trim()) updateData.religion = formData.religion.trim()
      if (formData.etnia?.trim()) {
        // codEtnia debe ser el código (ej: "58")
        updateData.codEtnia = formData.etnia.trim()
      }
      if (formData.centroPoblado?.trim()) {
        // localidad debe tener exactamente 12 caracteres con padding de espacios
        updateData.localidad = formData.centroPoblado.trim().padEnd(12, ' ')
      }
      if (formData.telefono1?.trim()) updateData.telefono1 = formData.telefono1.trim()
      if (formData.telefono2?.trim()) updateData.telefono2 = formData.telefono2.trim()
      if (formData.hijos) updateData.hijos = parseInt(formData.hijos) || 0
      if (formData.observacion?.trim()) updateData.email = formData.observacion.trim()
      if (formData.correoElectronico?.trim()) updateData.correo = formData.correoElectronico.trim()
      if (formData.padre?.trim()) updateData.padre = formData.padre.trim()
      if (formData.madre?.trim()) updateData.madre = formData.madre.trim()
      // ✅ conyugeNombre: siempre enviar un valor (trim si existe, sino '-' por defecto)
      updateData.conyugeNombre = formData.conyuge?.trim() || '-'
      if (formData.ocupacionFamiliar?.trim()) updateData.conyugeOcupacion = formData.ocupacionFamiliar.trim()
      
      // ✅ Siempre enviar foto si existe (nueva de RENIEC, del formData o existente del paciente)
      if (reniecPhotoHex) {
        // Si hay foto nueva de RENIEC, enviarla
        updateData.stringFoto = reniecPhotoHex
      } else if (formData.stringFoto && formData.stringFoto.trim() !== '') {
        // Si hay foto en formData (cargada desde RENIEC anteriormente), enviarla
        updateData.stringFoto = formData.stringFoto
      } else {
        // Si no hay foto nueva, pero el paciente tiene foto existente, preservarla
        const fotoExistente = patient.STRING_FOTO || patient.stringFoto;
        if (fotoExistente && fotoExistente.trim() !== '') {
          updateData.stringFoto = fotoExistente
        }
      }
      
      // ✅ Campos RENIEC
      if (formData.direccionReniec?.trim()) {
        updateData.direccionReniec = formData.direccionReniec.trim()
      }
      if (formData.distritoReniec?.trim()) {
        updateData.distritoReniec = formData.distritoReniec.trim()
      }
      // ✅ Ubigeo de nacimiento RENIEC (código de 6 dígitos: depProvDist)
      if (formData.ubigeoNacReniec?.trim()) {
        updateData.ubigeoNacReniec = formData.ubigeoNacReniec.trim()
      } else if (reniecData?.ubigeoReniecNacimiento) {
        // Si no está en formData pero está en reniecData, usarlo
        updateData.ubigeoNacReniec = reniecData.ubigeoReniecNacimiento
      }
      // Si se consultó RENIEC (reniecData existe), marcar como validado
      if (reniecData) {
        updateData.validadoReniec = true
      }
      
      // Obtener usuario del JWT
      const usuario = extractDocumentFromToken();
      
      const response = await fetch(`${import.meta.env.VITE_API_CITAS_MASTER_URL}/historia-clinica/pacientes/${pacienteId}?usuario=${encodeURIComponent(usuario || '')}`, {
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
              key={`step1-${historyUpdateKey}`}
              formData={formData}
              onInputChange={handleInputChange}
              documentType={selectedDocType}
              documentNumber={selectedDocNumber}
              patientData={patient}
              onDocumentTypeChange={handleDocumentTypeChange}
              onDocumentNumberChange={setSelectedDocNumber}
              reniecData={reniecData || undefined}
              isEditMode={true}
              onEditHistoryNumber={handleOpenEditHistory}
            />
            {/* ✅ Botón RENIEC solo visible para pacientes con tipo de documento 'D' (DNI) */}
            {selectedDocType === 'D' && (
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
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-blue-800">
          Editar Información del Paciente - H.C. {patient.HISTORIA?.trim() || patient.historia?.trim() || 'N/A'}
        </DialogTitle>
      </DialogHeader>

      {/* ✅ Alertas visuales de APIs llamadas */}
      {apiAlerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {apiAlerts.map((alert, index) => (
            <Alert 
              key={`alert-${index}`}
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
            <Button onClick={handleNext} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : currentStep === 2 ? (
            <>
              <Button onClick={handleNext} variant="outline" className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200">
                Siguiente (Opcional)
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={handleSubmit} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-6 py-2.5">
                <CheckCircle className="w-4 h-4 mr-2" />
                Actualizar Historia Clínica
              </Button>
            </>
          ) : (
            <Button onClick={handleSubmit} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-6 py-2.5">
              <CheckCircle className="w-4 h-4 mr-2" />
              Actualizar Historia Clínica
            </Button>
          )}
        </div>
      </div>
    </DialogContent>

      {/* Dialog de éxito */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-green-600">
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

      {/* Modal para editar número de historia clínica */}
      <EditHistoryNumberModal
        isOpen={showEditHistoryModal}
        onClose={() => setShowEditHistoryModal(false)}
        onSuccess={handleHistoryUpdateSuccess}
        currentHistory={currentHistoryNumber}
        patientId={patient.PACIENTE || patient.paciente || patient.id || ''}
        patientDocument={patient.DOCUMENTO || patient.documento || patient.dni || ''}
      />
    </Dialog>
  )
}
