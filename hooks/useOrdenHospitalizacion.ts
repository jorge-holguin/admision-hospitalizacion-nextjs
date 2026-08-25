import { useState, useEffect, useCallback } from 'react';
import { OrdenHospitalizacion, ordenHospitalizacionService } from '@/services/hospitalizacion/ordenHospitalizacionService';
import { useDebounce } from '@/hooks/useDebounce';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface UseOrdenHospitalizacionProps {
  initialPage?: number;
  initialPageSize?: number;
}

interface UseOrdenHospitalizacionReturn {
  ordenesHospitalizacion: OrdenHospitalizacion[];
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  pacienteId: string | null;
  setPacienteId: (id: string | null) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  refresh: () => void;
}

export function useOrdenHospitalizacion({
  initialPage = 1,
  initialPageSize = 10,
}: UseOrdenHospitalizacionProps = {}): UseOrdenHospitalizacionReturn {
  const [ordenesHospitalizacion, setOrdenesHospitalizacion] = useState<OrdenHospitalizacion[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pacienteId, setPacienteIdState] = useState<string | null>(null);

  // Usar debounce para evitar múltiples llamadas API cuando cambia el pacienteId
  const debouncedPacienteId = useDebounce(pacienteId, 500);

  const fetchOrdenesHospitalizacion = useCallback(async () => {
    if (!debouncedPacienteId) {
      setOrdenesHospitalizacion([]);
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ordenHospitalizacionService.getPaginatedOrdenHospitalizacion(
        { pacienteId: debouncedPacienteId },
        { page: pagination.page, pageSize: pagination.pageSize }
      );

      let data: OrdenHospitalizacion[] = [];
      let total = 0;

      if (result.success && Array.isArray(result.data)) {
        data = result.data;
        total = result.pagination?.total || data.length;
      } else if (result.success && result.data?.records) {
        data = result.data.records;
        total = result.data.pagination?.total || data.length;
      }

      setOrdenesHospitalizacion(data);
      setPagination(prev => ({
        ...prev,
        total,
        totalPages: Math.ceil(total / pagination.pageSize),
      }));
    } catch (err) {
      console.error('⚠️ [useOrdenHospitalizacion] Error al obtener órdenes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al obtener órdenes de hospitalización');
      setOrdenesHospitalizacion([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedPacienteId, pagination.page, pagination.pageSize]);
  
  // Efecto para cargar datos cuando cambian los parámetros de paginación o el pacienteId
  useEffect(() => {
    fetchOrdenesHospitalizacion();
  }, [fetchOrdenesHospitalizacion]);
  
  // Función para establecer el pacienteId
  const setPacienteId = useCallback((id: string | null) => {
    setPacienteIdState(id);
    // Resetear a la primera página cuando cambia el pacienteId
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  // Función para cambiar la página
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);
  
  // Función para cambiar el tamaño de página
  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 })); // Resetear a la primera página
  }, []);
  
  // Función para refrescar los datos
  const refresh = useCallback(() => {
    fetchOrdenesHospitalizacion();
  }, [fetchOrdenesHospitalizacion]);
  
  return {
    ordenesHospitalizacion,
    pagination,
    loading,
    error,
    pacienteId,
    setPacienteId,
    setPage,
    setPageSize,
    refresh,
  };
}
