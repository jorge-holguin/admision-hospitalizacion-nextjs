// entidadSisService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface EntidadSis {
  ENTIDADSIS: string;
  NOMBRE: string;
}

// ============================================================================
// SERVICIO DE ENTIDADES SIS - SPRING BOOT API
// ============================================================================

export const entidadSisService = {
  async getEntidadesSis(limit = 10, search?: string): Promise<EntidadSis[]> {
    try {
      console.log('🔍 Obteniendo entidades SIS activas', { limit, search });

      const params: Record<string, string> = {
        limit: limit.toString(),
        activo: '1',
      };
      if (search) params.search = search;

      const url = buildUrl(`${API_ENDPOINTS.citas.base}/entidades-sis`, params);
      const response = await fetchApi(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const data = Array.isArray(result) ? result : (result.data || []);

      const entidades = data.map((item: any) => ({
        ENTIDADSIS: (item.ENTIDADSIS || item.entidadSis || '').trim(),
        NOMBRE: (item.NOMBRE || item.nombre || '').trim(),
      }));

      console.log(`✅ Encontradas ${entidades.length} entidades SIS`);
      return entidades;
    } catch (error) {
      console.error('❌ Error al obtener entidades SIS:', error);
      throw new Error('Error al obtener entidades SIS');
    }
  },

  async getEntidadSisByCode(code: string): Promise<EntidadSis | null> {
    try {
      console.log('🔍 Obteniendo entidad SIS por código:', code);

      const url = `${API_ENDPOINTS.citas.base}/entidades-sis/${code.trim()}`;
      const response = await fetchApi(url);

      if (response.status === 404) {
        console.log('⚠️ Entidad SIS no encontrada para código:', code);
        return null;
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      const entidad = {
        ENTIDADSIS: (result.ENTIDADSIS || result.entidadSis || '').trim(),
        NOMBRE: (result.NOMBRE || result.nombre || '').trim(),
      };

      console.log('✅ Entidad SIS encontrada:', entidad);
      return entidad;
    } catch (error) {
      console.error('❌ Error al obtener entidad SIS por código:', error);
      throw new Error('Error al obtener entidad SIS');
    }
  }
};
