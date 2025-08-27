import { useState, useEffect, useCallback } from "react";
import { medicoService, Medico } from "../../services/master-tables/medicoService";

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export function useMedicos(initialPage = 1, initialPageSize = 10) {
  const [data, setData] = useState<Medico[]>([]);
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
      const result = await medicoService.getMedicos(
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

  const createMedico = async (medicoData: Partial<Medico>) => {
    setIsLoading(true);
    try {
      await medicoService.createMedico(medicoData);
      refreshData();
      return { success: true };
    } catch (err) {
      console.error("Error creating médico:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Error desconocido" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateMedico = async (id: string, medicoData: Partial<Medico>) => {
    setIsLoading(true);
    try {
      await medicoService.updateMedico(id, medicoData);
      refreshData();
      return { success: true };
    } catch (err) {
      console.error("Error updating médico:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Error desconocido" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMedico = async (id: string) => {
    setIsLoading(true);
    try {
      await medicoService.deleteMedico(id);
      refreshData();
      return { success: true };
    } catch (err) {
      console.error("Error deleting médico:", err);
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
    createMedico,
    updateMedico,
    deleteMedico,
  };
}
