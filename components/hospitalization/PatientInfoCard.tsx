import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import ImageWithLoader from '@/components/ui/ImageWithLoader';

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
  phone: string;
  district: string;
  photo?: string;
}

export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({ patientId, className = '', onDataLoaded }) => {
  const [patientData, setPatientData] = useState<PatientData>({
    historyNumber: "",
    paternalSurname: "",
    maternalSurname: "",
    names: "",
    document: "",
    sex: "",
    birthDate: "",
    age: "",
    insurance: "",
    phone: "",
    district: "",
    photo: ""
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
        
        // Fetch patient data from filiacion API
        const filiacionResponse = await fetch(`/api/filiacion/${patientId}`);
        
        if (!filiacionResponse.ok) {
          throw new Error(`Error al cargar datos del paciente: ${filiacionResponse.status}`);
        }
        
        const responseData = await filiacionResponse.json();
        
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
          insurance: data.NOMBRE_SEGURO?.trim() || data.SEGURO?.trim() || '',
          phone: data.TELEFONO1 || '',
          district: data.Distrito_Dir || '',
          photo: data.STRING_FOTO || ''
        };
        
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

  // Construir el nombre completo del paciente
  const fullName = [
    patientData.names,
    patientData.paternalSurname,
    patientData.maternalSurname
  ].filter(Boolean).join(' ');

  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <div className="flex flex-col items-center">
          <div className="relative h-60 w-40 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 mb-4">
            {patientData.photo ? (
              <ImageWithLoader 
                src={`data:image/jpeg;base64,${patientData.photo}`}
                alt="Foto del paciente"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
                loadingClassName="opacity-0"
                loadedClassName="opacity-100"
                className="object-cover transition-opacity duration-200"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold">{fullName || 'Paciente sin nombre'}</h2>
            <p className="text-sm text-gray-500">HC: {patientData.historyNumber || '-'}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col space-y-3">
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
          <div>
            <p className="text-sm font-medium text-gray-500">Teléfono</p>
            <p className="text-lg font-semibold">{patientData.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Distrito Actual</p>
            <p className="text-lg font-semibold">{patientData.district || '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
