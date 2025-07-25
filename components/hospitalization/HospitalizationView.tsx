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

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditable) {
      console.log('Formulario en modo solo lectura, no se puede enviar');
      return;
    }
    
    setSubmitting(true);
    
    try {
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
        estado: orderData?.ESTADO || '2'
      };
      
      console.log('Enviando datos actualizados:', updateData);
      
      // Si el estado es '2', mostrar la consulta SQL que se ejecutaría
      if (orderData?.ESTADO === '2') {
        // Extraer solo los IDs numéricos de los campos
        const consultorioId = formData.consultorio ? formData.consultorio.split(' ')[0].trim() : '';
        const origenId = formData.origin ? formData.origin.split(' ')[0].trim() : '';
        const seguroId = formData.seguro ? formData.seguro.split(' ')[0].trim() : '';
        const medicoId = formData.medico ? formData.medico.split(' ')[0].trim() : '';
        const diagnosticoId = formData.diagnostico ? formData.diagnostico.split(' ')[0].trim() : '';
        
        // Construir objeto con los valores para SQL siguiendo el ejemplo de HospitalizationForm
        const valoresSQL = {
          IDHOSPITALIZACION: orderId,
          PACIENTE: patientId,
          NOMBRES: orderData?.NOMBRES || '',
          CONSULTORIO1: `${consultorioId}  `,
          HORA1: formData.time,
          FECHA1: formData.date,
          ORIGEN: origenId,
          SEGURO: `${seguroId} `,
          MEDICO1: medicoId,
          ESTADO: '2',
          USUARIO: 'SUPERVISOR',
          DIAGNOSTICO: diagnosticoId,
          EDAD: orderData?.EDAD || '000a00m00d',
          ORIGENID: `${origenId}  `
        };
        
        // Mostrar el objeto JSON en la consola
        console.log('Valores para SQL:', valoresSQL);
        
        // Construir la consulta SQL (UPDATE en lugar de INSERT)
        const sqlQuery = `UPDATE Hospitaliza
SET PACIENTE = '${valoresSQL.PACIENTE}',
    NOMBRES = '${valoresSQL.NOMBRES}',
    CONSULTORIO1 = '${valoresSQL.CONSULTORIO1}',
    HORA1 = '${valoresSQL.HORA1}',
    FECHA1 = '${valoresSQL.FECHA1}',
    ORIGEN = '${valoresSQL.ORIGEN}',
    SEGURO = '${valoresSQL.SEGURO}',
    MEDICO1 = '${valoresSQL.MEDICO1}',
    ESTADO = '${valoresSQL.ESTADO}',
    USUARIO = '${valoresSQL.USUARIO}',
    DIAGNOSTICO = '${valoresSQL.DIAGNOSTICO}',
    EDAD = '${valoresSQL.EDAD}',
    ORIGENID = '${valoresSQL.ORIGENID}'
WHERE IDHOSPITALIZACION = '${valoresSQL.IDHOSPITALIZACION}';`;
        
        console.log('SQL Query:', sqlQuery);
        alert(`SQL Query: ${sqlQuery}`);
      }
      
      // Enviar datos a la API
      const response = await fetch(`/api/orden-hospitalizacion/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`Error al guardar: ${response.statusText}`);
      }
      
      // Mostrar mensaje de éxito
      alert('Datos guardados correctamente');
      
      // Redirigir a la lista de hospitalizaciones
      router.push('/hospitalization/list');
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
      <Card>
        <CardContent className="pt-6">
          {/* Form Header - Fecha y hora de ingreso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-100 rounded-lg">
            <div className="md:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="dateField" className="block text-sm font-medium mb-1">Fecha de Ingreso</Label>
                  <Input
                    id="dateField"
                    value={orderData?.FECHA1 || ''}
                    disabled={true}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="timeField" className="block text-sm font-medium mb-1">Hora de Ingreso</Label>
                  <Input
                    id="timeField"
                    value={orderData?.HORA1 || ''}
                    disabled={true}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <PatientInfoCard
            patientId={patientId}
            className="mb-6"
            onDataLoaded={(data) => console.log('Datos de paciente cargados en PatientInfoCard:', data)}
          />
          
          {/* Formulario en dos columnas como en la imagen compartida */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
            {/* Fila 1, Columna 1: Código de Origen de Atención */}
            <div>
              <Label className="text-sm font-semibold text-red-600 block mb-2">
                <span className="text-red-500">●</span> Código de Origen de Atención<span className="text-red-500">*</span>
              </Label>
              <Input
                id="hospitalizationId"
                value={formData.hospitalizationId}
                disabled={true}
                className="w-full h-10"
              />
            </div>
            
            {/* Fila 1, Columna 2: Procedencia del Paciente */}
            <div>
              <Label className="text-sm font-semibold text-red-600 block mb-2">
                <span className="text-red-500">●</span> Procedencia del Paciente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="origin"
                value={`${formData.origin} [${formData.originName}]`}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                disabled={true} // Este campo siempre está deshabilitado
                className="w-full h-10 font-medium"
                required
              />
            </div>
            
            {/* Fila 2, Columna 1: Hospitalizado en */}
            <div>
              <Label className="text-sm font-semibold text-red-600 block mb-2">
                <span className="text-red-500">●</span> Hospitalizado en <span className="text-red-500">*</span>
              </Label> 
              {isEditable ? (
                <ConsultorioSelector
                  value={formData.consultorio}
                  onChange={(value) => setFormData({ ...formData, consultorio: value.split(' ')[0], consultorioName: value.split(' ')[1]?.replace(/[\[\]]/g, '') || '' })}
                  disabled={false}
                  className="w-full"
                />
              ) : (
                <Input
                  id="consultorio"
                  value={`${formData.consultorio} [${formData.consultorioName}]`}
                  onChange={(e) => setFormData({ ...formData, consultorio: e.target.value })}
                  disabled={true}
                  className="w-full h-10"
                  required
                />
              )}
            </div>
            
            {/* Fila 2, Columna 2: Médico */}
            <div>
              <Label className="text-sm font-semibold text-red-600 block mb-2">
                <span className="text-red-500">●</span> Médico <span className="text-red-500">*</span>
              </Label>
              {isEditable ? (
                <MedicoSelector
                  value={formData.medico}
                  onChange={(value, medicoData) => {
                    console.log('Médico seleccionado:', medicoData);
                    setFormData({ ...formData, medico: value.split(' ')[0], medicoName: value.split(' ')[1]?.replace(/[\[\]]/g, '') || '' });
                  }}
                  disabled={false}
                  className="w-full"
                />
              ) : (
                <Input
                  id="medico"
                  value={`${formData.medico} [${formData.medicoName}]`}
                  onChange={(e) => setFormData({ ...formData, medico: e.target.value })}
                  disabled={true}
                  className="w-full h-10"
                  required
                />
              )}
            </div>
            
            {/* Fila 3, Columna 1: Financiamiento */}
            <div>
              <Label className="text-sm font-semibold text-red-600 block mb-2">
                <span className="text-red-500">●</span> Financiamiento <span className="text-red-500">*</span>
              </Label> 
              {isEditable ? (
                <SeguroSelector
                  value={formData.seguro}
                  onChange={(value) => setFormData({ ...formData, seguro: value.split(' ')[0], seguroName: value.split(' ')[1]?.replace(/[\[\]]/g, '') || '' })}
                  disabled={false}
                  className="w-full"
                />
              ) : (
                <Input
                  id="seguro"
                  value={`${formData.seguro} [${formData.seguroName}]`}
                  onChange={(e) => setFormData({ ...formData, seguro: e.target.value })}
                  disabled={true}
                  className="w-full h-10"
                  required
                />
              )}
            </div>
            
            {/* Fila 3, Columna 2: Diagnóstico */}
            <div>
              <Label className="text-sm font-semibold text-red-600 block mb-2">
                <span className="text-red-500">●</span> Diagnóstico <span className="text-red-500">*</span>
              </Label>
              {isEditable ? (
                <DiagnosticoSelector
                  value={formData.diagnostico}
                  onChange={(value, diagnosticoData) => {
                    console.log('Diagnóstico seleccionado:', diagnosticoData);
                    setFormData({ ...formData, diagnostico: value });
                  }}
                  disabled={false}
                  origenId={formData.hospitalizationId ? formData.hospitalizationId.split(' ')[0].trim() : ''}
                  className="w-full"
                />
              ) : (
                <Input
                  id="diagnostico"
                  value={formData.diagnostico}
                  onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                  disabled={true}
                  className="w-full h-10"
                  required
                />
              )}
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleGoBack}
              disabled={submitting}
            >
              {isEditable ? 'Cancelar' : 'Volver'}
            </Button>
            
            {/* Solo mostrar botón de guardar si es editable (estado '2') */}
            {isEditable && (
              <Button 
                type="submit" 
                disabled={submitting}
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
    </form>
  );
}
