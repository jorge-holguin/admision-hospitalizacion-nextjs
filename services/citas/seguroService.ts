// seguroService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface Seguro {
  Seguro: string;
  Nombre: string;
}

// ============================================================================
// SERVICIO DE SEGUROS - SPRING BOOT API
// ============================================================================

export const seguroService = {
  /**
   * Get seguros for citas
   * @param codCita - Código de cita (default: '1')
   */
  async getSegurosByCodCita(codCita: string = '1'): Promise<Seguro[]> {
    try {      const url = buildUrl(`${API_ENDPOINTS.citas.base}/seguros`, { codCita });
      const response = await fetchApi(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const data = Array.isArray(result) ? result : (result.data || []);

      const seguros = data.map((item: any) => ({
        Seguro: item.Seguro || item.SEGURO || item.seguro || '',
        Nombre: item.Nombre || item.NOMBRE || item.nombre || '',
      }));      return seguros;
    } catch (error) {
      console.error('❌ Error al obtener seguros para citas:', error);
      throw new Error('Error al obtener seguros para citas');
    }
  }
};
