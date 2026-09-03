import { API_ENDPOINTS } from '@/lib/api-config';

export interface MotivoEmergencia {
  motivoEmergencia: string
  nombre: string
  activo?: number
}

/**
 * Servicio para motivos de emergencia
 * MIGRADO: Ahora usa backend Spring Boot
 */
export class MotivoEmergenciaService {
  async findAll(): Promise<MotivoEmergencia[]> {
    try {      const response = await fetch(API_ENDPOINTS.emergencia.reasons, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const items = data.items || data.data || data;      return items;
    } catch (error) {
      console.error('❌ Error al obtener motivos de emergencia:', error);
      return [];
    }
  }
}

export const motivoEmergenciaService = new MotivoEmergenciaService();
