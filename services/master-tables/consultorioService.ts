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
      console.log(`🔍 Buscando consultorios - página ${page}, tamaño ${pageSize}`);
      
      const params: Record<string, string> = {
        page: page.toString(),
        pageSize: pageSize.toString(),
      };
      
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
      
      console.log(`✅ Encontrados ${normalized.length} consultorios (total: ${total})`);
      
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
      console.log(`🔍 Buscando consultorio: ${id}`);
      
      const url = API_ENDPOINTS.masterTables.consultorios.byId(id);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró consultorio ${id}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Consultorio encontrado: ${id}`);
      
      return normalizeConsultorio(data);
    } catch (error) {
      console.error(`❌ Error in consultorioServerService.getConsultorioById(${id}):`, error);
      throw error;
    }
  },

  async createConsultorio(data: Partial<Consultorio>): Promise<Consultorio> {
    try {
      console.log(`➕ Creando consultorio: ${data.CONSULTORIO}`);
      
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
      console.log(`✅ Consultorio creado: ${data.CONSULTORIO}`);
      
      return normalizeConsultorio(result);
    } catch (error) {
      console.error('❌ Error in consultorioServerService.createConsultorio:', error);
      throw error;
    }
  },

  async updateConsultorio(id: string, data: Partial<Consultorio>): Promise<Consultorio | null> {
    try {
      console.log(`🔄 Actualizando consultorio: ${id}`);
      
      const url = API_ENDPOINTS.masterTables.consultorios.byId(id);
      const response = await fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró consultorio ${id}`);
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Consultorio actualizado: ${id}`);
      
      return normalizeConsultorio(result);
    } catch (error) {
      console.error(`❌ Error in consultorioServerService.updateConsultorio(${id}):`, error);
      throw error;
    }
  },

  async deleteConsultorio(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Eliminando consultorio: ${id}`);
      
      const url = API_ENDPOINTS.masterTables.consultorios.byId(id);
      const response = await fetchApi(url, {
        method: 'DELETE',
      });
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró consultorio ${id}`);
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ Consultorio eliminado: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error in consultorioServerService.deleteConsultorio(${id}):`, error);
      throw error;
    }
  }
};
