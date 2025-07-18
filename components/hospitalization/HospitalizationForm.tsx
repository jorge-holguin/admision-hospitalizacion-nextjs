"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from "@/components/ui/spinner"
import { Loader2, Save } from 'lucide-react'
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
  const [isEditable, setIsEditable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filiacionData, setFiliacionData] = useState<any>(null);
  
  // Estado para el origen de hospitalización
  const [origenes, setOrigenes] = useState<OrigenHospitalizacion[]>([])
  const [loadingOrigenes, setLoadingOrigenes] = useState(false)
  const [searchOrigin, setSearchOrigin] = useState('')
  const [selectedOrigin, setSelectedOrigin] = useState<OrigenHospitalizacion | null>(null)
  const [showAllOrigins, setShowAllOrigins] = useState(false)
  const [fieldsLocked, setFieldsLocked] = useState(false);
  
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
    diagnosis: ""
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


  // Function to calculate age from birthdate
  const calculateAge = (birthDate: string | Date | null | undefined): string => {
    if (!birthDate) return "";
    
    try {
      let date: Date;
      
      if (typeof birthDate === 'string') {
        // Check if it's in format YYYY-MM-DD
        const match = birthDate.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const [_, year, month, day] = match;
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Try to parse as is
          date = new Date(birthDate);
        }
      } else {
        date = new Date(birthDate);
      }
      
      if (isNaN(date.getTime())) {
        return "";
      }
      
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const m = today.getMonth() - date.getMonth();
      
      if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      
      return age.toString();
    } catch (error) {
      console.error('Error calculating age:', error);
      return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Mostrar que se está procesando
      setSubmitting(true);
      
      // Extraer valores del formulario
      const idHospitalizacion = '25001960'; // Generado o fijo según requerimiento
      const origenId = formData.hospitalizationOrigin ? formData.hospitalizationOrigin.split(' ')[0] : '';
      const medicoCode = formData.authorizingDoctor ? formData.authorizingDoctor.split(' ')[0] : '';
      const consultorioCode = formData.hospitalizedIn ? formData.hospitalizedIn.split(' ')[0] : '';
      const fechaFormateada = formData.date ? formData.date.replace(/-/g, '') : '';
      const diagnosticoCode = formData.diagnosis ? formData.diagnosis.split(' ')[0] : '';
      const seguroCode = formData.insurance ? formData.insurance.split(' ')[0] : '20';
      const edadCalculada = calculateAge(formData.birthDate);
      const nombreCompleto = `${formData.paternalSurname || ''} ${formData.maternalSurname || ''} ${formData.names || ''} `;
      
      // Crear objeto con los valores
      const valoresSQL = {
        IDHOSPITALIZACION: idHospitalizacion,
        PACIENTE: patientId,
        NOMBRES: nombreCompleto,
        CONSULTORIO1: `${consultorioCode}  `,
        HORA1: formData.time,
        FECHA1: fechaFormateada,
        ORIGEN: origenId,
        SEGURO: `${seguroCode} `,
        MEDICO1: medicoCode,
        ESTADO: '2',
        USUARIO: 'SUPERVISOR',
        DIAGNOSTICO: diagnosticoCode,
        EDAD: edadCalculada || '000a00m00d',
        ORIGENID: `${origenId}  `
      };
      
      // Mostrar el objeto JSON en la consola
      console.log('Valores para SQL:', valoresSQL);
      
      // Estructura SQL con los valores del formulario
      const sqlInsert = `select * from INSERT INTO Hospitaliza(IDHOSPITALIZACION,PACIENTE,NOMBRES,CONSULTORIO1,HORA1,FECHA1,ORIGEN,SEGURO,MEDICO1,ESTADO,USUARIO,DIAGNOSTICO,EDAD,ORIGENID) VALUES('${valoresSQL.IDHOSPITALIZACION}','${valoresSQL.PACIENTE}','${valoresSQL.NOMBRES}','${valoresSQL.CONSULTORIO1}','${valoresSQL.HORA1}','${valoresSQL.FECHA1}','${valoresSQL.ORIGEN}','${valoresSQL.SEGURO}','${valoresSQL.MEDICO1}','${valoresSQL.ESTADO}','${valoresSQL.USUARIO}','${valoresSQL.DIAGNOSTICO}','${valoresSQL.EDAD}','${valoresSQL.ORIGENID}')`;
      
      // Mostrar en consola el formato SQL
      console.log('SQL Query:', sqlInsert);
      
      // Simular éxito sin hacer la petición real
      setTimeout(() => {
        setSubmitting(false);
        alert('Consulta SQL y valores JSON mostrados en consola');
      }, 500);
      
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          {/* Form Header - Solo fecha y hora, sin campo de historia duplicado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-100 rounded-lg">
            <div className="md:col-span-2">
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

          {/* Patient Information */}
          <PatientInfoCard
            patientId={patientId}
            className="mb-6"
            onDataLoaded={handlePatientDataLoaded}
          />
          
          {/* Formulario en dos columnas como en la imagen compartida */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Columna izquierda */}
            <div className="space-y-6">
              <OrigenSelector
                value={formData.hospitalizationOrigin}
                onChange={(value, origenData) => {
                  setFormData({ ...formData, hospitalizationOrigin: value });
                  console.log('Origen seleccionado:', origenData);
                }}
                disabled={fieldsLocked}
                required
                className="w-full"
                patientId={patientId}
                onAttentionOriginChange={(attentionOrigin) => {
                  setFormData(prev => ({ ...prev, attentionOrigin }));
                }}
                onMedicoChange={(medicoValue, medicoData) => {
                  setFormData(prev => ({ ...prev, authorizingDoctor: medicoValue }));
                }}
                onDiagnosticoChange={(diagnosticoValue, diagnosticoData) => {
                  setFormData(prev => ({ ...prev, diagnosis: diagnosticoValue }));
                }}
              />
              
              <ConsultorioSelector
                value={formData.hospitalizedIn}
                onChange={(value) => setFormData({ ...formData, hospitalizedIn: value })}
                disabled={fieldsLocked}
                className="w-full"
              />
              
              <SeguroSelector
                value={formData.financing}
                onChange={(value) => setFormData({ ...formData, financing: value })}
                disabled={fieldsLocked}
                className="w-full"
              />
            </div>
            
            {/* Columna derecha */}
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-red-600">
                  <span className="text-red-500">●</span> Origen de Atención: <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.attentionOrigin}
                  onChange={(e) => setFormData({ ...formData, attentionOrigin: e.target.value })}
                  className="mt-1 font-medium"
                  disabled={true} // Siempre en modo solo lectura
                  required
                />
              </div>
              
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
              
              <DiagnosticoSelector
                value={formData.diagnosis}
                onChange={(value, diagnosticoData) => {
                  console.log('Diagnóstico seleccionado:', diagnosticoData);
                  setFormData({ ...formData, diagnosis: value });
                }}
                disabled={fieldsLocked}
                origenId={formData.hospitalizationOrigin ? formData.hospitalizationOrigin.split(' ')[0] : ''} // Extraemos el código de origen del valor seleccionado
              />
            </div>
          </div>
          
          {/* Campo de observaciones eliminado según requerimiento */}
          
          <div className="flex justify-end space-x-4 mt-8">
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
    </form>
  );
}
