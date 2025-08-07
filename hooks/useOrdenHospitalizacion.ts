import { useState, useEffect, useCallback } from 'react';
import { OrdenHospitalizacion } from '@/services/ordenHospitalizacionService';
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
      // Usar la API principal con paginación en lugar de la API específica de paciente
      const apiUrl = `/api/orden-hospitalizacion?page=${pagination.page}&pageSize=${pagination.pageSize}&pacienteId=${debouncedPacienteId}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error('⚠️ [useOrdenHospitalizacion] Error en respuesta API:', response.status, response.statusText);
        throw new Error(`Error al obtener órdenes de hospitalización: ${response.status}`);
      }

      const result = await response.json();

      // La API principal devuelve los datos en diferentes formatos dependiendo del endpoint
      let data = [];
      let total = 0;

      if (result.success && result.data && Array.isArray(result.data)) {
        // Formato para filtrado por pacienteId: { success: true, data: [...], pagination: {...} }
        data = result.data;
        total = result.pagination?.total || data.length;
      } else if (result.success && result.data && result.data.records) {
        // Formato estándar: { success: true, data: { records: [...], pagination: {...} } }
        data = result.data.records;
        total = result.data.pagination?.total || data.length;
      } else if (Array.isArray(result)) {
        // Formato antiguo: array directo
        data = result;
        total = result.length;
      } else if (result.data && !Array.isArray(result.data) && !result.data.records) {
        // Caso especial: objeto data sin records
        console.warn('⚠️ [useOrdenHospitalizacion] Estructura de datos inesperada:', result);
        data = [];
        total = 0;
      }

      const totalPages = Math.ceil(total / pagination.pageSize);

      // La API ya devuelve los datos paginados, no necesitamos hacer paginación del lado del cliente

      setOrdenesHospitalizacion(data);
      setPagination(prev => ({
        ...prev,
        total,
        totalPages,
      }));
    } catch (err) {
      console.error('⚠️ [useOrdenHospitalizacion] Error al obtener órdenes:', err);

      // Intentar detectar si el error es por llamar a la URL incorrecta
      if (err instanceof Error && err.message.includes('404')) {
        console.error('⚠️ [useOrdenHospitalizacion] Posible error de URL incorrecta. Verificar que se está usando /api/orden-hospitalizacion/paciente/${id} y no /api/orden-hospitalizacion/${id}');

        // Intentar recuperarse usando la URL correcta
        try {
          const correctUrl = `/api/orden-hospitalizacion/paciente/${debouncedPacienteId}`;
          const recoveryResponse = await fetch(correctUrl);

          if (recoveryResponse.ok) {
            const recoveryData = await recoveryResponse.json();

            const allData = Array.isArray(recoveryData) ? recoveryData : [];
            const total = allData.length;
            const totalPages = Math.ceil(total / pagination.pageSize);

            const start = (pagination.page - 1) * pagination.pageSize;
            const end = start + pagination.pageSize;
            const paginatedData = allData.slice(start, end);

            setOrdenesHospitalizacion(paginatedData);
            setPagination(prev => ({
              ...prev,
              total,
              totalPages,
            }));

            setLoading(false);
            return; // Salir temprano si la recuperación fue exitosa
          }
        } catch (recoveryErr) {
          console.error('⚠️ [useOrdenHospitalizacion] Fallo en intento de recuperación:', recoveryErr);
        }
      }

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
