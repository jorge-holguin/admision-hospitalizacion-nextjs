// filiacionService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface FiliacionFilter {
  historia?: string;
  documento?: string;
  nombres?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface Filiacion {
  PACIENTE: string;
  HISTORIA: string;
  NOMBRES: string;
  SEXO: string;
  NOMBRE_ESTADO_CIVIL: string;
  FECHA_APERTURA: Date | string;
  HORA_APERTURA: string;
  PADRE: string;
  MADRE: string;
  DIRECCION: string;
  TELEFONO1: string;
  FECHA_NACIMIENTO: Date | string;
  DISTRITO: string;
  NOMBRE_DOCUMENTO: string;
  DOCUMENTO: string;
  NOMBRE_OCUPACION: string;
  NOMBRE_GRADO_INSTRUCCION: string;
  NOMBRE_CONYUGE: string;
  NOMBRE_SEGURO: string;
  NOMBRE_ENTIDAD: string;
  ANIO: string;
  PATERNO: string;
  MATERNO: string;
  NOMBRE: string;
  LUGAR_NACIMIENTO: string;
  HIJOS: number;
  CONYUGE_OCUPACION: string;
  CONSULTORIO: string;
  CONSUL: string;
  EDAD: number;
  ESTADO_CIVIL: string;
  SYSINSERT: Date | string;
  SYSUPDATE: Date | string;
  FECHA_CONSULTA: Date | string;
  TURNO_CONSULTA: string;
  Nombre_Localidad: string;
  Provincia_Nac: string;
  Departamento_Nac: string;
  Distrito_Dir: string;
  Provincia_Dir: string;
  Departamento_Dir: string;
  USUARIO: string;
  FLAG: string;
  RELIGION: string;
  DESRELIGION: string;
  USUARIO_IMP: string;
  HISTORIA_ANT: string;
  CODIGOBARRAS: string;
  STRING_FOTO: string;
  TIPO_DOCUMENTO: string;
  LOCALIDAD: string;
  TELEFONO2: string;
  SEGURO: string;
  Expr2: string;
  COD_DISTRITO: string;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ============================================================================
// SERVICIOS DE FILIACIÓN - SPRING BOOT API
// ============================================================================

export const filiacionService = {
  /**
   * Get paginated filiacion records with optional filtering
   */
  async getPaginatedFiliacion(
    filter: FiliacionFilter = {},
    { page = 1, pageSize = 10 }: PaginationOptions
  ): Promise<PaginatedResponse<Filiacion>> {
    try {
      console.log('🔍 [Hospitalización] Buscando registros de filiación:', { page, pageSize, filter });
      
      const params: Record<string, string> = {
        page: page.toString(),
        pageSize: pageSize.toString(),
      };
      
      if (filter.historia) params.historia = filter.historia;
      if (filter.documento) params.documento = filter.documento;
      if (filter.nombres) params.nombres = filter.nombres;
      
      const url = buildUrl(API_ENDPOINTS.filiation.search, params);
      console.log('🏥 Consultando filiación:', url);
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error en la respuesta:', errorData);
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Filiación obtenida:', data);
      
      if (data.data && Array.isArray(data.data)) {
        data.data = data.data.map((record: any) => processDateFields(record));
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error en getPaginatedFiliacion:', error);
      return {
        data: [],
        pagination: {
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        },
      };
    }
  },
  
  /**
   * Get a single filiacion record by ID (PACIENTE or HISTORIA)
   */
  async getFiliacionById(id: string): Promise<Filiacion | null> {
    try {
      console.log(`🔍 [Hospitalización] Buscando registro de filiación con ID: ${id}`);
      
      if (!id || typeof id !== 'string') {
        console.error(`ID inválido: ${id}`);
        return null;
      }
      
      const url = API_ENDPOINTS.filiation.byId(id);
      console.log('🏥 Consultando filiación por ID:', url);
      
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró registro de filiación con ID ${id}`);
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Registro de filiación encontrado:', data);
      
      return processDateFields(data);
    } catch (error) {
      console.error(`❌ Error en getFiliacionById(${id}):`, error);
      return null;
    }
  },
  
  /**
   * Search filiacion records by historia clinica
   */
  async searchByHistoria(historia: string): Promise<Filiacion[]> {
    try {
      console.log(`🔍 [Hospitalización] Buscando por historia: ${historia}`);
      
      const params = { historia, pageSize: '10' };
      const url = buildUrl(API_ENDPOINTS.filiation.search, params);
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Encontrados ${data.data?.length || 0} registros por historia`);
      
      return (data.data || []).map((record: any) => processDateFields(record));
    } catch (error) {
      console.error(`❌ Error en searchByHistoria(${historia}):`, error);
      return [];
    }
  },
  
  /**
   * Search filiacion records by DNI/documento
   */
  async searchByDocumento(documento: string): Promise<Filiacion[]> {
    try {
      console.log(`🔍 [Hospitalización] Buscando por documento: ${documento}`);
      
      const params = { documento, pageSize: '10' };
      const url = buildUrl(API_ENDPOINTS.filiation.search, params);
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Encontrados ${data.data?.length || 0} registros por documento`);
      
      return (data.data || []).map((record: any) => processDateFields(record));
    } catch (error) {
      console.error(`❌ Error en searchByDocumento(${documento}):`, error);
      return [];
    }
  },
  
  /**
   * Search filiacion records by name (nombres, apellidos)
   */
  async searchByName(name: string): Promise<Filiacion[]> {
    try {
      console.log(`🔍 [Hospitalización] Buscando por nombre: ${name}`);
      
      const params = { nombres: name, pageSize: '100' };
      const url = buildUrl(API_ENDPOINTS.filiation.search, params);
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Encontrados ${data.data?.length || 0} registros por nombre`);
      
      return (data.data || []).map((record: any) => processDateFields(record));
    } catch (error) {
      console.error(`❌ Error en searchByName(${name}):`, error);
      return [];
    }
  },
  
  /**
   * Count filiacion records with optional filtering
   */
  async countFiliacion(filter: FiliacionFilter = {}): Promise<number> {
    try {
      console.log('📊 [Hospitalización] Contando registros con filtros:', filter);
      
      const params: Record<string, string> = {
        page: '1',
        pageSize: '1',
      };
      
      if (filter.historia) params.historia = filter.historia;
      if (filter.documento) params.documento = filter.documento;
      if (filter.nombres) params.nombres = filter.nombres;
      
      const url = buildUrl(API_ENDPOINTS.filiation.search, params);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const total = data.pagination?.total || 0;
      
      console.log(`✅ Total de registros: ${total}`);
      return total;
    } catch (error) {
      console.error('❌ Error en countFiliacion:', error);
      return 0;
    }
  },
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Procesa los campos de fecha en un registro
 */
function processDateFields(record: any): any {
  if (!record) return record;
  
  const dateFields = ['FECHA_NACIMIENTO', 'FECHA_APERTURA', 'SYSINSERT', 'SYSUPDATE', 'FECHA_CONSULTA'];
  const processed = { ...record };
  
  for (const fieldName of dateFields) {
    if (processed[fieldName]) {
      try {
        const fecha = new Date(processed[fieldName]);
        if (!isNaN(fecha.getTime())) {
          processed[fieldName] = fecha.toISOString().split('T')[0];
        } else {
          processed[fieldName] = String(processed[fieldName]);
        }
      } catch (error) {
        processed[fieldName] = String(processed[fieldName]);
      }
    }
  }
  
  // Mapear Expr2 a COD_DISTRITO si existe
  if (processed.Expr2 !== undefined && !processed.COD_DISTRITO) {
    processed.COD_DISTRITO = processed.Expr2;
  }
  
  return processed;
}

export default filiacionService;
