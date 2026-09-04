"use client"

import React, { useState, useEffect, useRef } from 'react';
import { getCivilStatusDescription, getCivilStatusCode } from '@/utils/civilStatusUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import { User, Calendar, Phone, MapPin, CreditCard, Heart, House, Edit } from 'lucide-react';
import { usePatientData } from '@/contexts/PatientDataContext';
import { Button } from '@/components/ui/button';
import { calculateAgeFormatted, formatAgeReadable } from '@/lib/ageCalculator';

// Normaliza un valor que puede venir como objeto de ubigeo a string
function toUbigeoStr(value: any): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return (
      value.distrito || value.provincia || value.departamento || value.ubigeo || value.nombre || value.descripcion || value.codigo || value.id || ''
    );
  }
  return String(value).trim();
}

interface PatientInfoCardEmergencyProps {
  patientId: string;
  patient?: any; // Datos del paciente ya cargados
  onDataLoaded?: (data: any) => void;
  className?: string;
  onUpdatePatient?: () => void; // Callback para abrir modal de edición
  isLoadingUpdate?: boolean; // Estado de carga del botón actualizar
}

interface PatientData {
  paciente: string;
  nombres: string;
  nombre: string;
  historia: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  documento: string;
  tipoDocumento: string;
  fechaNacimiento: string;
  edad: string;
  sexo: string;
  estadoCivil: string;
  direccion: string;
  distrito: string;
  departamentoDir: string;
  distritoDir: string;
  telefono1: string;
  telefono2: string;
  seguro: string;
  descSeguro: string;
  // Campos adicionales para emergencia
  religion?: string;
  descreligion?: string;
  nombreLocalidad?: string;
  localidad?: string;
  nombreOcupacion?: string;
  photo?: string; // Base64 encoded photo
  [key: string]: any; // Para permitir propiedades adicionales
}

export const PatientInfoCardEmergency: React.FC<PatientInfoCardEmergencyProps> = ({
  patientId,
  patient,
  onDataLoaded,
  className = "",
  onUpdatePatient,
  isLoadingUpdate = false
}) => {
  // Use the patient data context
  const { getPatientData } = usePatientData();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use a ref to track if we've already loaded data for this patient ID
  const hasLoadedRef = useRef<{[key: string]: boolean}>({});
  
  useEffect(() => {
    // Si ya tenemos los datos del paciente como prop, usarlos directamente
    if (patient) {
      // Adaptar los datos del paciente al formato esperado
      const adaptedData: PatientData = {
        paciente: patient.PACIENTE || patient.paciente || '',
        nombres: patient.NOMBRES || patient.nombres || '',
        nombre: patient.NOMBRE || patient.nombre || '',
        historia: patient.HISTORIA || patient.historia || '',
        apellidoPaterno: patient.PATERNO || patient.APELLIDO_PATERNO || patient.apellidoPaterno || '',
        apellidoMaterno: patient.MATERNO || patient.APELLIDO_MATERNO || patient.apellidoMaterno || '',
        documento: patient.DOCUMENTO || patient.documento || '',
        tipoDocumento: patient.TIPO_DOCUMENTO || patient.tipoDocumento || '',
        fechaNacimiento: patient.FECHA_NACIMIENTO || patient.fechaNacimiento || '',
        edad: patient.EDAD || patient.edad || '',
        sexo: patient.SEXO || patient.sexo || '',
        estadoCivil: getCivilStatusDescription(
          getCivilStatusCode(patient.ESTADO_CIVIL || patient.estadoCivil, patient.NOMBRE_ESTADO_CIVIL || patient.nombreEstadoCivil)
          || patient.ESTADO_CIVIL || patient.NOMBRE_ESTADO_CIVIL || patient.estadoCivil
        ),
        direccion: patient.DIRECCION || patient.direccion || '',
        distrito: toUbigeoStr(patient.DISTRITO ?? patient.distrito),
        departamentoDir: toUbigeoStr(patient.DEPARTAMENTO_DIR ?? patient.departamentoDir),
        distritoDir: toUbigeoStr(patient.Distrito_Dir ?? patient.DISTRITO_DIR ?? patient.distritoDir),
        telefono1: patient.TELEFONO1 || patient.telefono1 || '',
        telefono2: patient.TELEFONO2 || patient.telefono2 || '',
        seguro: patient.SEGURO || patient.seguro || '',
        descSeguro: patient.NOMBRE_SEGURO || patient.DESC_SEGURO || patient.descSeguro || '',
        religion: patient.RELIGION || patient.religion || '',
        descreligion: patient.DESRELIGION || patient.DESC_RELIGION || patient.descreligion || '',
        nombreLocalidad: patient.Nombre_Localidad || patient.NOMBRE_LOCALIDAD || patient.nombreLocalidad || '',
        localidad: patient.LOCALIDAD || patient.localidad || '',
        nombreOcupacion: patient.NOMBRE_OCUPACION || patient.nombreOcupacion || '',
        photo: patient.STRING_FOTO || patient.STRING_PHOTO || patient.photo || ''
      };
      
      setPatientData(adaptedData);
      if (onDataLoaded && !hasLoadedRef.current[patientId]) {
        onDataLoaded(adaptedData);
        hasLoadedRef.current[patientId] = true;
      }
      return;
    }
    
    // Si no, intentar obtenerlos del contexto
    const existingData = getPatientData(patientId);
    
    if (existingData) {
      setPatientData(existingData);
      if (onDataLoaded && !hasLoadedRef.current[patientId]) {
        onDataLoaded(existingData);
        hasLoadedRef.current[patientId] = true;
      }
    }
  }, [patientId, patient, getPatientData, onDataLoaded]);  // Listen for context changes

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
      // Asegurar que la fecha se interprete correctamente sin problemas de zona horaria
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      
      // Crear la fecha con los componentes exactos (mes es 0-indexed en JavaScript)
      return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
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
    <div className={`${className} space-y-4`}>
      {/* Eliminamos Card, CardHeader y CardContent para usar el contenedor externo */}
        {/* Foto del paciente - Centrada y más grande */}
        <div className="flex flex-col items-center space-y-4">
          {/* Foto del paciente */}
          <div className="relative w-32 h-40 flex-shrink-0">
            {patientData.photo ? (
              <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                <ImageWithLoader 
                  src={patientData.photo}
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
              {`${patientData.nombres}`.trim()}
            </h3>
            <p className="text-sm text-gray-500">HC: {patientData.historia}</p>
          </div>
        </div>

        {/* Información básica */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>DNI:</strong> {patientData.documento || 'No especificado'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Nacimiento:</strong> {formatDate(patientData.fechaNacimiento)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Edad:</strong> {patientData.fechaNacimiento 
                ? formatAgeReadable(calculateAgeFormatted(patientData.fechaNacimiento))
                : (patientData.edad || 'No especificado')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Sexo:</strong>
            </span>
            <Badge className={getSexoBadgeColor(patientData.sexo)}>
              {patientData.sexo === 'M' ? 'Masculino' : patientData.sexo === 'F' ? 'Femenino' : patientData.sexo}
            </Badge>

          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Heart className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Estado Civil:</strong> {getCivilStatusDescription(patientData.estadoCivil)}
            </span>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="border-t pt-3">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Contacto</h4>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <House className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                {patientData.direccion || 'Dirección no especificada'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{toUbigeoStr(patientData.distritoDir)} , {toUbigeoStr(patientData.departamentoDir)}</span>
            </div>

            {patientData.telefono1 && (
              <div className="flex flex-wrap items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{patientData.telefono1}</span>
              </div>
            )}

            {patientData.telefono2 && (
              <div className="flex flex-wrap items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{patientData.telefono2}</span>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="border-t pt-3">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Información Adicional</h4>
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Seguro:</strong> {patientData.descSeguro || 'No especificado'}
            </div>
            
            {patientData.religion && (
              <div className="text-sm">
                <strong>Religión:</strong> {patientData.descreligion}
              </div>
            )}
            
              <div className="text-sm">
                <strong>Localidad:</strong> {patientData.nombreLocalidad}
              </div>

            <div className="text-sm">
                <strong>Distrito Nacimiento:</strong> {toUbigeoStr(patientData.distrito)}
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
    </div>
  );
};
