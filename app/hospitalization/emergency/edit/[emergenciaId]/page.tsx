'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmergenciaForm from '@/components/emergency/EmergencyForm';
import { Box, CircularProgress, Alert } from '@mui/material';

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
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }
  
  if (!emergencia || !pacienteId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No se encontró la emergencia solicitada o falta el ID del paciente.
        </Alert>
      </Box>
    );
  }
  
  return (
    <EmergenciaForm 
      pacienteId={pacienteId} 
      emergenciaId={emergenciaId} 
      initialData={emergencia} 
    />
  );
}
