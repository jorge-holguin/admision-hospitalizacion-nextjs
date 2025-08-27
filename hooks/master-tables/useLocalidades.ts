import { useState, useEffect, useCallback } from "react";
import { localidadService, Localidad } from "../../services/master-tables/localidadService";

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export function useLocalidades(initialPage = 1, initialPageSize = 10) {
  const [data, setData] = useState<Localidad[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: initialPage,
    pageSize: initialPageSize,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await localidadService.getLocalidades(
        pagination.page,
        pagination.pageSize,
        filters
      );

      setData(result.data || []);
      setPagination({
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination((prev) => ({ ...prev, page: 1, pageSize }));
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const refreshData = () => {
    fetchData();
  };

  const createLocalidad = async (localidadData: Partial<Localidad>) => {
    setIsLoading(true);
    try {
      await localidadService.createLocalidad(localidadData);
      refreshData();
      return { success: true };
    } catch (err) {
      console.error("Error creating localidad:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Error desconocido" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocalidad = async (id: string, localidadData: Partial<Localidad>) => {
    setIsLoading(true);
    try {
      await localidadService.updateLocalidad(id, localidadData);
      refreshData();
      return { success: true };
    } catch (err) {
      console.error("Error updating localidad:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Error desconocido" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLocalidad = async (id: string) => {
    setIsLoading(true);
    try {
      await localidadService.deleteLocalidad(id);
      refreshData();
      return { success: true };
    } catch (err) {
      console.error("Error deleting localidad:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Error desconocido" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    pagination,
    isLoading,
    error,
    handlePageChange,
    handlePageSizeChange,
    handleFilterChange,
    refreshData,
    createLocalidad,
    updateLocalidad,
    deleteLocalidad,
  };
}
