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
  creaCuenta?: string
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

      const raw = await response.json();
      const data = Array.isArray(raw) ? raw : (raw.data || []);
      
      console.log(`✅ SeguroService: ${data.length} seguros obtenidos`);
      
      // Normalizar campos (soporta uppercase y lowercase)
      const seguros = data.map((item: any) => ({
        seguro: String(item.seguro || item.Seguro || item.SEGURO || ''),
        nombre: String(item.nombre || item.Nombre || item.NOMBRE || ''),
        activo: item.activo ?? item.ACTIVO ?? 1,
        tipoSeguro: item.tipoSeguro ?? item.TIPO_SEGURO,
        codseg: item.codseg ?? item.CODSEG,
        codhis: item.codhis ?? item.CODHIS,
        codcita: item.codcita ?? item.CODCITA,
        flatEmeWeb: item.flatEmeWeb ?? item.FLAT_EME_WEB,
        flatLiqWeb: item.flatLiqWeb ?? item.FLAT_LIQ_WEB,
        codsis: item.codsis ?? item.CODSIS,
        creaCuenta: String(item.creaCuenta ?? item.CreaCuenta ?? item.CREA_CUENTA ?? ''),
      } as Seguro));
      
      // Filtrar solo los activos con flat_liq_web=1 cuando el campo exista
      const filtrados = seguros.filter((s: Seguro) => s.flatLiqWeb === undefined || s.flatLiqWeb === 1);
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
