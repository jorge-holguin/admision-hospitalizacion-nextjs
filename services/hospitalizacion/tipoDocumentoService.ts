import { API_ENDPOINTS } from '@/lib/api-config';

export interface TipoDocumento {
  tipoDocumento: string
  nombre: string
  activo: number
  tipoLabo?: number
  tipoRef?: number
  tipoSis?: string
  tipoCdc?: string | null
}

/**
 * Servicio para tipos de documento
 * MIGRADO: Ahora usa backend Spring Boot
 */
export class TipoDocumentoService {
  async findTipoDocumentos(): Promise<TipoDocumento[]> {
    try {
      console.log('🔍 TipoDocumentoService: Obteniendo tipos de documento desde Spring Boot');
      
      const response = await fetch(API_ENDPOINTS.utils.documentTypes, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ TipoDocumentoService: ${data.length} tipos de documento obtenidos`);
      
      // Filtrar solo los activos
      const activos = data.filter((tipo: TipoDocumento) => tipo.activo === 1);
      return activos;
    } catch (error) {
      console.error('❌ Error al obtener tipos de documento:', error);
      return [];
    }
  }

  async findByCode(code: string): Promise<TipoDocumento | null> {
    try {
      const tipos = await this.findTipoDocumentos();
      const tipo = tipos.find(t => t.tipoDocumento.trim() === code.trim());
      return tipo || null;
    } catch (error) {
      console.error(`❌ Error al buscar tipo de documento ${code}:`, error);
      return null;
    }
  }
}

export const tipoDocumentoService = new TipoDocumentoService();
