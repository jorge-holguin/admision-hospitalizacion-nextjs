import { useState, useCallback } from 'react';
import { Medico } from '@/services/hospitalizacion/medicoService';

interface UseMedicosOnDemandReturn {
  medicos: Medico[];
  loading: boolean;
  error: string | null;
  searchMedicos: (searchTerm?: string, consultorioId?: string) => Promise<void>;
  clearMedicos: () => void;
}

// Cache global para médicos
let medicosCache: Medico[] = [];
let lastSearchParams: string = '';

export function useMedicosOnDemand(): UseMedicosOnDemandReturn {
  const [medicos, setMedicos] = useState<Medico[]>(medicosCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMedicos = useCallback(async (searchTerm?: string, consultorioId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Crear parámetros de búsqueda
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (consultorioId) params.append('consultorio', consultorioId);
      
      const currentSearchParams = params.toString();
      
      // Si ya tenemos datos en caché para los mismos parámetros, no hacer nueva llamada
      if (currentSearchParams === lastSearchParams && medicosCache.length > 0) {
        setMedicos(medicosCache);
        return;
      }
            
      let url = '/api/master-tables/medicos/search';
      if (currentSearchParams) {
        url += `?${currentSearchParams}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al cargar médicos: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Actualizar caché
      medicosCache = data;
      lastSearchParams = currentSearchParams;
      
      setMedicos(data);
    } catch (err: any) {
      console.error('Error al cargar médicos:', err);
      setError(err.message || 'Error al cargar médicos');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMedicos = useCallback(() => {
    medicosCache = [];
    lastSearchParams = '';
    setMedicos([]);
    setError(null);
  }, []);

  return {
    medicos,
    loading,
    error,
    searchMedicos,
    clearMedicos
  };
}
