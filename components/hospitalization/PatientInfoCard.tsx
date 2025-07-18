import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface PatientInfoCardProps {
  patientId: string;
  className?: string;
  onDataLoaded?: (data: PatientData) => void;
}

interface PatientData {
  historyNumber: string;
  paternalSurname: string;
  maternalSurname: string;
  names: string;
  document: string;
  sex: string;
  birthDate: string;
  age: string;
  insurance: string;
}

export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({ patientId, className = '', onDataLoaded }) => {
  console.log('PatientInfoCard renderizado con patientId:', patientId);
  const [patientData, setPatientData] = useState<PatientData>({
    historyNumber: "",
    paternalSurname: "",
    maternalSurname: "",
    names: "",
    document: "",
    sex: "",
    birthDate: "",
    age: "",
    insurance: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del paciente cuando cambia el patientId
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching patient data for ID:', patientId);
        
        // Fetch patient data from filiacion API
        const filiacionResponse = await fetch(`/api/filiacion/${patientId}`);
        
        if (!filiacionResponse.ok) {
          throw new Error(`Error al cargar datos del paciente: ${filiacionResponse.status}`);
        }
        
        const responseData = await filiacionResponse.json();
        console.log('Datos de filiación recibidos en PatientInfoCard:', responseData);
        
        // La estructura de la respuesta tiene un objeto data que contiene los datos del paciente
        const data = responseData.data || responseData;
        
        // Extraemos los campos directamente de la estructura que vemos en la consola
        const patientDataObj: PatientData = {
          historyNumber: data.HISTORIA || '',
          paternalSurname: data.PATERNO?.trim() || data.APEPAT?.trim() || '',
          maternalSurname: data.MATERNO?.trim() || data.APEMAT?.trim() || '',
          names: data.NOMBRE?.trim() || data.NOMBRES?.trim() || '',
          document: data.DOCUMENTO || '',
          sex: data.SEXO === 'M' ? 'Masculino' : data.SEXO === 'F' ? 'Femenino' : data.SEXO || '',
          birthDate: data.FECHA_NACIMIENTO || data.FECNAC || '',
          age: data.EDAD || '',
          insurance: data.NOMBRE_SEGURO?.trim() || data.SEGURO?.trim() || ''
        };
        
        console.log('PatientData mapeado:', patientDataObj);
        
        // Actualizamos el estado con los datos del paciente
        setPatientData(patientDataObj);
        
        // Notificar al componente padre sobre los datos cargados
        if (onDataLoaded) {
          onDataLoaded(patientDataObj);
        }
      } catch (err: any) {
        console.error('Error fetching patient data:', err);
        setError(err.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]); // Eliminamos onDataLoaded de las dependencias para evitar re-renderizados constantes

  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verificamos si hay datos del paciente (al menos un campo con valor)
  const hasData = Object.values(patientData).some(value => value && value.trim() !== '');
  
  if (!hasData) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            No se pudo cargar la información del paciente
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mostrar mensaje de error si existe
  if (error) {
    return (
      <Card className={`bg-red-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="text-red-500 font-medium">
            Error al cargar datos del paciente: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Historia Clínica</p>
            <p className="text-lg font-semibold">{patientData.historyNumber || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Nombres</p>
            <p className="text-lg font-semibold">{patientData.names || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Apellido Paterno</p>
            <p className="text-lg font-semibold">{patientData.paternalSurname || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Apellido Materno</p>
            <p className="text-lg font-semibold">{patientData.maternalSurname || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Documento</p>
            <p className="text-lg font-semibold">{patientData.document || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Sexo</p>
            <p className="text-lg font-semibold">{patientData.sex || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha de Nacimiento</p>
            <p className="text-lg font-semibold">{patientData.birthDate || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Edad</p>
            <p className="text-lg font-semibold">{patientData.age || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Seguro</p>
            <p className="text-lg font-semibold">{patientData.insurance || '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
