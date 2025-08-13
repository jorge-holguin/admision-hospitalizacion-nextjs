import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface EmergenciaRecord {
  Estado: string | null;
  Emergencia_id: string;
  Fecha: Date;
  Hora: string | null;
  Orden: string;
  Paciente: string | null;
  Historia: string | null;
  Nombres: string | null;
  Sexo: string;
  Nombre_Seguro: string | null;
  Consultorio: string | null;
  Nombre_Consultorio: string | null;
  Nombre_motivo: string | null;
  Usuario: string;
  TipoAtencion: string | null;
}

export interface EmergenciaPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EmergenciaFilter {
  month?: number;
  year?: number;
  searchTerm?: string;
}

export const useEmergencia = () => {
  const [data, setData] = useState<EmergenciaRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EmergenciaFilter>({});
  
  // Configuración de paginación
  const [pagination, setPagination] = useState<EmergenciaPagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  /**
   * Función para cargar los datos de emergencia con filtros y paginación
   */
  const fetchEmergencias = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Construir URL con parámetros de consulta
      const queryParams = new URLSearchParams();
      
      // Añadir filtros si existen
      if (filter.month) queryParams.append('month', filter.month.toString());
      if (filter.year) queryParams.append('year', filter.year.toString());
      if (filter.searchTerm) queryParams.append('search', filter.searchTerm);
      
      // Añadir parámetros de paginación
      queryParams.append('page', pagination.page.toString());
      queryParams.append('pageSize', pagination.pageSize.toString());
      
      const url = `/api/emergencia?${queryParams.toString()}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar datos de emergencia');
      }
      
      if (result.success) {
        setData(result.data || []);
        
        // Actualizar información de paginación
        if (result.pagination) {
          setPagination({
            page: result.pagination.page || pagination.page,
            pageSize: result.pagination.pageSize || pagination.pageSize,
            total: result.pagination.total || 0,
            totalPages: result.pagination.totalPages || 0
          });
        }
      } else {
        setData([]);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos de emergencia');
      toast.error(err.message || 'Error al cargar datos de emergencia');
      console.error('Error al cargar emergencias:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter, pagination.page, pagination.pageSize]);

  // Cargar emergencias cuando cambian los filtros o la paginación
  useEffect(() => {
    fetchEmergencias();
  }, [fetchEmergencias]);
  
  /**
   * Manejador para cambiar de página
   */
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      page
    }));
  }, []);
  
  /**
   * Manejador para cambiar el tamaño de página
   */
  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize,
      page: 1 // Resetear a la primera página cuando cambia el tamaño
    }));
  }, []);
  
  /**
   * Manejador para cambiar los filtros
   */
  const handleFilterChange = useCallback((newFilter: EmergenciaFilter) => {
    setFilter(newFilter);
    // Resetear a la primera página cuando cambian los filtros
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  }, []);
  
  /**
   * Función para refrescar los datos manteniendo los filtros actuales
   */
  const refreshData = useCallback(() => {
    fetchEmergencias();
  }, [fetchEmergencias]);

  return {
    data,
    pagination,
    isLoading,
    error,
    handlePageChange,
    handlePageSizeChange,
    handleFilterChange,
    refreshData,
    filter
  };
};

export default useEmergencia;
