// diagnosticoService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface Diagnostico {
  Codigo: string;
  Nombre: string;
}

export interface DiagnosticoDetallado {
  DX: string;
  DX_DES?: string;
}

// ============================================================================
// SERVICIO DE DIAGNÓSTICOS - SPRING BOOT API
// ============================================================================

export class DiagnosticoService {
  /**
   * Busca diagnósticos de emergencia con opciones de búsqueda y límite
   */
  async findAllEmergencia(search?: string, origen?: string, limit?: number): Promise<Diagnostico[]> {
    try {
      console.log(`🔍 Buscando diagnósticos de emergencia${search ? ` con búsqueda: ${search}` : ''}${origen ? ` origen: ${origen}` : ''}${limit ? ` (límite: ${limit})` : ''}`);

      const params: Record<string, string> = {
        tipo: 'CX',
      };

      if (search) params.search = search;
      if (origen) params.origen = origen;
      if (limit) params.limit = limit.toString();

      const url = buildUrl(API_ENDPOINTS.diagnosticos.search, params);
      const response = await fetchApi(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      
      const diagnosticos = await response.json();
      console.log(`✅ Se encontraron ${Array.isArray(diagnosticos) ? diagnosticos.length : 0} diagnósticos de emergencia`);
      
      return Array.isArray(diagnosticos) ? diagnosticos : diagnosticos.data || [];
    } catch (error) {
      console.error('❌ Error al buscar diagnósticos de emergencia:', error);
      throw new Error(`Error al buscar diagnósticos de emergencia: ${error}`);
    }
  }
  
  /**
   * Busca diagnóstico por ID de emergencia
   */
  async findByEmergenciaId(emergenciaId: string): Promise<Diagnostico | null> {
    try {
      console.log(`🔍 Buscando diagnóstico para emergencia con ID: ${emergenciaId}`);
      
      const url = API_ENDPOINTS.diagnosticos.byEmergencia(emergenciaId);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró diagnóstico para la emergencia: ${emergenciaId}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const diagnostico = await response.json();
      console.log(`✅ Diagnóstico encontrado: ${diagnostico.Codigo} - ${diagnostico.Nombre}`);
      
      return diagnostico;
    } catch (error) {
      console.error(`❌ Error al buscar diagnóstico para emergencia ${emergenciaId}:`, error);
      throw new Error(`Error al buscar diagnóstico para emergencia ${emergenciaId}: ${error}`);
    }
  }
  
  /**
   * Busca un diagnóstico por ID de consulta externa
   */
  async findByConsultaExterna(citaId: string): Promise<Diagnostico | null> {
    try {
      console.log(`🔍 Buscando diagnóstico para consulta externa con ID: ${citaId}`);
      
      const url = API_ENDPOINTS.diagnosticos.byConsultaExterna(citaId);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró diagnóstico para la consulta externa: ${citaId}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const diagnostico = await response.json();
      console.log(`✅ Diagnóstico encontrado: ${diagnostico.Codigo} - ${diagnostico.Nombre}`);
      
      return diagnostico;
    } catch (error) {
      console.error(`❌ Error al buscar diagnóstico para consulta externa ${citaId}:`, error);
      throw new Error(`Error al buscar diagnóstico para consulta externa ${citaId}: ${error}`);
    }
  }

  /**
   * Busca un diagnóstico por ID, determinando automáticamente si es emergencia o consulta externa
   */
  async findById(id: string): Promise<Diagnostico | null> {
    try {
      console.log(`🔍 Buscando diagnóstico por ID: ${id}`);
      
      const url = API_ENDPOINTS.diagnosticos.byId(id);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró diagnóstico para el ID: ${id}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const diagnostico = await response.json();
      
      if (!diagnostico || (!diagnostico.Codigo && !diagnostico.codigo)) {
        console.log(`⚠️ No se encontró diagnóstico para el ID: ${id}`);
        return null;
      }
      
      console.log(`✅ Diagnóstico encontrado: ${diagnostico.Codigo || diagnostico.codigo} - ${diagnostico.Nombre || diagnostico.nombre}`);
      
      return {
        Codigo: diagnostico.Codigo || diagnostico.codigo,
        Nombre: diagnostico.Nombre || diagnostico.nombre,
      };
    } catch (error) {
      console.error(`❌ Error al buscar diagnóstico por ID ${id}:`, error);
      throw new Error(`Error al buscar diagnóstico por ID ${id}: ${error}`);
    }
  }
}

export const diagnosticoService = new DiagnosticoService();
