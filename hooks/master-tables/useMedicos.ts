import { useState, useEffect, useCallback } from "react";
import { medicoServerService } from "@/services/master-tables/medicoService";

// Nota: Definimos la interfaz localmente para evitar importar código del lado servidor en el cliente
export interface Medico {
  ID_MEDICO?: number;
  MEDICO: string;
  NOMBRE: string;
  NOMBRES?: string;
  APATERNO?: string;
  AMATERNO?: string;
  DNI?: string;
  TIPO_DOCUMENTO?: string;
  ESPECIALIDAD?: string;
  CONSULTORIO?: string;
  ACTIVO: string;
  FECHNAC?: string;
  GENERO?: string;
  ESPECIALIDAD2?: string;
  CONSULTORIO2?: string;
  CONSULTORIO2_NOMBRE?: string;
  ESPECIALIDAD2_NOMBRE?: string;
  USUARIO?: string;
  [key: string]: any;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export function useMedicos(initialPage = 1, initialPageSize = 20) {
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
      const result = await medicoServerService.getMedicos(
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

  const createMedico = async (medicoData: Partial<Medico>) => {
    setIsLoading(true);
    try {
      await medicoServerService.createMedico(medicoData);
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
      await medicoServerService.updateMedico(id, medicoData);
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
      await medicoServerService.deleteMedico(id);
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

  const toggleMedicoStatus = async (id: string, currentStatus: string) => {
    setIsLoading(true);
    try {
      const newStatus = currentStatus === "1" ? "0" : "1";
      await medicoServerService.updateMedico(id, { ACTIVO: newStatus });
      refreshData();
      return { success: true, newStatus };
    } catch (err) {
      console.error("Error toggling médico status:", err);
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
    toggleMedicoStatus,
  };
}
