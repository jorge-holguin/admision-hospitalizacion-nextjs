import { useState, useEffect, useCallback } from 'react';
import { emergenciaService } from '@/services/emergencia/emergenciaService';

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
    patientId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (patientId) {
        result = await emergenciaService.getEmergenciasByPacienteId(patientId, { page, pageSize });
      } else {
        result = await emergenciaService.getEmergencias({}, { page, pageSize });
      }

      setEmergencias((result.data || []) as unknown as Emergencia[]);
      setPagination(result.pagination || {
        page,
        pageSize,
        total: 0,
        totalPages: 0
      });
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

      const created = await emergenciaService.createEmergencia(emergenciaData as any);

      // Recargar las emergencias para reflejar la nueva
      await loadEmergencias();
      return created;
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

      const updated = await emergenciaService.updateEmergencia(emergenciaId, emergenciaData as any);

      // Recargar las emergencias para reflejar los cambios
      await loadEmergencias();
      return updated;
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

      await emergenciaService.deleteEmergencia(emergenciaId);

      // Recargar las emergencias para reflejar la eliminación
      await loadEmergencias();
      return true;
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

      const data = await emergenciaService.getEmergenciaById(emergenciaId);
      return data as unknown as Emergencia | null;
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

      const result = await emergenciaService.checkEmergenciaActiva(pacienteId);
      return result.hasActive;
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
