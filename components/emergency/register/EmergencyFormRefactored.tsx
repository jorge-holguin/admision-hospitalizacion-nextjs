"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from "@/lib/router"

import { Card, CardContent } from '@/components/ui/card'
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import AlertPortal from "@/components/ui/alert-portal"
import { useEmergencyAccount } from '@/contexts/EmergencyAccountContext'
import { useSeguros } from '@/contexts/SegurosContext'
import { useMedicos } from '@/contexts/MedicosContext'
import { useConsultorios } from '@/contexts/ConsultoriosContext'

// Componentes modulares para emergencia
import { EmergencySection } from './EmergencySection'
import { AdditionalFieldsSection } from './AdditionalFieldsSection'
import { FormActionsEmergency } from './FormActionsEmergency'
import { FormHeaderEmergency } from './FormHeaderEmergency'
import { EmergencyDetails } from './EmergencyDetails'
import { validateEmergencyForm } from './FormValidatorEmergency'
import { useSelectsState } from './FormUtilsEmergency'
import FuaEmergencyStatusAlert from "./FuaEmergencyStatusAlert"
import { AccountConfirmationDialog } from '../modals/AccountConfirmationDialog'
import { MultiAccountSelectorDialog, type ActiveAccount } from '@/components/shared/MultiAccountSelectorDialog'

import { extractDocumentFromToken } from '@/utils/jwtUtils'
import { getCivilStatusCode } from '@/utils/civilStatusUtils'
import { usePatientData, useFetchPatientData } from "@/contexts/PatientDataContext";
import { useTiposDocumento } from "@/contexts/TiposDocumentoContext";
import { useServerDateTime } from "@/contexts/ServerDateTimeContext";
import { datetimeService } from '@/services/datetimeService'
import { nextIdService } from '@/services/emergencia/nextIdService'
import { API_ENDPOINTS, API_SPRING_URL } from '@/lib/api-config'

// Extender la interfaz de datos del paciente para incluir los campos adicionales
interface PatientDataExtended {
  estadoCivil?: string;
  NOMBRE_ESTADO_CIVIL?: string;
  direccion?: string;
  distrito?: string;
  telefono1?: string;
  telefono2?: string;
  tipoDocumento?: string;
  documento?: string;
  localidad?: string;
  seguro?: string;
  descSeguro?: string;
  religion?: string;
  nombre?: string;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  COD_DISTRITO?: string;
  LUGAR_NACIMIENTO?: string;
  [key: string]: any; // Para permitir acceso a propiedades adicionales
}

import { useAuth } from '@/components/AuthProvider';

// Tipos para los datos de emergencia
interface MotivoEmergencia {
  CODIGO: string;
  NOMBRE: string;
}

interface Consultorio {
  CODIGO: string;
  NOMBRE: string;
}

interface Medico {
  CODIGO: string;
  NOMBRES: string;
  APELLIDOS: string;
}

interface Seguro {
  Seguro: string;
  Nombre: string;
}

interface Diagnostico {
  CODIGO: string;
  NOMBRE: string;
}

interface EmergencyFormProps {
  patientId: string;
  emergencyId?: string | null;
  emergencyData?: any;
  patient?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onBack?: () => void; // Callback para volver al modal anterior
  isModal?: boolean;
  alertsContainerId?: string; // ID del contenedor para mostrar alertas
  readOnly?: boolean; // Modo solo lectura
}

export function EmergencyFormRefactored({ 
  patientId, 
  emergencyId, 
  emergencyData, 
  patient, 
  onSuccess, 
  onError, 
  onBack,
  isModal = false,
  alertsContainerId,
  readOnly = false
}: EmergencyFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Estado para loading y error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [patientData, setPatientData] = useState<PatientDataExtended | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isEditable, setIsEditable] = useState(true);
  const [fieldsLocked, setFieldsLocked] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  
  // Variables para FuaEmergencyStatusAlert
  const [insuranceCode, setInsuranceCode] = useState<string>('');
  const [numeroCuenta, setNumeroCuenta] = useState<string>('');
  const [loadingCuenta, setLoadingCuenta] = useState<boolean>(false);
  const [cuentaId, setCuentaId] = useState<string | null>(null);
  
  // Estados para el diálogo de confirmación de cuenta
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [existingAccountInfo, setExistingAccountInfo] = useState<any>(null);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [accountDialogLoading, setAccountDialogLoading] = useState(false);
  const [showMultiAccountDialog, setShowMultiAccountDialog] = useState(false);
  const [multiActiveAccounts, setMultiActiveAccounts] = useState<ActiveAccount[]>([]);
  
  // Usar contexto para fecha y hora del servidor
  const { serverDateTime, refreshDateTime } = useServerDateTime();

  // Contextos para datos compartidos
  const { seguros } = useSeguros()
  const { medicos } = useMedicos()
  const { consultorios } = useConsultorios()
  const { tiposDocumento } = useTiposDocumento()

  // Memoized callback for FUA validation
  const handleFuaValidationChange = useCallback((isValid: boolean) => {
    setMainFormFuaValidationPassed(isValid);
  }, []);
  const [mainFormFuaValidationPassed, setMainFormFuaValidationPassed] = useState<boolean>(false);
  
  // Códigos de seguro SIS que requieren validación FUA
  const sisInsuranceCodes = ['20', '21', '22', '23', '24', '25'];
  const requiresFuaValidation = Boolean(insuranceCode && sisInsuranceCodes.includes(insuranceCode.trim()));
  
  
  // Estado para motivos de emergencia
  const [motivos, setMotivos] = useState<MotivoEmergencia[]>([]);
  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [selectedMotivo, setSelectedMotivo] = useState<MotivoEmergencia | null>(null);
  const [searchMotivo, setSearchMotivo] = useState('');
  
  // Estado para elementos seleccionados (los datos vienen de contextos)
  const [selectedConsultorio, setSelectedConsultorio] = useState<Consultorio | null>(null);
  const [searchConsultorio, setSearchConsultorio] = useState('');
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);
  const [searchMedico, setSearchMedico] = useState('');
  const [selectedSeguro, setSelectedSeguro] = useState<Seguro | null>(null);
  const [searchSeguro, setSearchSeguro] = useState('');
  
  // Estado para formas de ingreso (aún no tiene contexto)
  const [formasIngreso, setFormasIngreso] = useState<any[]>([]);
  const [loadingFormasIngreso, setLoadingFormasIngreso] = useState(false);
  const [selectedFormaIngreso, setSelectedFormaIngreso] = useState<any | null>(null);
  const [searchFormaIngreso, setSearchFormaIngreso] = useState('');
  
  // Estado para diagnósticos
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(false);
  const [selectedDiagnostico, setSelectedDiagnostico] = useState<Diagnostico | null>(null);
  const [searchDiagnostico, setSearchDiagnostico] = useState('');

  // Get current date and time from server (will be updated via useEffect)
  const now = new Date();
  const fallbackDate = now.toISOString().split('T')[0]; // formato YYYY-MM-DD para input type="date"
  const fallbackTime = now.toTimeString().substring(0, 5); // formato HH:MM para input type="time"
  
  // Estado para los selectores abiertos
  const { openSelects, toggleSelect, closeAllSelects } = useSelectsState();
  const primerApellido = typeof window !== 'undefined' ? extractDocumentFromToken() : 'SUPERVISOR';

  // Initialize form data with empty values
  const [formData, setFormData] = useState({
    patientId: patientId,
    emergencyId: '',
    fecha: fallbackDate,
    hora: fallbackTime,
    consultorio: '',
    medico: '',
    motivoEmergencia: '',
    seguro: '',
    diagnostico: '',
    observacion1: '',
    observacion2: '',
    estado: '2', // 2 = REGISTRADO
    // Campos del paciente
    paciente: patientId,
    nombre: '', // Añadir campo nombre
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    documento: '',
    fechaNacimiento: '',
    edad: '',
    sexo: '',
    // Campos adicionales que mencionaste
    orden: '',
    tipoDocumento: '',
    estadoCivil: '',
    direccion: '',
    distrito: '',
    telefono1: '',
    telefono2: '',
    acompanante: '',
    tipoDocumentoA: '',
    documentoA: '',
    preAfiliacion: '',
    localidad: '',
    tipoAtencion: '',
    religion: '',
    seguroLiq: '',
    formaIngreso: '',
    cuentaId: '',
    usuario: primerApellido || 'SISTEMA',
    // Campos adicionales para distrito y lugar de nacimiento
    COD_DISTRITO: '',
    LUGAR_NACIMIENTO: '',
    // Empresa de seguro (opcional, solo cuando seguro='02' SOAT)
    aseguradora: '',
    aseguradoraDisplay: ''
  });

  // Obtener funciones del contexto de datos del paciente
  const { getPatientData } = usePatientData();
  const { fetchPatientData } = useFetchPatientData(patientId || '');

  // Función para asegurar que los datos del paciente estén disponibles (orquestador único)
  const ensurePatientData = useCallback(async (patientId: string): Promise<PatientDataExtended | null> => {
    // Primero verificar si ya tenemos los datos en el contexto
    const existingData = getPatientData(patientId);
    if (existingData) {
      return existingData as PatientDataExtended;
    }

    // Si no hay datos, usar fetchPatientData que ya tiene deduplicación
    const fetchedData = await fetchPatientData();
    return fetchedData as PatientDataExtended | null;
  }, [getPatientData, fetchPatientData]);

  // Refrescar fecha y hora del servidor al montar el componente (cada vez que se abre el modal)
  // Solo para emergencias nuevas, no para edición
  useEffect(() => {
    if (!emergencyId && !emergencyData) {
      // Es una emergencia nueva, refrescar la hora del servidor
      refreshDateTime();
    }
  }, []); // Solo al montar el componente
  
  // Usar fecha y hora del servidor desde el contexto
  useEffect(() => {
    // Solo actualizar si es una emergencia nueva (no edición)
    if (!emergencyId && !emergencyData && serverDateTime.date && serverDateTime.time) {
      // Actualizar formulario con fecha y hora del servidor
      setFormData(prev => ({
        ...prev,
        fecha: serverDateTime.date || fallbackDate,
        hora: serverDateTime.time || fallbackTime
      }));
    }
  }, [serverDateTime, fallbackDate, fallbackTime, emergencyId, emergencyData]);

  // Ya no necesitamos cargar tipos de documento, usamos el contexto

  // Función para normalizar valores a string de forma segura
  const safeTrim = useCallback((value: any): string => {
    if (value === null || value === undefined) return '';
    return typeof value === 'string' ? value.trim() : String(value).trim();
  }, []);

  // Extrae el código limpio de seguro (soporta "(02) - SOAT", "02 - SOAT", "02" y convierte 06 -> 0)
  const extractInsuranceCode = useCallback((value: any): string => {
    const raw = safeTrim(value);
    if (!raw) return '';
    const code = raw.split(' - ')[0].replace(/^\(|\)$/g, '').trim();
    return code === '06' ? '0' : code;
  }, [safeTrim]);

  // Función para obtener los datos de filiación del paciente desde el contexto
  const getPatientFiliation = useCallback((patientId: string): PatientDataExtended | null => {
    // Obtener datos del paciente del contexto
    const patientDataFromContext = getPatientData(patientId) as PatientDataExtended;
    
    if (!patientDataFromContext) {
      return null;
    }
    
    const seguroCode = safeTrim(patientDataFromContext.seguro);
    let descSeguro = safeTrim(patientDataFromContext.descSeguro);
    // Si el seguro es ESSALUD, cambiar también la descripción
    if (seguroCode === '06') {
      descSeguro = 'PAGANTE';
    }

    // Mapear los campos del contexto a los campos que necesitamos
    return {
      estadoCivil: getCivilStatusCode(
        patientDataFromContext.estadoCivil || (patientDataFromContext as any).ESTADO_CIVIL || (patientDataFromContext as any).ESTADOCIVIL,
        patientDataFromContext.NOMBRE_ESTADO_CIVIL || (patientDataFromContext as any).NOMBRE_ESTADO_CIVIL || (patientDataFromContext as any).nombreEstadoCivil
      ) || '',
      NOMBRE_ESTADO_CIVIL: (patientDataFromContext as any).NOMBRE_ESTADO_CIVIL || (patientDataFromContext as any).nombreEstadoCivil || '',
      direccion: safeTrim(patientDataFromContext.direccion),
      distrito: safeTrim(patientDataFromContext.distrito),
      telefono1: safeTrim(patientDataFromContext.telefono1),
      telefono2: safeTrim(patientDataFromContext.telefono2),
      tipoDocumento: safeTrim(patientDataFromContext.tipoDocumento),
      documento: safeTrim(patientDataFromContext.documento),
      localidad: safeTrim(patientDataFromContext.localidad),
      seguro: seguroCode,
      descSeguro,
      religion: safeTrim(patientDataFromContext.religion),
      nombre: safeTrim(patientDataFromContext.nombre),
      nombres: safeTrim(patientDataFromContext.nombres),
      apellidoPaterno: safeTrim(patientDataFromContext.apellidoPaterno),
      apellidoMaterno: safeTrim(patientDataFromContext.apellidoMaterno),
      sexo: safeTrim(patientDataFromContext.sexo),
      edad: safeTrim(patientDataFromContext.edad),
      fechaNacimiento: safeTrim(patientDataFromContext.fechaNacimiento),
      COD_DISTRITO: safeTrim(patientDataFromContext.COD_DISTRITO),
      LUGAR_NACIMIENTO: safeTrim(patientDataFromContext.LUGAR_NACIMIENTO)
    };
  }, [getPatientData, safeTrim]);

  // Función para manejar los datos del paciente cargados (ahora solo actualiza el formulario)
  const handlePatientDataLoaded = useCallback((data: PatientDataExtended) => {
    setPatientData(data);
    
    // Actualizar formData con los datos del paciente
    setFormData(prev => ({
      ...prev,
      nombre: data.nombre || '',
      nombres: data.nombres || '',
      apellidoPaterno: data.apellidoPaterno || '',
      apellidoMaterno: data.apellidoMaterno || '',
      documento: data.documento || '',
      tipoDocumento: data.tipoDocumento || '',
      estadoCivil: getCivilStatusCode(
        data.estadoCivil || (data as any).ESTADO_CIVIL || (data as any).ESTADOCIVIL,
        data.NOMBRE_ESTADO_CIVIL || (data as any).NOMBRE_ESTADO_CIVIL || (data as any).nombreEstadoCivil
      ) || '',
      direccion: data.direccion || '',
      distrito: data.distrito || '',
      telefono1: data.telefono1 || '',
      telefono2: data.telefono2 || '',
      localidad: data.localidad || '',
      seguro: data.seguro || '',
      religion: data.religion || '',
      // Incluir campos sexo, edad y fecha de nacimiento
      sexo: data.sexo || '',
      edad: data.edad || '',
      fechaNacimiento: data.fechaNacimiento || '', // ✅ Agregado
      // Campos adicionales
      COD_DISTRITO: data.COD_DISTRITO || '',
      LUGAR_NACIMIENTO: data.LUGAR_NACIMIENTO || ''
    }));
    
    // Actualizar el código de seguro para FuaEmergencyStatusAlert
    const seguroCode = extractInsuranceCode(data.seguro);
    if (seguroCode) {
      setInsuranceCode(seguroCode);
    }
    
    // Si no hay emergencyId (modo creación), actualizar el seguro desde los datos del paciente
    const seguroTrimmed = extractInsuranceCode(data.seguro);
    if (!emergencyId && seguroTrimmed) {
      let seguroToUse = seguroTrimmed;
      let seguroEncontrado = seguros.find(s => safeTrim(s.Seguro) === seguroTrimmed);
      
      // Si el seguro es ESSALUD (06), convertir a PAGANTE (0)
      if (safeTrim(data.seguro).startsWith('06')) {
        seguroEncontrado = seguros.find(s => s.Seguro === '0');
        if (seguroEncontrado) {
          seguroToUse = `${seguroEncontrado.Seguro} - ${seguroEncontrado.Nombre}`;
        } else {
          seguroToUse = '0 - PAGANTE';
        }
      }
      
      setFormData(prev => ({
        ...prev,
        seguro: seguroToUse
      }));
      
      // Establecer el seguro seleccionado
      if (seguroEncontrado) {
        setSelectedSeguro(seguroEncontrado);
      }
    }
  }, [emergencyId, seguros]);

  // Efecto para cargar datos del paciente al montar el componente
  useEffect(() => {
    const loadInitialPatientData = async () => {
      if (!patientId) return;
      
      try {
        // Priorizar datos del prop patient si están disponibles
        if (patient) {
          handlePatientDataLoaded(patient);
          return;
        }
        
        // Si no hay datos en el prop, usar el orquestador único
        const data = await ensurePatientData(patientId);
        if (data) {
          handlePatientDataLoaded(data);
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales del paciente:', error);
      }
    };

    loadInitialPatientData();
  }, [patientId, patient, ensurePatientData, handlePatientDataLoaded]);

  // Manejar cambios en el formulario
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error de validación si existe
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Ocultar alerta de error si se está editando el formulario
    if (showErrorAlert) {
      setShowErrorAlert(false);
      setError(null);
    }
  };

  // Manejar datos de emergencia cargados (para modo edición)
  const handleEmergencyDataLoaded = (data: any) => {
    // Actualizar formData con los datos de la emergencia
    setFormData(prev => ({
      ...prev,
      fecha: data.fecha,
      hora: data.hora,
      consultorio: data.consultorio,
      motivoEmergencia: data.motivoEmergencia,
      seguro: data.seguro,
      observacion1: data.observacion1,
      observacion2: data.observacion2,
      estado: data.estado,
      estadoCivil: getCivilStatusCode(
        data.estadoCivil || data.ESTADO_CIVIL || data.ESTADOCIVIL,
        data.NOMBRE_ESTADO_CIVIL || data.nombreEstadoCivil
      ) || '',
      // Datos del acompañante
      acompanante: data.acompanante || '',
      tipoDocumentoA: data.tipoDocumentoA || '',
      documentoA: data.documentoA || ''
    }));
    
    // Actualizar el código de seguro para validación FUA
    const seguroCode = extractInsuranceCode(data.seguro);
    setInsuranceCode(seguroCode);
    
    // Actualizar estados de selección
    if (data.motivoData) setSelectedMotivo(data.motivoData);
    if (data.consultorioData) setSelectedConsultorio(data.consultorioData);
    if (data.medicoData) setSelectedMedico(data.medicoData);
    if (data.seguroData) setSelectedSeguro(data.seguroData);
    if (data.diagnosticoData) setSelectedDiagnostico(data.diagnosticoData);
    
    setLoading(false);
  };

  // Manejar cambio de estado de edición
  const handleStatusChange = (isEditable: boolean, isLocked: boolean) => {
    // If readOnly prop is true, override the editable state
    setIsEditable(readOnly ? false : isEditable);
    setFieldsLocked(readOnly ? true : isLocked);
    setLoading(false);
  };


  // Usar el contexto de cuentas de emergencia
  const { fetchEmergencyAccount, isLoading: isLoadingAccountState } = useEmergencyAccount();
  // Convertir el estado de carga de objeto a booleano
  const isLoadingAccount = patientId ? isLoadingAccountState[patientId] || false : false;

  // Función para obtener el siguiente ID de emergencia y orden
  const fetchNextEmergencyIds = async () => {
    try {
      return await nextIdService.getNextIds();
    } catch (error) {
      console.error('Error al obtener los siguientes IDs:', error);
      return null;
    }
  };



  // Función para verificar si existe una cuenta activa para el paciente
  const checkExistingAccount = async (seguroCode: string): Promise<any> => {
    try {
      const url = `${API_ENDPOINTS.emergencia.checkAccount}?paciente=${encodeURIComponent(patientId)}&seguro=${encodeURIComponent(seguroCode)}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.ok && result.requiresCuenta && result.existeCtaActiva && result.cuenta) {
        return result.cuenta;
      }
      return null;
    } catch (error) {
      console.error('Error al verificar cuenta existente:', error);
      return null;
    }
  };

  // Función para procesar el formulario con opción de reutilizar cuenta o forzar creación
  const processFormWithAccountOption = async (reuseAccountId?: string, forceCreateNew?: boolean) => {
    try {
      setSubmitting(true);
      setAccountDialogLoading(true);
      
      // Usar los datos pendientes si existen, o los datos actuales del formulario
      const dataToUse = pendingFormData || {
        emergencyIdToUse: emergencyId,
        ordenToUse: formData.orden || '',
        cuentaIdToUse: formData.cuentaId || ''
      };
      
      let { emergencyIdToUse, ordenToUse, cuentaIdToUse } = dataToUse;
      
      if (!emergencyIdToUse) {
        const nextIds = await fetchNextEmergencyIds();
        if (!nextIds) {
          toast({
            title: "Error",
            description: "No se pudo obtener los IDs necesarios para la emergencia",
            variant: "destructive"
          });
          setSubmitting(false);
          setAccountDialogLoading(false);
          return;
        }
        
        emergencyIdToUse = nextIds.emergenciaId;
        ordenToUse = nextIds.orden;
      }

      // Obtener datos de filiación del contexto
      const filiacionData = getPatientFiliation(patientId);
      
      // Extraer códigos de los valores seleccionados
      const consultorioCode = typeof formData.consultorio === 'string' ? formData.consultorio.split(' - ')[0] || '' : String(formData.consultorio || '');
      const motivoCode = typeof formData.motivoEmergencia === 'string' ? formData.motivoEmergencia.split(' - ')[0] || '' : String(formData.motivoEmergencia || '');
      const seguroFormValue = typeof formData.seguro === 'string' ? formData.seguro : String(formData.seguro || '');
      const seguroCode = seguroFormValue.split(' - ')[0] || '';
      
      // APLICAR CONVERSIÓN PARA SEGURO Y SEGUROLIQ
      let seguroValue = seguroCode;
      let seguroLiqValue = seguroCode;
      
      if (seguroFormValue.includes('PAGANTE') || seguroCode === '0') {
        seguroValue = '0';
        seguroLiqValue = '0';
      } else if (seguroCode === '06') {
        seguroValue = '0';
        seguroLiqValue = '0';
      }
      
      const fechaFormateada = formData.fecha.replace(/-/g, '');
      
      // Preparar datos para enviar al servidor
      const emergencyDataPayload = {
        EMERGENCIA_ID: emergencyIdToUse,
        PACIENTE: patientId,
        FECHA: fechaFormateada,
        HORA: formData.hora,
        CONSULTORIO: consultorioCode.padEnd(6, ' ').substring(0, 6),
        MOTIVO_EMERGENCIA: motivoCode.padEnd(2, ' ').substring(0, 2),
        SEGURO: seguroValue.padEnd(2, ' ').substring(0, 2),
        OBSERVACION1: (formData.observacion1 || '').substring(0, 100),
        OBSERVACION2: (formData.observacion2 || '').substring(0, 100),
        ESTADO: formData.estado.substring(0, 1),
        USUARIO: (primerApellido || 'SISTEMA').substring(0, 10),
        ORDEN: String(ordenToUse || 1).padStart(3, '0').substring(0, 3),
        PATERNO: (filiacionData?.apellidoPaterno || formData.apellidoPaterno || '').substring(0, 30),
        MATERNO: (filiacionData?.apellidoMaterno || formData.apellidoMaterno || '').substring(0, 30),
        NOMBRE: (filiacionData?.nombre || formData.nombres || '').substring(0, 30),
        NOMBRES: (filiacionData?.nombres || `${formData.nombres || ''} ${formData.apellidoMaterno || ''} ${formData.apellidoPaterno || ''}`).trim().substring(0, 100),
        TIPO_DOCUMENTO: (filiacionData?.tipoDocumento || formData.tipoDocumento || '').padEnd(2, ' ').substring(0, 2),
        DOCUMENTO: (formData.documento || '').substring(0, 15),
        FECHA_NACIMIENTO: formData.fechaNacimiento ? formData.fechaNacimiento.replace(/-/g, '').substring(0, 8) : '',
        EDAD: (() => {
          let edad = (filiacionData?.edad || formData.edad || '').substring(0, 10);
          if (edad === '000a00m00d') edad = '000a00m01d';
          return edad;
        })(),
        SEXO: (filiacionData?.sexo || formData.sexo || '').substring(0, 1),
        ESTADO_CIVIL: (() => {
          const raw = getCivilStatusCode(
            formData.estadoCivil || filiacionData?.estadoCivil || (patientData as any)?.ESTADO_CIVIL || (patientData as any)?.estadoCivil || (patientData as any)?.ESTADOCIVIL,
            filiacionData?.NOMBRE_ESTADO_CIVIL || (patientData as any)?.NOMBRE_ESTADO_CIVIL || (patientData as any)?.nombreEstadoCivil
          ) || '';
          return raw.padEnd(2, ' ').substring(0, 2);
        })(),
        DIRECCION: (filiacionData?.direccion || formData.direccion || '').substring(0, 100),
        DISTRITO: (filiacionData?.COD_DISTRITO || formData.COD_DISTRITO || '').trim().substring(0, 7),
        TELEFONO1: (filiacionData?.telefono1 || formData.telefono1 || '').substring(0, 20),
        TELEFONO2: (filiacionData?.telefono2 || formData.telefono2 || '').substring(0, 20),
        ACOMPANANTE: (formData.acompanante || '').substring(0, 100),
        TIPO_DOCUMENTOA: (formData.tipoDocumentoA === 'D' ? 'D' : (formData.tipoDocumentoA || 'D')).substring(0, 2),
        DOCUMENTOA: (formData.documentoA || '').substring(0, 15),
        PRE_AFILIACION: (formData.preAfiliacion || '').padEnd(1, ' ').substring(0, 1),
        LOCALIDAD: (filiacionData?.localidad || formData.localidad || '').padEnd(12, ' ').substring(0, 12),
        TIPOATENCION: (formData.tipoAtencion || 'E').padEnd(1, ' ').substring(0, 1),
        RELIGION: (filiacionData?.religion || formData.religion || '0').padEnd(2, ' ').substring(0, 2),
        SEGUROLIQ: seguroLiqValue.padEnd(2, ' ').substring(0, 2),
        FORMA_INGRESO: (formData.formaIngreso === '1' ? '1' : (formData.formaIngreso || '1')).padEnd(1, ' ').substring(0, 1),
        CUENTAID: (cuentaIdToUse || '').padEnd(7, ' ').substring(0, 7),
        EMPRESASEGURO: seguroValue.trim() === '02' ? (formData.aseguradora || '').trim() : '',
        MEDICO: (formData.medico || '0').padEnd(4, ' ').substring(0, 4)
      };
      
      const method = emergencyId ? 'PUT' : 'POST';
      const url = emergencyId ? API_ENDPOINTS.emergencia.update(emergencyId) : API_ENDPOINTS.emergencia.create;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emergencyDataPayload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403 && errorData.statusInfo) {
          throw new Error(`No se puede editar: ${errorData.error}`);
        }
        throw new Error(errorData.error || 'Error al procesar la emergencia');
      }
      
      const result = await response.json();
      
      // Llamar al endpoint para asegurar la cuenta si el seguro es "0", "02" o "17"
      const seguroCodeForAccount = safeTrim(result.data?.SEGUROLIQ || result.SEGUROLIQ || emergencyDataPayload?.SEGUROLIQ);
      
      if (seguroCodeForAccount && ["0", "02", "17"].includes(seguroCodeForAccount)) {
        try {
          const pacienteData = result.data?.PACIENTE || result.PACIENTE || patientId;
          const nombreData = safeTrim(result.data?.NOMBRES || result.NOMBRES) || formData.nombres || formData.nombre || '';
          
          const asegurarResponse = await fetch(API_ENDPOINTS.emergencia.assignCuenta(emergencyIdToUse, 'EM'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paciente: pacienteData,
              seguro: seguroCodeForAccount,
              usuario: primerApellido,
              nombre: nombreData,
              origen: 'EM',
              observa: formData.observacion1 || '',
              empresaSeguro: seguroCodeForAccount === '02' ? (formData.aseguradora || '') : '',
              reuseAccountId: reuseAccountId,
              forceCreateNew: forceCreateNew
            })
          });

          const asegurarResult = await asegurarResponse.json();
          
          if (asegurarResult.ok && asegurarResult.cuentaId) {
            try {
              const record = result.data || result;
              await fetch(API_ENDPOINTS.emergencia.update(emergencyIdToUse), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...record, CUENTAID: asegurarResult.cuentaId })
              });
            } catch (updateError) {
              console.error('Error al actualizar la emergencia con el CUENTAID:', updateError);
            }
          }
        } catch (error) {
          console.error('Error al asegurar la cuenta:', error);
        }
      }
      
      // Limpiar estados del diálogo
      setShowAccountDialog(false);
      setExistingAccountInfo(null);
      setPendingFormData(null);
      
      // Mostrar mensaje de éxito
      if (!isModal) {
        toast({
          title: emergencyId ? "Emergencia actualizada" : "Emergencia creada",
          description: `Se ha ${emergencyId ? 'actualizado' : 'creado'} la emergencia correctamente`,
          variant: "default"
        });
      } else if (onSuccess) {
        onSuccess(result);
      } else {
        toast({
          title: emergencyId ? "Emergencia actualizada" : "Emergencia creada",
          description: `Se ha ${emergencyId ? 'actualizado' : 'creado'} la emergencia correctamente`,
          variant: "default"
        });
      }
      
    } catch (err: any) {
      console.error('Error al procesar el formulario:', err);
      
      let errorTitle = "Error";
      let errorMessage = err.message;
      
      if (err.message.includes('No se puede editar')) {
        errorTitle = "No se puede editar";
      } else if (err.message.includes('validación')) {
        errorTitle = "Error de validación";
      } else if (err.message.includes('conexión') || err.message.includes('network')) {
        errorTitle = "Error de conexión";
        errorMessage = "Problemas de conexión con el servidor. Por favor intente nuevamente.";
      }
      
      if (!isModal) {
        toast({ title: errorTitle, description: errorMessage, variant: "destructive" });
        if (err.message.includes('No se puede editar')) {
          setError(errorMessage);
          setShowErrorAlert(true);
        }
      } else if (onError) {
        onError(errorMessage);
      }
    } finally {
      setSubmitting(false);
      setAccountDialogLoading(false);
    }
  };

  // Función para procesar el formulario (verifica cuenta existente primero)
  const processForm = async () => {
    try {
      setSubmitting(true);
      
      // Extraer código de seguro para verificar si requiere cuenta
      const seguroToCheck = extractInsuranceCode(formData.seguro);
      
      // Verificar si el seguro requiere cuenta (0, 02, 17)
      const segurosConCuenta = ['0', '00', '02', '17'];
      
      if (segurosConCuenta.includes(seguroToCheck)) {
        // Verificar si hay múltiples cuentas activas (filtrado por origen=EM)
        try {
          const url = `${API_SPRING_URL}/accounts/patient/${encodeURIComponent(patientId)}?estado=1&origen=EM&seguro=${encodeURIComponent(seguroToCheck)}`;
          const resp = await fetch(url);
          if (resp.ok) {
            const data = await resp.json();
            const list: ActiveAccount[] = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
            if (list.length > 1) {
              setMultiActiveAccounts(list);
              setShowMultiAccountDialog(true);
              setPendingFormData({ emergencyIdToUse: emergencyId, ordenToUse: formData.orden || '', cuentaIdToUse: formData.cuentaId || '' });
              setSubmitting(false);
              return;
            }
          }
        } catch { /* ignorar, caer a checkExistingAccount */ }

        const existingAccount = await checkExistingAccount(seguroToCheck);
        
        if (existingAccount) {
          // Guardar datos pendientes para después del diálogo
          setPendingFormData({
            emergencyIdToUse: emergencyId,
            ordenToUse: formData.orden || '',
            cuentaIdToUse: formData.cuentaId || ''
          });
          
          // Mostrar diálogo de confirmación
          setExistingAccountInfo(existingAccount);
          setShowAccountDialog(true);
          setSubmitting(false);
          return; // Esperar decisión del usuario
        }
      }
      
      // Si no hay cuenta existente o el seguro no requiere cuenta, proceder normalmente
      await processFormWithAccountOption();
      
    } catch (err: any) {
      console.error('Error al verificar cuenta:', err);
      setSubmitting(false);
    }
  };

  // Handlers para el diálogo de cuenta
  const handleReuseAccount = async (cuentaId: string) => {
    await processFormWithAccountOption(cuentaId, false); // Reutilizar cuenta existente
  };

  const handleCreateNewAccount = async () => {
    await processFormWithAccountOption(undefined, true); // Forzar creación de nueva cuenta
  };

  const handleCloseAccountDialog = () => {
    setShowAccountDialog(false);
    setExistingAccountInfo(null);
    setPendingFormData(null);
    setSubmitting(false);
  };

  const handleMultiAccountSelectEM = async (cuentaId: string) => {
    setShowMultiAccountDialog(false);
    await processFormWithAccountOption(cuentaId, false);
  };

  const handleMultiAccountCreateNewEM = async () => {
    setShowMultiAccountDialog(false);
    await processFormWithAccountOption(undefined, true);
  };

  // Manejar cancelación del formulario
  const handleCancel = () => {
    if (onBack) {
      // Usar el callback onBack para volver al modal anterior o cerrar
      onBack();
    }
  };
  
  // Función para manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateEmergencyForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      
      // Mostrar errores de validación más específicos
      const errorCount = Object.keys(validation.errors).length;
      const errorFields = Object.keys(validation.errors).map(field => {
        // Convertir nombres de campos a formato legible
        const fieldMap: Record<string, string> = {
          'motivoEmergencia': 'Motivo de emergencia',
          'consultorio': 'Consultorio',
          'seguro': 'Condición del Paciente',
          'fecha': 'Fecha',
          'hora': 'Hora',
          'acompanante': 'Nombre del Acompañante',
          'documentoA': 'Documento Acompañante'
        };
        return fieldMap[field] || field;
      }).join(', ');
      
      toast({
        title: `Error de validación (${errorCount} ${errorCount === 1 ? 'campo' : 'campos'})`,
        description: `Por favor complete: ${errorFields}`,
        variant: "destructive"
      });
      
      // Hacer scroll al primer campo con error
      const firstErrorField = Object.keys(validation.errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return false;
    }
    return true;
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (emergencyData) {
      // Si tenemos datos de emergencia, cargarlos en el formulario
      handleEmergencyDataLoaded({
        fecha: emergencyData.FECHA ? new Date(emergencyData.FECHA).toISOString().split('T')[0] : '',
        hora: emergencyData.HORA || '',
        consultorio: emergencyData.CONSULTORIO || '',
        medico: emergencyData.MEDICO || '',
        motivoEmergencia: emergencyData.MOTIVO_EMERGENCIA || '',
        seguro: emergencyData.SEGURO || '',
        diagnostico: emergencyData.DIAGNOSTICO || '',
        observacion1: emergencyData.OBSERVACION1 || '',
        observacion2: emergencyData.OBSERVACION2 || '',
        estado: emergencyData.ESTADO || '',
        estadoCivil: emergencyData.ESTADO_CIVIL || emergencyData.estadoCivil || emergencyData.ESTADOCIVIL || '',
        // Datos del acompañante
        acompanante: emergencyData.ACOMPANANTE || emergencyData.acompanante || '',
        tipoDocumentoA: emergencyData.TIPO_DOCUMENTOA || emergencyData.tipoDocumentoA || emergencyData.tipoDocumentoAcompanante || '',
        documentoA: emergencyData.DOCUMENTOA || emergencyData.documentoA || emergencyData.documentoAcompanante || ''
      });
      
      // Si hay CUENTAID en los datos de emergencia, actualizarlo
      if (emergencyData.CUENTAID) {
        setCuentaId(emergencyData.CUENTAID);
      }
      
      // Cargar EMPRESASEGURO si existe (para edición)
      if (emergencyData.EMPRESASEGURO) {
        const empresaCode = emergencyData.EMPRESASEGURO?.toString().trim() || '';
        const empresaNombre = emergencyData.EMPRESASEG_NOMBRE?.toString().trim() || '';
        setFormData(prev => ({
          ...prev,
          aseguradora: empresaCode,
          aseguradoraDisplay: empresaNombre ? `(${empresaCode}) - ${empresaNombre}` : empresaCode
        }));
      }
    }
    setLoading(false);
  }, [emergencyData]);
  
  // NOTA: La carga de cuenta ahora se maneja en FormHeaderEmergency para evitar duplicados
  // Este useEffect se ha eliminado para prevenir llamadas duplicadas a la API

  return (
    <form id="emergency-form" onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <Toaster />
      
      {/* Selector de cuenta cuando hay múltiples activas */}
      <MultiAccountSelectorDialog
        isOpen={showMultiAccountDialog}
        onClose={() => { setShowMultiAccountDialog(false); setSubmitting(false); }}
        onSelectAccount={handleMultiAccountSelectEM}
        onCreateNew={handleMultiAccountCreateNewEM}
        accounts={multiActiveAccounts}
        isLoading={accountDialogLoading}
        title="Cuentas EM activas para el paciente"
      />

      {/* Diálogo de confirmación de cuenta existente */}
      <AccountConfirmationDialog
        isOpen={showAccountDialog}
        onClose={handleCloseAccountDialog}
        onReuseAccount={handleReuseAccount}
        onCreateNew={handleCreateNewAccount}
        accountInfo={existingAccountInfo}
        isLoading={accountDialogLoading}
      />
      
      {/* Renderizar alertas en el contenedor externo si se proporciona un ID */}
      {alertsContainerId && patientId && requiresFuaValidation && (
        <AlertPortal containerId={alertsContainerId}>
          <FuaEmergencyStatusAlert 
            patientId={patientId}
            insuranceCode={insuranceCode}
            onValidationChange={handleFuaValidationChange}
          />
        </AlertPortal>
      )}
      
      {alertsContainerId && showErrorAlert && error && (
        <AlertPortal containerId={alertsContainerId}>
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </AlertPortal>
      )}
      
      {/* Mostrar alertas en el formulario si no hay contenedor externo */}
      {!alertsContainerId && patientId && requiresFuaValidation && (
        <div className="mb-6">
          <FuaEmergencyStatusAlert 
            patientId={patientId}
            insuranceCode={insuranceCode}
            onValidationChange={handleFuaValidationChange}
          />
        </div>
      )}
      
      {!alertsContainerId && showErrorAlert && error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-6">
        {/* Main form content - Ocupa todo el ancho en modo modal */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="p-6">
              {/* Form Header - Fecha, hora y número de cuenta */}
              <FormHeaderEmergency
                fecha={formData.fecha}
                hora={formData.hora}
                onFechaChange={(value) => handleFormChange('fecha', value)}
                onHoraChange={(value) => handleFormChange('hora', value)}
                disabled={!isEditable || fieldsLocked || readOnly}
                validationErrors={validationErrors}
                patientId={patientId}
                onFormChange={handleFormChange}
                insuranceCode={insuranceCode}
                cuentaId={cuentaId || formData.cuentaId}
                loadingCuenta={isLoadingAccount}
              />
              {/* Campos Adicionales */}
              <AdditionalFieldsSection
                formData={formData}
                onFormChange={handleFormChange}
                validationErrors={validationErrors}
                disabled={fieldsLocked}
              />
              
              {/* Datos de Emergencia */}
              <EmergencySection
                formData={formData}
                patientId={patientId}
                validationErrors={validationErrors}
                disabled={fieldsLocked}
                onFormChange={handleFormChange}
                preloadedSeguros={seguros}
                preloadedConsultorios={consultorios}
                onMotivoChange={(value: string, motivoData: any) => {
                  setFormData(prev => ({
                    ...prev,
                    motivoEmergencia: value
                  }));
                  setSelectedMotivo(motivoData || null);
                }}
                onConsultorioChange={(value: string, consultorioData: any) => {
                  setFormData(prev => ({
                    ...prev,
                    consultorio: value
                  }));
                  setSelectedConsultorio(consultorioData || null);
                }}
                onFormaIngresoChange={(value: string, formaData: any) => {
                  setFormData(prev => ({
                    ...prev,
                    formaIngreso: value
                  }));
                  setSelectedFormaIngreso(formaData || null);
                }}
                onMedicoChange={(value: string, medicoData: any) => {
                  setFormData(prev => ({
                    ...prev,
                    medico: value
                  }));
                  setSelectedMedico(medicoData || null);
                }}
                onSeguroChange={async (value: string, seguroData: any) => {
                  setFormData(prev => ({
                    ...prev,
                    seguro: value
                  }));
                  setSelectedSeguro(seguroData || null);
                  
                  // Actualizar código de seguro para validación FUA
                  const seguroCode = extractInsuranceCode(value);
                  setInsuranceCode(seguroCode);
                  
                  // NOTA: La búsqueda de cuenta ahora se maneja automáticamente en FormHeaderEmergency
                  // cuando cambia insuranceCode, para evitar llamadas duplicadas a la API
                }}
                onDiagnosticoChange={(value: string, diagnosticoData: any) => {
                  setFormData(prev => ({
                    ...prev,
                    diagnostico: value
                  }));
                  setSelectedDiagnostico(diagnosticoData || null);
                }}
              />
              
              
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Componente para cargar datos de emergencia existente */}
      <EmergencyDetails
        emergencyId={emergencyId}
        emergencyData={emergencyData}
        onDataLoaded={handleEmergencyDataLoaded}
        onStatusChange={handleStatusChange}
      />
      
      {/* Acciones del formulario */}
      <FormActionsEmergency 
        onSave={processForm}
        onCancel={handleCancel}
        submitting={submitting}
        isEditable={isEditable}
        patientId={patientId}
        isUpdate={!!emergencyId}
        formData={formData}
        insuranceCode={insuranceCode}
        onBeforeSave={async () => {
          const validation = validateEmergencyForm(formData);
          if (!validation.isValid) {
            setValidationErrors(validation.errors);
            
            // Mostrar errores de validación más específicos
            const errorCount = Object.keys(validation.errors).length;
            const errorFields = Object.keys(validation.errors).map(field => {
              // Convertir nombres de campos a formato legible
              const fieldMap: Record<string, string> = {
                'motivoEmergencia': 'Motivo de emergencia',
                'consultorio': 'Consultorio',
                'seguro': 'Seguro',
                'fecha': 'Fecha',
                'hora': 'Hora'
              };
              return fieldMap[field] || field;
            }).join(', ');
            
            toast({
              title: `Error de validación (${errorCount} ${errorCount === 1 ? 'campo' : 'campos'})`,
              description: `Por favor complete: ${errorFields}`,
              variant: "destructive"
            });
            
            // Hacer scroll al primer campo con error
            const firstErrorField = Object.keys(validation.errors)[0];
            const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
            if (errorElement) {
              errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            return false;
          }
          return true;
        }}
      />
    </form>
  );
}
