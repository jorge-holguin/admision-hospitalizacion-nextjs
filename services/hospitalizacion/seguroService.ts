import { API_ENDPOINTS } from '@/lib/api-config';

export interface Seguro {
  seguro: string
  nombre: string
  activo?: number
  tipoSeguro?: string
  codseg?: string
  codhis?: number
  codcita?: number
  flatEmeWeb?: number
  flatLiqWeb?: number
  codsis?: string
}

/**
 * Servicio para seguros
 * MIGRADO: Ahora usa backend Spring Boot
 */
export class SeguroService {
  async findAll(): Promise<Seguro[]> {
    try {
      console.log('🔍 SeguroService: Obteniendo seguros desde Spring Boot');
      
      const response = await fetch(API_ENDPOINTS.utils.insurances, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ SeguroService: ${data.length} seguros obtenidos`);
      
      // Filtrar solo los activos con flat_liq_web=1
      const filtrados = data.filter((s: Seguro) => s.flatLiqWeb === 1);
      return filtrados;
    } catch (error) {
      console.error('❌ Error al buscar seguros:', error);
      throw new Error(`Error al buscar seguros: ${error}`);
    }
  }

  async findByCode(code: string): Promise<Seguro | null> {
    try {
      console.log(`🔍 SeguroService: Buscando seguro con código: ${code}`);
      
      const seguros = await this.findAll();
      const seguro = seguros.find(s => s.seguro.trim() === code.trim());
      
      if (!seguro) {
        console.log(`⚠️ No se encontró seguro con código: ${code}`);
        return null;
      }
      
      console.log(`✅ Seguro encontrado: ${seguro.nombre}`);
      return seguro;
    } catch (error) {
      console.error(`❌ Error al buscar seguro con código ${code}:`, error);
      throw new Error(`Error al buscar seguro con código ${code}: ${error}`);
    }
  }
}

export const seguroService = new SeguroService()
