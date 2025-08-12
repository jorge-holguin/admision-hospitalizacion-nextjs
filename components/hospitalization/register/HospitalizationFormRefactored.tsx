"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"
import { useDocumentPrinter } from '@/components/hospitalization/DocumentPrinter'
import { printMultiplePdfsViaDirectApi, printMergedPDF } from '@/utils/pdfUtils'

// Componentes reutilizables
import { PatientInfoCard } from '@/components/hospitalization/PatientInfoCard'
import { OrigenSelector } from '@/components/hospitalization/OrigenSelector'
import { ConsultorioSelector } from '@/components/hospitalization/ConsultorioSelector'
import { MedicoSelector } from '@/components/hospitalization/MedicoSelector'
import { SeguroSelector } from '@/components/hospitalization/SeguroSelector'
import { DiagnosticoSelector } from '@/components/hospitalization/DiagnosticoSelector'
import { ProcedenciaSelector } from '@/components/hospitalization/ProcedenciaSelector';
import { DateTimeFields } from '@/components/hospitalization/DateTimeFields'

// Componentes nuevos refactorizados
import { CompanionForm } from './CompanionForm'
import { FormActions } from './FormActions'
import { HospitalizationDetails } from './HospitalizationDetails'
import { validateHospitalizationForm } from './FormValidator'
import { useSelectsState } from './FormUtils'
import FuaStatusAlert from './FuaStatusAlert'
import VerificacionDiagnostico, { VerificacionDiagnosticoRef } from '@/components/ui/VerificacionDiagnostico'

// Tipos
import { OrigenHospitalizacion } from '@/services/origenHospitalizacionService'
import { Seguro } from '@/services/seguroService'
import { Diagnostico } from '@/services/diagnosticoService'

import { useAuth } from '@/components/AuthProvider';

interface HospitalizationFormProps {
  patientId: string;
  orderId?: string | null;
}

const API_BACKEND_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL;

export function HospitalizationFormRefactored({ patientId, orderId }: HospitalizationFormProps) {
  const router = useRouter();
  const { user } = useAuth(); // Moved inside the component
  const verificacionDiagnosticoRef = useRef<VerificacionDiagnosticoRef>(null);
  
  // Estado para loading y error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filiacionData, setFiliacionData] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isEditable, setIsEditable] = useState(true);
  const [fieldsLocked, setFieldsLocked] = useState(false);
  
  // Utilizar el hook de impresión directa con callback de redirección
  const { handleDirectPrint } = useDocumentPrinter({
    onPrintComplete: () => {
      // Redirigir a la lista de órdenes después de iniciar la impresión
      router.push(`/hospitalization/orders/${patientId}`);
    }
  });
  
  // Estos handlers se definen más abajo
  
  // Estado para el origen de hospitalización
  const [origenes, setOrigenes] = useState<OrigenHospitalizacion[]>([])
  const [loadingOrigenes, setLoadingOrigenes] = useState(false)
  const [searchOrigin, setSearchOrigin] = useState('')
  const [selectedOrigin, setSelectedOrigin] = useState<OrigenHospitalizacion | null>(null)
  const [showAllOrigins, setShowAllOrigins] = useState(false)
  
  // Estado para los seguros
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [loadingSeguros, setLoadingSeguros] = useState(false);
  const [selectedSeguro, setSelectedSeguro] = useState<Seguro | null>(null);
  const [searchSeguro, setSearchSeguro] = useState('');
  
  // Estado para los diagnósticos
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(false);
  const [selectedDiagnostico, setSelectedDiagnostico] = useState<Diagnostico | null>(null);
  const [searchDiagnostico, setSearchDiagnostico] = useState('');
  
  // Estado para los departamentos de hospital
  const [departamentos, setDepartamentos] = useState<{CONSULTORIO: string, NOMBRE: string}[]>([])
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false)
  const [searchDepartamento, setSearchDepartamento] = useState('')
  const [selectedDepartamento, setSelectedDepartamento] = useState<{CONSULTORIO: string, NOMBRE: string} | null>(null);
  
  // Estado para médicos
  const [medicos, setMedicos] = useState<any[]>([]);
  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [searchMedico, setSearchMedico] = useState('');
  const [selectedMedico, setSelectedMedico] = useState<any | null>(null);

  // Get current date and time
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // formato YYYY-MM-DD para input type="date"
  const currentTime = now.toTimeString().substring(0, 5); // formato HH:MM para input type="time"
  
  // Estado para los selectores abiertos
  const { openSelects, toggleSelect, closeAllSelects } = useSelectsState();
  
  // Initialize form data with empty values
  const [formData, setFormData] = useState({
    patientId: patientId,
    hospitalizationId: '',
    hospitalizedIn: '',
    attentionOrigin: '',
    authorizingDoctor: '',
    diagnosis: '',
    financing: '',
    date: currentDate, // Inicializar con la fecha actual en formato YYYY-MM-DD
    time: currentTime, // Inicializar con la hora actual en formato HH:MM
    hospitalizationDate: currentDate, // Cambiado de Date a string para resolver errores de TypeScript
    hospitalizationTime: '',
    dischargeDate: '', // Cambiado de null a string vacía para resolver errores de TypeScript
    dischargeTime: '',
    companionName: '',
    companionPhone: '',
    hospitalizationOrigin: '', // Añadido para resolver errores de TypeScript
    historyNumber: '', // Añadido para resolver errores de TypeScript
    paternalSurname: '', // Añadido para resolver errores de TypeScript
    maternalSurname: '', // Añadido para resolver errores de TypeScript
    names: '', // Añadido para resolver errores de TypeScript
    document: '', // Añadido para resolver errores de TypeScript
    sex: '', // Añadido para resolver errores de TypeScript
    birthDate: '', // Añadido para resolver errores de TypeScript
    age: '', // Añadido para resolver errores de TypeScript
    insurance: '', // Añadido para resolver errores de TypeScript
    companionRelationship: '',
    companionAddress: '',
    companionDni: '',
    companionEmail: '',
    observations: '',
    status: 'PENDIENTE',
    procedencia: 'EM', // Valor por defecto: Emergencia
  });

  // Función para manejar los datos del paciente cargados desde PatientInfoCard
  const handlePatientDataLoaded = useCallback((data: any) => {
    // Actualizar formData con los datos del paciente
    setFormData(prev => ({
      ...prev,
      historyNumber: data.historyNumber,
      paternalSurname: data.paternalSurname,
      maternalSurname: data.maternalSurname,
      names: data.names,
      document: data.document,
      sex: data.sex,
      birthDate: data.birthDate,
      age: data.age,
      insurance: data.insurance
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

  // Manejar datos de hospitalización cargados
  const handleHospitalizationDataLoaded = (data: any) => {
    // Actualizar formData con los datos de la orden
    setFormData(prev => ({
      ...prev,
      date: data.date,
      time: data.time,
      hospitalizationOrigin: data.hospitalizationOrigin,
      attentionOrigin: data.attentionOrigin,
      hospitalizedIn: data.hospitalizedIn,
      authorizingDoctor: data.authorizingDoctor,
      financing: data.financing,
      diagnosis: data.diagnosis
    }));
    
    // Si hay datos de filiación en la respuesta, actualizar el estado
    if (data.rawData) {
      setFiliacionData(data.rawData);
    }
    
    if (data.origenData) {
      setSelectedOrigin(data.origenData);
    }
    
    if (data.diagnosticoData) {
      setSelectedDiagnostico(data.diagnosticoData);
    }
    
    setLoading(false);
  };

  // Manejar cambio de estado de edición
  const handleStatusChange = (isEditable: boolean, isLocked: boolean) => {
    setIsEditable(isEditable);
    setFieldsLocked(isLocked);
    setLoading(false);
  };

  // Función para obtener el siguiente ID de hospitalización
  const fetchNextHospitalizacionId = async () => {
    try {
      const response = await fetch('/api/hospitaliza?next-id=true');
      if (!response.ok) {
        throw new Error('Error al obtener el siguiente ID de hospitalización');
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
      // Mostrar que se está procesando
      setSubmitting(true);
      
      // Obtener el siguiente ID de hospitalización
      const nextId = await fetchNextHospitalizacionId();
      if (!nextId) {
        toast({
          title: "Error",
          description: "No se pudo obtener un ID de hospitalización",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }
      
      // La verificación del diagnóstico ya se realizó en onBeforeSave
      
      // La validación ya se realizó en handleSubmit, pero verificamos nuevamente
      // para asegurarnos de que todo esté en orden antes de enviar
      console.log('Validando formulario antes de enviar', { procedencia: formData.procedencia });
      const validation = validateHospitalizationForm(formData);
      console.log('Resultado de validación:', validation);
      
      if (!validation.isValid) {
        console.log('Errores de validación:', validation.errors);
        setValidationErrors(validation.errors);
        toast({
          title: "Error de validación",
          description: "Por favor complete todos los campos requeridos",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }
      
      setSubmitting(true);
      
      // Extraer códigos de los valores seleccionados
      // Verificar si la procedencia es RN o si el origen contiene "EMERGENCIA" para determinar el código
      let origenCode;
      if (formData.procedencia === 'RN') {
        origenCode = 'RN'; // Si la procedencia es RN, el origen debe ser RN (2 caracteres)
        console.log('Procedencia es RN, estableciendo origenCode a RN');
      } else {
        const origenText = formData.attentionOrigin || '';
        origenCode = origenText.toUpperCase().includes('EMERGENCIA') ? 'EM' : 'CE';
        console.log('Procedencia no es RN, origenCode:', origenCode);
      }
      const origenId = formData.procedencia === 'RN' ? '' : (formData.hospitalizationOrigin ? formData.hospitalizationOrigin.split(' [')[0] : '');
      console.log('Valores de origen:', { origenCode, origenId, procedencia: formData.procedencia });
      
      // Extraer los códigos de los valores seleccionados
      // Formato esperado: "Código - Descripción" o solo "Código"
      const consultorioCode = formData.hospitalizedIn.split(' - ')[0] || '';
      const seguroCode = formData.financing.split(' - ')[0] || '';
      const medicoCode = formData.authorizingDoctor.split(' - ')[0] || '';
      
      // Extraer el código del diagnóstico (antes del primer espacio o guion)
      const diagnosticoCode = formData.diagnosis.split(/[ -]/)[0] || '';
      
      console.log('Códigos extraidos:', { 
        consultorioCode, 
        diagnosticoCode, 
        seguroCode, 
        medicoCode 
      });
      
      // Formatear fecha como YYYYMMDD (formato requerido por SQL Server)
      const fechaFormateada = formData.date.replace(/-/g, ''); // Convertir YYYY-MM-DD a YYYYMMDD
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      };
      
      // Calcular la edad en formato '000a00m00d'
      const calcularEdad = () => {
        if (!filiacionData || !filiacionData.birthDate) return '000a00m00d';
        
        const fechaNacimiento = new Date(filiacionData.birthDate);
        const hoy = new Date();
        
        let años = hoy.getFullYear() - fechaNacimiento.getFullYear();
        let meses = hoy.getMonth() - fechaNacimiento.getMonth();
        let dias = hoy.getDate() - fechaNacimiento.getDate();
        
        if (dias < 0) {
          meses--;
          const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
          dias += ultimoDiaMesAnterior;
        }
        
        if (meses < 0) {
          años--;
          meses += 12;
        }
        
        return `${años.toString().padStart(3, '0')}a${meses.toString().padStart(2, '0')}m${dias.toString().padStart(2, '0')}d`;
      };
      
      const edadCalculada = calcularEdad();
      
      // Asegurar que el nombre completo esté correctamente formateado
      // Usar los datos de filiación si están disponibles, o los datos del formulario si no lo están
      const apellidoPaterno = filiacionData?.paternalSurname || formData.paternalSurname || '';
      const apellidoMaterno = filiacionData?.maternalSurname || formData.maternalSurname || '';
      const nombres = filiacionData?.names || formData.names || '';
      const nombreCompleto = `${apellidoPaterno} ${apellidoMaterno} ${nombres}`.trim();
      
      // Verificar que el nombre no esté vacío
      if (!nombreCompleto) {
        toast({
          title: "Error",
          description: "Faltan datos del paciente: nombre completo",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }
      
      // Función para truncar strings según los límites de la base de datos
      const truncate = (value: string, maxLength: number) => {
        return (value || '').toString().trim().substring(0, maxLength);
      };
      
      // Función para extraer el primer apellido del nombre completo en el token
      const extractFirstSurname = () => {
        try {
          // Obtener el token del localStorage
          const authToken = localStorage.getItem('authToken');
          if (!authToken) return 'SUPERVISOR';
          
          // Decodificar el token (solo la parte del payload)
          const tokenParts = authToken.split('.');
          if (tokenParts.length !== 3) return 'SUPERVISOR';
          
          // Decodificar la parte del payload (segunda parte)
          const payload = JSON.parse(atob(tokenParts[1]));
          
          // Extraer el nombre completo
          const nombreCompleto = payload.nombreCompleto;
          if (!nombreCompleto) return 'SUPERVISOR';
          
          // Obtener el primer apellido (primera palabra)
          const primerApellido = nombreCompleto.split(' ')[0];
          return primerApellido || 'SUPERVISOR';
        } catch (error) {
          console.error('Error al extraer el primer apellido del token:', error);
          return 'SUPERVISOR';
        }
      };
      
      // Obtener el primer apellido solo si estamos en el navegador
      const primerApellido = typeof window !== 'undefined' ? extractFirstSurname() : 'SUPERVISOR';
      
      // Preparar datos para enviar al servidor en el formato esperado por la API
      const hospitalData = {
        // Incluir el IDHOSPITALIZACION obtenido del servicio
        IDHOSPITALIZACION: truncate(nextId, 10),
        PACIENTE: truncate(patientId, 10),
        NOMBRES: truncate(nombreCompleto, 100), // Limitar a 100 caracteres
        CONSULTORIO1: consultorioCode.padEnd(6, ' ').substring(0, 6), // Exactamente 6 caracteres
        HORA1: truncate(formatTime(formData.time), 10), // Formato hh:mm AM/PM
        FECHA1: truncate(fechaFormateada, 10), // Formato YYYY-MM-DD
        ORIGEN: origenCode, // 'EM' o 'CE' basado en el texto del origen
        SEGURO: truncate(seguroCode, 2),
        MEDICO1: truncate(medicoCode, 3).trim(),
        ESTADO: '2',
        USUARIO: primerApellido,
        DIAGNOSTICO: truncate(diagnosticoCode, 10),
        EDAD: truncate(edadCalculada, 10), // Formato '000a00m00d'
        ORIGENID: truncate(origenId, 10), // Máximo 10 caracteres
        USUARIO_IMP: primerApellido,
        // Datos del acompañante
        ACOMPANANTE_NOMBRE: truncate(formData.companionName || '', 50),
        ACOMPANANTE_TELEFONO: truncate(formData.companionPhone || '', 15),
        ACOMPANANTE_DIRECCION: truncate(formData.companionAddress || '', 100)
      };
      
      // Determinar si es creación o actualización
      const method = 'POST';
      const url = '/api/hospitaliza';
      
      // Verificar que todos los campos requeridos estén presentes
      if (!hospitalData.NOMBRES || hospitalData.NOMBRES.trim() === '') {
        toast({
          title: "Error",
          description: "Faltan campos requeridos: NOMBRES",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }
      
      console.log('Enviando datos a la API:', { 
        url,
        method,
        hospitalData
      });
      
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(hospitalData),
        });
        
        console.log('Respuesta de la API recibida:', { 
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        // Procesar la respuesta
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error en la respuesta de la API:', errorData);
          throw new Error(errorData.error || 'Error al crear la hospitalización');
        }
        
        const result = await response.json();
        console.log('Hospitalización creada exitosamente:', result);
        
        // Mostrar mensaje de éxito
        setSubmitting(false);
        toast({
          title: "Hospitalización creada",
          description: `Se ha creado la hospitalización con ID: ${result.IDHOSPITALIZACION}`,
          variant: "default"
        });
        
        // Llamar al endpoint para asegurar la cuenta si el seguro es "0", "02" o "17"
        const seguroCode = result.SEGURO?.trim();
        if (["0", "02", "17"].includes(seguroCode)) {
          try {
            console.log(`Asegurando cuenta para hospitalización ${result.IDHOSPITALIZACION.trim()} con seguro ${seguroCode}...`);
            console.log('Datos que se envían al endpoint:', {
              paciente: result.PACIENTE,
              seguro: seguroCode,
              usuario: user?.sub || 'SISTEMA',
              nombre: result.NOMBRES?.trim() || ''
            });
            const asegurarResponse = await fetch(`/api/hospitaliza/${result.IDHOSPITALIZACION.trim()}/asegurar-cuenta`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                paciente: result.PACIENTE,
                seguro: seguroCode,
                usuario: user?.sub || 'SISTEMA',
                nombre: result.NOMBRES?.trim() || ''
              })
            });
            
            const asegurarResult = await asegurarResponse.json();
            console.log('Resultado de asegurar cuenta:', asegurarResult);
            
            if (asegurarResult.ok) {
              console.log(`Cuenta asegurada correctamente: ${asegurarResult.cuentaId || 'N/A'}`);
            } else {
              console.warn(`No se pudo asegurar la cuenta: ${asegurarResult.mensaje}`);
            }
          } catch (error) {
            console.error('Error al asegurar la cuenta:', error);
          }
        } else {
          console.log(`No se requiere asegurar cuenta para seguro: ${seguroCode}`);
        }
        
        // Obtener el ID limpio para los PDFs
        const cleanId = result.IDHOSPITALIZACION.trim();
        
        // Obtener el nombre completo del usuario desde el token de autenticación
        const nombreCompleto = user?.nombreCompleto || '';
        
        // Crear array con las URLs de los PDFs a imprimir
        const pdfUrls = [
          `${API_BACKEND_URL}/reporte/pdf/orden-hospitalizacion/${cleanId}?usuario=${encodeURIComponent(nombreCompleto)}`,
          `${API_BACKEND_URL}/reporte/pdf/consentimiento-hospitalizacion/${cleanId}?usuario=${encodeURIComponent(nombreCompleto)}`,
          `${API_BACKEND_URL}/reporte/pdf/hoja-filiacion/${cleanId}?usuario=${encodeURIComponent(nombreCompleto)}`
        ];
        
        try {
          // Intentar método primario: imprimir cada PDF por separado usando la API directa
          console.log('Intentando imprimir usando la API directa...');
          const directPrintSuccess = await printMultiplePdfsViaDirectApi(pdfUrls);
          
          if (directPrintSuccess) {
            console.log('Impresión directa exitosa para todos los PDFs');
            toast({
              title: "Impresión iniciada",
              description: "Los documentos se están enviando a la impresora.",
              variant: "default"
            });
            
            // Redirigir a la lista de órdenes después de iniciar la impresión
            router.push(`/hospitalization/orders/${patientId}`);
          } else {
            // Si falla el método primario, usar el método secundario (merge PDF)
            console.log('Impresión directa falló, usando método secundario (merge PDF)...');
            
            // Imprimir directamente los PDFs sin mostrar el visor usando el método actual
            // La redirección se maneja en el callback onPrintComplete del hook useDocumentPrinter
            handleDirectPrint(pdfUrls);
          }
        } catch (printError) {
          console.error('Error en el proceso de impresión:', printError);
          
          // Si ocurre cualquier error, usar el método secundario (merge PDF)
          console.log('Error en impresión, usando método secundario (merge PDF)...');
          handleDirectPrint(pdfUrls);
        }
      } catch (fetchError) {
        console.error('Error en la solicitud fetch:', fetchError);
        setSubmitting(false);
        throw fetchError;
      }
      
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
    router.push(`/hospitalization/orders/${patientId}`);
  };
  
  // Función para manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulario enviado, datos actuales:', { 
      formData,
      procedencia: formData.procedencia,
      hospitalizationOrigin: formData.hospitalizationOrigin,
      attentionOrigin: formData.attentionOrigin
    });
    
    // Solo validamos el formulario, pero no lo procesamos
    // El procesamiento real ocurre en processForm() que se llama desde FormActions
    // después de la confirmación del usuario
    const validation = validateHospitalizationForm(formData);
    console.log('Resultado de validación en handleSubmit:', validation);
    
    if (!validation.isValid) {
      console.log('Errores de validación en handleSubmit:', validation.errors);
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
      {/* Alerta de estado FUA - Posicionada al inicio del formulario */}
      <FuaStatusAlert 
        patientId={patientId} 
        insuranceCode={selectedSeguro?.Seguro || formData.insurance?.split(' - ')[0]}
      />
      
      <Toaster />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar with Patient Information */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Datos del Paciente</h3>
              <PatientInfoCard
                patientId={patientId}
                onDataLoaded={handlePatientDataLoaded}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Main form content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {/* Form Header - Historia, fecha y hora */}
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 mb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <Label htmlFor="historyNumber" className="font-medium">Nº Historia: <span className="text-red-500">*</span></Label>
                    <Input
                      id="historyNumber"
                      value={formData.historyNumber}
                      readOnly
                      className="font-medium mt-2"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <DateTimeFields
                      dateValue={formData.date}
                      timeValue={formData.time}
                      onDateChange={(value) => setFormData({ ...formData, date: value })}
                      onTimeChange={(value) => setFormData({ ...formData, time: value })}
                      disabled={fieldsLocked}
                      autoFill={true}
                    />
                  </div>
                </div>
              </div>
              
              {/* Datos del Acompañante */}
              <h3 className="text-lg font-semibold mb-4">Datos del Acompañante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-gray-100 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <Label htmlFor="companionName" className="font-medium text-black-600">Nombres y apellidos del acompañante <span className="text-red-500">*</span></Label>
                  <Input
                    id="companionName"
                    value={formData.companionName}
                    onChange={(e) => {
                      setFormData({ ...formData, companionName: e.target.value });
                      // Limpiar error cuando el usuario empieza a escribir
                      if (validationErrors.companionName && e.target.value.trim()) {
                        setValidationErrors({...validationErrors, companionName: ''});
                      }
                    }}
                    className={`w-full font-medium ${validationErrors.companionName ? 'border-red-500' : ''}`}
                    placeholder="Ingrese nombre del acompañante"
                    disabled={fieldsLocked}
                  />
                  {validationErrors.companionName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.companionName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companionPhone" className="font-medium text-black-600">Teléfono del acompañante <span className="text-red-500">*</span></Label>
                  <Input
                    id="companionPhone"
                    value={formData.companionPhone}
                    onChange={(e) => {
                      // Solo permitir números
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, companionPhone: value });
                      // Limpiar error cuando el usuario empieza a escribir
                      if (validationErrors.companionPhone && value) {
                        setValidationErrors({...validationErrors, companionPhone: ''});
                      }
                    }}
                    className={`w-full font-medium ${validationErrors.companionPhone ? 'border-red-500' : ''}`}
                    placeholder="Ingrese teléfono del acompañante"
                    disabled={fieldsLocked}
                  />
                  {validationErrors.companionPhone && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.companionPhone}</p>
                  )}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="companionAddress" className="font-medium text-black-600">Domicilio del acompañante <span className="text-red-500">*</span></Label>
                  <Input
                    id="companionAddress"
                    value={formData.companionAddress}
                    onChange={(e) => {
                      setFormData({ ...formData, companionAddress: e.target.value });
                      // Limpiar error cuando el usuario empieza a escribir
                      if (validationErrors.companionAddress && e.target.value.trim()) {
                        setValidationErrors({...validationErrors, companionAddress: ''});
                      }
                    }}
                    className={`w-full font-medium ${validationErrors.companionAddress ? 'border-red-500' : ''}`}
                    placeholder="Ingrese domicilio del acompañante"
                    disabled={fieldsLocked}
                  />
                  {validationErrors.companionAddress && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.companionAddress}</p>
                  )}
                </div>
              </div>
              
              {/* Datos de Hospitalización */}
              <h3 className="text-lg font-semibold mb-4">Datos de Hospitalización</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-gray-100 p-4 rounded-lg border border-gray-200">
                {/* Fila 1: Procedencia del Paciente | Código de Origen de Atención */}
                <div className="space-y-2">
                  <Label htmlFor="procedencia" className="text-sm font-semibold text-black-600">
                    Procedencia del Paciente <span className="text-red-500">*</span>
                  </Label>
                  <ProcedenciaSelector
                    value={formData.procedencia || 'EM'}
                    onChange={(value) => {
                      // Al cambiar la procedencia, limpiamos los campos dependientes
                      if (value === 'RN') {
                        // Si es RN, limpiamos y deshabilitamos el código de origen
                        setFormData(prev => ({
                          ...prev,
                          procedencia: value,
                          hospitalizationOrigin: '', // Limpiamos el código de origen
                          hospitalizedIn: '', // Limpiamos el hospitalizado en
                          authorizingDoctor: '', // Limpiamos el médico
                          diagnosis: '', // Limpiamos el diagnóstico
                          financing: '' // Limpiamos el financiamiento
                        }));
                        setSelectedOrigin(null);
                        setSelectedMedico(null);
                        setSelectedDiagnostico(null);
                        setSelectedSeguro(null); // Limpiamos el seguro seleccionado
                      } else {
                        // Si es EM o CE, solo limpiamos los campos pero no los deshabilitamos
                        setFormData(prev => ({
                          ...prev,
                          procedencia: value,
                          hospitalizationOrigin: '', // Limpiamos el código de origen
                          hospitalizedIn: '', // Limpiamos el hospitalizado en
                          authorizingDoctor: '', // Limpiamos el médico
                          diagnosis: '', // Limpiamos el diagnóstico
                          financing: '' // Limpiamos el financiamiento
                        }));
                        setSelectedOrigin(null);
                        setSelectedMedico(null);
                        setSelectedDiagnostico(null);
                        setSelectedSeguro(null); // Limpiamos el seguro seleccionado
                      }
                      
                      // Limpiar errores de validación relacionados
                      setValidationErrors(prev => ({
                        ...prev,
                        hospitalizationOrigin: '',
                        authorizingDoctor: '',
                        diagnosis: ''
                      }));
                    }}
                    disabled={fieldsLocked}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="origen" className="text-sm font-semibold text-black-600">
                    Código de Origen de Atención <span className="text-red-500">*</span>
                  </Label>
                  <OrigenSelector
                    value={formData.procedencia === 'RN' ? '' : formData.hospitalizationOrigin}
                    onChange={(value, origenData) => {
                      setFormData(prev => ({
                        ...prev,
                        hospitalizationOrigin: value
                      }));
                      
                      setSelectedOrigin(origenData || null);
                      
                      // Limpiar error de validación
                      if (validationErrors.hospitalizationOrigin) {
                        setValidationErrors(prev => ({
                          ...prev,
                          hospitalizationOrigin: ''
                        }));
                      }
                    }}
                    origenFilter={formData.procedencia} // Filtrar por procedencia
                    disabled={formData.procedencia === 'RN' || fieldsLocked} // Deshabilitar si es RN
                    required
                    patientId={patientId}
                    onAttentionOriginChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        attentionOrigin: value
                      }));
                    }}
                    onMedicoChange={(value, medicoData) => {
                      setFormData(prev => ({
                        ...prev,
                        authorizingDoctor: value
                      }));
                      setSelectedMedico(medicoData || null);
                    }}
                    onDiagnosticoChange={(value, diagnosticoData) => {
                      setFormData(prev => ({
                        ...prev,
                        diagnosis: value
                      }));
                      setSelectedDiagnostico(diagnosticoData || null);
                    }}
                    onSeguroChange={(value, seguroData) => {
                      setFormData(prev => ({
                        ...prev,
                        financing: value
                      }));
                      setSelectedSeguro(seguroData || null);
                    }}
                  />
                </div>
                
                {/* Fila 2: Hospitalizado en | Médico que autoriza */}
                <div className="space-y-2">
                  <Label htmlFor="consultorio" className="text-sm font-semibold text-black-600">
                    Hospitalizado en <span className="text-red-500">*</span>
                  </Label>
                  <ConsultorioSelector
                    value={formData.hospitalizedIn}
                    onChange={(value) => setFormData({ ...formData, hospitalizedIn: value })}
                    disabled={fieldsLocked}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="medico" className="text-sm font-semibold text-black-600">
                    Médico que autoriza la Hospitalización <span className="text-red-500">*</span>
                  </Label>
                  <MedicoSelector
                    value={formData.authorizingDoctor}
                    onChange={(value, medicoData) => {
                      setFormData({ ...formData, authorizingDoctor: value });
                      setSelectedMedico(medicoData || null);
                    }}
                    disabled={fieldsLocked}
                    className="w-full"
                    // No pasamos consultorioId para permitir buscar cualquier médico
                  />
                </div>
                
                {/* Fila 3: Financiamiento | Diagnóstico */}
                <div className="space-y-2">
                  <Label htmlFor="seguro" className="text-sm font-semibold text-black-600">
                    Financiamiento <span className="text-red-500">*</span>
                  </Label>
                  <SeguroSelector
                    value={formData.financing}
                    onChange={(value, seguroData) => {
                      setFormData({ ...formData, financing: value });
                      setSelectedSeguro(seguroData || null);
                    }}
                    disabled={fieldsLocked}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="diagnostico" className="text-sm font-semibold text-black-600">
                    Diagnóstico <span className="text-red-500">*</span>
                  </Label>
                  <DiagnosticoSelector
                    value={formData.diagnosis}
                    onChange={(value, diagnosticoData) => {
                      setFormData({ ...formData, diagnosis: value });
                      setSelectedDiagnostico(diagnosticoData || null);
                    }}
                    disabled={fieldsLocked}
                    origenId={formData.hospitalizationOrigin ? formData.hospitalizationOrigin.split(' ')[0] : ''} // Extraemos el código de origen del valor seleccionado
                    tipoOrigen={formData.hospitalizationOrigin ? formData.hospitalizationOrigin.split(' ')[0] : 'CE'} // Tipo de origen para determinar qué API usar
                    className="w-full"
                  />
                  
                  {/* Componente de verificación de diagnóstico solo para origen CE */}
                  {formData.hospitalizationOrigin && formData.hospitalizationOrigin.split(' ')[0] === 'CE' && (
                    <div className="mt-2">
                      <VerificacionDiagnostico
                        ref={verificacionDiagnosticoRef}
                        diagnostico={formData.diagnosis}
                        onResultado={(resultado) => {
                          if (!resultado.valido) {
                            toast({
                              title: "Error en el diagnóstico",
                              description: resultado.mensaje || "El diagnóstico no es válido",
                              variant: "destructive"
                            });
                          } else if (resultado.reemplazo && !resultado.multiples) {
                            toast({
                              title: "Diagnóstico validado",
                              description: `Se utilizará: ${resultado.reemplazo}`,
                              variant: "default"
                            });
                          } else if (resultado.multiples) {
                            toast({
                              title: "Múltiples diagnósticos encontrados",
                              description: resultado.mensaje || "Se encontraron múltiples diagnósticos similares",
                              variant: "default"
                            });
                          }
                        }}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>
         
              
              {/* Campo de observaciones eliminado según requerimiento */}
              
              {/* Mensaje informativo */}
              <div className="flex items-center mt-6 mb-2 text-sm text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>El Código de Origen de Atención no es requerido si el nombre es "RN".</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Se eliminó el visor de PDF para usar impresión directa */}
      
      {/* Componente para cargar datos de hospitalización existente */}
      <HospitalizationDetails
        orderId={orderId}
        onDataLoaded={handleHospitalizationDataLoaded}
        onStatusChange={handleStatusChange}
      />
      
      {/* Diálogo de confirmación */}
      <FormActions 
        onSave={processForm}
        onCancel={handleCancel}
        submitting={submitting}
        isEditable={isEditable}
        patientId={patientId}
        insuranceCode={formData.financing}
        onBeforeSave={async () => {
          // Validar el formulario antes de mostrar el diálogo de confirmación
          const validation = validateHospitalizationForm(formData);
          if (!validation.isValid) {
            setValidationErrors(validation.errors);
            toast({
              title: "Error de validación",
              description: "Por favor complete todos los campos obligatorios",
              variant: "destructive"
            });
            return false;
          }
          
          // Verificar el diagnóstico antes de procesar el formulario solo para origen 'CE'
          const origenCode = formData.hospitalizationOrigin ? formData.hospitalizationOrigin.split(' ')[0] : 'CE';
          
          if (formData.diagnosis && origenCode === 'CE' && verificacionDiagnosticoRef.current) {
            const resultado = await verificacionDiagnosticoRef.current.verificar();
            
            if (!resultado.valido) {
              // Si el diagnóstico no es válido, detener el proceso
              return false;
            }
            
            // Si hay un reemplazo sugerido, actualizar el diagnóstico
            if (resultado.reemplazo && !resultado.multiples) {
              setFormData(prev => ({
                ...prev,
                diagnosis: resultado.reemplazo || prev.diagnosis
              }));
            }
          }
          
          return true;
        }}
      />
    </form>
  );
}
