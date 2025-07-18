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
    console.log('📝 [useOrdenHospitalizacion] Iniciando fetchOrdenesHospitalizacion');
    console.log('📝 [useOrdenHospitalizacion] Parámetros:', { 
      pacienteId: debouncedPacienteId, 
      page: pagination.page, 
      pageSize: pagination.pageSize 
    });
    
    if (!debouncedPacienteId) {
      console.log('📝 [useOrdenHospitalizacion] No hay pacienteId, limpiando datos');
      setOrdenesHospitalizacion([]);
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Registrar la URL que se va a utilizar
      const apiUrl = `/api/orden-hospitalizacion/paciente/${debouncedPacienteId}`;
      console.log('📝 [useOrdenHospitalizacion] Llamando a API:', apiUrl);
      
      // Use the correct endpoint for fetching orders by patient ID
      const response = await fetch(apiUrl);
      
      console.log('📝 [useOrdenHospitalizacion] Estado de respuesta API:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('⚠️ [useOrdenHospitalizacion] Error en respuesta API:', response.status, response.statusText);
        throw new Error(`Error al obtener órdenes de hospitalización: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📝 [useOrdenHospitalizacion] Datos recibidos:', { 
        esArray: Array.isArray(data), 
        longitud: Array.isArray(data) ? data.length : 'N/A',
        muestra: Array.isArray(data) && data.length > 0 ? data[0] : 'Sin datos'
      });
      
      // Since the paciente endpoint returns an array directly without pagination
      // we need to handle the pagination on the client side
      const allData = Array.isArray(data) ? data : [];
      const total = allData.length;
      const totalPages = Math.ceil(total / pagination.pageSize);
      
      console.log('📝 [useOrdenHospitalizacion] Aplicando paginación del lado del cliente:', { 
        total, 
        totalPages, 
        páginaActual: pagination.page 
      });
      
      // Apply pagination on the client side
      const start = (pagination.page - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      const paginatedData = allData.slice(start, end);
      
      console.log('📝 [useOrdenHospitalizacion] Datos paginados:', { 
        desde: start, 
        hasta: end, 
        registrosMostrados: paginatedData.length 
      });
      
      setOrdenesHospitalizacion(paginatedData);
      setPagination(prev => ({
        ...prev,
        total,
        totalPages,
      }));
      
      console.log('📝 [useOrdenHospitalizacion] Datos actualizados correctamente');
    } catch (err) {
      console.error('⚠️ [useOrdenHospitalizacion] Error al obtener órdenes:', err);
      
      // Intentar detectar si el error es por llamar a la URL incorrecta
      if (err instanceof Error && err.message.includes('404')) {
        console.error('⚠️ [useOrdenHospitalizacion] Posible error de URL incorrecta. Verificar que se está usando /api/orden-hospitalizacion/paciente/${id} y no /api/orden-hospitalizacion/${id}');
        
        // Intentar recuperarse usando la URL correcta
        try {
          console.log('📝 [useOrdenHospitalizacion] Intentando recuperación con URL correcta...');
          const correctUrl = `/api/orden-hospitalizacion/paciente/${debouncedPacienteId}`;
          const recoveryResponse = await fetch(correctUrl);
          
          if (recoveryResponse.ok) {
            const recoveryData = await recoveryResponse.json();
            console.log('📝 [useOrdenHospitalizacion] Recuperación exitosa con URL correcta');
            
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
