"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { PDFViewerModal } from '@/components/ui/pdf-viewer-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Loader2, Save } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { OrigenHospitalizacion } from '@/services/origenHospitalizacionService'
import { Seguro } from '@/services/seguroService'
import { Diagnostico } from '@/services/diagnosticoService'
import { HospitalizacionDetalle } from '@/services/hospitalizaService'
// Componentes reutilizables
import { PatientInfoCard } from '@/components/hospitalization/PatientInfoCard'
import { OrigenSelector } from '@/components/hospitalization/OrigenSelector'
import { ConsultorioSelector } from '@/components/hospitalization/ConsultorioSelector'
import { MedicoSelector } from '@/components/hospitalization/MedicoSelector'
import { SeguroSelector } from '@/components/hospitalization/SeguroSelector'
import { DiagnosticoSelector } from '@/components/hospitalization/DiagnosticoSelector'
import { DateTimeFields } from '@/components/hospitalization/DateTimeFields'

interface HospitalizationFormProps {
  patientId: string;
  orderId?: string | null;
}

export function HospitalizationForm({ patientId, orderId }: HospitalizationFormProps) {
  const router = useRouter();
  
  // Estado para loading y error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [pdfTitle, setPdfTitle] = useState('');
  const [filiacionData, setFiliacionData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isEditable, setIsEditable] = useState(true);
  const [fieldsLocked, setFieldsLocked] = useState(false);
  
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
  
  // Initialize form data with empty values
  const [formData, setFormData] = useState({
    historyNumber: "",
    date: currentDate,
    time: currentTime,
    paternalSurname: "",
    maternalSurname: "",
    names: "",
    document: "",
    sex: "",
    birthDate: "",
    age: "",
    insurance: "",
    hospitalizationOrigin: "",
    attentionOrigin: "CE [CONSULTA EXTERNA]",
    hospitalizedIn: "",
    authorizingDoctor: "",
    financing: "",
    diagnosis: "",
    // Campos del acompañante
    companionName: "",
    companionPhone: "",
    companionAddress: ""
    // Campo observations eliminado según requerimiento
  });

  const [openSelects, setOpenSelects] = useState({
    hospitalizedIn: false,
    attentionOrigin: false,
    authorizingDoctor: false,
    diagnosis: false,
    financing: false,
    hospitalizationOrigin: false,
    seguro: false,
  });

  // Función para formatear fechas desde la base de datos
  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '';
    
    try {
      // Si es una cadena con formato ISO o SQL Server (YYYY-MM-DD)
      if (typeof dateString === 'string') {
        // Para convertir a formato YYYY-MM-DD (para inputs type="date")
        const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
          return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
        }
        
        // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
        const ddmmyyyyMatch = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (ddmmyyyyMatch) {
          const [_, day, month, year] = ddmmyyyyMatch;
          return `${year}-${month}-${day}`;
        }
      }
      
      // Si es un objeto Date o puede convertirse a uno
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }
      
      // Si ya está en el formato correcto o no podemos analizarlo
      return typeof dateString === 'string' ? dateString : '';
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return '';
    }
  };

  // Función para cargar detalles de hospitalización
  const fetchHospitalizationDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/orden-hospitalizacion/${id}`);
      if (!response.ok) {
        throw new Error(`Error al cargar detalles de hospitalización: ${response.statusText}`);
      }
      const data = await response.json();
      
      console.log('Datos de orden cargados:', data);
      
      // Verificar si el estado es '3' para bloquear campos
      if (data.ESTADO === '3') {
        console.log('Orden con ESTADO=3 detectada, bloqueando campos...');
        setFieldsLocked(true);
        setIsEditable(false);
        
        // Mostrar mensaje informativo
        setTimeout(() => {
          alert('Esta hospitalización no puede ser modificada debido a su estado actual.');
        }, 500);
      } else {
        setFieldsLocked(false);
        setIsEditable(true);
      }
      
      console.log('Estado de la orden:', data.ESTADO);
      
      console.log('Mapeando campos de la orden:', data);
      
      // Formatear la hora correctamente
      let formattedTime = currentTime;
      if (data.HORA1) {
        // Limpiar espacios y asegurar formato correcto
        const timeStr = data.HORA1.trim();
        console.log('Hora original:', timeStr);
        
        // Intentar formatear la hora en formato HH:MM
        try {
          // Si la hora viene como '13:45:00', extraer solo HH:MM
          if (timeStr.includes(':')) {
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
              const hours = parts[0].padStart(2, '0');
              const minutes = parts[1].padStart(2, '0');
              formattedTime = `${hours}:${minutes}`;
            }
          } 
          // Si la hora viene en otro formato, intentar convertirla
          else {
            formattedTime = timeStr;
          }
          console.log('Hora formateada:', formattedTime);
        } catch (error) {
          console.error('Error al formatear la hora:', error);
          formattedTime = currentTime;
        }
      }
      
      // Actualizar formData con los datos de la orden
      setFormData(prev => ({
        ...prev,
        date: formatDate(data.FECHA1) || currentDate,
        time: formattedTime,
        // Campos con etiqueta roja (obligatorios)
        hospitalizationOrigin: data.CUENTAID ? `${data.CUENTAID} [${data.CUENTANOMBRE || ''}]` : "",
        attentionOrigin: data.ORIGEN || "CE [CONSULTA EXTERNA]",
        hospitalizedIn: data.CONSULTORIO1 ? `${data.CONSULTORIO1.trim()} [${data.CONSULNOMBRE || ''}]` : "",
        authorizingDoctor: data.MEDICO1 ? `${data.MEDICO1} [${data.MEDICONOMBRE || ''}]` : "",
        financing: data.SEGURO ? `${data.SEGURO} [${data.SEGURONOMBRE || ''}]` : "",
        diagnosis: data.DIAGNOSTICO ? `${data.DIAGNOSTICO} [${data.DIAGNOMBRE || ''}]` : ""
      }));
      
      // Intentar cargar los datos en los selectores si están disponibles
      try {
        if (data.CUENTAID && data.CUENTANOMBRE) {
          // Crear un objeto compatible con OrigenHospitalizacion
          const origenData: OrigenHospitalizacion = {
            ORIGEN: data.ORIGEN || '',
            CODIGO: data.CUENTAID || '',
            CONSULTORIO: data.CONSULTORIO1 || '',
            NOM_CONSULTORIO: data.CONSULNOMBRE || '',
            PACIENTE: `${data.APELLIDO_PATERNO || ''} ${data.APELLIDO_MATERNO || ''} ${data.NOMBRES || ''}`.trim(),
            FECHA: new Date(),
            MEDICO: data.MEDICO1 || '',
            NOM_MEDICO: data.MEDICONOMBRE || '',
            NOMBRES: data.NOMBRES || '',
            DNI: data.DNI || '',
            DX: data.DIAGNOSTICO || ''
          };
          setSelectedOrigin(origenData);
        }
        
        if (data.DIAGNOSTICO && data.DIAGNOMBRE) {
          // Crear un objeto compatible con Diagnostico
          const diagnosticoData: Diagnostico = {
            Codigo: data.DIAGNOSTICO || '',
            Nombre: data.DIAGNOMBRE || ''
          };
          setSelectedDiagnostico(diagnosticoData);
        }
      } catch (error) {
        console.error('Error al configurar selectores con datos de la API:', error);
      }
      
    } catch (err: any) {
      console.error('Error al cargar detalles de hospitalización:', err);
      setError(err.message);
    }
  };

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

  // Cargar datos de hospitalización si existe orderId
  useEffect(() => {
    const loadHospitalizationData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Si hay un orderId, cargar detalles de la hospitalización
        if (orderId) {
          await fetchHospitalizationDetails(orderId);
        } else {
          setFieldsLocked(false); // No hay orden, permitir edición
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar datos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadHospitalizationData();
  }, [orderId]);

  // Cargar origen de hospitalización si existe
  useEffect(() => {
    if (orderId && formData.hospitalizationOrigin) {
      const loadHospitalizationOrigin = async () => {
        try {
          const originCode = formData.hospitalizationOrigin.split(' ')[0];
          const response = await fetch(`/api/origen-hospitalizacion?code=${encodeURIComponent(originCode)}`);
          if (!response.ok) throw new Error('Error al cargar origen de hospitalización');
          const data = await response.json();
          setSelectedOrigin(data);
        } catch (error) {
          console.error('Error cargando origen de hospitalización:', error);
        }
      };
      loadHospitalizationOrigin();
    }
  }, [orderId, formData.hospitalizationOrigin]);

  // Cargar diagnóstico si existe
  useEffect(() => {
    if (orderId && formData.diagnosis) {
      const loadDiagnostico = async () => {
        try {
          const diagCode = formData.diagnosis.split(' ')[0];
          const response = await fetch(`/api/diagnostico?code=${encodeURIComponent(diagCode)}`);
          if (!response.ok) throw new Error('Error al cargar diagnóstico');
          const data = await response.json();
          setSelectedDiagnostico(data);
        } catch (error) {
          console.error('Error cargando diagnóstico:', error);
        }
      };
      loadDiagnostico();
    }
  }, [orderId, formData.diagnosis]);

  // Cargar departamento si existe
  useEffect(() => {
    if (orderId && formData.hospitalizedIn) {
      const loadDepartamento = async () => {
        try {
          const deptCode = formData.hospitalizedIn.split(' ')[0];
          const response = await fetch(`/api/consultorio?code=${encodeURIComponent(deptCode)}`);
          if (!response.ok) throw new Error('Error al cargar departamento');
          const data = await response.json();
          setSelectedDepartamento(data);
        } catch (error) {
          console.error('Error cargando departamento:', error);
        }
      };
      loadDepartamento();
    }
  }, [orderId, formData.hospitalizedIn]);

  // Cargar médico si existe
  useEffect(() => {
    if (orderId && formData.authorizingDoctor) {
      const loadMedico = async () => {
        try {
          const medicoCode = formData.authorizingDoctor.split(' ')[0];
          const response = await fetch(`/api/medico?code=${encodeURIComponent(medicoCode)}`);
          if (!response.ok) throw new Error('Error al cargar médico');
          const data = await response.json();
          setSelectedMedico(data);
        } catch (error) {
          console.error('Error cargando médico:', error);
        }
      };
      loadMedico();
    }
  }, [orderId, formData.authorizingDoctor]);


  // Función para formatear la hora en formato 'hh:mm AM/PM'
  const formatTime = (time: string): string => {
    if (!time) return '';
    
    // Convertir de formato 24h a 12h con AM/PM
    const [hours, minutes] = time.split(':');
    const hoursNum = parseInt(hours, 10);
    const period = hoursNum >= 12 ? 'PM' : 'AM';
    const hours12 = hoursNum % 12 || 12; // Convertir 0 a 12
    
    return `${hours12.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  // Function to calculate age from birthdate in format '000a00m00d'
  const calculateAge = (birthDate: string | Date | null | undefined): string => {
    if (!birthDate) return '000a00m00d';
    
    try {
      let birthDateObj: Date;
      
      if (typeof birthDate === 'string') {
        // Check if it's in format YYYY-MM-DD
        const match = birthDate.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const [_, year, month, day] = match;
          birthDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Try to parse as is
          birthDateObj = new Date(birthDate);
        }
      } else if (birthDate instanceof Date) {
        birthDateObj = birthDate;
      } else {
        return '000a00m00d';
      }
      
      if (isNaN(birthDateObj.getTime())) {
        return '000a00m00d';
      }
      
      const today = new Date();
      
      let years = today.getFullYear() - birthDateObj.getFullYear();
      let months = today.getMonth() - birthDateObj.getMonth();
      let days = today.getDate() - birthDateObj.getDate();
      
      // Ajustar si los días son negativos
      if (days < 0) {
        months--;
        // Días en el mes anterior
        const prevMonthDate = new Date(today.getFullYear(), today.getMonth(), 0);
        days = prevMonthDate.getDate() + days;
      }
      
      // Ajustar si los meses son negativos
      if (months < 0) {
        years--;
        months += 12;
      }
      
      // Formatear como '000a00m00d'
      const formattedYears = years.toString().padStart(3, '0');
      const formattedMonths = months.toString().padStart(2, '0');
      const formattedDays = days.toString().padStart(2, '0');
      
      return `${formattedYears}a${formattedMonths}m${formattedDays}d`;
    } catch (error) {
      console.error('Error calculating age:', error);
      return '000a00m00d';
    }
  };
  // Función para validar campos requeridos
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validar campos del acompañante (marcados con text-red-500)
    if (!formData.companionName.trim()) {
      errors.companionName = "El nombre del acompañante es obligatorio";
    }
    
    if (!formData.companionPhone.trim()) {
      errors.companionPhone = "El teléfono del acompañante es obligatorio";
    } else if (!/^[0-9]+$/.test(formData.companionPhone)) {
      errors.companionPhone = "El teléfono debe contener solo números";
    }
    
    if (!formData.companionAddress.trim()) {
      errors.companionAddress = "El domicilio del acompañante es obligatorio";
    }
    
    // Validar campos de hospitalización marcados como requeridos
    if (!formData.hospitalizedIn.trim()) {
      errors.hospitalizedIn = "El consultorio es obligatorio";
    }
    
    if (!formData.financing.trim()) {
      errors.financing = "El financiamiento es obligatorio";
    }
    
    if (!formData.attentionOrigin.trim()) {
      errors.attentionOrigin = "La procedencia del paciente es obligatoria";
    }
    
    if (!formData.authorizingDoctor.trim()) {
      errors.authorizingDoctor = "El médico que autoriza es obligatorio";
    }
    
    if (!formData.diagnosis.trim()) {
      errors.diagnosis = "El diagnóstico es obligatorio";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario antes de mostrar diálogo de confirmación
    if (!validateForm()) {
      // Mostrar mensaje de error general
      toast({
        title: "Error de validación",
        description: "Por favor complete todos los campos obligatorios marcados con *",
        variant: "destructive"
      });
      // Hacer scroll al primer error
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Mostrar diálogo de confirmación personalizado
    setShowConfirmDialog(true);
  };
  
  // Función para procesar el formulario después de la confirmación
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
  
  const processForm = async () => {
    
    try {
      // Mostrar que se está procesando
      setSubmitting(true);
      
      // Obtener el siguiente ID de hospitalización
      const nextId = await fetchNextHospitalizacionId();
      if (!nextId) {
        toast({
          title: "Error",
          description: "No se pudo obtener el siguiente ID de hospitalización",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }
      
      // Extraer valores del formulario
      // IDHOSPITALIZACION será generado automáticamente por el servicio
      
      // Extraer el ID del origen y determinar si es emergencia (EM) o consulta externa (CE)
      const origenId = formData.hospitalizationOrigin ? formData.hospitalizationOrigin.split(' ')[0] : '';
      // Verificar si el origen contiene "EMERGENCIA" para determinar si es EM o CE
      const origenText = formData.hospitalizationOrigin || '';
      const origenCode = origenText.toUpperCase().includes('EMERGENCIA') ? 'EM' : 'CE';
      
      console.log('Origen seleccionado:', origenText, '-> Código:', origenCode);
      
      const medicoCode = formData.authorizingDoctor ? formData.authorizingDoctor.split(' ')[0].trim() : '';
      const consultorioCode = formData.hospitalizedIn ? formData.hospitalizedIn.split(' ')[0].trim() : '';
      
      // Formatear fecha como YYYYMMDD (formato requerido por SQL Server)
      const fechaObj = formData.date ? new Date(formData.date) : new Date();
      // Formato YYYYMMDD sin guiones
      const fechaFormateada = `${fechaObj.getFullYear()}${String(fechaObj.getMonth() + 1).padStart(2, '0')}${String(fechaObj.getDate()).padStart(2, '0')}`; // Formato YYYYMMDD
      
      const diagnosticoCode = formData.diagnosis ? formData.diagnosis.split(' ')[0].trim() : '';
      const seguroCode = formData.financing ? formData.financing.split(' ')[0].trim() : '20';
      const edadCalculada = calculateAge(formData.birthDate);
      const nombreCompleto = `${formData.paternalSurname || ''} ${formData.maternalSurname || ''} ${formData.names || ''} `.trim();
      
      // Validar que el teléfono sea numérico
      if (formData.companionPhone && !/^\d+$/.test(formData.companionPhone)) {
        alert('El teléfono del acompañante debe contener solo números');
        setSubmitting(false);
        return;
      }
      
      // Crear objeto con los valores correctamente formateados
      const valoresSQL = {
        // Incluir el IDHOSPITALIZACION obtenido del servicio
        IDHOSPITALIZACION: nextId,
        PACIENTE: patientId,
        NOMBRES: nombreCompleto,
        CONSULTORIO1: consultorioCode.padEnd(6, ' ').substring(0, 6), // Exactamente 6 caracteres
        HORA1: formatTime(formData.time), // Formato hh:mm AM/PM
        FECHA1: fechaFormateada, // Formato YYYY-MM-DD
        ORIGEN: origenCode, // 'EM' o 'CE' basado en el texto del origen
        SEGURO: seguroCode,
        MEDICO1: medicoCode,
        ESTADO: '2',
        USUARIO: 'SUPERVISOR',
        DIAGNOSTICO: diagnosticoCode,
        EDAD: edadCalculada, // Formato '000a00m00d'
        ORIGENID: origenId.trim().substring(0, 10), // Máximo 10 caracteres
        // Datos del acompañante
        ACOMPANANTE_NOMBRE: formData.companionName || '',
        ACOMPANANTE_TELEFONO: formData.companionPhone || '',
        ACOMPANANTE_DIRECCION: formData.companionAddress || ''
      };
      
      // Mostrar el objeto JSON en la consola para validación
      console.log('Datos de hospitalización a enviar:', JSON.stringify(valoresSQL, null, 2));
      
      // Mostrar un alert con los datos para validación
      alert('Revisa la consola para ver los datos que se enviarán. Presiona OK para continuar.');
      
      // Enviar los datos al API de hospitalización
      const response = await fetch('/api/hospitaliza', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(valoresSQL),
      });
      
      // Procesar la respuesta
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la hospitalización');
      }
      
      const result = await response.json();
      console.log('Hospitalización creada:', result);
      
      // Mostrar mensaje de éxito
      setSubmitting(false);
      toast({
        title: "Hospitalización creada",
        description: `Se ha creado la hospitalización con ID: ${result.IDHOSPITALIZACION}`,
        variant: "default"
      });
      
      // Obtener el ID limpio para los PDFs
      const cleanId = result.IDHOSPITALIZACION.trim();
      
      // Configurar los PDFs para mostrar (orden de hospitalización y consentimiento)
      setPdfTitle('Documentos de Hospitalización');
      setPdfUrls([
        `http://192.168.0.21:8080/api/reporte/pdf/orden-hospitalizacion/${cleanId}`,
        `http://192.168.0.21:8080/api/reporte/pdf/consentimiento-hospitalizacion/${cleanId}`,
        `http://192.168.0.21:8080/api/reporte/pdf/hoja-filiacion/${cleanId}`
      ]);
      
      // Abrir el visor de PDF
      setPdfViewerOpen(true);
      
      // No redirigimos automáticamente para permitir que el usuario vea e imprima los PDFs
      
    } catch (error: any) {
      console.error('Error:', error);
      setSubmitting(false);
      alert('Error al procesar el formulario');
    }
  };

  const handleCancel = () => {
    router.push('/hospitalization');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando datos del paciente...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Error</h3>
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={handleCancel}
        >
          Volver
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <Toaster />
      {/* Diálogo de confirmación */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          setShowConfirmDialog(false);
          processForm();
        }}
        title="Confirmar hospitalización"
        description="¿Está seguro de generar la orden de hospitalización? Esta acción no se puede deshacer."
        confirmText="Generar orden"
        cancelText="Cancelar"
        isLoading={submitting}
      />
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
                   
              {/* Datos del Acompañante */}
              <h3 className="text-lg font-semibold mb-4">Datos del Acompañante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-blue-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <Label htmlFor="companionName" className="font-medium text-red-500">● Nombres y apellidos del acompañante *</Label>
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
                  <Label htmlFor="companionPhone" className="font-medium text-red-500">● Teléfono del acompañante *</Label>
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
                  <Label htmlFor="companionAddress" className="font-medium text-red-500">● Domicilio del acompañante *</Label>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-green-50 p-4 rounded-lg border border-gray-200">
                {/* Columna izquierda */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="origen" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Código de Origen de Atención <span className="text-red-500">*</span>
                    </Label>
                    <OrigenSelector
                      value={formData.hospitalizationOrigin}
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
                      disabled={fieldsLocked}
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="consultorio" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Hospitalizado en <span className="text-red-500">*</span>
                    </Label>
                    <ConsultorioSelector
                      value={formData.hospitalizedIn}
                      onChange={(value) => setFormData({ ...formData, hospitalizedIn: value })}
                      disabled={fieldsLocked}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="seguro" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Financiamiento <span className="text-red-500">*</span>
                    </Label>
                    <SeguroSelector
                      value={formData.financing}
                      onChange={(value) => setFormData({ ...formData, financing: value })}
                      disabled={fieldsLocked}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Columna derecha */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="attentionOrigin" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Procedencia del Paciente <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="attentionOrigin"
                      value={formData.attentionOrigin}
                      onChange={(e) => setFormData({ ...formData, attentionOrigin: e.target.value })}
                      className="font-medium"
                      disabled={true} // Siempre en modo solo lectura
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="medico" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Médico que autoriza la Hospitalización <span className="text-red-500">*</span>
                    </Label>
                    <MedicoSelector
                      value={formData.authorizingDoctor}
                      onChange={(value, medicoData) => {
                        console.log('Médico seleccionado:', medicoData);
                        setFormData({ ...formData, authorizingDoctor: value });
                      }}
                      disabled={fieldsLocked}
                      className="w-full"
                      // No pasamos consultorioId para permitir buscar cualquier médico
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="diagnostico" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Diagnóstico <span className="text-red-500">*</span>
                    </Label>
                    <DiagnosticoSelector
                      value={formData.diagnosis}
                      onChange={(value, diagnosticoData) => {
                        console.log('Diagnóstico seleccionado:', diagnosticoData);
                        setFormData({ ...formData, diagnosis: value });
                      }}
                      disabled={fieldsLocked}
                      origenId={formData.hospitalizationOrigin ? formData.hospitalizationOrigin.split(' ')[0] : ''} // Extraemos el código de origen del valor seleccionado
                      className="w-full"
                    />
                  </div>
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
              
              <div className="flex justify-end space-x-4 mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || fieldsLocked}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Visor de PDF para documentos de hospitalización */}
      <PDFViewerModal
        open={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        pdfUrls={pdfUrls}
        title={pdfTitle}
        patientId={patientId}
      />
    </form>
  );
}
