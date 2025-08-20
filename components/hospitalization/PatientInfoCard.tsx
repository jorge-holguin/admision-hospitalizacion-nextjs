"use client"

import React, { useState, useEffect, useRef } from 'react';
import { getCivilStatusDescription } from '@/utils/civilStatusUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Calendar, Phone, MapPin, FileText, Activity, CreditCard, Heart, VenusAndMars, House, Home, Book } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import { usePatientData, useFetchPatientData } from '@/contexts/PatientDataContext';

interface PatientInfoCardProps {
  patientId: string;
  hospitalizationOrderId?: string;
  className?: string;
  onDataLoaded?: (data: any) => void;
}

interface PatientData {
  historyNumber: string;
  paternalSurname: string;
  maternalSurname: string;
  names: string;
  document: string;
  documentType: string;
  sex: string;
  birthDate: string;
  age: string;
  insurance: string;
  phone: string;
  phone2: string;
  district: string;
  locality: string;
  localityDescription: string;
  address: string;
  currentDistrict: string;
  religion: string;
  desc_religion: string;
  maritalStatus: string;
  photo?: string;
  fullName?: string;
}

interface DiagnosisData {
  code: string;
  description: string;
}

export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  patientId,
  hospitalizationOrderId,
  className = '',
  onDataLoaded
}) => {
  // Usar el contexto para obtener datos del paciente
  const { fetchPatientData, isLoading, error: fetchError } = useFetchPatientData(patientId);
  const { getPatientData } = usePatientData();
  
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [hospitalizationData, setHospitalizationData] = useState<any>(null);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(fetchError);

  // Efecto para cargar los datos del paciente usando el contexto
  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId) {
        console.warn('PatientInfoCard: No patientId provided');
        return;
      }

      try {
        // Intentar obtener datos del contexto primero
        let contextData = getPatientData(patientId);
        
        // Si no hay datos en el contexto, cargarlos
        if (!contextData) {
          console.log(`[PatientInfoCard] Fetching patient data for ID: ${patientId} via context`);
          await fetchPatientData();
          contextData = getPatientData(patientId);
        }
        
        if (contextData) {
          // Mapear los datos del contexto al formato que espera este componente
          const patientDataObj: PatientData = {
            historyNumber: contextData.historia || '',
            paternalSurname: contextData.apellidoPaterno?.trim() || '',
            maternalSurname: contextData.apellidoMaterno?.trim() || '',
            names: contextData.nombre?.trim() || contextData.nombres?.trim() || '',
            document: contextData.documento || '',
            documentType: contextData.tipoDocumento || '',
            sex: contextData.sexo || '',
            birthDate: contextData.fechaNacimiento || '',
            age: contextData.edad || '',
            insurance: contextData.descSeguro?.trim() || contextData.seguro?.trim() || '',
            phone: contextData.telefono1 || '',
            phone2: contextData.telefono2 || '',
            district: contextData.distritoDir || contextData.distrito || '',
            locality: contextData.localidad || '',
            localityDescription: contextData.nombreLocalidad || '',
            address: contextData.direccion || '',
            currentDistrict: contextData.distrito || '',
            religion: contextData.religion || 'NO ESPECIFICA',
            desc_religion: contextData.descreligion || 'NO ESPECIFICA',
            maritalStatus: contextData.estadoCivil || '',
            photo: contextData.photo || ''
          };

          // Construir el nombre completo del paciente en formato APELLIDOS NOMBRES
          patientDataObj.fullName = [
            patientDataObj.paternalSurname,
            patientDataObj.maternalSurname,
            patientDataObj.names
          ].filter(Boolean).join(' ').toUpperCase();
          
          // Actualizamos el estado con los datos del paciente
          setPatientData(patientDataObj);
          
          // Notificar al componente padre sobre los datos cargados
          if (onDataLoaded) {
            onDataLoaded(patientDataObj);
          }
        }
      } catch (err: any) {
        console.error('Error fetching patient data:', err);
        setError(err.message || 'Error al cargar datos');
      }
    };

    loadPatientData();
  }, [patientId, fetchPatientData, getPatientData, onDataLoaded]);

  // Actualizar el estado de carga cuando cambie en el contexto
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // Actualizar el estado de error cuando cambie en el contexto
  useEffect(() => {
    setError(fetchError);
  }, [fetchError]);

  // Fetch hospitalization order data if ID is provided
  useEffect(() => {
    const fetchHospitalizationOrder = async () => {
      if (!hospitalizationOrderId) {
        return;
      }

      try {
        const response = await fetch(`/api/orden-hospitalizacion/${hospitalizationOrderId}`);
        
        if (!response.ok) {
          console.error(`Error fetching hospitalization order: ${response.status}`);
          return;
        }
        
        const data = await response.json();
        
        if (data && data.data) {
          // Extract diagnosis information
          const diagnosisCode = data.data.DIAGNOSTICO || '';
          
          // Set diagnosis data
          setDiagnosisData({
            code: diagnosisCode.trim(),
            description: data.data.DIAGNOSTICO_DESC || 'Descripción no disponible'
          });

          console.log('Diagnosis data loaded:', diagnosisCode);
        }
      } catch (err) {
        console.error('Error fetching hospitalization order:', err);
      }
    };

    fetchHospitalizationOrder();
  }, [hospitalizationOrderId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
            <span className="ml-3">Cargando datos del paciente...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!patientData) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>No se encontraron datos del paciente</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificado';
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString('es-ES', { month: 'long' });
      const year = date.getFullYear();
      return `${day} de ${month} de ${year}`;
    } catch {
      return dateString;
    }
  };

  const getSexoBadgeColor = (sexo: string) => {
    switch (sexo?.toUpperCase()) {
      case 'M':
      case 'MASCULINO':
        return 'bg-blue-100 text-blue-800';
      case 'F':
      case 'FEMENINO':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto">
        {/* Foto del paciente - Centrada y más grande */}
        <div className="flex flex-col items-center space-y-4">
          {/* Foto del paciente */}
          <div className="relative w-32 h-40 flex-shrink-0">
            {patientData.photo ? (
              <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                <ImageWithLoader 
                  src={patientData.photo.startsWith('data:') ? patientData.photo : `data:image/jpeg;base64,${patientData.photo}`}
                  alt="Foto del paciente"
                  width={128}
                  height={160}
                  priority
                  sizes="128px"
                  loadingClassName="opacity-0"
                  loadedClassName="opacity-100"
                  className="object-cover transition-opacity duration-300 w-full h-full"
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    console.error('Error loading patient image:', e);
                    // Log the image source for debugging
                    console.error('Failed image source:', patientData.photo ? patientData.photo.substring(0, 100) + '...' : 'undefined');
                    // Hide the image container on error
                    const target = e.target as HTMLImageElement;
                    const container = target.closest('.relative') as HTMLElement;
                    if (container) {
                      container.style.display = 'none';
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200 shadow-sm">
                <User className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Información básica - Centrada */}
          <div className="text-center">
            <h3 className="font-semibold text-lg text-gray-900">
              {patientData.fullName || 'Paciente sin nombre'}
            </h3>
            <p className="text-sm text-gray-500 font-semibold">HC: {patientData.historyNumber}</p>
          </div>
        </div>

        {/* Diagnóstico (si está disponible) */}
        {diagnosisData && (
          <div className="border-t pt-3">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Diagnóstico</h4>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                <strong>{diagnosisData.code}:</strong> {diagnosisData.description}
              </span>
            </div>
          </div>
        )}

        {/* Información básica */}
        <div className="grid grid-cols-1 gap-3">


          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Nacimiento:</strong> {formatDate(patientData.birthDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Edad:</strong> {patientData.age || 'No especificado'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <VenusAndMars className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Sexo:</strong>
            </span>
            <Badge className={getSexoBadgeColor(patientData.sex)}>
              {patientData.sex === 'M' ? 'Masculino' : patientData.sex === 'F' ? 'Femenino' : patientData.sex}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Estado Civil:</strong> {getCivilStatusDescription(patientData.maritalStatus)}
            </span>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="border-t pt-3">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Contacto</h4>
            
          <div className="space-y-2">
            {patientData.address && (
              <div className="flex items-start gap-2">
                <Home className="h-4 w-4 text-gray-400 mt-1" />
                <span className="text-sm">{patientData.address}</span>
              </div>
            )}

            {patientData.district && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{patientData.district}</span>
              </div>
            )}

            {patientData.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{patientData.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="border-t pt-3">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Información Adicional</h4>
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Seguro:</strong> {patientData.insurance || 'No especificado'}
            </div>
            
            <div className="text-sm">
              <strong>Religión:</strong> {patientData.desc_religion || 'NO ESPECIFICA'}
            </div>
            
            <div className="text-sm">
              <strong>Localidad:</strong> {patientData.localityDescription || patientData.locality || 'No especificada'}
            </div>
            
            <div className="text-sm">
              <strong>Distrito Actual:</strong> {patientData.currentDistrict || 'No especificado'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
