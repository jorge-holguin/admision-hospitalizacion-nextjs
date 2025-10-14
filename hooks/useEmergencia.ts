import { useState, useEffect, useCallback } from 'react';

interface Emergencia {
  EMERGENCIA_ID: string;
  FECHA: Date;
  HORA?: string;
  PACIENTE?: string;
  NOMBRES?: string;
  HISTORIA?: string;
  CONSULTORIO?: string;
  MEDICO?: string;
  SEGURO?: string;
  OBSERVACION1?: string;
  CIEX1?: string;
  TIPO_CIEX1?: string;
  ESTADO?: string;
  // Otros campos según sea necesario
}

interface EmergenciaFilter {
  pacienteId?: string;
  fecha?: Date;
  estado?: string;
  consultorio?: string;
  medico?: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface UseEmergenciaProps {
  initialPage?: number;
  initialPageSize?: number;
  pacienteId?: string;
}

export function useEmergencia({
  initialPage = 1,
  initialPageSize = 10,
  pacienteId
}: UseEmergenciaProps = {}) {
  // Estados
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: initialPage,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPacienteId, setCurrentPacienteId] = useState<string | undefined>(pacienteId);

  // Función para cargar emergencias
  const loadEmergencias = useCallback(async (
    page: number = pagination.page,
    pageSize: number = pagination.pageSize,
    pacienteId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir la URL base
      let url: string;
      
      // Si se proporciona un ID de paciente, obtener solo las emergencias
      if (pacienteId) {
        // Si hay ID de paciente, usar el endpoint específico
        url = `/api/emergency/paciente/${pacienteId}?page=${page}&pageSize=${pageSize}`;
      } else {
        // Si no hay ID de paciente, obtener todas las emergencias
        url = `/api/emergency?page=${page}&pageSize=${pageSize}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al cargar emergencias: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setEmergencias(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Error desconocido al cargar emergencias');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar emergencias');
      console.error('Error al cargar emergencias:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  // Función para crear una nueva emergencia
  const createEmergencia = async (emergenciaData: Partial<Emergencia>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/emergency/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emergenciaData)
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear emergencia: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Recargar las emergencias para reflejar la nueva
        await loadEmergencias();
        return data.data;
      } else {
        throw new Error(data.error || 'Error desconocido al crear emergencia');
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear emergencia');
      console.error('Error al crear emergencia:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar una emergencia existente
  const updateEmergencia = async (emergenciaId: string, emergenciaData: Partial<Emergencia>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/emergency/${emergenciaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emergenciaData)
      });
      
      if (!response.ok) {
        throw new Error(`Error al actualizar emergencia: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Recargar las emergencias para reflejar los cambios
        await loadEmergencias();
        return data.data;
      } else {
        throw new Error(data.error || 'Error desconocido al actualizar emergencia');
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar emergencia');
      console.error('Error al actualizar emergencia:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una emergencia
  const deleteEmergencia = async (emergenciaId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/emergency/${emergenciaId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar emergencia: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Recargar las emergencias para reflejar la eliminación
        await loadEmergencias();
        return data.data;
      } else {
        throw new Error(data.error || 'Error desconocido al eliminar emergencia');
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar emergencia');
      console.error('Error al eliminar emergencia:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener una emergencia por su ID
  const getEmergenciaById = async (emergenciaId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/emergency/${emergenciaId}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener emergencia: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Error desconocido al obtener emergencia');
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener emergencia');
      console.error('Error al obtener emergencia:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si un paciente tiene emergencias activas
  const hasActiveEmergencias = async (pacienteId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/emergency/activa/${pacienteId}`);
      
      if (!response.ok) {
        throw new Error(`Error al verificar emergencias activas: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.hasActiveEmergencias;
      } else {
        throw new Error(data.error || 'Error desconocido al verificar emergencias activas');
      }
    } catch (err: any) {
      setError(err.message || 'Error al verificar emergencias activas');
      console.error('Error al verificar emergencias activas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar la paginación
  const setPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const setPageSize = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize }));
  };

  // Función para refrescar los datos
  const refresh = () => {
    loadEmergencias(pagination.page, pagination.pageSize, currentPacienteId);
  };

  // Cargar emergencias cuando cambian los parámetros de paginación o el ID del paciente
  useEffect(() => {
    if (currentPacienteId) {
      loadEmergencias(pagination.page, pagination.pageSize, currentPacienteId);
    } else {
      loadEmergencias(pagination.page, pagination.pageSize);
    }
  }, [pagination.page, pagination.pageSize, currentPacienteId, loadEmergencias]);

  return {
    emergencias,
    pagination,
    loading,
    error,
    setPage,
    setPageSize,
    refresh,
    createEmergencia,
    updateEmergencia,
    deleteEmergencia,
    getEmergenciaById,
    hasActiveEmergencias,
    setPacienteId: setCurrentPacienteId
  };
}
