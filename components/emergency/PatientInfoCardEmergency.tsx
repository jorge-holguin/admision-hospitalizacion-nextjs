"use client"

import React, { useState, useEffect, useRef } from 'react';
import { getCivilStatusDescription } from '@/utils/civilStatusUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import { User, Calendar, Phone, MapPin, CreditCard, Heart, House } from 'lucide-react';
import { usePatientData } from '@/contexts/PatientDataContext';

interface PatientInfoCardEmergencyProps {
  patientId: string;
  onDataLoaded?: (data: any) => void;
  className?: string;
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
}

export const PatientInfoCardEmergency: React.FC<PatientInfoCardEmergencyProps> = ({
  patientId,
  onDataLoaded,
  className = ""
}) => {
  // Use the patient data context
  const { getPatientData } = usePatientData();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use a ref to track if we've already loaded data for this patient ID
  const hasLoadedRef = useRef<{[key: string]: boolean}>({});
  
  useEffect(() => {
    // Only read from context - don't make API calls
    // The parent component (EmergencyFormRefactored) is responsible for loading data
    const existingData = getPatientData(patientId);
    
    if (existingData) {
      setPatientData(existingData);
      if (onDataLoaded && !hasLoadedRef.current[patientId]) {
        onDataLoaded(existingData);
        hasLoadedRef.current[patientId] = true;
      }
    }
  }, [patientId, getPatientData, onDataLoaded]);  // Listen for context changes

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
    <Card className={className}>
      <CardHeader className="pb-3">
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>DNI:</strong> {patientData.documento || 'No especificado'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Nacimiento:</strong> {formatDate(patientData.fechaNacimiento)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Edad:</strong> {patientData.edad || 'No especificado'}
            </span>
          </div>

          <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Sexo:</strong>
            </span>
            <Badge className={getSexoBadgeColor(patientData.sexo)}>
              {patientData.sexo === 'M' ? 'Masculino' : patientData.sexo === 'F' ? 'Femenino' : patientData.sexo}
            </Badge>

          </div>

          <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              <House className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                {patientData.direccion || 'Dirección no especificada'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{patientData.distritoDir} , {patientData.departamentoDir}</span>
            </div>

            {patientData.telefono1 && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{patientData.telefono1}</span>
              </div>
            )}

            {patientData.telefono2 && (
              <div className="flex items-center gap-2">
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
                <strong>Distrito Nacimiento:</strong> {patientData.distrito} 
              </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
