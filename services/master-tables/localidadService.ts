// localidadService.ts - Migrado a Spring Boot API
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

// Normalizador para filas de Localidad (soporta UPPERCASE y camelCase del API Spring Boot)
function normalizeLocalidad(row: any): Localidad {
  const rawActivo = getVal(row, 'ACTIVO', 'activo', 'Activo') ?? '';
  const ACTIVO = rawActivo === '1' || rawActivo.toUpperCase?.() === 'S' ? '1' : '0';
  const localidad = getVal(row, 'LOCALIDAD', 'localidad', 'Localidad');
  return {
    LOCALIDAD: localidad ? localidad.trim() : localidad,
    NOMBRE: getVal(row, 'NOMBRE', 'nombre', 'Nombre'),
    UBIGEO: getVal(row, 'UBIGEO', 'ubigeo', 'Ubigeo') ?? '',
    ACTIVO,
  } as Localidad;
}

export interface Localidad {
  LOCALIDAD: string;
  NOMBRE: string;
  UBIGEO?: string;
  ACTIVO: string;
  [key: string]: any;
}

export interface LocalidadFilters {
  nombre?: string;
  codigo?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// SERVICIO DE LOCALIDADES - SPRING BOOT API
// ============================================================================

export const localidadServerService = {
  async getLocalidades(
    page: number = 1,
    pageSize: number = 10,
    filters: LocalidadFilters = {}
  ): Promise<PaginatedResponse<Localidad>> {
    try {
      console.log(`🔍 Buscando localidades - página ${page}, tamaño ${pageSize}`);
      
      const params: Record<string, string> = {
        page: page.toString(),
        pageSize: pageSize.toString(),
      };
      
      if (filters.nombre) params.nombre = filters.nombre;
      if (filters.codigo) params.codigo = filters.codigo;
      
      const url = buildUrl(API_ENDPOINTS.masterTables.localidades.list, params);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Normalizar respuesta
      const data = Array.isArray(result) ? result : (result.data || []);
      const total = result.total || data.length;
      const normalized = data.map(normalizeLocalidad);
      
      console.log(`✅ Encontradas ${normalized.length} localidades (total: ${total})`);
      
      return {
        data: normalized,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('❌ Error in localidadServerService.getLocalidades:', error);
      throw error;
    }
  },

  async getLocalidadById(id: string): Promise<Localidad | null> {
    try {
      console.log(`🔍 Buscando localidad: ${id}`);
      
      const url = API_ENDPOINTS.masterTables.localidades.byId(id);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró localidad ${id}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Localidad encontrada: ${id}`);
      
      return normalizeLocalidad(data);
    } catch (error) {
      console.error(`❌ Error in localidadServerService.getLocalidadById(${id}):`, error);
      throw error;
    }
  },

  async createLocalidad(data: Partial<Localidad>): Promise<Localidad> {
    try {
      console.log(`➕ Creando localidad: ${data.LOCALIDAD}`);
      
      const url = API_ENDPOINTS.masterTables.localidades.list;
      const response = await fetchApi(url, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Localidad creada: ${data.LOCALIDAD}`);
      
      return normalizeLocalidad(result);
    } catch (error) {
      console.error('❌ Error in localidadServerService.createLocalidad:', error);
      throw error;
    }
  },

  async updateLocalidad(id: string, data: Partial<Localidad>): Promise<Localidad | null> {
    try {
      console.log(`🔄 Actualizando localidad: ${id}`);
      
      const url = API_ENDPOINTS.masterTables.localidades.byId(id);
      const response = await fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró localidad ${id}`);
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Localidad actualizada: ${id}`);
      
      return normalizeLocalidad(result);
    } catch (error) {
      console.error(`❌ Error in localidadServerService.updateLocalidad(${id}):`, error);
      throw error;
    }
  },

  async deleteLocalidad(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Eliminando localidad: ${id}`);
      
      const url = API_ENDPOINTS.masterTables.localidades.byId(id);
      const response = await fetchApi(url, {
        method: 'DELETE',
      });
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró localidad ${id}`);
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ Localidad eliminada: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error in localidadServerService.deleteLocalidad(${id}):`, error);
      throw error;
    }
  }
};
