import { useState, useEffect } from 'react';
import { seguroService } from '@/services/hospitalizacion/seguroService';

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

      const raw = await seguroService.findAll();
      const data: Seguro[] = raw.map((item: any) => ({
        Seguro: String(item.seguro || item.Seguro || item.SEGURO || ''),
        Nombre: String(item.nombre || item.Nombre || item.NOMBRE || ''),
        CREA_CUENTA: String(item.creaCuenta || item.CreaCuenta || item.CREA_CUENTA || ''),
      }));

      const filtered = searchTerm
        ? data.filter(s =>
            s.Seguro.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.Nombre.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : data;

      setSeguros(filtered);
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
