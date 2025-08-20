"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Save } from "lucide-react"

// Componentes modulares para emergencia
import { PatientSectionEmergency } from './PatientSectionEmergency'
import { EmergencySection } from './EmergencySection'
import { AdditionalFieldsSection } from './AdditionalFieldsSection'
import { FormActionsEmergency } from './FormActionsEmergency'
import { FormHeaderEmergency } from './FormHeaderEmergency'
import { EmergencyDetails } from './EmergencyDetails'
import { validateEmergencyForm } from './FormValidatorEmergency'
import { useSelectsState } from './FormUtilsEmergency'

// Tipos para emergencia (simplified for now)
interface MotivoEmergencia {
  MOTIVO_EMERGENCIA: string;
  NOMBRE: string;
}

interface Consultorio {
  CONSULTORIO: string;
  NOMBRE: string;
}

interface Medico {
  MEDICO: string;
  NOMBRE: string;
}

interface Seguro {
  SEGURO: string;
  NOMBRE: string;
}

interface Diagnostico {
  CODIGO: string;
  DESCRIPCION: string;
}

import { useAuth } from '@/components/AuthProvider';

interface EmergencyFormProps {
  patientId: string;
  emergencyId?: string | null;
  emergencyData?: any;
  readOnly?: boolean;
}

export function EmergencyFormRefactored({ patientId, emergencyId, emergencyData, readOnly = false }: EmergencyFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Estado para loading y error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isEditable, setIsEditable] = useState(true);
  const [fieldsLocked, setFieldsLocked] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  
  // Estado para motivos de emergencia
  const [motivos, setMotivos] = useState<MotivoEmergencia[]>([]);
  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [selectedMotivo, setSelectedMotivo] = useState<MotivoEmergencia | null>(null);
  const [searchMotivo, setSearchMotivo] = useState('');
  
  // Estado para consultorios
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [loadingConsultorios, setLoadingConsultorios] = useState(false);
  const [selectedConsultorio, setSelectedConsultorio] = useState<Consultorio | null>(null);
  const [searchConsultorio, setSearchConsultorio] = useState('');
  
  // Estado para médicos
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);
  const [searchMedico, setSearchMedico] = useState('');
  
  // Estado para formas de ingreso
  const [formasIngreso, setFormasIngreso] = useState<any[]>([]);
  const [loadingFormasIngreso, setLoadingFormasIngreso] = useState(false);
  const [selectedFormaIngreso, setSelectedFormaIngreso] = useState<any | null>(null);
  const [searchFormaIngreso, setSearchFormaIngreso] = useState('');

  // Estado para seguros
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [loadingSeguros, setLoadingSeguros] = useState(false);
  const [selectedSeguro, setSelectedSeguro] = useState<Seguro | null>(null);
  const [searchSeguro, setSearchSeguro] = useState('');
  
  // Estado para diagnósticos
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(false);
  const [selectedDiagnostico, setSelectedDiagnostico] = useState<Diagnostico | null>(null);
  const [searchDiagnostico, setSearchDiagnostico] = useState('');

  // Get current date and time
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // formato YYYY-MM-DD para input type="date"
  const currentTime = now.toTimeString().substring(0, 5); // formato HH:MM para input type="time"
  
  // Estado para los selectores abiertos
  const { openSelects, toggleSelect, closeAllSelects } = useSelectsState();
  
  // Initialize form data with empty values
  const [formData, setFormData] = useState({
    patientId: patientId,
    emergencyId: '',
    fecha: currentDate,
    hora: currentTime,
    consultorio: '',
    medico: '',
    motivoEmergencia: '',
    seguro: '',
    diagnostico: '',
    observacion1: '',
    observacion2: '',
    estado: '1', // 1 = REGISTRADO
    // Campos del paciente
    paciente: patientId,
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
    usuario: user?.sub || 'SISTEMA'
  });

  // Función para manejar los datos del paciente cargados desde PatientInfoCard
  const handlePatientDataLoaded = useCallback((data: any) => {
    setPatientData(data);
    // Actualizar formData con los datos del paciente
    setFormData(prev => ({
      ...prev,
      nombres: data.nombres || '',
      apellidoPaterno: data.apellidoPaterno || '',
      apellidoMaterno: data.apellidoMaterno || '',
      documento: data.documento || '',
      fechaNacimiento: data.fechaNacimiento || '',
      edad: data.edad || '',
      sexo: data.sexo || ''
    }));
  }, []);

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
      medico: data.medico,
      motivoEmergencia: data.motivoEmergencia,
      seguro: data.seguro,
      diagnostico: data.diagnostico,
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

  // Función para obtener la cuenta activa del paciente
  const fetchPatientAccount = async (patientId: string) => {
    try {
      const response = await fetch(`/api/cuenta/${patientId}`);
      if (!response.ok) {
        console.error('Error al obtener la cuenta del paciente:', response.statusText);
        return null;
      }
      const result = await response.json();
      console.log('Datos de cuenta obtenidos:', result);
      
      if (!result.success || !result.data) {
        console.error('Formato de respuesta inválido para cuenta');
        return null;
      }
      
      return result.data.cuentaId;
    } catch (error) {
      console.error('Error al obtener la cuenta del paciente:', error);
      return null;
    }
  };

  // Función para obtener los datos de filiación del paciente
  const fetchPatientFiliation = async (patientId: string) => {
    try {
      // Usar la API existente con el parámetro id
      const response = await fetch(`/api/filiacion2/${patientId}`);
      if (!response.ok) {
        console.error('Error al obtener datos de filiación:', response.statusText);
        return null;
      }
      const result = await response.json();
      console.log('Datos de filiación obtenidos:', result);
      
      if (!result.success || !result.data) {
        console.error('Formato de respuesta inválido para filiación');
        return null;
      }
      
      // Mapear los campos de la API de filiación a los campos que necesitamos
      return {
        estadoCivil: result.data.ESTADO_CIVIL || '',
        direccion: result.data.DIRECCION || '',
        // Usar Expr2 para el distrito si está disponible, de lo contrario usar DISTRITO
        distrito: result.data.Expr2 ? result.data.Expr2.trim() : (result.data.DISTRITO || ''),
        telefono1: result.data.TELEFONO1 || '',
        telefono2: result.data.TELEFONO2 || '',
        tipoDocumento: result.data.NOMBRE_DOCUMENTO === 'DNI' ? 'D' : result.data.NOMBRE_DOCUMENTO || '',
        documento: result.data.DOCUMENTO || '',
        // Asegurarse de eliminar espacios en blanco adicionales
        localidad: result.data.LOCALIDAD ? result.data.LOCALIDAD.trim() : ''
      };
    } catch (error) {
      console.error('Error al obtener datos de filiación:', error);
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
        
        // Obtener la cuenta activa del paciente
        const cuentaId = await fetchPatientAccount(patientId);
        if (cuentaId) {
          console.log('Cuenta activa del paciente obtenida:', cuentaId);
          cuentaIdToUse = cuentaId;
        } else {
          console.log('No se encontró cuenta activa para el paciente');
        }
        
        // Obtener los datos de filiación del paciente
        const filiacionData = await fetchPatientFiliation(patientId);
        if (filiacionData) {
          console.log('Datos de filiación obtenidos:', filiacionData);
          
          // Actualizar el formulario con los datos de filiación
          setFormData(prev => ({
            ...prev,
            emergenciaId: emergencyIdToUse,
            orden: ordenToUse,
            cuentaId: cuentaIdToUse,
            estadoCivil: filiacionData.estadoCivil || prev.estadoCivil || '',
            direccion: filiacionData.direccion || prev.direccion || '',
            distrito: filiacionData.distrito || prev.distrito || '',
            telefono1: filiacionData.telefono1 || prev.telefono1 || '',
            telefono2: filiacionData.telefono2 || prev.telefono2 || '',
            tipoDocumento: filiacionData.tipoDocumento || prev.tipoDocumento || '',
            documento: filiacionData.documento || prev.documento || '',
            localidad: filiacionData.localidad || prev.localidad || ''
          }));
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
      const medicoCode = formData.medico.split(' - ')[0] || '';
      const motivoCode = formData.motivoEmergencia.split(' - ')[0] || '';
      const seguroCode = formData.seguro.split(' - ')[0] || '';
      const diagnosticoCode = formData.diagnostico.split(' - ')[0] || '';
      
      // Usar el mismo valor de seguro para seguroLiq
      const seguroLiqValue = seguroCode;
      
      // Formatear fecha como YYYYMMDD
      const fechaFormateada = formData.fecha.replace(/-/g, '');
      
      // Preparar datos para enviar al servidor
      const emergencyData = {
        EMERGENCIA_ID: emergencyIdToUse,
        PACIENTE: patientId,
        FECHA: fechaFormateada,
        HORA: formData.hora,
        CONSULTORIO: consultorioCode,
        MEDICO: medicoCode.padEnd(4, ' ').substring(0, 4),
        MOTIVO_EMERGENCIA: motivoCode.padEnd(2, ' ').substring(0, 2),
        SEGURO: seguroCode.padEnd(3, ' ').substring(0, 3),
        CIEX1: diagnosticoCode,
        OBSERVACION1: formData.observacion1 || '',
        OBSERVACION2: formData.observacion2 || '',
        ESTADO: formData.estado,
        USUARIO: user?.sub || 'SISTEMA',
        // Campos adicionales
        ORDEN: ordenToUse, // Usar el valor obtenido de la API
        PATERNO: formData.apellidoPaterno || '',
        MATERNO: formData.apellidoMaterno || '',
        NOMBRE: formData.nombres || '',
        NOMBRES: `${formData.apellidoPaterno} ${formData.apellidoMaterno} ${formData.nombres}`.trim(),
        TIPO_DOCUMENTO: formData.tipoDocumento || '',
        DOCUMENTO: formData.documento || '',
        FECHA_NACIMIENTO: formData.fechaNacimiento ? formData.fechaNacimiento.replace(/-/g, '') : '',
        EDAD: formData.edad || '',
        SEXO: formData.sexo || '',
        ESTADO_CIVIL: formData.estadoCivil || '',
        DIRECCION: formData.direccion || '',
        // Usar el valor de distrito que ahora contiene Expr2 (150701)
        DISTRITO: formData.distrito || '',
        TELEFONO1: formData.telefono1 || '',
        TELEFONO2: formData.telefono2 || '',
        ACOMPANANTE: formData.acompanante || '',
        TIPO_DOCUMENTOA: formData.tipoDocumentoA || '',
        DOCUMENTOA: formData.documentoA || '',
        PRE_AFILIACION: formData.preAfiliacion || '',
        LOCALIDAD: formData.localidad || '',
        TIPOATENCION: formData.tipoAtencion || 'E',
        RELIGION: formData.religion || '0',
        SEGUROLIQ: seguroLiqValue || formData.seguroLiq || seguroCode || '',
        FORMA_INGRESO: formData.formaIngreso || '3',
        CUENTAID: formData.cuentaId || ''
      };
      
      // Determinar si es creación o actualización
      const method = emergencyId ? 'PATCH' : 'POST';
      const url = emergencyId ? `/api/emergencia/${emergencyId}` : '/api/emergencia/create';
      
      console.log('Enviando datos a la API:', { url, method, emergencyData });
      console.log('Valores finales para la emergencia:', { 
        emergenciaId: emergencyIdToUse, 
        orden: ordenToUse, 
        fecha: formData.fecha, 
        hora: formData.hora 
      });
      
      // Generar estructura SQL INSERT
      // Usar los valores del formulario para fecha y hora
      const formattedDate = formData.fecha ? formData.fecha.replace(/-/g, '') : fechaFormateada;
      const formattedTime = formData.hora || '';
      
      const sqlInsert = `INSERT INTO Emergencia (
    EMERGENCIA_ID,
    FECHA,
    HORA,
    ORDEN,
    PATERNO,
    MATERNO,
    NOMBRE,
    NOMBRES,
    PACIENTE,
    FECHA_NACIMIENTO,
    EDAD,
    SEXO,
    ESTADO_CIVIL,
    DIRECCION,
    DISTRITO,
    TELEFONO1,
    TELEFONO2,
    TIPO_DOCUMENTO,
    DOCUMENTO,
    ACOMPANANTE,
    TIPO_DOCUMENTOA,
    DOCUMENTOA,
    CONSULTORIO,
    MOTIVO_EMERGENCIA,
    SEGURO,
    OBSERVACION1,
    OBSERVACION2,
    ESTADO,
    CUENTAID,
    USUARIO,
    PRE_AFILIACION,
    LOCALIDAD,
    TIPOATENCION,
    RELIGION,
    SEGUROLIQ,
    FORMA_INGRESO
) VALUES (
    '${emergencyIdToUse}',           -- EMERGENCIA_ID
    '${formattedDate}',           -- FECHA
    '${formattedTime}',              -- HORA
    '${ordenToUse}',                -- ORDEN
    '${emergencyData.PATERNO || ''}',            -- PATERNO
    '${emergencyData.MATERNO || ''}',             -- MATERNO
    '${emergencyData.NOMBRE || ''}',       -- NOMBRE
    '${emergencyData.NOMBRES || ''}', -- NOMBRES
    '${patientId || ''}',         -- PACIENTE
    '${emergencyData.FECHA_NACIMIENTO ? emergencyData.FECHA_NACIMIENTO.replace(/-/g, '') : ''}',           -- FECHA_NACIMIENTO
    '${emergencyData.EDAD || ''}',         -- EDAD
    '${emergencyData.SEXO || ''}',                  -- SEXO
    '${(formData.estadoCivil || emergencyData.ESTADO_CIVIL || '').padEnd(2, ' ').substring(0, 2)}',                 -- ESTADO_CIVIL
    '${formData.direccion || emergencyData.DIRECCION || ''}', -- DIRECCION
    '${(formData.distrito || '150701').padEnd(7, ' ').substring(0, 7)}',            -- DISTRITO (usando Expr2)
    '${formData.telefono1 || emergencyData.TELEFONO1 || ''}',            -- TELEFONO1
    '${formData.telefono2 || emergencyData.TELEFONO2 || ''}',          -- TELEFONO2
    '${(formData.tipoDocumento || emergencyData.TIPO_DOCUMENTO || '').padEnd(2, ' ').substring(0, 2)}',                 -- TIPO_DOCUMENTO
    '${formData.documento || emergencyData.DOCUMENTO || ''}',           -- DOCUMENTO
    '${emergencyData.ACOMPANANTE || ''}',               -- ACOMPANANTE
    '${(emergencyData.TIPO_DOCUMENTOA || '').padEnd(2, ' ').substring(0, 2)}',                 -- TIPO_DOCUMENTOA
    '${emergencyData.DOCUMENTOA || ''}',           -- DOCUMENTOA
    '${(emergencyData.CONSULTORIO || '').padEnd(6, ' ').substring(0, 6)}',             -- CONSULTORIO
    '${(emergencyData.MOTIVO_EMERGENCIA || '').padEnd(2, ' ').substring(0, 2)}',                  -- MOTIVO_EMERGENCIA
    '${(emergencyData.SEGURO || '').padEnd(3, ' ').substring(0, 3)}',                -- SEGURO
    '${emergencyData.OBSERVACION1 || ''}',                  -- OBSERVACION1
    '${emergencyData.OBSERVACION2 || ''}',                  -- OBSERVACION2
    '${emergencyData.ESTADO || '2'}',                  -- ESTADO
    '${cuentaIdToUse}',                  -- CUENTAID
    '${emergencyData.USUARIO || 'SUPERVISOR'}',         -- USUARIO
    '${(emergencyData.PRE_AFILIACION || '').padEnd(1, ' ').substring(0, 1)}',                  -- PRE_AFILIACION
    '${(formData.localidad || emergencyData.LOCALIDAD || '').padEnd(12, ' ').substring(0, 12)}',       -- LOCALIDAD
    '${(emergencyData.TIPOATENCION || 'E').padEnd(1, ' ').substring(0, 1)}',                  -- TIPOATENCION
    '${(emergencyData.RELIGION || '0').padEnd(2, ' ').substring(0, 2)}',                  -- RELIGION
    '${(seguroLiqValue || emergencyData.SEGUROLIQ || emergencyData.SEGURO || '').padEnd(2, ' ').substring(0, 2)}',                -- SEGUROLIQ
    '${(emergencyData.FORMA_INGRESO || '1').padEnd(1, ' ').substring(0, 1)}'                   -- FORMA_INGRESO
);`;
      
      console.log('SQL INSERT Statement:', sqlInsert);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emergencyData),
      });
      
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
      
      // Mostrar mensaje de éxito
      toast({
        title: emergencyId ? "Emergencia actualizada" : "Emergencia creada",
        description: `Se ha ${emergencyId ? 'actualizado' : 'creado'} la emergencia correctamente`,
        variant: "default"
      });
      
      // Redirigir a la lista de emergencias
      router.push(`/emergency/${patientId}`);
      
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
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar cancelación del formulario
  const handleCancel = () => {
    router.push(`/emergency/${patientId}`);
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
          'medico': 'Médico',
          'seguro': 'Seguro',
          'diagnostico': 'Diagnóstico',
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
    }
    setLoading(false);
  }, [emergencyData]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <Toaster />
      {showErrorAlert && error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar with Patient Information */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="p-6">
              <PatientSectionEmergency
                patientId={patientId}
                onPatientDataLoaded={handlePatientDataLoaded}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Main form content */}
        <div className="lg:col-span-2">
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
                onSeguroChange={(value: string, seguroData: any) => {
                  setFormData(prev => ({
                    ...prev,
                    seguro: value
                  }));
                  setSelectedSeguro(seguroData || null);
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
                'medico': 'Médico',
                'seguro': 'Seguro',
                'diagnostico': 'Diagnóstico',
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
