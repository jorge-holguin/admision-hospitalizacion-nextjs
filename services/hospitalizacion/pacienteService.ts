// pacienteService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface PacienteFilter {
  historia?: string;
  documento?: string;
  nombres?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface Paciente {
  PACIENTE: string;
  HISTORIA: string;
  NOMBRES: string;
  PATERNO: string;
  MATERNO: string;
  NOMBRE: string;
  SEXO: string;
  FECHA_NACIMIENTO: string | Date;
  EDAD: string;
  DOCUMENTO: string;
  TIPO_DOCUMENTO: string;
  DIRECCION: string;
  TELEFONO1: string;
  ESTADO_CIVIL: string;
  SEGURO: string;
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
// SERVICIO DE PACIENTES - SPRING BOOT API
// ============================================================================

export const pacienteService = {
  /**
   * Obtener pacientes paginados con filtros opcionales
   */
  async getPaginatedPacientes(
    filter: PacienteFilter = {},
    { page = 1, pageSize = 10 }: PaginationOptions
  ): Promise<PaginatedResponse<Paciente>> {
    try {      const params: Record<string, string> = {
        page: page.toString(),
        pageSize: pageSize.toString(),
      };
      
      if (filter.historia) params.historia = filter.historia;

      // Documento → nueva API optimizada
      if (filter.documento && !filter.historia) {
        const p = new URLSearchParams({ tipoDocumento: 'D', documento: filter.documento });
        const url = `${API_ENDPOINTS.filiation.searchByDocument}?${p}`;
        const response = await fetchApi(url);
        const raw = response.ok ? await response.json() : null;
        const list: any[] = Array.isArray(raw) ? raw
          : Array.isArray(raw?.data) ? raw.data
          : (raw && !raw.error && (raw.PACIENTE || raw.paciente)) ? [raw]
          : [];
        return { data: list, pagination: { total: list.length, page, pageSize, totalPages: Math.ceil(list.length / pageSize) } };
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
        return { data: list, pagination: { total: list.length, page, pageSize, totalPages: Math.ceil(list.length / pageSize) } };
      }

      const url = buildUrl(API_ENDPOINTS.filiation.search, params);      const response = await fetchApi(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();      return {
        data: data.data || [],
        pagination: data.pagination || {
          total: data.data?.length || 0,
          page,
          pageSize,
          totalPages: Math.ceil((data.data?.length || 0) / pageSize),
        },
      };
    } catch (error) {
      console.error('❌ Error en getPaginatedPacientes:', error);
      throw error;
    }
  },
  
  /**
   * Obtener un paciente por su ID
   */
  async getPacienteById(id: string): Promise<Paciente | null> {
    try {      const url = API_ENDPOINTS.filiation.byId(id);
      const response = await fetchApi(url);
      
      if (response.status === 404) {        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const paciente = await response.json();      return paciente;
    } catch (error) {
      console.error(`❌ Error en getPacienteById(${id}):`, error);
      throw error;
    }
  },
  
  /**
   * Buscar pacientes por historia clínica
   */
  async searchByHistoria(historia: string): Promise<Paciente[]> {
    try {      const params = { historia, pageSize: '10' };
      const url = buildUrl(API_ENDPOINTS.filiation.search, params);
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();      return data.data || [];
    } catch (error) {
      console.error(`❌ Error en searchByHistoria(${historia}):`, error);
      throw error;
    }
  },
  
  /**
   * Buscar pacientes por documento (DNI)
   */
  async searchByDocumento(documento: string, tipoDocumento: string = 'D'): Promise<Paciente[]> {
    try {      const params = new URLSearchParams({ tipoDocumento, documento });
      const url = `${API_ENDPOINTS.filiation.searchByDocument}?${params}`;
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const list: Paciente[] = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : (data && !data.error && (data.PACIENTE || data.paciente)) ? [data]
        : [];      return list;
    } catch (error) {
      console.error(`❌ Error en searchByDocumento(${documento}):`, error);
      throw error;
    }
  },
  
  /**
   * Buscar pacientes por nombre o apellidos
   */
  async searchByName(name: string): Promise<Paciente[]> {
    try {      const url = `${API_ENDPOINTS.filiation.searchByName}?nombres=${encodeURIComponent(name)}`;
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const list: Paciente[] = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.pacientes) ? data.pacientes
        : Array.isArray(data?.content) ? data.content
        : [];      return list;
    } catch (error) {
      console.error(`❌ Error en searchByName(${name}):`, error);
      throw error;
    }
  },
  
  /**
   * Contar pacientes con filtros opcionales
   */
  async countPacientes(filter: PacienteFilter = {}): Promise<{ success: boolean; data?: { total: number }; message?: string }> {
    try {      const params: Record<string, string> = {
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
      const total = data.pagination?.total || 0;      return {
        success: true,
        data: { total }
      };
    } catch (error) {
      console.error('❌ Error en countPacientes:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al contar pacientes'
      };
    }
  },
};

export default pacienteService;
