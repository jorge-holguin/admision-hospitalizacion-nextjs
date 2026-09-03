// medicoService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface Medico {
  MEDICO: string;
  NOMBRE: string;
  ACTIVO?: string;
  ESPECIALIDAD?: string;
}

// ============================================================================
// SERVICIO DE MÉDICOS - SPRING BOOT API
// ============================================================================

export const medicoService = {
  /**
   * Busca médicos por una lista de códigos
   */
  async findByCodigos(codigos: string[]): Promise<Medico[]> {
    try {
      if (!codigos.length) return [];
      
      const codigosLimpios = codigos.map(c => c.trim()).filter(Boolean);
      if (!codigosLimpios.length) return [];      const url = buildUrl(API_ENDPOINTS.masterTables.medicos.search, {
        codigos: codigosLimpios.join(','),
        activo: '1',
      });
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const medicos = Array.isArray(data) ? data : data.data || [];      return medicos;
    } catch (error) {
      console.error('❌ Error al buscar médicos por códigos:', error);
      throw new Error('Error al buscar médicos por códigos');
    }
  },

  /**
   * Obtiene todos los médicos activos, ordenados por nombre
   */
  async findAll(): Promise<Medico[]> {
    try {      const url = buildUrl(API_ENDPOINTS.masterTables.medicos.list, {
        activo: '1',
      });
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const medicos = Array.isArray(data) ? data : data.data || [];      return medicos;
    } catch (error) {
      console.error('❌ Error al buscar médicos:', error);
      throw new Error('Error al buscar médicos');
    }
  },

  /**
   * Obtiene médicos filtrados por consultorio
   */
  async findByConsultorio(consultorioId: string): Promise<Medico[]> {
    try {      const url = buildUrl(API_ENDPOINTS.masterTables.medicos.search, {
        consultorio: consultorioId,
        activo: '1',
      });
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const medicos = Array.isArray(data) ? data : data.data || [];      return medicos;
    } catch (error) {
      console.error('❌ Error al buscar médicos por consultorio:', error);
      throw new Error('Error al buscar médicos por consultorio');
    }
  },

  /**
   * Busca médicos por especialidad
   */
  async findByEspecialidad(especialidad: string, searchTerm: string = '', limit: number = 50): Promise<Medico[]> {
    try {      const params: Record<string, string> = {
        especialidad: especialidad.trim(),
        activo: '1',
        limit: limit.toString(),
      };
      
      if (searchTerm) params.search = searchTerm;
      
      const url = buildUrl(API_ENDPOINTS.masterTables.medicos.search, params);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const medicos = Array.isArray(data) ? data : data.data || [];      return medicos;
    } catch (error) {
      console.error('❌ Error al buscar médicos por especialidad:', error);
      throw new Error('Error al buscar médicos por especialidad');
    }
  },

  /**
   * Busca médicos por nombre o código
   */
  async search(searchTerm: string, limit: number = 50): Promise<Medico[]> {
    try {      const url = buildUrl(API_ENDPOINTS.masterTables.medicos.search, {
        search: searchTerm,
        activo: '1',
        limit: limit.toString(),
      });
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const medicos = Array.isArray(data) ? data : data.data || [];      return medicos;
    } catch (error) {
      console.error('❌ Error al buscar médicos:', error);
      throw new Error('Error al buscar médicos');
    }
  }
};

export default medicoService;
