'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmergencyFormRefactored } from '@/components/emergency/register/EmergencyFormRefactored';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface EditEmergenciaPageProps {
  params: {
    emergenciaId: string;
  };
}

export default function EditEmergenciaPage({ params }: EditEmergenciaPageProps) {
  const { emergenciaId } = params;
  const router = useRouter();
  
  const [emergencia, setEmergencia] = useState<any>(null);
  const [pacienteId, setPacienteId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEmergencia = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/emergencia/${emergenciaId}`);
        
        if (!response.ok) {
          throw new Error(`Error al cargar emergencia: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setEmergencia(data.data);
          setPacienteId(data.data.PACIENTE || '');
        } else {
          throw new Error(data.error || 'No se pudo cargar la emergencia');
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar la emergencia');
        console.error('Error al cargar emergencia:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (emergenciaId) {
      fetchEmergencia();
    }
  }, [emergenciaId]);
  
  if (loading) {
    return (
      <Card className="m-4">
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="m-4">
        <CardContent className="p-6">
          <Alert className="mb-4">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  if (!emergencia || !pacienteId) {
    return (
      <Card className="m-4">
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              No se encontró la emergencia solicitada o falta el ID del paciente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <EmergencyFormRefactored 
      patientId={pacienteId} 
      emergencyId={emergenciaId} 
      emergencyData={emergencia} 
    />
  );
}
