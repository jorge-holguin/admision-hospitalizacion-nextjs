"use client"

import React from 'react';
import { getCivilStatusDescription } from '@/utils/civilStatusUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import { User, Calendar, Phone, CreditCard, Heart, House, Mail } from 'lucide-react';

interface Patient {
  // Campos que vienen del servicio filiacion2Service
  HISTORIA: string
  NOMBRES: string
  NOMBRE?: string
  PATERNO?: string
  MATERNO?: string
  SEXO: string
  DOCUMENTO: string
  TIPO_DOCUMENTO?: string
  FECHA_NACIMIENTO: string
  EDAD?: string
  ESTADO_CIVIL?: string
  DIRECCION: string
  DISTRITO: string
  Distrito_Dir?: string
  TELEFONO1?: string
  TELEFONO2?: string
  CORREO?: string
  SEGURO?: string
  NOMBRE_SEGURO?: string
  RELIGION?: string
  DESRELIGION?: string
  Nombre_Localidad?: string
  LOCALIDAD?: string
  STRING_FOTO?: string
  PACIENTE?: string
}

interface PatientInfoCardAppointmentProps {
  patient: Patient;
  className?: string;
}

export const PatientInfoCardAppointment: React.FC<PatientInfoCardAppointmentProps> = ({
  patient,
  className = ""
}) => {
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

  const processPhotoData = (photoData: string): string => {
    if (!photoData) return '';
    
    try {
      // Remove any whitespace, newlines or other non-base64 characters
      photoData = photoData.trim();
      
      // If it's already a data URL, keep it as is
      if (!photoData.startsWith('data:')) {
        // Check if it's a valid base64 string
        try {
          // Try to decode the first few characters to validate it's base64
          const testSample = photoData.substring(0, 10);
          atob(testSample);
          
          // If we got here, it's likely valid base64, so add the proper prefix
          photoData = `data:image/jpeg;base64,${photoData}`;
        } catch (e) {
          console.error('Invalid base64 data received:', e);
          return '';
        }
      }
      
      return photoData;
    } catch (error) {
      console.error('Error processing photo data:', error);
      return '';
    }
  };

  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-4">
        {/* Foto del paciente - Centrada y más grande */}
        <div className="flex flex-col items-center space-y-4">
          {/* Foto del paciente */}
          <div className="relative w-32 h-40 flex-shrink-0">
            {patient.STRING_FOTO ? (
              <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                <ImageWithLoader 
                  src={processPhotoData(patient.STRING_FOTO)}
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
              {patient.NOMBRES?.trim()}
            </h3>
            <p className="text-sm text-gray-500">HC: {patient.HISTORIA}</p>
          </div>
        </div>

        {/* Información básica */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>DNI:</strong> {patient.DOCUMENTO || 'No especificado'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Nacimiento:</strong> {formatDate(patient.FECHA_NACIMIENTO)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Edad:</strong> {patient.EDAD || 'No especificado'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Sexo:</strong>
            </span>
            <Badge className={getSexoBadgeColor(patient.SEXO)}>
              {patient.SEXO === 'M' ? 'Masculino' : patient.SEXO === 'F' ? 'Femenino' : patient.SEXO}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              <strong>Estado Civil:</strong>{' '}
              {getCivilStatusDescription(
                typeof patient.ESTADO_CIVIL === 'object' && patient.ESTADO_CIVIL !== null
                  ? (patient.ESTADO_CIVIL as any).nombre ||
                    (patient.ESTADO_CIVIL as any).estadoCivil?.toString().trim() ||
                    (patient.ESTADO_CIVIL as any).descripcion ||
                    (patient.ESTADO_CIVIL as any).ESTADO_CIVIL ||
                    ''
                  : patient.ESTADO_CIVIL
              )}
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
                {patient.DIRECCION || 'Dirección no especificada'}
              </span>
            </div>
            {patient.TELEFONO1 && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{patient.TELEFONO1}</span>
              </div>
            )}
            {patient.CORREO && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{patient.CORREO}</span>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="border-t pt-3">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Información Adicional</h4>
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Seguro:</strong> {patient.NOMBRE_SEGURO || 'No especificado'}
            </div>
            
            <div className="text-sm">
              <strong>Distrito Nacimiento:</strong> {patient.Distrito_Dir}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
