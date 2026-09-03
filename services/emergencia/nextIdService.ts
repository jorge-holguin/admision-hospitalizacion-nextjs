import { API_ENDPOINTS } from '@/lib/api-config';

interface NextIds {
  emergenciaId: string;
  orden: string;
}

interface NextIdResponse {
  nextId: string;
  orden?: string;
}

/**
 * Servicio para obtener siguientes IDs de emergencia
 * MIGRADO: Ahora usa backend Spring Boot
 */
class NextIdService {
  /**
   * Obtiene el siguiente ID de emergencia y número de orden
   */
  async getNextIds(): Promise<NextIds> {
    try {      const response = await fetch(API_ENDPOINTS.emergencia.nextId, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: NextIdResponse = await response.json();      return {
        emergenciaId: data.nextId,
        orden: data.orden || '001'
      };
    } catch (error) {
      console.error('❌ Error al obtener los siguientes IDs:', error);
      throw new Error('Error al obtener los siguientes IDs de emergencia');
    }
  }
}

export const nextIdService = new NextIdService();
