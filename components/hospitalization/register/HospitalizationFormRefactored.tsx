"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from "@/lib/router"

import { Card, CardContent } from '@/components/ui/card'

import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useDocumentPrinter } from '@/components/hospitalization/DocumentPrinter'
import { printMultiplePdfsViaDirectApi } from '@/utils/pdfUtils'
import { extractDocumentFromToken } from '@/utils/jwtUtils'
import { pacienteApiService } from '@/services/hospitalizacion/pacienteApiService'
import { usePatient } from '@/contexts/PatientContext'
import { useServerDateTime } from '@/contexts/ServerDateTimeContext'

// Componentes modulares refactorizados
import { PatientSection } from './PatientSection'
import { CompanionSection } from './CompanionSection'
import { HospitalizationSection } from './HospitalizationSection'
import { FormActions } from './FormActions'
import { FormHeader } from './FormHeader'
import { HospitalizationDetails } from './HospitalizationDetails'
import { validateHospitalizationForm } from './FormValidator'
import { useSelectsState } from './FormUtils'
import FuaStatusAlert from './FuaStatusAlert'

// Tipos
import { API_SPRING_URL, API_ENDPOINTS, buildUrl, fetchApi, normalizeHospitalizationData } from '@/lib/api-config'
import { OrigenHospitalizacion } from '@/services/hospitalizacion/origenHospitalizacionService'
import { Seguro } from '@/services/hospitalizacion/seguroService'
import { Diagnostico } from '@/services/hospitalizacion/diagnosticoService'

import { useAuth } from '@/components/AuthProvider';

interface HospitalizationFormProps {
  patientId: string;
  hospitalizationId?: string;
  hospitalizationData?: any;
  patient?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onBack?: () => void;
  isModal?: boolean;
  alertsContainerId?: string;
  onUpdatePatient?: () => void;
  isLoadingUpdate?: boolean;
  refreshPatientKey?: number;
}

const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL;

export function HospitalizationFormRefactored({ 
  patientId, 
  hospitalizationId, 
  hospitalizationData, 
  patient, 
  onSuccess, 
  onError, 
  onBack, 
  isModal = false, 
  alertsContainerId,
  onUpdatePatient,
  isLoadingUpdate,
  refreshPatientKey
}: HospitalizationFormProps) {
  const router = useRouter();
  const { user } = useAuth(); // Moved inside the component
  const { patientData, setPatientData } = usePatient();
  const { serverDateTime: contextServerDateTime, loading: dateTimeLoading } = useServerDateTime();
  const selectedCuentaIdRef = useRef<string | null>(null);
  const forceCreateNewRef = useRef<boolean>(false);
  
  // Estado para loading y error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isEditable, setIsEditable] = useState(true);
  const [fieldsLocked, setFieldsLocked] = useState(false);
  
  // Utilizar el hook de impresión directa con callback de redirección
  const { handleDirectPrint } = useDocumentPrinter({
    onPrintComplete: () => {
      // Solo redirigir si no estamos en modo modal
      if (!isModal) {
        router.push(`/hospitalization/orders/${patientId}`);
      }
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

  // Estado para fecha y hora del servidor
  const [serverDateTime, setServerDateTime] = useState({
    date: '',
    time: ''
  });
  
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
    date: '', // Se actualizará con la fecha del servidor
    time: '', // Se actualizará con la hora del servidor
    hospitalizationDate: '', // Se actualizará con la fecha del servidor
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
    patienteDBId: '', // ID real del paciente en BD (PACIENTE), obtenido de filiación
  });

  // Función para manejar los datos del paciente cargados desde PatientInfoCard
  const handlePatientDataLoaded = useCallback((data: any) => {
    // Guardar datos del paciente en el contexto global
    setPatientData({
      hc: data.historyNumber,
      name: `${data.paternalSurname} ${data.maternalSurname}, ${data.names}`,
      documento: data.document,
      pacienteId: data.pacienteId || patientId
    });

    // Actualizar formData con los datos del paciente (de filiación/PatientInfoCard)
    setFormData(prev => {
      const next = {
        ...prev,
        historyNumber: data.historyNumber,
        paternalSurname: data.paternalSurname,
        maternalSurname: data.maternalSurname,
        names: data.names,
        document: data.document,
        sex: data.sex,
        birthDate: data.birthDate,
        age: data.age,
        insurance: data.insurance,
        patienteDBId: data.pacienteId || patientId,
        // Pre-poblar financiamiento con el seguro del paciente (solo si aún no fue seleccionado)
        financing: prev.financing || data.insuranceCode || ''
      };
      return next;
    });
  }, [patientId, setPatientData]);

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
      diagnosis: data.diagnosis,
    }));
    
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
      const { ordenHospitalizacionService } = await import('@/services/hospitalizacion/ordenHospitalizacionService');
      return await ordenHospitalizacionService.getNextId();
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
      const validation = validateHospitalizationForm(formData);
      
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
      
      setSubmitting(true);
      
      // Extraer códigos de los valores seleccionados
      // Verificar si la procedencia es RN o si el origen contiene "EMERGENCIA" para determinar el código
      let origenCode;
      if (formData.procedencia === 'RN') {
        origenCode = 'RN'; // Si la procedencia es RN, el origen debe ser RN (2 caracteres)
      } else {
        const origenText = formData.attentionOrigin || '';
        origenCode = origenText.toUpperCase().includes('EMERGENCIA') ? 'EM' : 'CE';
      }
      const origenId = formData.procedencia === 'RN' ? '' : (formData.hospitalizationOrigin ? formData.hospitalizationOrigin.split(' [')[0] : '');
      
      // Extraer los códigos de los valores seleccionados
      // Formato esperado: "Código - Descripción" o solo "Código"
      const consultorioCode = formData.hospitalizedIn.split(' - ')[0] || '';
      const seguroCode = formData.financing.split(' - ')[0] || '';
      const medicoCode = formData.authorizingDoctor.split(' - ')[0] || '';

      // Extraer el código del diagnóstico (antes del primer espacio o guion)
      const diagnosticoCode = formData.diagnosis.split(/[ -]/)[0] || '';
      
      // Formatear fecha como YYYYMMDD (formato requerido por SQL Server)
      const fechaFormateada = formData.date.replace(/-/g, ''); // Convertir YYYY-MM-DD a YYYYMMDD
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      };
      
      // Obtener la edad directamente desde la API de paciente
      const getEdad = async () => {
        try {
          // Usar el servicio de pacienteApiService para obtener la edad formateada
          const formattedAge = await pacienteApiService.getFormattedAge(patientId);
          return formattedAge;
        } catch (error) {
          console.error('Error al obtener la edad desde la API:', error);
          // En caso de error, devolver un valor por defecto
          return '000a00m00d';
        }
      };
      
      const edadCalculada = await getEdad();
      
      // Asegurar que el nombre completo esté correctamente formateado
      // Usar los datos del formulario directamente
      const apellidoPaterno = formData.paternalSurname || '';
      const apellidoMaterno = formData.maternalSurname || '';
      const nombres = formData.names || '';
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
      
      // Obtener el primer apellido solo si estamos en el navegador
      const primerApellido = typeof window !== 'undefined' ? extractDocumentFromToken() : 'SUPERVISOR';
      
      // Preparar datos para enviar al servidor en el formato esperado por la API
      const hospitalData = {
        // Incluir el IDHOSPITALIZACION obtenido del servicio
        IDHOSPITALIZACION: truncate(nextId, 10),
        PACIENTE: truncate(formData.patienteDBId || patientId, 10),
        NOMBRES: truncate(nombreCompleto, 100), // Limitar a 100 caracteres
        CONSULTORIO1: consultorioCode.padEnd(6, ' ').substring(0, 6), // Exactamente 6 caracteres
        HORA1: truncate(formatTime(formData.time), 10), // Formato hh:mm AM/PM
        FECHA1: truncate(fechaFormateada, 10), // Formato YYYYMMDD
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
        ACOMPANANTE_DIRECCION: truncate(formData.companionAddress || '', 100),
        // ✅ Solo enviamos los campos con valores reales
        // Los campos null/vacíos no se envían para evitar sobrescribir valores por defecto de la BD
      };
      // Determinar si es creación o actualización
      const method = 'POST';
      const url = `${API_SPRING_URL}/hospitalization`;
      
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
      
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(hospitalData),
        });
        
        // Procesar la respuesta
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Error en la respuesta de la API:', errorData);
          
          // Detener el spinner inmediatamente
          setSubmitting(false);
          
          // Lanzar error con mensaje personalizado
          const errorMsg = errorData.error || 'Error al crear la hospitalización';
          throw new Error(errorMsg);
        }
        
        const result = await response.json();
        // Verificar que realmente se creó en la BD
        // Si el backend devuelve 20x sin campo 'success', asumimos éxito.
        if (result.success === false) {
          throw new Error(result.message || result.error || 'Error al crear la hospitalización');
        }
        
        // El backend puede devolver el objeto creado directamente o envuelto en { data: ... }
        const rawRecord = result.data || result;
        const createdRecord = normalizeHospitalizationData(rawRecord);
        const hospitalizacionId =
          createdRecord?.IDHOSPITALIZACION ||
          createdRecord?.id ||
          createdRecord?.ID ||
          createdRecord?.hospitalizacionId ||
          hospitalData.IDHOSPITALIZACION ||
          nextId;
        
        if (!hospitalizacionId) {
          console.error('❌ No se encontró IDHOSPITALIZACION en la respuesta:', result);
          throw new Error('No se pudo obtener el ID de la hospitalización creada');
        }
        
        // Mostrar mensaje de éxito
        setSubmitting(false);
        
        // Solo mostrar toast si no estamos en modal
        if (!isModal) {
          toast({
            title: "Hospitalización creada",
            description: `Se ha creado la hospitalización con ID: ${hospitalizacionId}`,
            variant: "default"
          });
        }
        
        // Llamar al endpoint para asegurar la cuenta si el seguro es "0", "02" o "17"
        // IMPORTANTE: Esto debe ejecutarse ANTES de llamar a onSuccess o return
        const seguroCode = (createdRecord?.SEGURO || hospitalData.SEGURO || '').toString().trim();
        
        if (["0", "02", "17"].includes(seguroCode)) {
          try {
            const nombrePaciente = (createdRecord?.NOMBRES || hospitalData.NOMBRES || '').toString().trim();
            const asegurarResponse = await fetch(API_ENDPOINTS.hospitalizacion.assignAccount(hospitalizacionId.trim(), 'HO'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                paciente: createdRecord?.PACIENTE || hospitalData.PACIENTE || patientId,
                seguro: seguroCode,
                usuario: primerApellido,
                nombre: nombrePaciente,
                origen: 'HO',
                ORIGEN: 'HO',
                reuseAccountId: selectedCuentaIdRef.current || undefined,
                forceCreateNew: forceCreateNewRef.current
              })
            });
            selectedCuentaIdRef.current = null;
            forceCreateNewRef.current = false;

            if (!asegurarResponse.ok) {
            } else {
              const asegurarResult = await asegurarResponse.json();

              if (asegurarResult.ok && asegurarResult.cuentaId) {
                // Validar que la cuenta creada/reutilizada tenga origen HO
                try {
                  const pacienteParaValidar = createdRecord?.PACIENTE || hospitalData.PACIENTE || patientId;
                  const validateUrl = buildUrl(API_ENDPOINTS.accounts.byPatient(pacienteParaValidar), {
                    estado: '1',
                    origen: 'HO',
                    seguro: seguroCode
                  });
                  const validateResponse = await fetchApi(validateUrl);
                  if (validateResponse.ok) {
                    const accounts = await validateResponse.json();
                    let accountList: any[] = [];
                    if (Array.isArray(accounts)) {
                      accountList = accounts;
                    } else if (Array.isArray(accounts?.data)) {
                      accountList = accounts.data;
                    }
                    const found = accountList.some((a: any) => String(a.cuentaId || a.CUENTAID) === String(asegurarResult.cuentaId));
                    if (!found) {
                    } else {
                    }
                  }
                } catch (validateError) {
                }

                // Actualizar el registro de hospitalización con el cuentaId
                // El backend no acepta PATCH sobre /hospitalization/{id}; se usa PUT con el mismo
                // formato que HospitalizationViewRefactored (updateData + valoresSQL).
                try {
                  const cuentaUpdateData = {
                    hospitalizationId: hospitalizacionId,
                    patientId: hospitalData.PACIENTE,
                    fecha: formData.date,
                    hora: formData.time,
                    origen: hospitalData.ORIGEN,
                    origen_atencion: formData.attentionOrigin || '',
                    consultorio: (formData.hospitalizedIn.split(' - ')[0] || '').trim(),
                    seguro: (formData.financing.split(' - ')[0] || '').trim(),
                    medico: (formData.authorizingDoctor.split(' - ')[0] || '').trim(),
                    diagnostico: (formData.diagnosis.split(/[ -]/)[0] || '').trim(),
                    estado: hospitalData.ESTADO,
                    acompanante_nombre: hospitalData.ACOMPANANTE_NOMBRE,
                    acompanante_telefono: hospitalData.ACOMPANANTE_TELEFONO,
                    acompanante_direccion: hospitalData.ACOMPANANTE_DIRECCION,
                  };

                  const valoresSQL = {
                    ...hospitalData,
                    IDHOSPITALIZACION: hospitalizacionId,
                    CUENTAID: asegurarResult.cuentaId
                  };

                  const updateResponse = await fetch(API_ENDPOINTS.hospitalizacion.update(hospitalizacionId.trim()), {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      ...cuentaUpdateData,
                      valoresSQL
                    })
                  });

                  if (!updateResponse.ok) {
                  } else {
                    const updateResult = await updateResponse.json();
                    if (updateResult.success === false) {
                      console.error('Error al actualizar la hospitalización con el CUENTAID:', updateResult.message);
                    }
                  }
                } catch (updateError) {
                  console.error('Error al actualizar la hospitalización con el CUENTAID:', updateError);
                }
              } else {
              }
            }
          } catch (error) {
            console.error('Error al asegurar la cuenta:', error);
          }
        }
        
        // Obtener el ID limpio para los PDFs
        const cleanId = hospitalizacionId.toString().trim();
        
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
          const directPrintSuccess = await printMultiplePdfsViaDirectApi(pdfUrls);
          
          if (directPrintSuccess) {
            toast({
              title: "Impresión iniciada",
              description: "Los documentos se están enviando a la impresora.",
              variant: "default"
            });
            
            // Si estamos en modo modal, llamar a onSuccess DESPUÉS de imprimir
            if (isModal && onSuccess) {
              onSuccess(result);
            } else {
              // Solo redirigir si no estamos en modo modal
              router.push(`/hospitalization/orders/${patientId}`);
            }
          } else {
            // Si falla el método primario, usar el método secundario (merge PDF)
            // Imprimir directamente los PDFs sin mostrar el visor usando el método actual
            // La redirección se maneja en el callback onPrintComplete del hook useDocumentPrinter
            handleDirectPrint(pdfUrls);
            
            // Si estamos en modo modal, llamar a onSuccess después de iniciar impresión
            if (isModal && onSuccess) {
              onSuccess(result);
            }
          }
        } catch (printError) {
          console.error('Error en el proceso de impresión:', printError);
          
          // Si ocurre cualquier error, usar el método secundario (merge PDF)
          handleDirectPrint(pdfUrls);
          
          // Si estamos en modo modal, llamar a onSuccess incluso si falla la impresión
          if (isModal && onSuccess) {
            onSuccess(result);
          }
        }
      } catch (fetchError) {
        console.error('Error en la solicitud fetch:', fetchError);
        setSubmitting(false);
        throw fetchError;
      }
      
    } catch (err: any) {
      console.error('Error al procesar el formulario:', err);
      
      // Si estamos en modo modal, usar callback onError
      if (isModal && onError) {
        onError(err.message);
      } else {
        // Solo mostrar toast si no estamos en modal
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar cancelación del formulario
  const handleCancel = () => {
    if (isModal && onBack) {
      onBack();
    } else {
      router.push(`/hospitalization/orders/${patientId}`);
    }
  };
  
  // Función para manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Solo validamos el formulario, pero no lo procesamos
    // El procesamiento real ocurre en processForm() que se llama desde FormActions
    // después de la confirmación del usuario
    const validation = validateHospitalizationForm(formData);
    
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

  // Cargar datos iniciales usando el contexto ServerDateTime
  useEffect(() => {
    if (contextServerDateTime && !dateTimeLoading) {
      
      // Actualizar el estado con la fecha y hora del contexto
      setServerDateTime({
        date: contextServerDateTime.date,
        time: contextServerDateTime.time
      });
      
      // Actualizar el formulario con la fecha y hora del contexto
      setFormData(prev => ({
        ...prev,
        date: contextServerDateTime.date,
        time: contextServerDateTime.time,
        hospitalizationDate: contextServerDateTime.date
      }));
      
      setLoading(false);
    } else if (!dateTimeLoading && !contextServerDateTime) {
      // Fallback a fecha/hora local si el contexto no está disponible
      const now = new Date();
      const localDate = now.toISOString().split('T')[0];
      const localTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setServerDateTime({
        date: localDate,
        time: localTime
      });
      
      setFormData(prev => ({
        ...prev,
        date: localDate,
        time: localTime,
        hospitalizationDate: localDate
      }));
      
      setLoading(false);
    }
  }, [contextServerDateTime, dateTimeLoading]);

  // Validar cuenta activa existente cuando cambia el financiamiento
  useEffect(() => {
    const seguroRaw = (formData.financing || '').split(' - ')[0]?.trim();
    if (!seguroRaw) return;

    const segurosConCuenta = ['0', '00', '02', '17'];
    if (!segurosConCuenta.includes(seguroRaw)) return;

    // Normalizar código de seguro para la API (el backend usa '0' para PAGANTE)
    let seguroCode = seguroRaw;
    if (seguroCode === '00') seguroCode = '0';

    let cancelled = false;
    (async () => {
      try {
        const url = buildUrl(API_ENDPOINTS.accounts.byPatient(patientId), {
          estado: '1',
          origen: 'HO',
          seguro: seguroCode,
        });
        const resp = await fetchApi(url);
        if (!resp.ok || cancelled) return;

        const data = await resp.json();
        const list: any[] = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);

        if (list.length > 0) {
          const cuentaId = String(list[0].cuentaId || list[0].CUENTAID || list[0].CUENTA_ID || '');
          if (cuentaId && !cancelled) {
            selectedCuentaIdRef.current = cuentaId;
          }
        } else if (!cancelled) {
          selectedCuentaIdRef.current = null;
        }
      } catch (err) {
      }
    })();

    return () => { cancelled = true; };
  }, [formData.financing, patientId]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Alerta de estado FUA - Posicionada al inicio del formulario */}
      <FuaStatusAlert
        patientId={patientId}
        insuranceCode={formData.financing || formData.insurance || ''}
      />
      
      <Toaster />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar with Patient Information */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="pt-6">
              <PatientSection
                patientId={patientId}
                hospitalizationOrderId={hospitalizationId || undefined}
                onPatientDataLoaded={handlePatientDataLoaded}
                onUpdatePatient={onUpdatePatient}
                isLoadingUpdate={isLoadingUpdate}
                refreshPatientKey={refreshPatientKey}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Main form content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {/* Form Header - Historia, fecha y hora */}
              <FormHeader
                date={formData.date}
                time={formData.time}
                historyNumber={formData.historyNumber}
                onDateChange={(value) => handleFormChange('date', value)}
                onTimeChange={(value) => handleFormChange('time', value)}
                disabled={fieldsLocked}
                validationErrors={validationErrors}
              />
              
              {/* Datos del Acompañante */}
              <CompanionSection
                companionName={formData.companionName}
                companionPhone={formData.companionPhone}
                companionAddress={formData.companionAddress}
                companionDni={formData.companionDni}
                companionEmail={formData.companionEmail}
                companionRelationship={formData.companionRelationship}
                onCompanionChange={(field, value) => {
                  handleFormChange(field, value);
                }}
                validationErrors={validationErrors}
                disabled={fieldsLocked}
              />
              
              {/* Datos de Hospitalización */}
              <HospitalizationSection
                formData={{
                  procedencia: formData.procedencia,
                  hospitalizationOrigin: formData.hospitalizationOrigin,
                  hospitalizedIn: formData.hospitalizedIn,
                  authorizingDoctor: formData.authorizingDoctor,
                  financing: formData.financing,
                  diagnosis: formData.diagnosis
                }}
                patientId={patientId}
                validationErrors={validationErrors}
                disabled={fieldsLocked}
                onFormChange={handleFormChange}
                onOrigenChange={(value, origenData) => {
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
                onProcedenciaChange={(value) => {
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
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      
      {/* Componente para cargar datos de hospitalización existente - Comentado temporalmente */}
      {/* <HospitalizationDetails
        hospitalizationId={hospitalizationId}
        onDataLoaded={handleHospitalizationDataLoaded}
        onStatusChange={handleStatusChange}
      /> */}
      
      {/* Diálogo de confirmación */}
      <FormActions 
        onSave={processForm}
        onCancel={handleCancel}
        submitting={submitting}
        isEditable={isEditable}
        patientId={patientId}
        insuranceCode={formData.financing}
        onAccountSelected={(id) => { selectedCuentaIdRef.current = id; forceCreateNewRef.current = false; }}
        onCreateNewAccount={() => { selectedCuentaIdRef.current = null; forceCreateNewRef.current = true; }}
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
          
          // Comentado temporalmente - verificación de diagnóstico
          // if (formData.diagnosis && origenCode === 'CE' && verificacionDiagnosticoRef.current) {
          //   const resultado = await verificacionDiagnosticoRef.current.verificar();
          //   
          //   if (!resultado.valido) {
          //     // Si el diagnóstico no es válido, detener el proceso
          //     return false;
          //   }
          //   
          //   // Si hay un reemplazo sugerido, actualizar el diagnóstico
          //   if (resultado.reemplazo && !resultado.multiples) {
          //     setFormData(prev => ({
          //       ...prev,
          //       diagnosis: resultado.reemplazo || prev.diagnosis
          //     }));
          //   }
          // }
          
          return true;
        }}
      />
    </form>
  );
}
