// consultorioService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

// Helper: obtiene el primer valor no nulo de una lista de claves
function getVal(row: any, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null) return String(v);
  }
  return undefined;
}

// Normalizador para filas de Consultorio (soporta UPPERCASE y camelCase del API Spring Boot)
function normalizeConsultorio(row: any): Consultorio {
  const rawActivo = getVal(row, 'ACTIVO', 'activo') ?? '';
  const ACTIVO = rawActivo === '1' || rawActivo.toUpperCase?.() === 'S' ? '1' : '0';
  const consultorio = getVal(row, 'CONSULTORIO', 'consultorio');
  return {
    CONSULTORIO: consultorio ? consultorio.trim() : consultorio,
    NOMBRE: getVal(row, 'NOMBRE', 'nombre'),
    ABREVIATURA: getVal(row, 'ABREVIATURA', 'abreviatura'),
    ESPECIALIDAD: getVal(row, 'ESPECIALIDAD', 'especialidad'),
    TIPO: getVal(row, 'TIPO', 'tipo'),
    ROL: getVal(row, 'ROL', 'rol'),
    MUESTRAROL: getVal(row, 'MUESTRAROL', 'muestraRol', 'muestrarol'),
    ACTIVO,
    ORDEN: getVal(row, 'ORDEN', 'orden'),
    NUMERO: getVal(row, 'NUMERO', 'numero'),
    HIS_CODSERVICIO: getVal(row, 'HIS_CODSERVICIO', 'hisCodservicio', 'hisCodServicio'),
    UPSTRAMA: getVal(row, 'UPSTRAMA', 'CODUPSSEEM', 'codupsseem', 'upstrama'),
    // Legacy fields for backward compatibility
    HIS_NOMSERVICIO: getVal(row, 'HIS_NOMSERVICIO', 'hisNomservicio', 'hisNomServicio'),
    CODIGOHIS: getVal(row, 'CODIGOHIS', 'codigoHis', 'HIS_CODSERVICIO', 'hisCodservicio'),
    NOMBRE_ESPECIALIDAD: getVal(row, 'NOMBRE_ESPECIALIDAD', 'nombreEspecialidad', 'HIS_NOMSERVICIO', 'hisNomservicio'),
  } as Consultorio;
}

export interface Consultorio {
  CONSULTORIO: string;
  NOMBRE: string;
  ABREVIATURA?: string;
  ESPECIALIDAD?: string;
  TIPO?: string;
  ROL?: string;
  MUESTRAROL?: string;
  ACTIVO: string;
  ORDEN?: string;
  NUMERO?: string;
  UPSTRAMA?: string;
  HIS_CODSERVICIO?: string;
  // Legacy fields
  HIS_NOMSERVICIO?: string;
  CODIGOHIS?: string;
  NOMBRE_ESPECIALIDAD?: string;
  [key: string]: any;
}

export interface ConsultorioFilters {
  nombre?: string;
  codigo?: string;
  servicio?: string;
  search?: string;
  tipo?: string | string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// SERVICIO DE CONSULTORIOS - SPRING BOOT API
// ============================================================================

export const consultorioServerService = {
  async getConsultorios(
    page: number = 1,
    pageSize: number = 10,
    filters: ConsultorioFilters = {}
  ): Promise<PaginatedResponse<Consultorio>> {
    try {
      const params: Record<string, string | string[]> = {
        page: page.toString(),
        pageSize: pageSize.toString(),
      };
      
      if (filters.search) params.search = filters.search;
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.nombre) params.nombre = filters.nombre;
      if (filters.codigo) params.codigo = filters.codigo;
      if (filters.servicio) params.servicio = filters.servicio;
      
      const url = buildUrl(API_ENDPOINTS.masterTables.consultorios.list, params);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Normalizar respuesta
      const data = Array.isArray(result) ? result : (result.data || []);
      const total = result.total || data.length;
      const normalized = data.map(normalizeConsultorio);
      return {
        data: normalized,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('❌ Error in consultorioServerService.getConsultorios:', error);
      throw error;
    }
  },

  async getConsultorioById(id: string): Promise<Consultorio | null> {
    try {
      const url = API_ENDPOINTS.masterTables.consultorios.byId(id);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return normalizeConsultorio(data);
    } catch (error) {
      console.error(`❌ Error in consultorioServerService.getConsultorioById(${id}):`, error);
      throw error;
    }
  },

  async createConsultorio(data: Partial<Consultorio>): Promise<Consultorio> {
    try {
      const url = API_ENDPOINTS.masterTables.consultorios.list;
      const response = await fetchApi(url, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return normalizeConsultorio(result);
    } catch (error) {
      console.error('❌ Error in consultorioServerService.createConsultorio:', error);
      throw error;
    }
  },

  async updateConsultorio(id: string, data: Partial<Consultorio>): Promise<Consultorio | null> {
    try {
      const url = API_ENDPOINTS.masterTables.consultorios.byId(id);
      const response = await fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return normalizeConsultorio(result);
    } catch (error) {
      console.error(`❌ Error in consultorioServerService.updateConsultorio(${id}):`, error);
      throw error;
    }
  },

  async getConsultoriosByEspecialidad(especialidad: string): Promise<Consultorio[]> {
    try {
      const url = buildUrl(API_ENDPOINTS.masterTables.consultorios.bySpecialty, {
        especialidad,
      });
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const data = Array.isArray(result) ? result : (result.data || []);
      
      return data.map(normalizeConsultorio);
    } catch (error) {
      console.error('❌ Error in consultorioServerService.getConsultoriosByEspecialidad:', error);
      throw error;
    }
  },

  async getConsultorioTipos(): Promise<{ Codigo: string; Nombre: string }[]> {
    try {
      const url = API_ENDPOINTS.masterTables.consultorios.types;
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const data = Array.isArray(result) ? result : (result.data || []);
      
      return data.map((row: any) => ({
        Codigo: row.codigo || row.Codigo || row.TIPO || row.tipo || '',
        Nombre: row.nombre || row.Nombre || row.NOMBRE || row.nombreTipo || '',
      }));
    } catch (error) {
      console.error('❌ Error in consultorioServerService.getConsultorioTipos:', error);
      throw error;
    }
  },

  async deleteConsultorio(id: string): Promise<boolean> {
    try {
      const url = API_ENDPOINTS.masterTables.consultorios.byId(id);
      const response = await fetchApi(url, {
        method: 'DELETE',
      });
      
      if (response.status === 404) {
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ Error in consultorioServerService.deleteConsultorio(${id}):`, error);
      throw error;
    }
  }
};
