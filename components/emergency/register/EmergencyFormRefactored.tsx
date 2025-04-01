"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
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
}

export function EmergencyFormRefactored({ patientId, emergencyId }: EmergencyFormProps) {
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
    setIsEditable(isEditable);
    setFieldsLocked(isLocked);
    setLoading(false);
  };

  // Función para obtener el siguiente ID de emergencia
  const fetchNextEmergencyId = async () => {
    try {
      const response = await fetch('/api/emergencia?next-id=true');
      if (!response.ok) {
        throw new Error('Error al obtener el siguiente ID de emergencia');
      }
      const data = await response.json();
      return data.nextId;
    } catch (error) {
      console.error('Error al obtener el siguiente ID:', error);
      return null;
    }
  };

  // Función para procesar el formulario (solo se ejecuta después de la confirmación)
  const processForm = async () => {
    try {
      setSubmitting(true);
      
      // Obtener el siguiente ID de emergencia si es creación
      let emergencyIdToUse = emergencyId;
      if (!emergencyIdToUse) {
        const nextId = await fetchNextEmergencyId();
        if (!nextId) {
          toast({
            title: "Error",
            description: "No se pudo obtener un ID de emergencia",
            variant: "destructive"
          });
          setSubmitting(false);
          return;
        }
        emergencyIdToUse = nextId;
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
      
      // Formatear fecha como YYYYMMDD
      const fechaFormateada = formData.fecha.replace(/-/g, '');
      
      // Preparar datos para enviar al servidor
      const emergencyData = {
        EMERGENCIA_ID: emergencyIdToUse,
        PACIENTE: patientId,
        FECHA: fechaFormateada,
        HORA: formData.hora,
        CONSULTORIO: consultorioCode,
        MEDICO: medicoCode,
        MOTIVO_EMERGENCIA: motivoCode,
        SEGURO: seguroCode,
        CIEX1: diagnosticoCode,
        OBSERVACION1: formData.observacion1 || '',
        OBSERVACION2: formData.observacion2 || '',
        ESTADO: formData.estado,
        USUARIO: user?.sub || 'SISTEMA',
        // Campos adicionales
        ORDEN: formData.orden || '',
        NOMBRES: `${formData.apellidoPaterno} ${formData.apellidoMaterno} ${formData.nombres}`.trim(),
        TIPO_DOCUMENTO: formData.tipoDocumento || '',
        DOCUMENTO: formData.documento || '',
        FECHA_NACIMIENTO: formData.fechaNacimiento || '',
        EDAD: formData.edad || '',
        SEXO: formData.sexo || '',
        ESTADO_CIVIL: formData.estadoCivil || '',
        DIRECCION: formData.direccion || '',
        DISTRITO: formData.distrito || '',
        TELEFONO1: formData.telefono1 || '',
        TELEFONO2: formData.telefono2 || '',
        ACOMPANANTE: formData.acompanante || '',
        TIPO_DOCUMENTOA: formData.tipoDocumentoA || '',
        DOCUMENTOA: formData.documentoA || '',
        PRE_AFILIACION: formData.preAfiliacion || '',
        LOCALIDAD: formData.localidad || '',
        TIPOATENCION: formData.tipoAtencion || '',
        RELIGION: formData.religion || '',
        SEGUROLIQ: formData.seguroLiq || '',
        FORMA_INGRESO: formData.formaIngreso || '',
        CUENTAID: formData.cuentaId || ''
      };
      
      // Determinar si es creación o actualización
      const method = emergencyId ? 'PUT' : 'POST';
      const url = emergencyId ? `/api/emergencia/${emergencyId}` : '/api/emergencia/create';
      
      console.log('Enviando datos a la API:', { url, method, emergencyData });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emergencyData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
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
      router.push(`/hospitalization/emergency/${patientId}`);
      
    } catch (err: any) {
      console.error('Error al procesar el formulario:', err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar cancelación del formulario
  const handleCancel = () => {
    router.push(`/hospitalization/emergency/${patientId}`);
  };
  
  // Función para manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateEmergencyForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({
        title: "Error de validación",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  // Cargar datos iniciales
  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <Toaster />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar with Patient Information */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="pt-6">
              <PatientSectionEmergency
                patientId={patientId}
                onPatientDataLoaded={handlePatientDataLoaded}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Main form content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {/* Form Header - Fecha y hora */}
              <FormHeaderEmergency
                fecha={formData.fecha}
                hora={formData.hora}
                onFechaChange={(value) => handleFormChange('fecha', value)}
                onHoraChange={(value) => handleFormChange('hora', value)}
                disabled={fieldsLocked}
                validationErrors={validationErrors}
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
        onBeforeSave={async () => {
          const validation = validateEmergencyForm(formData);
          if (!validation.isValid) {
            setValidationErrors(validation.errors);
            toast({
              title: "Error de validación",
              description: "Por favor complete todos los campos obligatorios",
              variant: "destructive"
            });
            return false;
          }
          return true;
        }}
      />
    </form>
  );
}
