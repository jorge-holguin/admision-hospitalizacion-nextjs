"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import AlertPortal from "@/components/ui/alert-portal"
import { usePatientAccount } from '@/contexts/PatientAccountContext'
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

import { extractDocumentFromToken } from '@/utils/jwtUtils'
import { usePatientData, useFetchPatientData } from "@/contexts/PatientDataContext";
import { useTiposDocumento } from "@/contexts/TiposDocumentoContext";
import { useServerDateTime } from "@/contexts/ServerDateTimeContext";
import { datetimeService } from '@/services/datetimeService'

// Extender la interfaz de datos del paciente para incluir los campos adicionales
interface PatientDataExtended {
  estadoCivil?: string;
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
  
  // Usar contexto para fecha y hora del servidor
  const { serverDateTime } = useServerDateTime();

  // Contextos para datos compartidos
  const { seguros } = useSeguros()
  const { medicos } = useMedicos()
  const { consultorios } = useConsultorios()
  const { tiposDocumento } = useTiposDocumento()

  // Memoized callback for FUA validation
  const handleFuaValidationChange = useCallback((isValid: boolean) => {
    console.log('Estado de validación FUA en formulario principal:', isValid);
    setMainFormFuaValidationPassed(isValid);
  }, []);
  const [mainFormFuaValidationPassed, setMainFormFuaValidationPassed] = useState<boolean>(false);
  
  // Códigos de seguro SIS que requieren validación FUA
  const sisInsuranceCodes = ['20', '21', '22', '23', '24', '25'];
  const requiresFuaValidation = Boolean(insuranceCode && sisInsuranceCodes.includes(insuranceCode.trim()));
  
  // Monitorear cambios en el código de seguro
  useEffect(() => {
    console.log('Código de seguro actualizado:', insuranceCode);
    console.log('Requiere validación FUA:', requiresFuaValidation);
  }, [insuranceCode, requiresFuaValidation]);
  
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
    LUGAR_NACIMIENTO: ''
  });

  // Obtener funciones del contexto de datos del paciente
  const { getPatientData } = usePatientData();
  const { fetchPatientData } = useFetchPatientData(patientId || '');

  // Función para asegurar que los datos del paciente estén disponibles (orquestador único)
  const ensurePatientData = useCallback(async (patientId: string): Promise<PatientDataExtended | null> => {
    // Primero verificar si ya tenemos los datos en el contexto
    const existingData = getPatientData(patientId);
    if (existingData) {
      console.log('Datos del paciente ya disponibles en contexto');
      return existingData as PatientDataExtended;
    }

    // Si no hay datos, usar fetchPatientData que ya tiene deduplicación
    console.log('Cargando datos del paciente desde API...');
    const fetchedData = await fetchPatientData();
    return fetchedData as PatientDataExtended | null;
  }, [getPatientData, fetchPatientData]);

  // Usar fecha y hora del servidor desde el contexto
  useEffect(() => {
    if (serverDateTime.date && serverDateTime.time) {
      // Actualizar formulario con fecha y hora del servidor
      setFormData(prev => ({
        ...prev,
        fecha: serverDateTime.date || fallbackDate,
        hora: serverDateTime.time || fallbackTime
      }));
    }
  }, [serverDateTime, fallbackDate, fallbackTime]);

  // Ya no necesitamos cargar tipos de documento, usamos el contexto

  // Función para obtener los datos de filiación del paciente desde el contexto
  const getPatientFiliation = useCallback((patientId: string): PatientDataExtended | null => {
    // Obtener datos del paciente del contexto
    const patientDataFromContext = getPatientData(patientId) as PatientDataExtended;
    
    if (!patientDataFromContext) {
      return null;
    }
    
    // Mapear los campos del contexto a los campos que necesitamos
    return {
      estadoCivil: patientDataFromContext.estadoCivil ? patientDataFromContext.estadoCivil.trim() : '',
      direccion: patientDataFromContext.direccion ? patientDataFromContext.direccion.trim() : '',
      // Usar el distrito del contexto
      distrito: patientDataFromContext.distrito ? patientDataFromContext.distrito.trim() : '',
      telefono1: patientDataFromContext.telefono1 ? patientDataFromContext.telefono1.trim() : '',
      telefono2: patientDataFromContext.telefono2 ? patientDataFromContext.telefono2.trim() : '',
      tipoDocumento: patientDataFromContext.tipoDocumento ? patientDataFromContext.tipoDocumento.trim() : '',
      documento: patientDataFromContext.documento ? patientDataFromContext.documento.trim() : '',
      // Asegurarse de eliminar espacios en blanco adicionales
      localidad: patientDataFromContext.localidad ? patientDataFromContext.localidad.trim() : '',
      seguro: patientDataFromContext.seguro ? patientDataFromContext.seguro.trim() : '',
      descSeguro: (() => {
        let seguroCode = patientDataFromContext.seguro ? patientDataFromContext.seguro.trim() : '';
        let descSeguro = patientDataFromContext.descSeguro ? patientDataFromContext.descSeguro.trim() : '';
        // Si el seguro es ESSALUD, cambiar también la descripción
        if (seguroCode === '06') {
          descSeguro = 'PAGANTE';
        }
        return descSeguro;
      })(),
      religion: patientDataFromContext.religion ? patientDataFromContext.religion.trim() : '',
      // Añadir el campo nombre que faltaba - usar el campo nombre del contexto, no nombres
      nombre: patientDataFromContext.nombre ? patientDataFromContext.nombre.trim() : '',
      nombres: patientDataFromContext.nombres ? patientDataFromContext.nombres.trim() : '',
      apellidoPaterno: patientDataFromContext.apellidoPaterno ? patientDataFromContext.apellidoPaterno.trim() : '',
      apellidoMaterno: patientDataFromContext.apellidoMaterno ? patientDataFromContext.apellidoMaterno.trim() : '',
      // Incluir campos sexo, edad y fecha de nacimiento
      sexo: patientDataFromContext.sexo ? patientDataFromContext.sexo.trim() : '',
      edad: patientDataFromContext.edad ? patientDataFromContext.edad.trim() : '',
      fechaNacimiento: patientDataFromContext.fechaNacimiento ? patientDataFromContext.fechaNacimiento.trim() : '', // ✅ Agregado
      // Añadir campos adicionales para distrito y lugar de nacimiento
      COD_DISTRITO: patientDataFromContext.COD_DISTRITO ? patientDataFromContext.COD_DISTRITO.trim() : '',
      LUGAR_NACIMIENTO: patientDataFromContext.LUGAR_NACIMIENTO ? patientDataFromContext.LUGAR_NACIMIENTO.trim() : ''
    };
  }, [getPatientData]);

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
      estadoCivil: data.estadoCivil || '',
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
    if (data.seguro) {
      let seguroCode = data.seguro.trim();
      // Aplicar conversión de ESSALUD (06) a PAGANTE (0)
      if (seguroCode === '06') {
        seguroCode = '0';
        console.log('Código de seguro convertido de 06 a 0 (PAGANTE) para insuranceCode');
      }
      setInsuranceCode(seguroCode);
      console.log('Código de seguro actualizado:', seguroCode);
    }
    
    // Si no hay emergencyId (modo creación), actualizar el seguro desde los datos del paciente
    if (!emergencyId && data.seguro) {
      let seguroToUse = data.seguro;
      let seguroEncontrado = seguros.find(s => s.Seguro === data.seguro);
      
      // Si el seguro es ESSALUD (06), convertir a PAGANTE (0)
      if (data.seguro.trim() === '06') {
        console.log('Convirtiendo seguro de ESSALUD (06) a PAGANTE (0) en formData');
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
          console.log('📋 Usando datos del paciente desde prop:', patient);
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
      estado: data.estado
    }));
    
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


  // Usar el contexto de cuentas de pacientes
  const { fetchPatientAccount, fetchPatientAccountBySeguro, isLoading: isLoadingAccountState } = usePatientAccount();
  // Convertir el estado de carga de objeto a booleano
  const isLoadingAccount = patientId ? isLoadingAccountState[patientId] || false : false;

  // Función para obtener el siguiente ID de emergencia y orden
  const fetchNextEmergencyIds = async () => {
    try {
      const response = await fetch('/api/emergencia?next-id=true');
      if (!response.ok) {
        throw new Error('Error al obtener el siguiente ID de emergencia');
      }
      const result = await response.json();
      console.log('Datos obtenidos de la API next-id:', result);
      
      if (!result.success || !result.data) {
        throw new Error('Formato de respuesta inválido');
      }
      
      return {
        emergenciaId: result.data.emergenciaId,
        orden: result.data.orden
      };
    } catch (error) {
      console.error('Error al obtener los siguientes IDs:', error);
      return null;
    }
  };



  // Función para procesar el formulario (solo se ejecuta después de la confirmación)
  const processForm = async () => {
    try {
      setSubmitting(true);
      
      // Obtener el siguiente ID de emergencia y orden si es creación
      let emergencyIdToUse = emergencyId;
      let ordenToUse = formData.orden || '';
      let cuentaIdToUse = formData.cuentaId || '';
      
      if (!emergencyIdToUse) {
        const nextIds = await fetchNextEmergencyIds();
        if (!nextIds) {
          toast({
            title: "Error",
            description: "No se pudo obtener los IDs necesarios para la emergencia",
            variant: "destructive"
          });
          setSubmitting(false);
          return;
        }
        
        console.log('IDs obtenidos para usar en el formulario:', nextIds);
        emergencyIdToUse = nextIds.emergenciaId;
        ordenToUse = nextIds.orden;
      }

      // Obtener la cuenta activa del paciente si no la tenemos
      if (!cuentaIdToUse) {
        const accountData = await fetchPatientAccount(patientId);
        cuentaIdToUse = accountData?.cuentaId || '';
        console.log('Cuenta obtenida para el paciente:', cuentaIdToUse);
      }
      
      // Obtener datos de filiación del contexto (ya cargados previamente)
      const filiacionData = getPatientFiliation(patientId);
      
      if (filiacionData) {
        console.log('Datos de filiación obtenidos del contexto:', filiacionData);
        
        // Actualizar el formulario con los datos de filiación
        setFormData(prev => {
          console.log('Actualizando formulario con datos de filiación:', filiacionData);
          return {
            ...prev,
            emergenciaId: emergencyIdToUse,
            orden: ordenToUse,
            cuentaId: cuentaIdToUse,
            estadoCivil: filiacionData.estadoCivil || prev.estadoCivil || '',
            direccion: filiacionData.direccion || prev.direccion || '',
            distrito: filiacionData.distrito || prev.distrito || '',
            telefono1: filiacionData.telefono1 || prev.telefono1 || '',
            telefono2: filiacionData.telefono2 || prev.telefono2 || '',
            nombre: filiacionData.nombre || prev.nombre || '',
            nombres: filiacionData.nombres || prev.nombres || '',
            apellidoPaterno: filiacionData.apellidoPaterno || prev.apellidoPaterno || '',
            apellidoMaterno: filiacionData.apellidoMaterno || prev.apellidoMaterno || '',
            tipoDocumento: filiacionData.tipoDocumento || prev.tipoDocumento || '',
            documento: filiacionData.documento || prev.documento || '',
            localidad: filiacionData.localidad || prev.localidad || '',
            seguro: filiacionData.seguro ? `${filiacionData.seguro} - ${filiacionData.descSeguro || ''}` : prev.seguro || '',
            religion: filiacionData.religion || prev.religion || '',
            COD_DISTRITO: filiacionData.COD_DISTRITO || prev.COD_DISTRITO || '',
            LUGAR_NACIMIENTO: filiacionData.LUGAR_NACIMIENTO || prev.LUGAR_NACIMIENTO || ''
          };
        });
      } else {
        console.log('No se encontraron datos de filiación para el paciente');
        
        // Actualizar el formulario solo con los IDs
        setFormData(prev => ({
          ...prev,
          emergenciaId: emergencyIdToUse,
          orden: ordenToUse,
          cuentaId: cuentaIdToUse
        }));
      }
      
      // Validar el formulario
      const validation = validateEmergencyForm(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        toast({
          title: "Error de validación",
          description: "Por favor complete todos los campos requeridos",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }
      
      // Extraer códigos de los valores seleccionados
      const consultorioCode = formData.consultorio.split(' - ')[0] || '';
      const motivoCode = formData.motivoEmergencia.split(' - ')[0] || '';
      const seguroCode = formData.seguro.split(' - ')[0] || '';
      
      // APLICAR CONVERSIÓN PARA SEGURO Y SEGUROLIQ
      let seguroValue = seguroCode;
      let seguroLiqValue = seguroCode;
      
      // Si el seguro mostrado en el formulario es PAGANTE, usar código 0 para ambos campos
      if (formData.seguro.includes('PAGANTE') || seguroCode === '0') {
        console.log('Estableciendo SEGURO y SEGUROLIQ como PAGANTE (0)');
        seguroValue = '0';
        seguroLiqValue = '0';
      } else if (seguroCode === '06') {
        console.log('Convirtiendo SEGURO y SEGUROLIQ de ESSALUD (06) a PAGANTE (0) en datos de API');
        seguroValue = '0';
        seguroLiqValue = '0';
      }
      
      console.log('Seguro seleccionado en formulario:', formData.seguro);
      console.log('Código de seguro extraído:', seguroCode);
      console.log('Valor SEGURO final:', seguroValue);
      console.log('Valor SEGUROLIQ final:', seguroLiqValue);
      
      // Formatear fecha como YYYYMMDD
      const fechaFormateada = formData.fecha.replace(/-/g, '');
      
      // Los datos de filiación ya están disponibles desde arriba
      
      // Verificar que tenemos los datos necesarios
      console.log('Datos de filiación para envío a API:', filiacionData);
      console.log('Cuenta ID que se usará en el envío:', cuentaIdToUse);
      
      // Preparar datos para enviar al servidor con límites de longitud adecuados
      const emergencyData = {
        EMERGENCIA_ID: emergencyIdToUse,
        PACIENTE: patientId,
        FECHA: fechaFormateada,
        HORA: formData.hora,
        CONSULTORIO: consultorioCode.padEnd(6, ' ').substring(0, 6),
        MOTIVO_EMERGENCIA: motivoCode.padEnd(2, ' ').substring(0, 2),
        SEGURO: seguroValue.padEnd(2, ' ').substring(0, 2), // Usar el valor convertido para SEGURO
        OBSERVACION1: (formData.observacion1 || '').substring(0, 100), // Limitar a 100 caracteres
        OBSERVACION2: (formData.observacion2 || '').substring(0, 100), // Limitar a 100 caracteres
        ESTADO: formData.estado.substring(0, 1), // Limitar a 1 caracter
        USUARIO: (primerApellido || 'SISTEMA').substring(0, 10), // Limitar a 10 caracteres
        // Campos adicionales
        ORDEN: (ordenToUse || '1').padStart(3, '0').substring(0, 3), // Formatear como '001' en lugar de '1'
        // Usar datos de filiación para los campos de nombre y apellidos
        PATERNO: (filiacionData && typeof filiacionData === 'object' && 'apellidoPaterno' in filiacionData ? String(filiacionData.apellidoPaterno) : formData.apellidoPaterno || '').substring(0, 30), // Limitar a 30 caracteres
        MATERNO: (filiacionData && typeof filiacionData === 'object' && 'apellidoMaterno' in filiacionData ? String(filiacionData.apellidoMaterno) : formData.apellidoMaterno || '').substring(0, 30), // Limitar a 30 caracteres
        NOMBRE: (filiacionData && typeof filiacionData === 'object' && 'nombre' in filiacionData ? String(filiacionData.nombre) : formData.nombres || '').substring(0, 30), // Limitar a 30 caracteres
        NOMBRES: (filiacionData && typeof filiacionData === 'object' && 'nombres' in filiacionData ? String(filiacionData.nombres) : `${formData.nombres || ''} ${formData.apellidoMaterno || ''} ${formData.apellidoPaterno || ''}`).trim().substring(0, 100),
        TIPO_DOCUMENTO: (filiacionData?.tipoDocumento || formData.tipoDocumento || '').padEnd(2, ' ').substring(0, 2), // Limitar a 2 caracteres
        DOCUMENTO: (formData.documento || '').substring(0, 15), // Limitar a 15 caracteres
        FECHA_NACIMIENTO: formData.fechaNacimiento ? formData.fechaNacimiento.replace(/-/g, '').substring(0, 8) : '', // Limitar a 8 caracteres
        EDAD: (filiacionData?.edad || formData.edad || '').substring(0, 10), // Limitar a 10 caracteres
        SEXO: (filiacionData?.sexo || formData.sexo || '').substring(0, 1), // Limitar a 1 caracter
        ESTADO_CIVIL: (filiacionData?.estadoCivil || formData.estadoCivil || '').padEnd(2, ' ').substring(0, 2), // Limitar a 2 caracteres
        DIRECCION: (filiacionData?.direccion || formData.direccion || '').substring(0, 100), // Limitar a 100 caracteres
        // Usar el valor de ubigeo (COD_DISTRITO) para el distrito
        DISTRITO: (filiacionData?.COD_DISTRITO || '').trim().substring(0, 7), // Limitar a 7 caracteres
        TELEFONO1: (filiacionData?.telefono1 || formData.telefono1 || '').substring(0, 20), // Limitar a 20 caracteres
        TELEFONO2: (filiacionData?.telefono2 || formData.telefono2 || '').substring(0, 20), // Limitar a 20 caracteres
        ACOMPANANTE: (formData.acompanante || '').substring(0, 100), // Limitar a 100 caracteres
        TIPO_DOCUMENTOA: (formData.tipoDocumentoA === 'D' ? 'D' : (formData.tipoDocumentoA || 'D')).substring(0, 2), // Asegurar que sea D por defecto
        DOCUMENTOA: (formData.documentoA || '').substring(0, 15), // Limitar a 15 caracteres
        PRE_AFILIACION: (formData.preAfiliacion || '').padEnd(1, ' ').substring(0, 1), // Limitar a 1 caracter
        LOCALIDAD: (filiacionData?.localidad || formData.localidad || '').padEnd(12, ' ').substring(0, 12), // Limitar a 12 caracteres
        TIPOATENCION: (formData.tipoAtencion || 'E').padEnd(1, ' ').substring(0, 1), // Limitar a 1 caracter
        RELIGION: (filiacionData?.religion || formData.religion || '0').padEnd(2, ' ').substring(0, 2), // Limitar a 2 caracteres
        SEGUROLIQ: seguroLiqValue.padEnd(2, ' ').substring(0, 2), // Limitar a 2 caracteres
        FORMA_INGRESO: (formData.formaIngreso === '1' ? '1' : (formData.formaIngreso || '1')).padEnd(1, ' ').substring(0, 1), // Asegurar que sea 1 (Caminando) por defecto
        CUENTAID: (cuentaIdToUse || '').padEnd(7, ' ').substring(0, 7) // Ajustar a Char(7) exactamente
      };
      
      // Log de los datos de filiación que se están usando
      console.log('Datos de filiación aplicados al envío:', filiacionData);
      
      // Imprimir longitudes de cada campo para depuración
      console.log('Longitudes de campos enviados a la API:');
      Object.entries(emergencyData).forEach(([key, value]) => {
        console.log(`${key}: ${value ? value.length : 0} caracteres - Valor: "${value}"`); 
      });
      
      // Logging específico para SEGURO y SEGUROLIQ
      console.log('VALORES FINALES DE SEGURO:');
      console.log(`SEGURO original del paciente: ${filiacionData?.seguro || 'No disponible'}`);
      console.log(`SEGURO seleccionado en formulario (código): ${seguroCode}`);
      console.log(`SEGURO convertido para API: ${seguroValue}`);
      console.log(`SEGUROLIQ convertido para API: ${seguroLiqValue}`);
      console.log(`SEGURO enviado a API: ${emergencyData.SEGURO}`);
      console.log(`SEGUROLIQ enviado a API: ${emergencyData.SEGUROLIQ}`);
      console.log(`¿SEGURO y SEGUROLIQ son iguales?: ${emergencyData.SEGURO === emergencyData.SEGUROLIQ ? 'SÍ' : 'NO'}`);
      
      // Determinar si es creación o actualización
      const method = emergencyId ? 'PATCH' : 'POST';
      const url = emergencyId ? `/api/emergencia/${emergencyId}` : '/api/emergencia';
      
      console.log('Enviando datos a la API:', { url, method, emergencyData });
      console.log('Valores finales para la emergencia:', { 
        emergenciaId: emergencyIdToUse, 
        orden: ordenToUse, 
        fecha: formData.fecha, 
        hora: formData.hora 
      });
      
      // Agregar un log detallado de los datos que se envían
      console.log('Datos completos enviados a la API:', JSON.stringify(emergencyData, null, 2));
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emergencyData),
      });
      
      // Log de la respuesta
      console.log('Respuesta de la API - Status:', response.status);
      if (!response.ok) {
        console.log('Error en la respuesta de la API');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Manejar errores específicos de estado
        if (response.status === 403 && errorData.statusInfo) {
          throw new Error(`No se puede editar: ${errorData.error}`);
        }
        
        throw new Error(errorData.error || 'Error al procesar la emergencia');
      }
      
      const result = await response.json();
      console.log('Emergencia procesada exitosamente:', result);
      
      // Llamar al endpoint para asegurar la cuenta si el seguro es "0", "02" o "17"
      // Extraer el código de seguro del resultado o de los datos del formulario
      const seguroCodeForAccount = result.data?.SEGUROLIQ?.trim() || 
                                   result.SEGUROLIQ?.trim() || 
                                   emergencyData?.SEGUROLIQ?.trim() ||
                                   formData.seguroLiq?.split(' - ')[0]?.trim();
      
      console.log('Código de seguro extraído para asegurar cuenta:', seguroCodeForAccount);
      
      if (seguroCodeForAccount && ["0", "02", "17"].includes(seguroCodeForAccount)) {
        try {
          console.log(`Asegurando cuenta para emergencia ${emergencyIdToUse} con seguro ${seguroCodeForAccount}...`);
          const pacienteData = result.data?.PACIENTE || result.PACIENTE || patientId;
          const nombreData = result.data?.NOMBRES?.trim() || 
                           result.NOMBRES?.trim() || 
                           formData.nombres || 
                           formData.nombre || '';
          
          console.log('Datos que se envían al endpoint:', {
            paciente: pacienteData,
            seguro: seguroCodeForAccount,
            usuario: primerApellido,
            nombre: nombreData
          });
          
          const asegurarResponse = await fetch(`/api/emergencia/${emergencyIdToUse}/asegurar-cuenta`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              paciente: pacienteData,
              seguro: seguroCodeForAccount,
              usuario: primerApellido,
              nombre: nombreData
            })
          });

          const asegurarResult = await asegurarResponse.json();
          console.log('Resultado de asegurar cuenta:', asegurarResult);
          
          if (asegurarResult.ok) {
            console.log(`Cuenta asegurada correctamente: ${asegurarResult.cuentaId || 'ID no disponible'}`);
            
            // Actualizar el registro de emergencia con el cuentaId si está disponible
            if (asegurarResult.cuentaId) {
              try {
                const updateResponse = await fetch(`/api/emergencia/${emergencyIdToUse}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    CUENTAID: asegurarResult.cuentaId
                  })
                });
                
                const updateResult = await updateResponse.json();
                if (updateResult.success) {
                  console.log(`Emergencia actualizada con CUENTAID: ${asegurarResult.cuentaId}`);
                } else {
                  console.error('Error al actualizar la emergencia con el CUENTAID:', updateResult.message);
                }
              } catch (updateError) {
                console.error('Error al actualizar la emergencia con el CUENTAID:', updateError);
              }
            } else {
              console.log('Cuenta asegurada pero no se retornó CUENTAID para actualizar');
            }
          } else {
            console.warn(`No se pudo asegurar la cuenta: ${asegurarResult.mensaje}`);
          }
        } catch (error) {
          console.error('Error al asegurar la cuenta:', error);
        }
      } else {
        console.log(`No se requiere asegurar cuenta para seguro: ${seguroCodeForAccount}`);
      }
      
      // Mostrar mensaje de éxito
      if (!isModal) {
        toast({
          title: emergencyId ? "Emergencia actualizada" : "Emergencia creada",
          description: `Se ha ${emergencyId ? 'actualizado' : 'creado'} la emergencia correctamente`,
          variant: "default"
        });
        
        // Redirigir a la lista de emergencias SOLO si no estamos en un modal
        // Comprobación adicional para asegurar que no redirigimos desde un modal
        if (window && window.location.pathname.includes('/emergency/register/') || 
            window.location.pathname.includes('/emergency/view/')) {
          router.push(`/emergency/${patientId}`);
        }
      } else {
        // En modo modal, usar callback de éxito
        if (onSuccess) {
          onSuccess(result);
        } else {
          // Si estamos en modal pero no hay callback de éxito, mostrar toast
          toast({
            title: emergencyId ? "Emergencia actualizada" : "Emergencia creada",
            description: `Se ha ${emergencyId ? 'actualizado' : 'creado'} la emergencia correctamente`,
            variant: "default"
          });
        }
      }
      
    } catch (err: any) {
      console.error('Error al procesar el formulario:', err);
      
      // Manejar diferentes tipos de errores
      let errorTitle = "Error";
      let errorMessage = err.message;
      
      // Detectar errores específicos por mensaje
      if (err.message.includes('No se puede editar')) {
        errorTitle = "No se puede editar";
        // El mensaje ya viene formateado desde la API
      } else if (err.message.includes('validación')) {
        errorTitle = "Error de validación";
      } else if (err.message.includes('conexión') || err.message.includes('network')) {
        errorTitle = "Error de conexión";
        errorMessage = "Problemas de conexión con el servidor. Por favor intente nuevamente.";
      } else if (err.message.includes('permiso') || err.message.includes('autorización')) {
        errorTitle = "Error de permisos";
        errorMessage = "No tiene permisos para realizar esta operación.";
      }
      
      if (!isModal) {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        
        // Si es un error de permisos o estado, mostrar alerta adicional
        if (err.message.includes('No se puede editar')) {
          setError(errorMessage);
          setShowErrorAlert(true);
        }
      } else {
        // En modo modal, usar callback de error
        if (onError) {
          onError(errorMessage);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar cancelación del formulario
  const handleCancel = () => {
    if (isModal && onBack) {
      // En modo modal, usar el callback onBack para volver al modal anterior
      onBack();
    } else {
      // Verificar si estamos en una página de emergencia antes de redirigir
      if (window && (window.location.pathname.includes('/emergency/register/') || 
          window.location.pathname.includes('/emergency/view/'))) {
        // En modo página, usar router para navegar
        router.push(`/emergency/${patientId}`);
      } else if (onBack) {
        // Si no estamos en una página de emergencia pero tenemos onBack, usarlo
        onBack();
      }
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
        estado: emergencyData.ESTADO || ''
      });
      
      // Si hay CUENTAID en los datos de emergencia, actualizarlo
      if (emergencyData.CUENTAID) {
        setCuentaId(emergencyData.CUENTAID);
      }
    }
    setLoading(false);
  }, [emergencyData]);
  
  // Cargar cuenta del paciente al iniciar
  useEffect(() => {
    if (patientId && !cuentaId) {
      const loadAccount = async () => {
        const accountData = await fetchPatientAccount(patientId);
        if (accountData?.cuentaId) {
          setCuentaId(accountData.cuentaId);
        } else {
          setCuentaId(null);
        }
      };
      loadAccount();
    }
  }, [patientId, fetchPatientAccount, cuentaId]);

  return (
    <form id="emergency-form" onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <Toaster />
      
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
                  if (value) {
                    let seguroCode = value.split(' - ')[0].trim();
                    // Aplicar conversión de ESSALUD (06) a PAGANTE (0)
                    if (seguroCode === '06') {
                      seguroCode = '0';
                      console.log('Código de seguro convertido de 06 a 0 (PAGANTE) para insuranceCode desde selector');
                    }
                    setInsuranceCode(seguroCode);
                    console.log('Código de seguro actualizado desde selector:', seguroCode);
                    
                    // Buscar cuenta por tipo de seguro si tenemos un paciente
                    if (patientId) {
                      try {
                        console.log(`=== CAMBIO DE SEGURO DETECTADO EN REGISTRO ===`);
                        console.log(`Seguro: ${seguroCode}, Paciente: ${patientId}`);
                        
                        const accountData = await fetchPatientAccountBySeguro(patientId, seguroCode);
                        
                        if (accountData && accountData.cuentaId) {
                          console.log(`Cuenta encontrada: ${accountData.cuentaId}`);
                          // Actualizar tanto cuentaId como numeroCuenta en el formulario
                          setFormData(prev => ({
                            ...prev,
                            cuentaId: accountData.cuentaId,
                            numeroCuenta: accountData.cuentaId,
                          }));
                          
                          toast({
                            title: 'Cuenta actualizada',
                            description: `Se encontró y asignó la cuenta ${accountData.cuentaId} para el tipo de seguro seleccionado`,
                          });
                        } else {
                          console.log(`No se encontró cuenta para el seguro ${seguroCode}`);
                          // Limpiar tanto cuentaId como numeroCuenta si no se encuentra cuenta
                          setFormData(prev => ({
                            ...prev,
                            cuentaId: '',
                            numeroCuenta: '',
                          }));
                          
                          toast({
                            title: 'Cuenta no encontrada',
                            description: `No se encontró una cuenta activa para el tipo de seguro seleccionado. Se creará una nueva cuenta al guardar.`,
                            variant: 'destructive',
                          });
                        }
                      } catch (error) {
                        console.error('Error al buscar cuenta por seguro:', error);
                        toast({
                          title: 'Error',
                          description: 'Error al buscar cuenta por tipo de seguro',
                          variant: 'destructive',
                        });
                      }
                    }
                  }
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
          console.log('Datos del formulario a validar:', formData);
          const validation = validateEmergencyForm(formData);
          console.log('Resultado de validación:', validation);
          if (!validation.isValid) {
            setValidationErrors(validation.errors);
            
            // Mostrar errores de validación más específicos
            const errorCount = Object.keys(validation.errors).length;
            console.log('Errores de validación encontrados:', errorCount);
            console.log('Campos con error:', validation.errors);
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
