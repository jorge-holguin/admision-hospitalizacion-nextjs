"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from "@/components/ui/spinner"
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { PatientInfoCard } from '@/components/hospitalization/PatientInfoCard'
import { DateTimeFields } from '@/components/hospitalization/DateTimeFields'
import { MedicoSelector } from '@/components/hospitalization/MedicoSelector'
import { DiagnosticoSelector } from '@/components/hospitalization/DiagnosticoSelector'
import { ConsultorioSelector } from '@/components/hospitalization/ConsultorioSelector'
import { SeguroSelector } from '@/components/hospitalization/SeguroSelector'
import { OrigenSelector } from '@/components/hospitalization/OrigenSelector'

interface HospitalizationViewProps {
  patientId: string;
  orderId: string | null;
}

export function HospitalizationView({ patientId, orderId }: HospitalizationViewProps) {
  const router = useRouter();
  
  // Estados para manejar datos y UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldsLocked, setFieldsLocked] = useState(false);
  const [filiacionData, setFiliacionData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  // Ya no necesitamos el estado para el médico seleccionado
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    date: '',
    time: '',
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
    attentionOrigin: ''
  });
  
  // Ya no necesitamos cargar datos de filiación ni detalles del médico desde APIs separadas
  // PatientInfoCard se encarga de cargar los datos de filiación

  // Función para cargar detalles de hospitalización
  const fetchHospitalizationDetails = async (id: string) => {
    try {
      console.log(`Consultando API de orden de hospitalización con ID: ${id}`);
      const response = await fetch(`/api/orden-hospitalizacion/${id}`);
      if (!response.ok) {
        throw new Error(`Error al cargar detalles de hospitalización: ${response.statusText}`);
      }
      const data = await response.json();
      
      console.log('Datos de orden cargados:', data);
      setOrderData(data);
      
      // Verificar el estado para determinar si es editable
      if (data.ESTADO === '2') {
        console.log('Orden con ESTADO=2 detectada, permitiendo edición limitada...');
        setIsEditable(true);
        setFieldsLocked(false);
      } else if (data.ESTADO === '3') {
        console.log('Orden con ESTADO=3 detectada, modo solo lectura...');
        setIsEditable(false);
        setFieldsLocked(true);
        
        // Mostrar mensaje informativo
        setTimeout(() => {
          alert('Esta hospitalización está en estado finalizado y no puede ser modificada.');
        }, 500);
      } else {
        // Para cualquier otro estado, modo solo lectura
        setIsEditable(false);
        setFieldsLocked(true);
      }
      
      console.log('Estado de la orden:', data.ESTADO);
      
      // Formatear la hora correctamente desde HORA1
      let formattedTime = '';
      if (data.HORA1) {
        // Extraer solo horas y minutos (formato HH:MM)
        const timeParts = data.HORA1.split(':');
        if (timeParts.length >= 2) {
          formattedTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
        } else {
          formattedTime = data.HORA1;
        }
      }
      
      // Actualizar el estado del formulario con los datos de la orden
      setFormData({
        date: data.FECHA1 || '',
        time: formattedTime,
        hospitalizationId: data.IDHOSPITALIZACION?.trim() || '',
        origin: data.ORIGEN || '',
        originName: data.ORIGENOMBRE || '',
        consultorio: data.CONSULTORIO1 || '',
        consultorioName: data.CONSULNOMBRE || '',
        medico: data.MEDICO1 || '',
        medicoName: data.MEDICONOMBRE || '',
        seguro: data.SEGURO || '',
        seguroName: data.SEGURONOMBRE || '',
        diagnostico: data.DIAGNOSTICO || '',
        attentionOrigin: data.ATENCION || ''
      });
      
      // Ya no necesitamos cargar datos adicionales del médico
      
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
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Cargar detalles de hospitalización si hay orderId
        if (orderId) {
          await fetchHospitalizationDetails(orderId);
        } else {
          setLoading(false);
          setError('No se proporcionó ID de orden de hospitalización');
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        setError('Error al cargar datos iniciales. Por favor, inténtelo de nuevo.');
        setLoading(false);
      }
    };
    
    loadData();
  }, [orderId]); // Ya no dependemos de patientId porque no hacemos fetch de filiación

  // Estado para el mensaje de éxito
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditable) {
      console.log('Formulario en modo solo lectura, no se puede enviar');
      return;
    }
    
    setSubmitting(true);
    
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
      const fechaFormateada = formData.date ? formData.date.replace(/-/g, '') : '';
      
      // Preparar datos para enviar a la API
      const updateData = {
        orderId: orderId,
        patientId: patientId,
        fecha: formData.date,
        hora: formData.time,
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
      
      console.log('Enviando datos actualizados:', updateData);
      
      // Crear objeto con los valores correctamente formateados para SQL
      const valoresSQL = {
        // Incluir el IDHOSPITALIZACION obtenido del servicio
        IDHOSPITALIZACION: orderId,
        PACIENTE: patientId,
        NOMBRES: orderData?.NOMBRES || '',
        CONSULTORIO1: consultorioCode.padEnd(6, ' ').substring(0, 6), // Exactamente 6 caracteres
        HORA1: formData.time, // Formato hh:mm AM/PM
        FECHA1: fechaFormateada, // Formato YYYYMMDD
        ORIGEN: origenCode === 'EM' ? 'EM' : 'CE', // 'EM' o 'CE' basado en el texto del origen
        SEGURO: seguroCode,
        MEDICO1: medicoCode,
        ESTADO: '2',
        USUARIO: 'SUPERVISOR',
        DIAGNOSTICO: diagnosticoCode,
        EDAD: orderData?.EDAD || '000a00m00d', // Formato '000a00m00d'
        ORIGENID: origenCode.trim().substring(0, 10), // Máximo 10 caracteres
        // Datos del acompañante
        ACOMPANANTE_NOMBRE: companionName || '',
        ACOMPANANTE_TELEFONO: companionPhone || '',
        ACOMPANANTE_DIRECCION: companionAddress || ''
      };
      
      // Mostrar el objeto JSON en la consola
      console.log('Valores para SQL:', valoresSQL);
      
      // Mostrar la consulta SQL en una alerta
      const sqlQueryPreview = JSON.stringify(valoresSQL, null, 2);
      alert(`Valores SQL para actualización:\n${sqlQueryPreview}`);
      
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
      
      // Redirigir después de un breve retraso
      setTimeout(() => {
        router.push(`/hospitalization/orders/${patientId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error al guardar los datos:', error);
      alert('Error al guardar los datos. Por favor, inténtelo de nuevo.');
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

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return dateString;
    }
  };

  // Formatear hora para mostrar (HH:MM)
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    // Si ya está en formato HH:MM, devolverlo tal cual
    if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;
    
    try {
      // Intentar extraer horas y minutos de diferentes formatos
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
      }
      return timeString;
    } catch (error) {
      console.error('Error al formatear hora:', error);
      return timeString;
    }
  };

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
              <div className="flex-1">
                <PatientInfoCard
                  patientId={patientId}
                  onDataLoaded={(data) => console.log('Datos de paciente cargados en PatientInfoCard:', data)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {/* Form Header - Historia, fecha y hora */}
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 mb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <Label htmlFor="historyNumber" className="font-medium">Nº Historia:</Label>
                    <Input
                      id="historyNumber"
                      value={formData.hospitalizationId}
                      readOnly
                      disabled={true}
                      className="font-medium mt-2"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateField" className="font-medium">Fecha de Ingreso:</Label>
                        <Input
                          id="dateField"
                          value={orderData?.FECHA1 || ''}
                          disabled={true}
                          className="font-medium mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeField" className="font-medium">Hora de Ingreso:</Label>
                        <Input
                          id="timeField"
                          value={orderData?.HORA1 || ''}
                          disabled={true}
                          className="font-medium mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          
              {/* Datos del Acompañante */}
              <h3 className="text-lg font-semibold mb-4">Datos del Acompañante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-blue-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <Label htmlFor="companionName" className="font-medium text-red-500">Nombres y apellidos del acompañante *</Label>
                  <Input
                    id="companionName"
                    value={orderData?.ACOMPANANTE_NOMBRE || ''}
                    onChange={(e) => {
                      if (isEditable) {
                        setOrderData({...orderData, ACOMPANANTE_NOMBRE: e.target.value});
                      }
                    }}
                    readOnly={!isEditable}
                    disabled={fieldsLocked}
                    className="w-full font-medium"
                    placeholder={isEditable ? "Ingrese nombre del acompañante" : "No registrado"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companionPhone" className="font-medium text-red-500">Teléfono del acompañante *</Label>
                  <Input
                    id="companionPhone"
                    value={orderData?.ACOMPANANTE_TELEFONO || ''}
                    onChange={(e) => {
                      if (isEditable) {
                        setOrderData({...orderData, ACOMPANANTE_TELEFONO: e.target.value});
                      }
                    }}
                    readOnly={!isEditable}
                    disabled={fieldsLocked}
                    className="w-full font-medium"
                    placeholder={isEditable ? "Ingrese teléfono del acompañante" : "No registrado"}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="companionAddress" className="font-medium text-red-500">Domicilio del acompañante *</Label>
                  <Input
                    id="companionAddress"
                    value={orderData?.ACOMPANANTE_DIRECCION || ''}
                    onChange={(e) => {
                      if (isEditable) {
                        setOrderData({...orderData, ACOMPANANTE_DIRECCION: e.target.value});
                      }
                    }}
                    readOnly={!isEditable}
                    disabled={fieldsLocked}
                    className="w-full font-medium"
                    placeholder={isEditable ? "Ingrese domicilio del acompañante" : "No registrado"}
                  />
                </div>
              </div>
              
              {/* Datos de Hospitalización */}
              <h3 className="text-lg font-semibold mb-4">Datos de Hospitalización</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-green-50 p-4 rounded-lg border border-gray-200">
                {/* Columna izquierda */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="origen" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Código de Origen de Atención
                    </Label>
                    <Input
                      id="origen"
                      value={formData.hospitalizationId || ''}
                      readOnly
                      disabled={true}
                      className="w-full font-medium"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="consultorio" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Hospitalizado en
                    </Label>
                    {isEditable ? (
                      <ConsultorioSelector
                        value={`${formData.consultorio} - ${formData.consultorioName}`}
                        onChange={(value) => {
                          const parts = value.split(' - ');
                          setFormData({
                            ...formData,
                            consultorio: parts[0],
                            consultorioName: parts.length > 1 ? parts[1] : ''
                          });
                        }}
                        disabled={fieldsLocked}
                        className="w-full"
                      />
                    ) : (
                      <Input
                        id="consultorio"
                        value={`${formData.consultorio} - ${formData.consultorioName}`}
                        readOnly
                        disabled={fieldsLocked}
                        className="w-full font-medium"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="seguro" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Financiamiento
                    </Label>
                    {isEditable ? (
                      <SeguroSelector
                        value={`${formData.seguro} - ${formData.seguroName}`}
                        onChange={(value) => {
                          const parts = value.split(' - ');
                          setFormData({
                            ...formData,
                            seguro: parts[0],
                            seguroName: parts.length > 1 ? parts[1] : ''
                          });
                        }}
                        disabled={fieldsLocked}
                        className="w-full"
                      />
                    ) : (
                      <Input
                        id="seguro"
                        value={`${formData.seguro} - ${formData.seguroName}`}
                        readOnly
                        disabled={true}
                        className="w-full font-medium"
                      />
                    )}
                  </div>
                </div>
                
                {/* Columna derecha */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="attentionOrigin" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Procedencia del Paciente
                    </Label>
                    <Input
                        id="attentionOrigin"
                        value={`${formData.origin} - ${formData.originName}`}
                        readOnly
                        disabled={true}
                        className="w-full font-medium"
                      />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="medico" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Médico que autoriza la Hospitalización
                    </Label>
                    {isEditable ? (
                      <MedicoSelector
                        value={`${formData.medico} - ${formData.medicoName}`}
                        onChange={(value, medicoData) => {
                          const parts = value.split(' - ');
                          setFormData({
                            ...formData,
                            medico: parts[0],
                            medicoName: parts.length > 1 ? parts[1] : ''
                          });
                        }}
                        disabled={fieldsLocked}
                        className="w-full"
                      />
                    ) : (
                      <Input
                        id="medico"
                        value={`${formData.medico} - ${formData.medicoName}`}
                        readOnly
                        disabled={fieldsLocked}
                        className="w-full font-medium"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="diagnostico" className="text-sm font-semibold text-red-600">
                      <span className="text-red-500">●</span> Diagnóstico
                    </Label>
                    {isEditable ? (
                      <DiagnosticoSelector
                        value={formData.diagnostico}
                        onChange={(value, diagnosticoData) => {
                          setFormData({
                            ...formData,
                            diagnostico: value
                          });
                        }}
                        disabled={fieldsLocked}
                        origenId={formData.origin}
                        className="w-full"
                      />
                    ) : (
                      <Input
                        id="diagnostico"
                        value={formData.diagnostico}
                        readOnly
                        disabled={fieldsLocked}
                        className="w-full font-medium"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Mensaje informativo */}
              <div className="flex items-center mt-6 mb-2 text-sm text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>El Código de Origen de Atención no es requerido si el nombre es "RN".</span>
              </div>
              
              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGoBack}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                
                {isEditable && (
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
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
