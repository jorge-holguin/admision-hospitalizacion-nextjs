import { useState, useEffect } from 'react';

export interface Seguro {
  Seguro: string;
  Nombre: string;
  CREA_CUENTA: string;
}

interface UseSegurosReturn {
  seguros: Seguro[];
  loading: boolean;
  error: string | null;
  searchSeguros: (searchTerm: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook personalizado para manejar la lista de seguros disponibles
 */
export const useSeguros = (): UseSegurosReturn => {
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeguros = async (searchTerm: string = '') => {
    try {
      setLoading(true);
      setError(null);

      const url = searchTerm 
        ? `/api/utils/insurances?search=${encodeURIComponent(searchTerm)}`
        : '/api/utils/insurances';

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al obtener seguros: ${response.status}`);
      }

      const data = await response.json();
      setSeguros(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error al obtener seguros:', errorMessage);
      setError(errorMessage);
      setSeguros([]);
    } finally {
      setLoading(false);
    }
  };

  const searchSeguros = async (searchTerm: string) => {
    await fetchSeguros(searchTerm);
  };

  const refetch = async () => {
    await fetchSeguros();
  };

  useEffect(() => {
    fetchSeguros();
  }, []);

  return {
    seguros,
    loading,
    error,
    searchSeguros,
    refetch
  };
};
