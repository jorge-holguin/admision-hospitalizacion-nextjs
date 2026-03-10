// origenHospitalizacionService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface OrigenHospitalizacion {
  ORIGEN: string;
  CODIGO: string;
  CONSULTORIO: string;
  NOM_CONSULTORIO: string;
  PACIENTE: string;
  FECHA: Date | string;
  MEDICO: string;
  NOM_MEDICO: string;
  NOMBRES?: string;
  DNI?: string;
  ESTADO?: string;
  DX?: string;
  DX_DES?: string;
  SEGURO?: string;
  [key: string]: any;
}

interface FindAllParams {
  skip?: number;
  take?: number;
  search?: string;
  pacienteId?: string;
  origen?: string;
}

interface CountParams {
  search?: string;
  pacienteId?: string;
  origen?: string;
}

// ============================================================================
// SERVICIO DE ORIGEN HOSPITALIZACIÓN - SPRING BOOT API
// ============================================================================

export class OrigenHospitalizacionService {
  async findAll(params: FindAllParams): Promise<OrigenHospitalizacion[]> {
    try {
      const { skip = 0, take = 10, search = '', pacienteId = '', origen = '' } = params;
      console.log('🔍 Buscando orígenes de hospitalización:', { skip, take, search, pacienteId, origen });
      
      const page = Math.floor(skip / take) + 1;
      
      const queryParams: Record<string, string> = {
        page: page.toString(),
        pageSize: take.toString(),
      };
      
      if (search) queryParams.search = search;
      if (pacienteId) queryParams.pacienteId = pacienteId;
      if (origen) queryParams.origen = origen;
      
      const url = buildUrl(API_ENDPOINTS.hospitalizacion.origins, queryParams);
      console.log('🏥 Consultando orígenes:', url);
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const records = Array.isArray(data) ? data : data.data || [];
      
      console.log(`✅ Encontrados ${records.length} orígenes de hospitalización`);
      
      // Procesar fechas
      return records.map((record: any) => processDateFields(record));
    } catch (error) {
      console.error('❌ Error en findAll:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<OrigenHospitalizacion | null> {
    try {
      console.log(`🔍 Buscando origen de hospitalización con ID: ${id}`);
      
      const url = `${API_ENDPOINTS.hospitalizacion.origins}/${id}`;
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        console.log(`⚠️ No se encontró origen con ID ${id}`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Origen de hospitalización encontrado:', data);
      
      return processDateFields(data);
    } catch (error) {
      console.error(`❌ Error en findOne(${id}):`, error);
      throw error;
    }
  }

  async count(params: CountParams): Promise<number> {
    try {
      console.log('📊 Contando orígenes de hospitalización:', params);
      const { search = '', pacienteId = '', origen = '' } = params;
      
      const queryParams: Record<string, string> = {
        page: '1',
        pageSize: '1',
      };
      
      if (search) queryParams.search = search;
      if (pacienteId) queryParams.pacienteId = pacienteId;
      if (origen) queryParams.origen = origen;
      
      const url = buildUrl(API_ENDPOINTS.hospitalizacion.origins, queryParams);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const count = data.pagination?.total || data.total || 0;
      
      console.log(`✅ Total de orígenes: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ Error en count:', error);
      return 0;
    }
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

function processDateFields(record: any): any {
  if (!record) return record;
  
  const processed = { ...record };
  
  if (processed.FECHA) {
    try {
      const fecha = new Date(processed.FECHA);
      if (!isNaN(fecha.getTime())) {
        processed.FECHA = fecha.toISOString();
      }
    } catch (error) {
      // Mantener el valor original
    }
  }
  
  return processed;
}

export const origenHospitalizacionService = new OrigenHospitalizacionService();
