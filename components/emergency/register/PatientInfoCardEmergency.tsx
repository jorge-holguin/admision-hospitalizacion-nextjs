"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import { User, Calendar, Phone, MapPin, CreditCard, Heart } from 'lucide-react';

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
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Intentar obtener datos del paciente desde la API de filiación
        const response = await fetch(`/api/filiacion/${patientId}`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener datos del paciente: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          const patientInfo: PatientData = {
            paciente: data.data.PACIENTE || patientId,
            nombres: data.data.NOMBRES || '',
            nombre: data.data.NOMBRE || '',
            historia: data.data.HISTORIA || '',
            apellidoPaterno: data.data.PATERNO || '',
            apellidoMaterno: data.data.MATERNO || '',
            documento: data.data.DOCUMENTO || '',
            tipoDocumento: data.data.TIPO_DOCUMENTO || '',
            fechaNacimiento: data.data.FECHA_NACIMIENTO || '',
            edad: data.data.EDAD || '',
            sexo: data.data.SEXO || '',
            estadoCivil: data.data.ESTADO_CIVIL || '',
            direccion: data.data.DIRECCION || '',
            distrito: data.data.DISTRITO || '',
            distritoDir: data.data.Distrito_Dir || '',
            telefono1: data.data.TELEFONO1 || '',
            telefono2: data.data.TELEFONO2 || '',
            seguro: data.data.SEGURO || '',
            descSeguro: data.data.NOMBRE_SEGURO || '',
            religion: data.data.RELIGION || '',
            descreligion: data.data.DESRELIGION || '',
            localidad: data.data.LOCALIDAD || '',
            nombreLocalidad: data.data.Nombre_Localidad || '',
            nombreOcupacion: data.data.NOMBRE_OCUPACION || '',
            photo: data.data.STRING_PHOTO || data.data.STRING_FOTO || '' // Support both field names
          };
          
          // Clean and validate the photo data
          if (patientInfo.photo) {
            try {
              // Remove any whitespace, newlines or other non-base64 characters
              patientInfo.photo = patientInfo.photo.trim();
              
              // If it's already a data URL, keep it as is
              if (!patientInfo.photo.startsWith('data:')) {
                // Check if it's a valid base64 string by attempting to decode a small part
                try {
                  // Try to decode the first few characters to validate it's base64
                  const testSample = patientInfo.photo.substring(0, 10);
                  atob(testSample);
                  
                  // If we got here, it's likely valid base64, so add the proper prefix
                  patientInfo.photo = `data:image/jpeg;base64,${patientInfo.photo}`;
                } catch (e) {
                  console.error('Invalid base64 data received:', e);
                  // If it's not valid base64, set to empty to show the default icon
                  patientInfo.photo = '';
                }
              } else {
                // Validate the data URL format
                if (!patientInfo.photo.match(/^data:(image\/(jpeg|png|gif|webp|svg\+xml));base64,/)) {
                  console.warn('Unusual data URL format:', patientInfo.photo.substring(0, 30));
                  // Try to fix common issues with data URLs
                  if (patientInfo.photo.includes('base64,')) {
                    // Extract just the base64 part and reconstruct
                    const base64Part = patientInfo.photo.split('base64,')[1];
                    if (base64Part) {
                      patientInfo.photo = `data:image/jpeg;base64,${base64Part}`;
                    }
                  }
                }
              }
              
              console.log('Processed photo URL:', patientInfo.photo.substring(0, 50) + '...');
            } catch (error) {
              console.error('Error processing photo data:', error);
              patientInfo.photo = ''; // Reset to empty on error
            }
          }
          
          setPatientData(patientInfo);
          
          // Notificar al componente padre con los datos cargados
          if (onDataLoaded) {
            onDataLoaded(patientInfo);
          }
        } else {
          throw new Error(data.error || 'No se encontraron datos del paciente');
        }
      } catch (err: any) {
        console.error('Error al cargar datos del paciente:', err);
        setError(err.message || 'Error al cargar datos del paciente');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId, onDataLoaded]);

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
      return date.toLocaleDateString('es-ES', {
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
              <strong>{patientData.tipoDocumento || 'DNI'}:</strong> {patientData.documento || 'No especificado'}
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
              <strong>Estado Civil:</strong> {patientData.estadoCivil || 'No especificado'}
            </span>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="border-t pt-3">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Contacto</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                {patientData.direccion || 'Dirección no especificada'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{patientData.distrito}</span>
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
                <strong>Distrito Actual:</strong> {patientData.distritoDir}
              </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
