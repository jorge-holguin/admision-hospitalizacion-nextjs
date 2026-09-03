import { API_ENDPOINTS } from '@/lib/api-config';

export interface FormaIngreso {
  formaIngreso: string
  nombre: string
  activo?: number
}

/**
 * Servicio para formas de ingreso de emergencia
 * MIGRADO: Ahora usa backend Spring Boot
 */
export class FormaIngresoService {
  async findAll(): Promise<FormaIngreso[]> {
    try {      const response = await fetch(API_ENDPOINTS.emergencia.admissionTypes, {
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
      console.error('❌ Error al obtener formas de ingreso:', error);
      return [];
    }
  }
}

export const formaIngresoService = new FormaIngresoService();
