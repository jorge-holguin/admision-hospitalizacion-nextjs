// especialidadService.ts - Servicio maestro de especialidades conectado al backend Spring Boot
import { API_ENDPOINTS, fetchApi } from '@/lib/api-config';

export interface Especialidad {
  Codigo: string;
  Nombre: string;
}

// Helper: obtiene el primer valor no nulo de una lista de claves
function getVal(row: any, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null) return String(v);
  }
  return undefined;
}

export function normalizeEspecialidad(row: any): Especialidad {
  const codigo = getVal(
    row,
    'codigo',
    'Codigo',
    'CODIGO',
    'especialidad',
    'Especialidad',
    'ESPECIALIDAD',
    'id',
    'Id',
    'ID'
  );
  const nombre = getVal(
    row,
    'nombre',
    'Nombre',
    'NOMBRE',
    'descripcion',
    'Descripcion',
    'DESCRIPCION'
  );

  return {
    Codigo: codigo ?? '',
    Nombre: nombre ?? '',
  };
}

function unwrapData(result: any): any[] {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  if (result && Array.isArray(result.content)) return result.content;
  return [];
}

/**
 * Obtiene el catálogo completo de especialidades del backend.
 * Normaliza las claves comunes (codigo/nombre, ESPECIALIDAD/NOMBRE, etc.)
 * a un objeto estandarizado { Codigo, Nombre } para los selectores.
 */
export async function getEspecialidades(): Promise<Especialidad[]> {
  const url = API_ENDPOINTS.masterTables.specialties;
  const response = await fetchApi(url);

  if (!response.ok) {
    throw new Error(`Error al cargar especialidades: ${response.status}`);
  }

  const result = await response.json();
  const data = unwrapData(result);

  return data.map(normalizeEspecialidad);
}

/**
 * Busca una especialidad por su código.
 */
export function findEspecialidadByCodigo(
  codigo: string,
  especialidades: Especialidad[]
): Especialidad | undefined {
  return especialidades.find((e) => e.Codigo === codigo);
}
