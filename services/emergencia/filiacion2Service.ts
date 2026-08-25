// filiacion2Service.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface FiliacionFilter {
  historia?: string;
  documento?: string;
  nombres?: string;
  tipoDocumento?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface CountResponse {
  success: boolean;
  data?: {
    total: number;
  };
  message?: string;
}

export interface Filiacion {
  PACIENTE: string;
  HISTORIA: string;
  NOMBRES: string;
  SEXO: string;
  NOMBRE_ESTADO_CIVIL: string;
  FECHA_APERTURA: Date;
  HORA_APERTURA: string;
  PADRE: string;
  MADRE: string;
  DIRECCION: string;
  TELEFONO1: string;
  FECHA_NACIMIENTO: Date;
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
  SYSINSERT: Date;
  SYSUPDATE: Date;
  FECHA_CONSULTA: Date;
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
      console.log('🔍 Buscando registros de filiación:', { page, pageSize, filter });
      
      // Construir query params
      const params: Record<string, string> = {
        page: page.toString(),
        pageSize: pageSize.toString(),
      };
      
      if (filter.historia) params.historia = filter.historia;

      // Documento → nueva API optimizada
      if (filter.documento && !filter.historia) {
        const tipoDoc = (filter.tipoDocumento || 'D').trim();
        const p = new URLSearchParams({ tipoDocumento: tipoDoc, documento: filter.documento.trim() });
        const url = `${API_ENDPOINTS.filiation.searchByDocument}?${p}`;
        const response = await fetchApi(url);
        if (response.status === 204 || response.headers.get('content-length') === '0' || !response.body) {
          return { data: [], pagination: { total: 0, page, pageSize, totalPages: 0 } };
        }
        const raw = response.ok ? await response.json().catch(() => null) : null;
        const list: any[] = Array.isArray(raw) ? raw
          : Array.isArray(raw?.data) ? raw.data
          : (raw && !raw.error && (raw.PACIENTE || raw.paciente)) ? [raw]
          : [];
        const mapped = list.map((r: any) => processDateFields(r));
        return { data: mapped, pagination: { total: mapped.length, page, pageSize, totalPages: Math.ceil(mapped.length / pageSize) } };
      }

      // Nombres → nueva API optimizada
      if (filter.nombres && !filter.historia) {
        const url = `${API_ENDPOINTS.filiation.searchByName}?nombres=${encodeURIComponent(filter.nombres)}`;
        const response = await fetchApi(url);
        const raw = response.ok ? await response.json() : null;
        const list: any[] = Array.isArray(raw) ? raw
          : Array.isArray(raw?.data) ? raw.data
          : Array.isArray(raw?.pacientes) ? raw.pacientes
          : Array.isArray(raw?.content) ? raw.content
          : [];
        const mapped = list.map((r: any) => processDateFields(r));
        return { data: mapped, pagination: { total: mapped.length, page, pageSize, totalPages: Math.ceil(mapped.length / pageSize) } };
      }

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
      
      // Procesar fechas si es necesario
      if (data.data && Array.isArray(data.data)) {
        data.data = data.data.map((record: any) => processDateFields(record));
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error en getPaginatedFiliacion:', error);
      // Devolver resultado vacío en caso de error
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
   * Get a single filiacion record by ID
   */
  async getFiliacionById(id: string): Promise<Filiacion | null> {
    try {
      console.log(`🔍 Buscando registro de filiación con ID: ${id}`);
      
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
      
      // Procesar fechas
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
      console.log(`🔍 Buscando registros de filiación por historia: ${historia}`);
      
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
  async searchByDocumento(documento: string, tipoDocumento: string = 'D'): Promise<Filiacion[]> {
    try {
      console.log(`🔍 Buscando registros de filiación por documento: ${documento}`);
      
      const params = new URLSearchParams({ tipoDocumento, documento });
      const url = `${API_ENDPOINTS.filiation.searchByDocument}?${params}`;
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const list: any[] = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : (data && !data.error && (data.PACIENTE || data.paciente)) ? [data]
        : [];
      console.log(`✅ Encontrados ${list.length} registros por documento`);
      
      return list.map((record: any) => processDateFields(record));
    } catch (error) {
      console.error(`❌ Error en searchByDocumento(${documento}):`, error);
      return [];
    }
  },
  
  /**
   * Search filiacion records by name or apellidos
   */
  async searchByName(name: string): Promise<Filiacion[]> {
    try {
      console.log(`🔍 Buscando registros de filiación por nombre: ${name}`);
      
      const url = `${API_ENDPOINTS.filiation.searchByName}?nombres=${encodeURIComponent(name)}`;
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const list: any[] = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.pacientes) ? data.pacientes
        : Array.isArray(data?.content) ? data.content
        : [];
      console.log(`✅ Encontrados ${list.length} registros por nombre`);
      
      return list.map((record: any) => processDateFields(record));
    } catch (error) {
      console.error(`❌ Error en searchByName(${name}):`, error);
      return [];
    }
  },
  
  /**
   * Count filiacion records with optional filtering
   */
  async countFiliacion(filter: FiliacionFilter = {}): Promise<CountResponse> {
    try {
      console.log('📊 Contando registros de filiación con filtros:', filter);
      
      // Usar la búsqueda paginada con pageSize=1 para obtener el total
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
      
      console.log(`✅ Total de registros de filiación: ${total}`);
      
      return {
        success: true,
        data: { total }
      };
    } catch (error) {
      console.error('❌ Error en countFiliacion:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al contar registros'
      };
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
