import { useState, useEffect, useCallback } from "react";

// Interfaz local para evitar importar código del lado servidor
export interface Localidad {
  LOCALIDAD: string;
  NOMBRE: string;
  ACTIVO: string;
  [key: string]: any;
}

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
      const params = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
      });
      Object.entries(filters || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).length > 0) {
          params.set(k, String(v));
        }
      });

      const res = await fetch(`/api/master-tables/localidades?${params.toString()}`);
      if (!res.ok) throw new Error(`Error ${res.status} al obtener localidades`);
      const result = await res.json();

      setData((result?.data as Localidad[]) || []);
      setPagination((prev) => ({
        page: result?.page ?? prev.page,
        pageSize: result?.pageSize ?? prev.pageSize,
        total: result?.total ?? 0,
        totalPages: Math.ceil((result?.total ?? 0) / (result?.pageSize ?? prev.pageSize)),
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

  const createLocalidad = async (localidadData: Partial<Localidad>) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/master-tables/localidades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localidadData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status} al crear localidad`);
      }
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
      const res = await fetch(`/api/master-tables/localidades/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localidadData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status} al actualizar localidad`);
      }
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
      const res = await fetch(`/api/master-tables/localidades/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status} al eliminar localidad`);
      }
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
