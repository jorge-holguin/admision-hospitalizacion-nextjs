// medicoService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

// Helper: obtiene el primer valor no nulo de una lista de claves (UPPERCASE y camelCase)
function getVal(row: any, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null) return String(v);
  }
  return undefined;
}

// Normalizador para filas de Médico (soporta UPPERCASE y camelCase del API Spring Boot)
function normalizeMedico(row: any): Medico {
  const rawActivo = getVal(row, 'ACTIVO', 'activo') ?? '';
  const activo = rawActivo === '1' || rawActivo.toUpperCase?.() === 'S' ? '1' : '0';
  const consultorio = getVal(row, 'CONSULTORIO', 'consultorio');

  return {
    ID_MEDICO: typeof row.ID_MEDICO === 'bigint' ? Number(row.ID_MEDICO) : row.ID_MEDICO,
    MEDICO: getVal(row, 'MEDICO', 'medico'),
    NOMBRE: getVal(row, 'NOMBRE', 'nombre'),
    DNI: getVal(row, 'DNI', 'dni'),
    EESS: getVal(row, 'EESS', 'eess'),
    ABREVIATURA: getVal(row, 'ABREVIATURA', 'abreviatura'),
    COLEGIO: getVal(row, 'COLEGIO', 'colegio'),
    COLESP: getVal(row, 'COLESP', 'colesp'),
    ESPECIALIDAD: getVal(row, 'ESPECIALIDAD', 'especialidad'),
    CONSULTORIO: consultorio ? consultorio.trim() : consultorio,
    CODHIS: getVal(row, 'CODHIS', 'codhis'),
    CONTRATO: getVal(row, 'CONTRATO', 'contrato'),
    ACTIVO: activo,
    IMPCITA: getVal(row, 'IMPCITA', 'impcita'),
    PROFESION_COLEGIO: getVal(row, 'PROFESION_COLEGIO', 'profesionColegio'),
    FECHNAC: getVal(row, 'FECHNAC', 'fechnac'),
    GENERO: getVal(row, 'GENERO', 'genero'),
    ESPECIALIDAD2: getVal(row, 'ESPECIALIDAD2', 'especialidad2'),
    CONSULTORIO2: getVal(row, 'CONSULTORIO2', 'consultorio2'),
    PROFESION_COLEGIO2: getVal(row, 'PROFESION_COLEGIO2', 'profesionColegio2'),
    CONSULTORIO_NOMBRE: getVal(row, 'CONSULTORIO_NOMBRE', 'consultorioNombre'),
    ESPECIALIDAD_NOMBRE: getVal(row, 'ESPECIALIDAD_NOMBRE', 'especialidadNombre'),
    PROFESION_NOMBRE: getVal(row, 'PROFESION_NOMBRE', 'profesionNombre'),
    COLEGIO_NOMBRE: getVal(row, 'COLEGIO_NOMBRE', 'colegioNombre'),
    CONSULTORIO2_NOMBRE: getVal(row, 'CONSULTORIO2_NOMBRE', 'consultorio2Nombre'),
    ESPECIALIDAD2_NOMBRE: getVal(row, 'ESPECIALIDAD2_NOMBRE', 'especialidad2Nombre'),
    PROFESION_COLEGIO2_NOMBRE: getVal(row, 'PROFESION_COLEGIO2_NOMBRE', 'profesionColegio2Nombre'),
    NOMBRES: getVal(row, 'NOMBRES', 'nombres'),
    APATERNO: getVal(row, 'APATERNO', 'apaterno'),
    AMATERNO: getVal(row, 'AMATERNO', 'amaterno'),
    TIPO_DOCUMENTO: getVal(row, 'TIPO_DOCUMENTO', 'tipoDocumento'),
    PAIS: getVal(row, 'PAIS', 'pais'),
    USUARIO: getVal(row, 'USUARIO', 'usuario'),
    CORREO: getVal(row, 'CORREO', 'correo'),
    TELEFONO: getVal(row, 'TELEFONO', 'telefono'),
    COLESP2: getVal(row, 'COLESP2', 'colesp2'),
    COLESP3: getVal(row, 'COLESP3', 'colesp3'),
  } as Medico;
}

export interface Medico {
  ID_MEDICO?: number;
  MEDICO: string;
  NOMBRE: string;
  DNI?: string;
  EESS?: string;
  ABREVIATURA?: string;
  COLEGIO?: string;
  COLESP?: string;
  ESPECIALIDAD?: string;
  CONSULTORIO?: string;
  CODHIS?: string;
  CONTRATO?: string;
  ACTIVO: string;
  IMPCITA?: string;
  PROFESION_COLEGIO?: string;
  FECHNAC?: string;
  GENERO?: string;
  ESPECIALIDAD2?: string;
  CONSULTORIO2?: string;
  PROFESION_COLEGIO2?: string;
  CONSULTORIO_NOMBRE?: string;
  ESPECIALIDAD_NOMBRE?: string;
  PROFESION_NOMBRE?: string;
  COLEGIO_NOMBRE?: string;
  CONSULTORIO2_NOMBRE?: string;
  ESPECIALIDAD2_NOMBRE?: string;
  PROFESION_COLEGIO2_NOMBRE?: string;
  NOMBRES?: string;
  APATERNO?: string;
  AMATERNO?: string;
  TIPO_DOCUMENTO?: string;
  PAIS?: string;
  USUARIO?: string;
  CORREO?: string;
  TELEFONO?: string;
  COLESP2?: string;
  COLESP3?: string;
  [key: string]: any;
}

export interface MedicoFilters {
  search?: string;
  consultorio?: string;
  nombre?: string;
  dni?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// SERVICIO DE MÉDICOS - SPRING BOOT API
// ============================================================================

export const medicoServerService = {
  async getMedicos(
    page: number = 1,
    pageSize: number = 10,
    filters: MedicoFilters = {}
  ): Promise<PaginatedResponse<Medico>> {
    try {
      console.log(`🔍 Buscando médicos - página ${page}, tamaño ${pageSize}`);
      
      const params: Record<string, string> = {
        page: page.toString(),
        pageSize: pageSize.toString(),
      };
      
      if (filters.search) params.search = filters.search;
      if (filters.consultorio) params.consultorio = filters.consultorio;
      if (filters.nombre) params.nombre = filters.nombre;
      if (filters.dni) params.dni = filters.dni;
      
      const url = buildUrl(API_ENDPOINTS.masterTables.medicos.list, params);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      const data = Array.isArray(result) ? result : (result.data || []);
      const total = result.total || data.length;
      const normalized = data.map(normalizeMedico);
      
      console.log(`✅ Encontrados ${normalized.length} médicos (total: ${total})`);
      
      return {
        data: normalized,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('❌ Error in medicoServerService.getMedicos:', error);
      throw error;
    }
  },

  async getMedicoById(id: string): Promise<Medico | null> {
    try {
      console.log(`🔍 Buscando médico: ${id}`);
      
      const url = API_ENDPOINTS.masterTables.medicos.byId(id);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró médico ${id}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Médico encontrado: ${id}`);
      
      return normalizeMedico(data);
    } catch (error) {
      console.error(`❌ Error in medicoServerService.getMedicoById(${id}):`, error);
      throw error;
    }
  },

  async createMedico(data: Partial<Medico>): Promise<Medico> {
    try {
      console.log(`➕ Creando médico: ${data.MEDICO}`);
      
      const url = API_ENDPOINTS.masterTables.medicos.list;
      const response = await fetchApi(url, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Médico creado: ${data.MEDICO}`);
      
      return normalizeMedico(result);
    } catch (error) {
      console.error('❌ Error in medicoServerService.createMedico:', error);
      throw error;
    }
  },

  async updateMedico(id: string, data: Partial<Medico>): Promise<Medico | null> {
    try {
      console.log(`🔄 Actualizando médico: ${id}`);
      
      const url = API_ENDPOINTS.masterTables.medicos.byId(id);
      const response = await fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró médico ${id}`);
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Médico actualizado: ${id}`);
      
      return normalizeMedico(result);
    } catch (error) {
      console.error(`❌ Error in medicoServerService.updateMedico(${id}):`, error);
      throw error;
    }
  },

  async deleteMedico(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Eliminando médico: ${id}`);
      
      const url = API_ENDPOINTS.masterTables.medicos.byId(id);
      const response = await fetchApi(url, {
        method: 'DELETE',
      });
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró médico ${id}`);
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ Médico eliminado: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error in medicoServerService.deleteMedico(${id}):`, error);
      throw error;
    }
  },

  async searchMedicos(params?: {
    search?: string;
    especialidad?: string;
    consultorio?: string;
    codigos?: string;
  }): Promise<Medico[]> {
    try {
      console.log('🔍 Buscando médicos con filtros:', params);
      
      const queryParams: Record<string, string> = {};
      if (params?.search) queryParams.search = params.search;
      if (params?.especialidad) queryParams.especialidad = params.especialidad;
      if (params?.consultorio) queryParams.consultorio = params.consultorio;
      if (params?.codigos) queryParams.codigos = params.codigos;
      
      const url = buildUrl(API_ENDPOINTS.masterTables.medicos.search, queryParams);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const data = Array.isArray(result) ? result : (result.data || []);
      const normalized = data.map(normalizeMedico);
      
      console.log(`✅ Encontrados ${normalized.length} médicos`);
      return normalized;
    } catch (error) {
      console.error('❌ Error in medicoServerService.searchMedicos:', error);
      throw error;
    }
  },

  async suggestCode(): Promise<string> {
    try {
      console.log('🔢 Obteniendo siguiente código de médico');
      
      const url = API_ENDPOINTS.masterTables.medicos.suggestCode;
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const code = result.code || result.suggestedCode || result;
      
      console.log(`✅ Código sugerido: ${code}`);
      return String(code);
    } catch (error) {
      console.error('❌ Error in medicoServerService.suggestCode:', error);
      throw error;
    }
  }
};
