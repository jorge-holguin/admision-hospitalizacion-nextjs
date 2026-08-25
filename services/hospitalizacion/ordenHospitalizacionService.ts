// ordenHospitalizacionService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface OrdenHospitalizacionFilter {
  pacienteId?: string;
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

export interface OrdenHospitalizacion {
  ESTADO: string;
  idHOSPITALIZACION: string;
  PACIENTE: string;
  Historia: string;
  CONSULNOMBRE: string;
  FECHA1: Date | string;
  HORA1: string;
  ORIGENOMBRE: string;
  SEGURONOMBRE: string;
  MEDICONOMBRE: string;
  [key: string]: any;
}

// ============================================================================
// SERVICIO DE ORDEN HOSPITALIZACIÓN - SPRING BOOT API
// ============================================================================

export const ordenHospitalizacionService = {
  /**
   * Check if a patient has editable hospitalization orders (ESTADO = '1' or ESTADO = '2')
   */
  async checkEditableStatus(pacienteId: string): Promise<{ isEditable: boolean; source?: string; error?: string }> {
    try {
      console.log(`🔍 Verificando estado editable para paciente: ${pacienteId}`);
      
      const url = buildUrl(`${API_ENDPOINTS.hospitalizacion.base}/check-editable`, { pacienteId });
      const response = await fetchApi(url);
      
      if (!response.ok) {
        // Si el endpoint no existe, intentar obtener órdenes y verificar manualmente
        const ordenes = await this.getOrdenHospitalizacionByPaciente(pacienteId);
        const isEditable = ordenes.some((o: any) => o.ESTADO === '1' || o.ESTADO === '2');
        return { isEditable, source: 'fallback' };
      }
      
      const data = await response.json();
      console.log(`✅ Estado editable para paciente ${pacienteId}:`, data.isEditable);
      
      return { isEditable: data.isEditable, source: 'api' };
    } catch (error) {
      console.error('❌ Error al verificar estado editable:', error);
      return { isEditable: false, error: String(error), source: 'error' };
    }
  },

  /**
   * Get paginated orden hospitalización records with optional filtering
   */
  async getPaginatedOrdenHospitalizacion(
    filter: OrdenHospitalizacionFilter = {},
    { page = 1, pageSize = 10 }: PaginationOptions
  ): Promise<any> {
    try {
      console.log('🔍 Buscando registros de orden hospitalización:', { page, pageSize, filter });
      
      const params: Record<string, string> = {
        page: page.toString(),
        pageSize: pageSize.toString(),
      };
      
      if (filter.pacienteId) params.pacienteId = filter.pacienteId;
      
      const url = buildUrl(API_ENDPOINTS.hospitalizacion.ordenes, params);
      console.log('🏥 Consultando órdenes:', url);
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Encontrados ${data.data?.length || 0} registros`);
      
      // Procesar fechas
      if (data.data && Array.isArray(data.data)) {
        data.data = data.data.map((record: any) => processDateFields(record));
      }
      
      // Formato compatible con el frontend
      if (filter.pacienteId) {
        return {
          success: true,
          data: data.data || [],
          pagination: data.pagination || {
            total: data.data?.length || 0,
            page,
            pageSize,
            totalPages: Math.ceil((data.data?.length || 0) / pageSize),
          },
        };
      } else {
        return {
          success: true,
          data: {
            records: data.data || [],
            pagination: data.pagination || {
              total: data.data?.length || 0,
              page,
              pageSize,
              totalPages: Math.ceil((data.data?.length || 0) / pageSize),
            },
          },
        };
      }
    } catch (error) {
      console.error('❌ Error en getPaginatedOrdenHospitalizacion:', error);
      throw error;
    }
  },
  
  /**
   * Get a single orden hospitalización record by ID
   */
  async getOrdenHospitalizacionById(id: string): Promise<OrdenHospitalizacion | null> {
    try {
      if (!id || id === 'undefined' || id.trim() === '') {
        console.error(`ID de orden hospitalización inválido: "${id}"`);
        return null;
      }
      
      console.log(`🔍 Buscando registro de orden hospitalización con ID: "${id}"`);
      
      const url = API_ENDPOINTS.hospitalizacion.byId(id.trim());
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró orden con ID ${id}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Orden de hospitalización encontrada`);
      
      return processDateFields(data);
    } catch (error) {
      console.error(`❌ Error en getOrdenHospitalizacionById(${id}):`, error);
      throw error;
    }
  },
  
  /**
   * Get all orden hospitalización records for a patient
   */
  async getOrdenHospitalizacionByPaciente(pacienteId: string): Promise<OrdenHospitalizacion[]> {
    try {
      console.log(`🔍 Buscando órdenes de hospitalización para paciente: ${pacienteId}`);
      
      const url = API_ENDPOINTS.hospitalizacion.byPatient(pacienteId);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const records = Array.isArray(data) ? data : data.data || [];
      
      console.log(`✅ Encontrados ${records.length} registros para el paciente`);
      
      return records.map((record: any) => processDateFields(record));
    } catch (error) {
      console.error(`❌ Error en getOrdenHospitalizacionByPaciente(${pacienteId}):`, error);
      throw error;
    }
  },
  
  /**
   * Count orden hospitalización records with optional filtering
   */
  async countOrdenHospitalizacion(filter: OrdenHospitalizacionFilter = {}): Promise<CountResponse> {
    try {
      console.log('📊 Contando registros de orden hospitalización:', filter);
      
      // Usar búsqueda paginada con pageSize=1 para obtener el total
      const params: Record<string, string> = {
        page: '1',
        pageSize: '1',
      };
      
      if (filter.pacienteId) params.pacienteId = filter.pacienteId;
      
      const url = buildUrl(API_ENDPOINTS.hospitalizacion.list, params);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const total = data.pagination?.total || 0;
      
      console.log(`✅ Total de órdenes: ${total}`);
      
      return {
        success: true,
        data: { total }
      };
    } catch (error) {
      console.error('❌ Error en countOrdenHospitalizacion:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  /**
   * Create a new orden hospitalización record
   */
  async createOrdenHospitalizacion(data: any): Promise<any> {
    try {
      console.log('🏥 Creando nuevo registro de orden hospitalización:', data);
      
      const response = await fetchApi(API_ENDPOINTS.hospitalizacion.create, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Orden de hospitalización creada:`, result);
      
      return {
        success: true,
        data: result,
        message: 'Orden de hospitalización creada exitosamente'
      };
    } catch (error) {
      console.error('❌ Error en createOrdenHospitalizacion:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing orden hospitalización record
   */
  async updateOrdenHospitalizacion(id: string, data: any): Promise<any> {
    try {
      console.log(`🔄 Actualizando orden de hospitalización con ID ${id}:`, data);
      
      const response = await fetchApi(API_ENDPOINTS.hospitalizacion.update(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Orden de hospitalización actualizada`);
      
      return {
        success: true,
        data: result,
        message: 'Orden de hospitalización actualizada exitosamente'
      };
    } catch (error) {
      console.error(`❌ Error en updateOrdenHospitalizacion(${id}):`, error);
      throw error;
    }
  },

  /**
   * Get the next available hospitalization ID
   */
  async getNextId(): Promise<string> {
    try {
      console.log('🔢 Obteniendo siguiente ID de hospitalización');
      
      const response = await fetchApi(API_ENDPOINTS.hospitalizacion.nextId);
      
      if (!response.ok) {
        console.error('❌ Error al obtener siguiente ID:', response.status);
        return '25000001';
      }
      
      const data = await response.json();
      const nextId = data.nextId || data.toString();
      
      console.log('✅ Siguiente ID:', nextId);
      return nextId;
    } catch (error) {
      console.error('❌ Error al obtener el siguiente ID:', error);
      return '25000001';
    }
  },

  /**
   * Delete a hospitalization order by ID (logical deletion)
   */
  async deleteById(id: string): Promise<any> {
    try {
      console.log(`🗑️ Eliminando orden de hospitalización con ID: ${id}`);
      
      const response = await fetchApi(API_ENDPOINTS.hospitalizacion.logicalDelete(id), {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ Orden de hospitalización ${id} eliminada`);
      
      return {
        success: true,
        message: 'Orden de hospitalización eliminada exitosamente',
        data: { id }
      };
    } catch (error) {
      console.error(`❌ Error al eliminar orden ${id}:`, error);
      throw error;
    }
  },
};

// ============================================================================
// UTILIDADES
// ============================================================================

// Mapeo de nombres de campos que el Spring Boot API devuelve en camelCase/minúsculas
// a los nombres UPPERCASE que usa el frontend
const API_FIELD_MAP: Record<string, string> = {
  idHospitalizacion: 'idHOSPITALIZACION',
  estado: 'ESTADO',
  paciente: 'PACIENTE',
  historia: 'HISTORIA',
  nombres: 'NOMBRES',
  sexo: 'SEXO',
  estadoCivil: 'ESTADOCIVIL',
  direccion: 'DIRECCION',
  distrito: 'DISTRITO',
  telefono1: 'TELEFONO1',
  fechaNacimiento: 'FECHA_NACIMIENTO',
  edad: 'EDAD',
  tipoDocumento: 'TIPO_DOCUMENTO',
  documento: 'DOCUMENTO',
  consultorio1: 'CONSULTORIO1',
  consulNombre: 'CONSULNOMBRE',
  hora1: 'HORA1',
  fecha1: 'FECHA1',
  origen: 'ORIGEN',
  origenNombre: 'ORIGENOMBRE',
  seguro: 'SEGURO',
  seguroNombre: 'SEGURONOMBRE',
  medico1: 'MEDICO1',
  medicoNombre: 'MEDICONOMBRE',
  diagnostico: 'DIAGNOSTICO',
  diagnosticoNombre: 'DIAGNOSTICONOMBRE',
  usuario: 'USUARIO',
  usuarioImp: 'USUARIOIMP',
  cuentaId: 'CUENTAID',
  acompananteNombre: 'ACOMPANANTENOMBRE',
  acompananteDireccion: 'ACOMPANANTEDIRECCION',
  acompananteTelefono: 'ACOMPANANTETELEFONO',
  origenId: 'ORIGENID',
};

function processDateFields(record: any): any {
  if (!record) return record;

  // Mapear claves del API a los nombres UPPERCASE del frontend
  const processed: any = {};
  for (const [key, value] of Object.entries(record)) {
    const targetKey = API_FIELD_MAP[key] || key;
    processed[targetKey] = value;
  }

  // Si ya viene en UPPERCASE, conservar también la clave original para compatibilidad
  for (const [key, value] of Object.entries(record)) {
    if (processed[key] === undefined) {
      processed[key] = value;
    }
  }

  const dateFields = ['FECHA1', 'FECHA_NACIMIENTO', 'FECHA_BAJA'];

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

  // Normalizar idHOSPITALIZACION
  if (processed.idHOSPITALIZACION === undefined) {
    if (processed.IDHOSPITALIZACION !== undefined) {
      processed.idHOSPITALIZACION = String(processed.IDHOSPITALIZACION);
    } else if (processed.ID_HOSPITALIZACION !== undefined) {
      processed.idHOSPITALIZACION = String(processed.ID_HOSPITALIZACION);
    }
  }

  return processed;
}

export default ordenHospitalizacionService;
