"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { getCivilStatusDescription } from '@/utils/civilStatusUtils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Calendar, Phone, MapPin, FileText, Heart, House, Home, Book, Edit } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import { usePatientData, useFetchPatientData } from '@/contexts/PatientDataContext';
import { calculateAgeFormatted, formatAgeReadable } from '@/lib/ageCalculator';

interface PatientInfoCardProps {
  patientId: string;
  hospitalizationOrderId?: string;
  className?: string;
  onDataLoaded?: (data: any) => void;
  initialData?: any; // Datos iniciales para evitar llamada a API
  onUpdatePatient?: () => void; // Callback para abrir modal de edición
  isLoadingUpdate?: boolean; // Estado de carga del botón actualizar
}

// Helper para extraer el código de seguro ya sea de string o del objeto anidado
function extractInsuranceCode(seguro: any): string {
  if (!seguro) return '';
  if (typeof seguro === 'string') return seguro.trim();
  if (typeof seguro === 'object') {
    return String(
      seguro.seguro ?? seguro.codigo ?? seguro.id ?? seguro.Seguro ??
      seguro.nombre ?? seguro.descripcion ?? ''
    ).trim();
  }
  return String(seguro).trim();
}

function extractInsuranceName(seguro: any, descSeguro?: any): string {
  if (descSeguro && typeof descSeguro === 'string') return descSeguro.trim();
  if (!seguro) return '';
  if (typeof seguro === 'string') return '';
  if (typeof seguro === 'object') {
    return String(
      seguro.nombre ?? seguro.Nombre ?? seguro.descripcion ??
      seguro.descripcion ?? ''
    ).trim();
  }
  return '';
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
  insuranceCode: string;
  pacienteId: string;
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

function formatDate(dateString: string): string {
  if (!dateString) return 'No especificado';
  try {
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function getSexoBadgeColor(sexo: string): string {
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
}

export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  patientId,
  hospitalizationOrderId,
  className = '',
  onDataLoaded,
  initialData,
  onUpdatePatient,
  isLoadingUpdate = false
}) => {
  // Usar el contexto para obtener datos del paciente
  const { fetchPatientData, isLoading, error: fetchError } = useFetchPatientData(patientId);
  const { getPatientData } = usePatientData();
  
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);

  // Memoizar el callback onDataLoaded para evitar recreaciones
  const memoizedOnDataLoaded = useCallback((data: PatientData) => {
    if (onDataLoaded) {
      onDataLoaded(data);
    }
  }, [onDataLoaded]);

  // Efecto para cargar los datos del paciente usando el contexto
  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId) {
        return;
      }

      // Si tenemos initialData, aún así cargar los datos completos desde la API de filiación
      // para tener toda la información del paciente (foto, datos completos, etc.)

      try {
        // Intentar obtener datos del contexto primero
        let contextData = getPatientData(patientId);
        
        // Si no hay datos en el contexto, cargarlos
        if (!contextData) {
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
            insurance: extractInsuranceName(contextData.seguro, contextData.descSeguro) ||
                       extractInsuranceCode(contextData.seguro),
            insuranceCode: extractInsuranceCode(contextData.seguro),
            pacienteId: String(contextData.paciente ?? '').trim(),
            phone: contextData.telefono1 || '',
            phone2: contextData.telefono2 || '',
            district: contextData.distritoDir || contextData.distrito || '',
            locality: contextData.localidad || '',
            localityDescription: contextData.nombreLocalidad || '',
            address: contextData.direccion || '',
            currentDistrict: contextData.distrito || '',
            religion: contextData.religion || 'NO ESPECIFICA',
            desc_religion: contextData.descreligion || 'NO ESPECIFICA',
            maritalStatus: getCivilStatusDescription(contextData.estadoCivil),
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
          
          // Notificar al componente padre sobre los datos cargados usando el callback memoizado
          memoizedOnDataLoaded(patientDataObj);
        }
      } catch (err: any) {
        console.error('Error fetching patient data:', err);
      }
    };

    loadPatientData();
  }, [patientId, fetchPatientData, getPatientData, memoizedOnDataLoaded, initialData]);

  // Cargar datos de diagnóstico desde initialData (sin llamada a API)
  useEffect(() => {
    if (!hospitalizationOrderId) {
      return;
    }

    // Si tenemos initialData, extraer el diagnóstico de ahí
    if (initialData && initialData.DIAGNOSTICO) {
      setDiagnosisData({
        code: initialData.DIAGNOSTICO.trim(),
        description: initialData.DIAGNOSTICONOMBRE || 'Descripción no disponible'
      });
    }
  }, [hospitalizationOrderId, initialData]);

  if (isLoading) {
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

  if (fetchError) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{fetchError}</AlertDescription>
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
              <div className="w-full h-full rounded-lg bg-gray-100 flex flex-wrap items-center justify-center border-2 border-gray-200 shadow-sm">
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
            <div className="flex flex-wrap items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                <strong>{diagnosisData.code}:</strong> {diagnosisData.description}
              </span>
            </div>
          </div>
        )}

        {/* Información básica */}
        <div className="grid grid-cols-1 gap-3">


          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Nacimiento:</strong> {formatDate(patientData.birthDate)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Edad:</strong> {patientData.birthDate 
                ? formatAgeReadable(calculateAgeFormatted(patientData.birthDate))
                : (patientData.age || 'No especificado')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Book className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Sexo:</strong>
            </span>
            <Badge className={getSexoBadgeColor(patientData.sex)}>
              {patientData.sex === 'M' ? 'Masculino' : patientData.sex === 'F' ? 'Femenino' : patientData.sex}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              <div className="flex flex-wrap items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{patientData.district}</span>
              </div>
            )}

            {patientData.phone && (
              <div className="flex flex-wrap items-center gap-2">
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
              <strong>Distrito Nacimiento:</strong> {patientData.currentDistrict || 'No especificado'}
            </div>
          </div>
        </div>

        {/* Botón Actualizar Historia Clínica */}
        {onUpdatePatient && (
          <div className="border-t pt-3 mt-3">
            <Button
              variant="outline"
              onClick={onUpdatePatient}
              disabled={isLoadingUpdate}
              className="w-full justify-center px-6 py-2.5 h-11 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              {isLoadingUpdate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Cargando...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Actualizar Historia Clínica
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
