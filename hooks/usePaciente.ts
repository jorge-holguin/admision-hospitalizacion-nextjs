import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

interface PacienteFilter {
  historia?: string;
  documento?: string;
  nombres?: string;
}

interface PaginationOptions {
  page: number;
  pageSize: number;
}

interface Paciente {
  PACIENTE: string;
  HISTORIA: string;
  NOMBRES: string;
  PATERNO: string;
  MATERNO: string;
  NOMBRE: string;
  SEXO: string;
  DOCUMENTO: string;
  FECHA_NACIMIENTO: Date | null;
  EDAD: string;
  [key: string]: any; // Para otros campos que puedan venir
}

interface PaginatedResponse {
  data: Paciente[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

interface CountResponse {
  success: boolean;
  data?: {
    total: number;
  };
  message?: string;
}

export const usePaciente = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [filter, setFilter] = useState<PacienteFilter>({});
  const [searchType, setSearchType] = useState<'historia' | 'documento' | 'nombres'>('nombres');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Función para construir los parámetros de consulta
  const buildQueryParams = useCallback((
    filterOptions: PacienteFilter,
    paginationOptions: PaginationOptions
  ): string => {
    const params = new URLSearchParams();
    
    // Añadir parámetros de paginación
    params.append('page', paginationOptions.page.toString());
    params.append('pageSize', paginationOptions.pageSize.toString());
    
    // Añadir filtros si existen
    if (filterOptions.historia) {
      params.append('historia', filterOptions.historia);
    }
    
    if (filterOptions.documento) {
      params.append('documento', filterOptions.documento);
    }
    
    if (filterOptions.nombres) {
      params.append('nombres', filterOptions.nombres);
    }
    
    return params.toString();
  }, []);

  // Función para obtener pacientes paginados
  const fetchPacientes = useCallback(async (
    filterOptions: PacienteFilter = filter,
    paginationOptions: PaginationOptions = { page: pagination.page, pageSize: pagination.pageSize }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = buildQueryParams(filterOptions, paginationOptions);
      console.log(`Fetching pacientes with params: ${queryParams}`);
      
      const response = await fetch(`/api/paciente?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Internal Server Error');
      }
      
      const data: PaginatedResponse = await response.json();
      setPacientes(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching paciente data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, filter, pagination.page, pagination.pageSize]);

  // Función para contar pacientes con filtros
  const countPacientes = useCallback(async (filterOptions: PacienteFilter = filter) => {
    try {
      const params = new URLSearchParams();
      
      if (filterOptions.historia) {
        params.append('historia', filterOptions.historia);
      }
      
      if (filterOptions.documento) {
        params.append('documento', filterOptions.documento);
      }
      
      if (filterOptions.nombres) {
        params.append('nombres', filterOptions.nombres);
      }
      
      const response = await fetch(`/api/paciente/count?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Internal Server Error');
      }
      
      const data: CountResponse = await response.json();
      return data.data?.total || 0;
    } catch (err) {
      console.error('Error counting pacientes:', err);
      return 0;
    }
  }, [filter]);

  // Función para obtener un paciente por ID
  const getPacienteById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/paciente/${id}`);
      
      if (!response.ok) {
        throw new Error('Internal Server Error');
      }
      
      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error(`Error fetching paciente with ID ${id}:`, err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para cambiar la página
  const changePage = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // Función para cambiar el tamaño de página
  const changePageSize = useCallback((newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  }, []);

  // Función para actualizar el filtro basado en el tipo de búsqueda y término
  const updateFilter = useCallback((term: string) => {
    const newFilter: PacienteFilter = {};
    
    if (term) {
      newFilter[searchType] = term;
    }
    
    setFilter(newFilter);
  }, [searchType]);

  // Debounce para la búsqueda
  const debouncedUpdateFilter = useCallback(
    debounce((term: string) => {
      updateFilter(term);
    }, 500),
    [updateFilter]
  );

  // Manejar cambios en el término de búsqueda
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedUpdateFilter(term);
  }, [debouncedUpdateFilter]);

  // Manejar cambios en el tipo de búsqueda
  const handleSearchTypeChange = useCallback((type: 'historia' | 'documento' | 'nombres') => {
    setSearchType(type);
    // Aplicar el filtro actual con el nuevo tipo
    if (searchTerm) {
      const newFilter: PacienteFilter = {};
      newFilter[type] = searchTerm;
      setFilter(newFilter);
    }
  }, [searchTerm]);

  // Limpiar la búsqueda
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setFilter({});
  }, []);

  // Refrescar datos
  const refreshData = useCallback(() => {
    fetchPacientes(filter, { page: pagination.page, pageSize: pagination.pageSize });
  }, [fetchPacientes, filter, pagination.page, pagination.pageSize]);

  // Efecto para cargar datos cuando cambian los filtros o la paginación
  useEffect(() => {
    fetchPacientes(filter, { page: pagination.page, pageSize: pagination.pageSize });
  }, [fetchPacientes, filter, pagination.page, pagination.pageSize]);

  return {
    pacientes,
    loading,
    error,
    pagination,
    filter,
    searchType,
    searchTerm,
    fetchPacientes,
    countPacientes,
    getPacienteById,
    changePage,
    changePageSize,
    handleSearchChange,
    handleSearchTypeChange,
    clearSearch,
    refreshData,
  };
};
