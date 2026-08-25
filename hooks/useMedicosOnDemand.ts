import { useState, useCallback } from 'react';
import { Medico } from '@/services/hospitalizacion/medicoService';
import { medicoServerService } from '@/services/master-tables/medicoService';

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
      
      const currentSearchParams = JSON.stringify({ searchTerm, consultorioId });
      
      // Si ya tenemos datos en caché para los mismos parámetros, no hacer nueva llamada
      if (currentSearchParams === lastSearchParams && medicosCache.length > 0) {
        setMedicos(medicosCache);
        return;
      }
      
      const data = await medicoServerService.searchMedicos({
        search: searchTerm,
        consultorio: consultorioId,
      });
      
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
