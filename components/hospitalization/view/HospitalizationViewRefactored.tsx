"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { datetimeService } from '@/services/datetimeService'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Spinner } from "@/components/ui/spinner"
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { extractUserSurnameFromToken } from '@/utils/jwtUtils'
import { convertDateFormat, convertTimeFormat, convertTo12HourFormat } from '@/utils/dateFormatUtils'
import { usePatient } from '@/contexts/PatientContext'

// Componentes reutilizables
import { PatientInfoCard } from '@/components/hospitalization/PatientInfoCard'

// Componentes específicos para la vista
import { FormHeader } from './FormHeader'
import { CompanionInfo } from './CompanionInfo'
import { HospitalizationInfo } from './HospitalizationInfo'
import { ViewActions } from './ViewActions'
import { ViewDetails } from './ViewDetails'

interface HospitalizationViewProps {
  patientId: string;
  orderId: string | null;
}

export function HospitalizationViewRefactored({ patientId, orderId }: HospitalizationViewProps) {
  const router = useRouter();
  const { patientData, setPatientData } = usePatient();
  
  // Callback memoizado para manejar datos del paciente
  const handlePatientDataLoaded = useCallback((data: any) => {
    setPatientData({
      hc: data.historyNumber,
      name: `${data.paternalSurname} ${data.maternalSurname}, ${data.names}`,
      documento: data.document,
      pacienteId: patientId
    });
  }, [patientId, setPatientData]);
  
  // Estados para manejar datos y UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldsLocked, setFieldsLocked] = useState(false);
  const [filiacionData, setFiliacionData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [dateEdited, setDateEdited] = useState(false);
  const [timeEdited, setTimeEdited] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    dateEdited: false, // Flag para saber si la fecha fue editada manualmente
    timeEdited: false, // Flag para saber si la hora fue editada manualmente
    hospitalizationId: '',
    origin: '',
    originName: '',
    consultorio: '',
    consultorioName: '',
    medico: '',
    medicoName: '',
    seguro: '',
    seguroName: '',
    diagnostico: '',
    diagnosticoNombre: '',
    attentionOrigin: ''
  });
  
  // Función para cargar detalles de hospitalización
  const fetchHospitalizationDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orden-hospitalizacion/${id}`);
      
      if (!response.ok) {
        console.error(`Error en respuesta API: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Contenido de error: ${errorText}`);
        throw new Error(`Error al cargar detalles de hospitalización: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setOrderData(data);
      
      // Verificar el estado para determinar si es editable
      if (data.ESTADO === '2') {
        setIsEditable(true);
        setFieldsLocked(false);
      } else if (data.ESTADO === '3') {
        setIsEditable(false);
        setFieldsLocked(true);
        
        // Mostrar mensaje informativo
        setTimeout(() => {
          toast({
            title: "Información",
            description: "Esta hospitalización está en estado finalizado y no puede ser modificada.",
            variant: "default"
          });
        }, 500);
      } else {
        // Para cualquier otro estado, modo solo lectura
        setIsEditable(false);
        setFieldsLocked(true);
      }
      
      // Convertir la fecha del formato DD/MM/YYYY a YYYY-MM-DD
      const formattedDate = data.FECHA1 ? convertDateFormat(data.FECHA1) : '';
      
      // Convertir la hora del formato 12h a 24h
      const formattedTime = data.HORA1 ? convertTimeFormat(data.HORA1) : '';
      
      console.log('Fecha original:', data.FECHA1, 'Fecha convertida:', formattedDate);
      console.log('Hora original:', data.HORA1, 'Hora convertida:', formattedTime);
      
      // Actualizar el estado del formulario con los datos de la orden
      setFormData({
        date: formattedDate,
        time: formattedTime,
        dateEdited: false, // Inicialmente no está editado
        timeEdited: false, // Inicialmente no está editado
        hospitalizationId: data.ORIGENID?.trim() || '', // Usar ORIGENID para el código de origen de atención
        origin: data.ORIGEN || '',
        originName: data.ORIGENOMBRE || '',
        consultorio: data.CONSULTORIO1 || '',
        consultorioName: data.CONSULNOMBRE || '',
        medico: data.MEDICO1 || '',
        medicoName: data.MEDICONOMBRE || '',
        seguro: data.SEGURO || '',
        seguroName: data.SEGURONOMBRE || '',
        diagnostico: data.DIAGNOSTICO || '',
        diagnosticoNombre: data.DIAGNOSTICONOMBRE || '',
        attentionOrigin: data.ATENCION || ''
      });
      
      // Si hay datos de filiación en la respuesta, actualizarlos
      if (data.FILIACION) {
        setFiliacionData(data.FILIACION);
      }
      
    } catch (error) {
      console.error('Error al cargar detalles de hospitalización:', error);
      setError('Error al cargar detalles de hospitalización. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (orderId) {
      fetchHospitalizationDetails(orderId);
    } else {
      setLoading(false);
      setError('No se proporcionó ID de orden de hospitalización');
    }
  }, [orderId]);

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditable) {
      toast({
        title: "Información",
        description: "Formulario en modo solo lectura, no se puede enviar",
        variant: "default"
      });
      return;
    }
    
    // Validar que la fecha y hora no estén vacías
    if (!formData.date || !formData.time) {
      toast({
        title: "Error de validación",
        description: "La fecha y hora de ingreso son obligatorias",
        variant: "destructive"
      });
      return;
    }
    
    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.date)) {
      toast({
        title: "Error de validación",
        description: "El formato de fecha debe ser YYYY-MM-DD",
        variant: "destructive"
      });
      return;
    }
    
    // Validar formato de hora (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(formData.time)) {
      toast({
        title: "Error de validación",
        description: "El formato de hora debe ser HH:MM (24 horas)",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    // Usar siempre los valores del formulario (preservar fecha/hora original si no se editó)
    const serverDate = formData.date;
    const serverTime = formData.time;
    
    // Convertir la hora de formato 24h a formato 12h para guardar en la base de datos
    const time12h = convertTo12HourFormat(serverTime);
    console.log('Hora convertida a formato 12h para guardar:', time12h);
    
    try {
      // Obtener los valores de los campos de acompañante
      const companionName = orderData?.ACOMPANANTE_NOMBRE || '';
      const companionPhone = orderData?.ACOMPANANTE_TELEFONO || '';
      const companionAddress = orderData?.ACOMPANANTE_DIRECCION || '';
      
      // Extraer solo los IDs numéricos de los campos
      const consultorioCode = formData.consultorio ? formData.consultorio.split(' ')[0].trim() : '';
      const origenCode = formData.origin ? formData.origin.split(' ')[0].trim() : '';
      const seguroCode = formData.seguro ? formData.seguro.split(' ')[0].trim() : '';
      const medicoCode = formData.medico ? formData.medico.split(' ')[0].trim() : '';
      const diagnosticoCode = formData.diagnostico ? formData.diagnostico.split(' ')[0].trim() : '';
      
      // Formatear la fecha como YYYYMMDD para SQL Server
      const fechaFormateada = serverDate ? serverDate.replace(/-/g, '') : '';
      
      // Preparar datos para enviar a la API
      const updateData = {
        orderId: orderId,
        patientId: patientId,
        fecha: serverDate,
        hora: time12h, // Usar el formato de 12 horas
        origen: formData.origin,
        origen_atencion: formData.originName,
        consultorio: formData.consultorio,
        seguro: formData.seguro,
        medico: formData.medico,
        diagnostico: formData.diagnostico,
        estado: orderData?.ESTADO || '2',
        acompanante_nombre: companionName,
        acompanante_telefono: companionPhone,
        acompanante_direccion: companionAddress
      };
      
      // Crear objeto con los valores correctamente formateados para SQL
      const valoresSQL = {
        // Incluir el IDHOSPITALIZACION obtenido del servicio
        IDHOSPITALIZACION: orderId,
        PACIENTE: patientId,
        NOMBRES: orderData?.NOMBRES || '',
        CONSULTORIO1: consultorioCode.padEnd(6, ' ').substring(0, 6), // Exactamente 6 caracteres
        HORA1: time12h, // Usar la hora en formato 12h
        FECHA1: fechaFormateada, // Formato YYYYMMDD con fecha del servidor
        ORIGEN: formData.origin, // Usar el valor de origin del formData que se actualiza al cambiar la procedencia
        SEGURO: seguroCode,
        MEDICO1: medicoCode,
        ESTADO: '2',
        // Obtener el apellido del usuario desde el token JWT
        USUARIO: (() => {
          const apellido = typeof window !== 'undefined' ? extractUserSurnameFromToken() : 'SUPERVISOR';
          return apellido || 'SUPERVISOR';
        })(),
        USUARIO_IMP: (() => {
          const apellido = typeof window !== 'undefined' ? extractUserSurnameFromToken() : 'SUPERVISOR';
          return apellido || 'SUPERVISOR';
        })(),
        DIAGNOSTICO: diagnosticoCode,
        EDAD: orderData?.EDAD || '000a00m00d', // Formato '000a00m00d'
        // Si el origen es RN, el ORIGENID debe estar vacío
        ORIGENID: formData.origin === 'RN' ? '' : (formData.hospitalizationId ? formData.hospitalizationId.trim().substring(0, 10) : ''),
        // Datos del acompañante
        ACOMPANANTE_NOMBRE: companionName || '',
        ACOMPANANTE_TELEFONO: companionPhone || '',
        ACOMPANANTE_DIRECCION: companionAddress || ''
      };
      
      // Enviar datos a la API
      const response = await fetch(`/api/orden-hospitalizacion/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updateData,
          valoresSQL // Incluir los valores SQL formateados
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error al guardar: ${response.statusText}`);
      }
      
      // Mostrar mensaje de éxito
      setShowSuccessMessage(true);
      toast({
        title: "Éxito",
        description: "Se actualizó la hospitalización correctamente.",
        variant: "default"
      });
      
      // Redirigir después de un breve retraso
      setTimeout(() => {
        router.push(`/hospitalization/orders/${patientId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error al guardar los datos:', error);
      toast({
        title: "Error",
        description: "Error al guardar los datos. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Función para manejar el botón de volver
  const handleGoBack = () => {
    router.push(`/hospitalization/orders/${patientId}`);
  };

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Mostrar error si ocurre
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={handleGoBack}>Volver</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensaje de éxito */}
      {showSuccessMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">¡Éxito! </strong>
          <span className="block sm:inline">Se actualizó la hospitalización correctamente.</span>
          <span className="block mt-2">Redirigiendo a la lista de órdenes...</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar with Patient Information */}
        <div className="lg:col-span-1 flex flex-col">
          <Card className="h-full flex-1">
            <CardContent className="pt-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-4">Datos del Paciente</h3>
              <div className="flex-1 flex flex-col">
                <PatientInfoCard
                  patientId={patientId}
                  hospitalizationOrderId={orderId || undefined}
                  onDataLoaded={handlePatientDataLoaded}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="h-full flex-1">
            <CardContent className="pt-6 h-full flex flex-col">
              {/* Form Header - Historia, fecha y hora */}
              <FormHeader 
                date={formData.date || ''}
                time={formData.time || ''}
                historyNumber={orderData?.HISTORIA?.trim() || ''}
                onDateChange={(newDate: string) => {
                  setFormData({
                    ...formData,
                    date: newDate,
                    dateEdited: true // Marcar como editado manualmente
                  });
                }}
                onTimeChange={(newTime: string) => {
                  setFormData({
                    ...formData,
                    time: newTime,
                    timeEdited: true // Marcar como editado manualmente
                  });
                }}
                disabled={!isEditable || fieldsLocked}
                validationErrors={{}}
              />  
              
              {/* Datos del Acompañante */}
              <CompanionInfo 
                companionData={orderData}
                isEditable={isEditable}
                fieldsLocked={fieldsLocked}
                onChange={(updatedData) => setOrderData({...orderData, ...updatedData})}
              />
              
              {/* Datos de Hospitalización */}
              <HospitalizationInfo 
                formData={{...formData, patientId: patientId}}
                setFormData={setFormData}
                isEditable={isEditable}
                fieldsLocked={fieldsLocked}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Componente para cargar detalles de la vista */}
      <ViewDetails
        orderId={orderId}
        onDataLoaded={(data) => {
          // Opcional: manejar datos adicionales si es necesario
        }}
      />
      
      {/* Acciones de la vista */}
      <ViewActions 
        onSave={handleSubmit}
        onCancel={handleGoBack}
        submitting={submitting}
        isEditable={isEditable}
      />
    </form>
  );
}
