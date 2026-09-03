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
  estado?: string;
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
      // Construir query params
      const params: Record<string, string> = {
        page: page.toString(),
        pageSize: pageSize.toString(),
      };

      if (filter.estado) {
        params.estado = filter.estado;
      }

      // Helper para agregar estado a URLs puntuales
      const withEstado = (base: string) => {
        if (!filter.estado) return base;
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}estado=${encodeURIComponent(filter.estado)}`;
      };

      // Historia clínica
      if (filter.historia) {
        const url = withEstado(`${API_ENDPOINTS.filiation.searchByHistoria}?historia=${encodeURIComponent(filter.historia)}&page=${page}&pageSize=${pageSize}`);
        const response = await fetchApi(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Error en la respuesta:', errorData);
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          data.data = data.data.map((record: any) => processDateFields(record));
        }
        return data;
      }

      // Documento → nueva API optimizada
      if (filter.documento && !filter.historia) {
        const tipoDoc = (filter.tipoDocumento || 'D').trim();
        const p = new URLSearchParams({ tipoDocumento: tipoDoc, documento: filter.documento.trim() });
        const url = withEstado(`${API_ENDPOINTS.filiation.searchByDocument}?${p}`);
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
        const url = withEstado(`${API_ENDPOINTS.filiation.searchByName}?nombres=${encodeURIComponent(filter.nombres)}`);
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

      const url = buildUrl(API_ENDPOINTS.filiation.searchByDocument, params);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error en la respuesta:', errorData);
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
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
      if (!id || typeof id !== 'string') {
        console.error(`ID inválido: ${id}`);
        return null;
      }
      
      const url = API_ENDPOINTS.filiation.byId(id);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
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
      const url = `${API_ENDPOINTS.filiation.searchByHistoria}?historia=${encodeURIComponent(historia)}&pageSize=10`;
      const response = await fetchApi(url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
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
      // Helper para agregar estado a la URL de conteo
      const withEstado = (base: string) => {
        if (!filter.estado) return base;
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}estado=${encodeURIComponent(filter.estado)}`;
      };

      // Usar la búsqueda paginada con pageSize=1 para obtener el total
      let url
      if (filter.historia) {
        url = withEstado(`${API_ENDPOINTS.filiation.searchByHistoria}?historia=${encodeURIComponent(filter.historia)}&page=1&pageSize=1`)
      } else if (filter.documento) {
        const tipoDoc = (filter.tipoDocumento || 'D').trim()
        url = withEstado(`${API_ENDPOINTS.filiation.searchByDocument}?tipoDocumento=${tipoDoc}&documento=${encodeURIComponent(filter.documento)}&page=1&pageSize=1`)
      } else if (filter.nombres) {
        url = withEstado(`${API_ENDPOINTS.filiation.searchByName}?nombres=${encodeURIComponent(filter.nombres)}&page=1&pageSize=1`)
      } else {
        url = withEstado(`${API_ENDPOINTS.filiation.searchByDocument}?page=1&pageSize=1`)
      }
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const total = data.pagination?.total || 0;
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
