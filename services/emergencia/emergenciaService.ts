// emergenciaService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';
import { getCivilStatusCode } from '@/utils/civilStatusUtils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface EmergenciaFilters {
  pacienteId?: string;
  fecha?: string;
  estado?: string;
  consultorio?: string;
  medico?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface EmergenciaData {
  IDEMERGENCIA: string;
  ORDEN?: string;
  PACIENTE: string;
  FECHA?: string;
  HORA?: string;
  SEGURO: string;
  FORMA_INGRESO?: string;
  MOTIVO?: string;
  DIAGNOSTICO?: string;
  USUARIO?: string;
  CONSULTORIO?: string;
  MEDICO?: string;
  ESTADO?: string;
  CUENTA_ID?: string;
  SEGURO_LIQ?: string;
  FUA?: string;
  ACOMPANANTE?: string;
  PARENTESCO?: string;
  TELEFONO?: string;
  OBSERVACIONES?: string;
  FECHA_NAC?: string;
  EDAD?: string;
  [key: string]: any;
}

export interface EmergenciaCreateData {
  IDEMERGENCIA: string;
  ORDEN: string;
  PACIENTE: string;
  FECHA: string;
  HORA: string;
  SEGURO: string;
  FORMA_INGRESO?: string;
  MOTIVO?: string;
  DIAGNOSTICO?: string;
  USUARIO: string;
  CONSULTORIO?: string;
  MEDICO?: string;
  ESTADO?: string;
  SEGURO_LIQ?: string;
  ACOMPANANTE?: string;
  PARENTESCO?: string;
  TELEFONO?: string;
  OBSERVACIONES?: string;
  EDAD?: string;
  [key: string]: any;
}

export interface EmergenciaUpdateData {
  SEGURO?: string;
  FORMA_INGRESO?: string;
  MOTIVO?: string;
  DIAGNOSTICO?: string;
  CONSULTORIO?: string;
  MEDICO?: string;
  ESTADO?: string;
  SEGURO_LIQ?: string;
  CUENTA_ID?: string;
  FUA?: string;
  ACOMPANANTE?: string;
  PARENTESCO?: string;
  TELEFONO?: string;
  OBSERVACIONES?: string;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Calcula la edad formateada a partir de la fecha de nacimiento
 */
export function calculateAgeFormatted(fechaNacimiento: string | Date | null | undefined): string {
  if (!fechaNacimiento) return '';
  
  try {
    const birthDate = typeof fechaNacimiento === 'string' 
      ? new Date(fechaNacimiento) 
      : fechaNacimiento;
    
    if (isNaN(birthDate.getTime())) return '';
    
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Formato: "XX A YY M ZZ D"
    return `${years.toString().padStart(2, '0')} A ${months.toString().padStart(2, '0')} M ${days.toString().padStart(2, '0')} D`;
  } catch (error) {
    console.error('Error calculando edad:', error);
    return '';
  }
}

// ============================================================================
// SERVICIOS DE EMERGENCIA - SPRING BOOT API
// ============================================================================

/**
 * Obtiene lista paginada de emergencias con filtros opcionales
 */
export async function getEmergencias(
  filters: EmergenciaFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResponse<EmergenciaData>> {
  try {
    const { page = 1, pageSize = 10 } = pagination;
    
    // Construir query params
    const params: Record<string, string> = {
      page: page.toString(),
      pageSize: pageSize.toString(),
    };
    
    if (filters.pacienteId) params.pacienteId = filters.pacienteId;
    if (filters.fecha) params.fecha = filters.fecha;
    if (filters.estado) params.estado = filters.estado;
    if (filters.consultorio) params.consultorio = filters.consultorio;
    if (filters.medico) params.medico = filters.medico;
    
    const url = buildUrl(API_ENDPOINTS.emergencia.list, params);
    console.log('🏥 Consultando emergencias:', url);
    
    const response = await fetchApi(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Emergencias obtenidas:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo emergencias:', error);
    throw error;
  }
}

/**
 * Obtiene emergencias por mes y año (para listados mensuales)
 */
export async function getEmergenciasByMonth(
  month: number,
  year: number,
  search?: string,
  pagination: PaginationParams = {}
): Promise<PaginatedResponse<EmergenciaData>> {
  try {
    const { page = 1, pageSize = 10 } = pagination;
    
    const params: Record<string, string> = {
      month: month.toString(),
      year: year.toString(),
      page: page.toString(),
      pageSize: pageSize.toString(),
    };
    
    if (search) params.search = search;
    
    const url = buildUrl(API_ENDPOINTS.emergencia.byMonth, params);
    console.log('🏥 Consultando emergencias por mes:', url);
    
    const response = await fetchApi(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo emergencias por mes:', error);
    throw error;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Intenta dividir el campo NOMBRES ("PATERNO MATERNO NOMBRE1 NOMBRE2")
 * en paterno, materno y nombre cuando el backend no los devuelve separados.
 */
function parseNombres(fullName: string | null | undefined): { paterno: string; materno: string; nombre: string } | null {
  if (!fullName || typeof fullName !== 'string') return null;
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 3) return null;
  return {
    paterno: parts[0],
    materno: parts[1],
    nombre: parts.slice(2).join(' ')
  };
}

function isBlank(value: any): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

/**
 * Obtiene una emergencia específica por ID
 */
export async function getEmergenciaById(id: string): Promise<EmergenciaData | null> {
  try {
    if (!id) {
      console.warn('⚠️ ID de emergencia no proporcionado');
      return null;
    }
    
    const url = buildUrl(API_ENDPOINTS.emergencia.byId(id));
    console.log('🏥 Consultando emergencia por ID:', url);
    
    const response = await fetchApi(url);
    
    if (response.status === 404) {
      console.warn('⚠️ Emergencia no encontrada:', id);
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Emergencia obtenida:', data);

    // Spring Boot /emergency/{id} a veces devuelve campos del paciente en null.
    // Si eso ocurre, los enriquecemos desde la API de filiación y del campo NOMBRES.
    const pacienteId = data?.paciente ?? data?.PACIENTE;
    if (pacienteId && (isBlank(data.nombre) || isBlank(data.paterno) || isBlank(data.materno) || isBlank(data.documento))) {
      try {
        const pUrl = buildUrl(API_ENDPOINTS.filiation.byId(String(pacienteId)));
        console.log('🔍 Enriqueciendo emergencia con datos de filiación:', pUrl);
        const pResp = await fetchApi(pUrl);
        if (pResp.ok) {
          const pJson = await pResp.json();
          const p = pJson?.data ?? pJson;
          data.nombre          = data.nombre          ?? p?.nombre          ?? p?.NOMBRE          ?? p?.nombres          ?? p?.NOMBRES          ?? null;
          data.paterno         = data.paterno         ?? p?.paterno         ?? p?.PATERNO         ?? p?.apellidoPaterno  ?? null;
          data.materno         = data.materno         ?? p?.materno         ?? p?.MATERNO         ?? p?.apellidoMaterno  ?? null;
          data.nombres         = data.nombres         ?? p?.nombres         ?? p?.NOMBRES         ?? null;
          data.documento       = data.documento       ?? p?.documento       ?? p?.DOCUMENTO       ?? p?.dni              ?? null;
          data.tipoDocumento   = data.tipoDocumento   ?? p?.tipoDocumento   ?? p?.TIPO_DOCUMENTO  ?? null;
          data.fechaNacimiento = data.fechaNacimiento ?? p?.fechaNacimiento ?? p?.FECHA_NAC       ?? null;
          data.edad            = data.edad            ?? p?.edad            ?? p?.EDAD            ?? null;
          data.sexo            = data.sexo            ?? p?.sexo            ?? p?.SEXO            ?? null;
          data.direccion       = data.direccion       ?? p?.direccion       ?? p?.DIRECCION       ?? null;
          data.telefono1       = data.telefono1       ?? p?.telefono1       ?? p?.TELEFONO1       ?? null;
          data.estadoCivil     = data.estadoCivil     ?? getCivilStatusCode(p?.estadoCivil     ?? p?.ESTADO_CIVIL    ?? p?.ESTADOCIVIL, p?.NOMBRE_ESTADO_CIVIL ?? p?.nombreEstadoCivil) ?? null;
          console.log('✅ Datos del paciente enriquecidos desde filiación');
        }
      } catch (enrichErr) {
        console.warn('⚠️ No se pudieron enriquecer datos del paciente en emergencia:', enrichErr);
      }
    }

    // Fallback final: si aún faltan nombres separados pero tenemos el campo NOMBRES,
    // los parseamos como "PATERNO MATERNO NOMBRE(S)".
    if (isBlank(data.nombre) || isBlank(data.paterno) || isBlank(data.materno)) {
      const parsed = parseNombres(data.nombres ?? data.NOMBRES);
      if (parsed) {
        data.paterno = data.paterno ?? parsed.paterno;
        data.materno = data.materno ?? parsed.materno;
        data.nombre  = data.nombre  ?? parsed.nombre;
        data.nombres = data.nombres ?? `${parsed.paterno} ${parsed.materno} ${parsed.nombre}`;
        console.log('✅ Nombres parseados desde el campo NOMBRES:', parsed);
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Error obteniendo emergencia por ID:', error);
    throw error;
  }
}

/**
 * Obtiene emergencias por paciente ID
 */
export async function getEmergenciasByPacienteId(
  pacienteId: string,
  pagination: PaginationParams = {}
): Promise<PaginatedResponse<EmergenciaData>> {
  try {
    const { page = 1, pageSize = 10 } = pagination;
    
    const params: Record<string, string> = {
      page: page.toString(),
      pageSize: pageSize.toString(),
    };
    
    const url = buildUrl(API_ENDPOINTS.emergencia.byPaciente(pacienteId), params);
    console.log('🏥 Consultando emergencias por paciente:', url);
    
    const response = await fetchApi(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo emergencias por paciente:', error);
    throw error;
  }
}

/**
 * Verifica si un paciente tiene emergencias activas
 */
export async function checkEmergenciaActiva(pacienteId: string): Promise<{
  hasActive: boolean;
  emergencia?: EmergenciaData;
}> {
  try {
    const url = buildUrl(API_ENDPOINTS.emergencia.checkActiva(pacienteId));
    console.log('🏥 Verificando emergencia activa:', url);
    
    const response = await fetchApi(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error verificando emergencia activa:', error);
    throw error;
  }
}

/**
 * Crea una nueva emergencia
 */
export async function createEmergencia(
  emergenciaData: EmergenciaCreateData
): Promise<EmergenciaData> {
  try {
    const url = API_ENDPOINTS.emergencia.create;
    console.log('🏥 Creando emergencia:', url);
    console.log('📋 Datos:', emergenciaData);
    
    const response = await fetchApi(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emergenciaData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Emergencia creada:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error creando emergencia:', error);
    throw error;
  }
}

/**
 * Actualiza una emergencia existente
 */
export async function updateEmergencia(
  id: string,
  updateData: EmergenciaUpdateData
): Promise<EmergenciaData> {
  try {
    const url = API_ENDPOINTS.emergencia.update(id);
    console.log('🏥 Actualizando emergencia:', url);
    console.log('📋 Datos:', updateData);
    
    const response = await fetchApi(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Emergencia actualizada:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error actualizando emergencia:', error);
    throw error;
  }
}

/**
 * Elimina lógicamente una emergencia (soft delete)
 */
export async function deleteEmergencia(id: string): Promise<boolean> {
  try {
    const url = API_ENDPOINTS.emergencia.delete(id);
    console.log('🏥 Eliminando emergencia:', url);
    
    const response = await fetchApi(url, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }
    
    console.log('✅ Emergencia eliminada');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando emergencia:', error);
    throw error;
  }
}

/**
 * Asigna una cuenta a una emergencia
 */
export async function assignCuentaToEmergencia(
  emergenciaId: string,
  cuentaData: {
    paciente: string;
    seguro: string;
    usuario: string;
    [key: string]: any;
  }
): Promise<{ success: boolean; cuentaId?: string; error?: string }> {
  try {
    const url = API_ENDPOINTS.emergencia.assignCuenta(emergenciaId);
    console.log('🏥 Asignando cuenta a emergencia:', url);
    console.log('📋 Datos:', cuentaData);
    
    const response = await fetchApi(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cuentaData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Error ${response.status}: ${response.statusText}`,
      };
    }
    
    const data = await response.json();
    console.log('✅ Cuenta asignada:', data);
    
    return {
      success: true,
      cuentaId: data.cuentaId,
    };
  } catch (error) {
    console.error('❌ Error asignando cuenta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene la cuenta activa de un paciente por tipo de seguro
 */
export async function getCuentaActivaByPaciente(
  pacienteId: string,
  seguro: string
): Promise<{ cuentaId: string | null; fua: string | null }> {
  try {
    const params = { seguro };
    const url = buildUrl(API_ENDPOINTS.cuentas.byPacienteAndSeguro(pacienteId), params);
    console.log('🏥 Consultando cuenta activa:', url);
    
    const response = await fetchApi(url);
    
    if (response.status === 404) {
      return { cuentaId: null, fua: null };
    }
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      cuentaId: data.CUENTA_ID || data.cuentaId || null,
      fua: data.FUA || data.fua || null,
    };
  } catch (error) {
    console.error('❌ Error obteniendo cuenta activa:', error);
    return { cuentaId: null, fua: null };
  }
}

// ============================================================================
// EXPORTAR SERVICIO COMO OBJETO
// ============================================================================

export const emergenciaService = {
  // Consultas
  getEmergencias,
  getEmergenciasByMonth,
  getEmergenciaById,
  getEmergenciasByPacienteId,
  checkEmergenciaActiva,
  getCuentaActivaByPaciente,
  
  // Operaciones CRUD
  createEmergencia,
  updateEmergencia,
  deleteEmergencia,
  assignCuentaToEmergencia,
  
  // Utilidades
  calculateAgeFormatted,
};

export default emergenciaService;
