// profesionesColegioService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ProfesionColegio {
  id_profesion: string;
  Profesion: string;
  id_colegio: string;
  Colegio: string;
  ACTIVO: number;
}

// ============================================================================
// SERVICIO DE PROFESIONES Y COLEGIOS - SPRING BOOT API
// ============================================================================

/**
 * Normaliza un registro del backend al formato ProfesionColegio.
 * El endpoint devuelve snakeCase/camelCase; el frontend espera id_profesion, Profesion, etc.
 */
function normalizeProfesionColegio(record: any): ProfesionColegio {
  return {
    id_profesion: record.idProfesion ?? record.id_profesion ?? record.ID_PROFESION ?? '',
    Profesion: record.profesion ?? record.Profesion ?? record.PROFESION ?? '',
    id_colegio: record.idColegio ?? record.id_colegio ?? record.ID_COLEGIO ?? '',
    Colegio: record.colegio ?? record.Colegio ?? record.COLEGIO ?? '',
    ACTIVO: record.activo ?? record.ACTIVO ?? 0,
  };
}

/**
 * Obtiene todas las profesiones y colegios activos
 */
export async function getProfesionesColegio(): Promise<ProfesionColegio[]> {
  try {
    console.log('🔍 Obteniendo profesiones y colegios');
    
    const url = API_ENDPOINTS.masterTables.profesionesColegio;
    const response = await fetchApi(url);

    if (!response.ok) {
      throw new Error(`Error al obtener profesiones y colegios: ${response.statusText}`);
    }

    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.data || []);
    const result = list.map(normalizeProfesionColegio);
    
    console.log(`✅ Encontradas ${result.length} profesiones/colegios`);
    return result;
  } catch (error) {
    console.error('❌ Error en getProfesionesColegio:', error);
    throw error;
  }
}

/**
 * Obtiene una profesión y colegio por ID
 */
export async function getProfesionColegioById(id: string): Promise<ProfesionColegio | null> {
  try {
    console.log(`🔍 Buscando profesión/colegio: ${id}`);
    
    const url = `${API_ENDPOINTS.masterTables.profesionesColegio}/${id}`;
    const response = await fetchApi(url);

    if (response.status === 404) {
      console.log(`⚠️ No se encontró profesión/colegio ${id}`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Error al obtener profesión y colegio: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Profesión/colegio encontrado: ${id}`);
    return normalizeProfesionColegio(data.data ?? data);
  } catch (error) {
    console.error('❌ Error en getProfesionColegioById:', error);
    throw error;
  }
}

/**
 * Busca profesiones y colegios por término de búsqueda
 */
export async function searchProfesionesColegio(searchTerm: string): Promise<ProfesionColegio[]> {
  try {
    console.log(`🔍 Buscando profesiones/colegios: ${searchTerm}`);
    
    const url = buildUrl(API_ENDPOINTS.masterTables.profesionesColegio, {
      search: searchTerm,
    });
    
    const response = await fetchApi(url);

    if (!response.ok) {
      throw new Error(`Error al buscar profesiones y colegios: ${response.statusText}`);
    }

    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.data || []);
    const result = list.map(normalizeProfesionColegio);
    
    console.log(`✅ Encontradas ${result.length} profesiones/colegios`);
    return result;
  } catch (error) {
    console.error('❌ Error en searchProfesionesColegio:', error);
    throw error;
  }
}
