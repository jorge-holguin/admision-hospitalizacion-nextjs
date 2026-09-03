import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from "@/lib/api-config";

interface PatientSeguroData {
  seguro: string;
  nombreSeguro: string;
  seguroDisplay: string;
}

interface UsePatientSeguroReturn {
  seguroData: PatientSeguroData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook personalizado para obtener datos de seguro del paciente desde la API de filiacion2
 */
export const usePatientSeguro = (patientId: string | null): UsePatientSeguroReturn => {
  const [seguroData, setSeguroData] = useState<PatientSeguroData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientSeguro = async () => {
    if (!patientId) {
      setSeguroData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);      // Usar endpoint directo de Spring Boot para obtener datos del paciente
      const response = await fetch(API_ENDPOINTS.filiation.byId(patientId), {
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos del paciente: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const filiacionData = result.data;
        
        // Extraer datos de seguro
        const seguro = filiacionData.SEGURO?.trim() || '';
        const nombreSeguro = filiacionData.NOMBRE_SEGURO?.trim() || '';
        
        // Formatear para mostrar: "código - descripción"
        const seguroDisplay = seguro && nombreSeguro 
          ? `${seguro} - ${nombreSeguro}`
          : seguro || nombreSeguro || '';

        const seguroInfo: PatientSeguroData = {
          seguro,
          nombreSeguro,
          seguroDisplay
        };        setSeguroData(seguroInfo);
      } else {
        console.warn('No se encontraron datos del paciente en filiacion2');
        setSeguroData(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error al obtener datos de seguro del paciente:', errorMessage);
      setError(errorMessage);
      setSeguroData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientSeguro();
  }, [patientId]);

  return {
    seguroData,
    loading,
    error,
    refetch: fetchPatientSeguro
  };
};
