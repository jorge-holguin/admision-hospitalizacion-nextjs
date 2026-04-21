import { useState, useEffect, useCallback } from "react";
import { consultorioServerService } from "@/services/master-tables/consultorioService";

// Definir interfaz local para evitar importar código de servidor en el cliente
export interface Consultorio {
  CONSULTORIO: string;
  NOMBRE: string;
  ABREVIATURA?: string;
  ESPECIALIDAD?: string;
  HIS_NOMSERVICIO?: string;
  ACTIVO: string;
  [key: string]: any;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export function useConsultorios(initialPage = 1, initialPageSize = 20) {
  const [data, setData] = useState<Consultorio[]>([]);
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
      const result = await consultorioServerService.getConsultorios(
        pagination.page,
        pagination.pageSize,
        filters
      );

      setData(result.data || []);
      setPagination((prev) => ({
        page: result.page ?? prev.page,
        pageSize: result.pageSize ?? prev.pageSize,
        total: result.total ?? 0,
        totalPages: result.totalPages ?? Math.ceil((result.total ?? 0) / (result.pageSize ?? prev.pageSize)),
      }));
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

  const createConsultorio = async (consultorioData: Partial<Consultorio>) => {
    setIsLoading(true);
    try {
      await consultorioServerService.createConsultorio(consultorioData);
      refreshData();
      return { success: true };
    } catch (err) {
      console.error("Error creating consultorio:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error desconocido"
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateConsultorio = async (id: string, consultorioData: Partial<Consultorio>) => {
    setIsLoading(true);
    try {
      await consultorioServerService.updateConsultorio(id, consultorioData);
      refreshData();
      return { success: true };
    } catch (err) {
      console.error("Error updating consultorio:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error desconocido"
      };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConsultorio = async (id: string) => {
    setIsLoading(true);
    try {
      await consultorioServerService.deleteConsultorio(id);
      refreshData();
      return { success: true };
    } catch (err) {
      console.error("Error deleting consultorio:", err);
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
    createConsultorio,
    updateConsultorio,
    deleteConsultorio,
  };
}
