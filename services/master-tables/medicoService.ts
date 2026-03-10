// medicoService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

// Normalizador para filas de Médico
function normalizeMedico(row: any): Medico {
  const rawActivo = (row?.ACTIVO ?? '').toString();
  const activo = rawActivo === '1' || rawActivo.toUpperCase?.() === 'S' ? '1' : '0';

  return {
    ID_MEDICO: typeof row.ID_MEDICO === 'bigint' ? Number(row.ID_MEDICO) : row.ID_MEDICO,
    MEDICO: row.MEDICO?.toString?.() ?? row.MEDICO,
    NOMBRE: row.NOMBRE?.toString?.() ?? row.NOMBRE,
    DNI: row.DNI?.toString?.() ?? row.DNI,
    EESS: row.EESS?.toString?.() ?? row.EESS,
    ABREVIATURA: row.ABREVIATURA?.toString?.() ?? row.ABREVIATURA,
    COLEGIO: row.COLEGIO?.toString?.() ?? row.COLEGIO,
    COLESP: row.COLESP?.toString?.() ?? row.COLESP,
    ESPECIALIDAD: row.ESPECIALIDAD?.toString?.() ?? row.ESPECIALIDAD,
    CONSULTORIO: row.CONSULTORIO ? String(row.CONSULTORIO).trim() : row.CONSULTORIO,
    CODHIS: row.CODHIS?.toString?.() ?? row.CODHIS,
    CONTRATO: row.CONTRATO?.toString?.() ?? row.CONTRATO,
    ACTIVO: activo,
    IMPCITA: row.IMPCITA?.toString?.() ?? row.IMPCITA,
    PROFESION_COLEGIO: row.PROFESION_COLEGIO?.toString?.() ?? row.PROFESION_COLEGIO,
    FECHNAC: row.FECHNAC?.toString?.() ?? row.FECHNAC,
    GENERO: row.GENERO?.toString?.() ?? row.GENERO,
    ESPECIALIDAD2: row.ESPECIALIDAD2?.toString?.() ?? row.ESPECIALIDAD2,
    CONSULTORIO2: row.CONSULTORIO2?.toString?.() ?? row.CONSULTORIO2,
    PROFESION_COLEGIO2: row.PROFESION_COLEGIO2?.toString?.() ?? row.PROFESION_COLEGIO2,
    CONSULTORIO_NOMBRE: row.CONSULTORIO_NOMBRE?.toString?.() ?? row.CONSULTORIO_NOMBRE,
    ESPECIALIDAD_NOMBRE: row.ESPECIALIDAD_NOMBRE?.toString?.() ?? row.ESPECIALIDAD_NOMBRE,
    PROFESION_NOMBRE: row.PROFESION_NOMBRE?.toString?.() ?? row.PROFESION_NOMBRE,
    COLEGIO_NOMBRE: row.COLEGIO_NOMBRE?.toString?.() ?? row.COLEGIO_NOMBRE,
    CONSULTORIO2_NOMBRE: row.CONSULTORIO2_NOMBRE?.toString?.() ?? row.CONSULTORIO2_NOMBRE,
    ESPECIALIDAD2_NOMBRE: row.ESPECIALIDAD2_NOMBRE?.toString?.() ?? row.ESPECIALIDAD2_NOMBRE,
    PROFESION_COLEGIO2_NOMBRE: row.PROFESION_COLEGIO2_NOMBRE?.toString?.() ?? row.PROFESION_COLEGIO2_NOMBRE,
    NOMBRES: row.NOMBRES?.toString?.() ?? row.NOMBRES,
    APATERNO: row.APATERNO?.toString?.() ?? row.APATERNO,
    AMATERNO: row.AMATERNO?.toString?.() ?? row.AMATERNO,
    TIPO_DOCUMENTO: row.TIPO_DOCUMENTO?.toString?.() ?? row.TIPO_DOCUMENTO,
    PAIS: row.PAIS?.toString?.() ?? row.PAIS,
    USUARIO: row.USUARIO?.toString?.() ?? row.USUARIO,
    CORREO: row.CORREO?.toString?.() ?? row.CORREO,
    TELEFONO: row.TELEFONO?.toString?.() ?? row.TELEFONO,
    COLESP2: row.COLESP2?.toString?.() ?? row.COLESP2,
    COLESP3: row.COLESP3?.toString?.() ?? row.COLESP3,
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
