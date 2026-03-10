/**
 * Configuración centralizada de URLs de API
 * Esta configuración facilita la migración de Next.js API a Spring Boot
 */

// URL base del backend Spring Boot
export const API_SPRING_URL = process.env.NEXT_PUBLIC_API_SPRING_URL || 'http://192.168.5.239:9011/api';

// URLs específicas por módulo
export const API_ENDPOINTS = {
  // ============================================
  // UTILIDADES
  // ============================================
  utils: {
    datetime: `${API_SPRING_URL}/utils/datetime`,
    documentTypes: `${API_SPRING_URL}/maestro/tipoDocumento`,
    insurances: `${API_SPRING_URL}/maestro/seguro`,
    ubigeo: `${API_SPRING_URL}/maestro/ubigeo`,
    ocupaciones: `${API_SPRING_URL}/maestro/ocupacion`,
    estadoCivil: `${API_SPRING_URL}/maestro/estadoCivil`,
    gradoInstruccion: `${API_SPRING_URL}/maestro/gradoInstruccion`,
    religiones: `${API_SPRING_URL}/maestro/religion`,
    etnias: `${API_SPRING_URL}/maestro/etnia`,
    paises: `${API_SPRING_URL}/maestro/pais`,
    localidades: `${API_SPRING_URL}/maestro/localidad`,
  },

  // ============================================
  // EMERGENCIA
  // ============================================
  emergencia: {
    base: `${API_SPRING_URL}/emergencia`,
    list: `${API_SPRING_URL}/emergencia`,
    byMonth: `${API_SPRING_URL}/emergencia/por-mes`,
    byId: (id: string) => `${API_SPRING_URL}/emergencia/${id}`,
    byPatient: (patientId: string) => `${API_SPRING_URL}/emergencia/paciente/${patientId}`,
    byPaciente: (pacienteId: string) => `${API_SPRING_URL}/emergencia/paciente/${pacienteId}`,
    checkActiva: (pacienteId: string) => `${API_SPRING_URL}/emergencia/paciente/${pacienteId}/activa`,
    nextId: `${API_SPRING_URL}/emergencia/next-id`,
    admissionTypes: `${API_SPRING_URL}/emergencia/admission-types`,
    reasons: `${API_SPRING_URL}/emergencia/reasons`,
    create: `${API_SPRING_URL}/emergencia`,
    update: (id: string) => `${API_SPRING_URL}/emergencia/${id}`,
    delete: (id: string) => `${API_SPRING_URL}/emergencia/${id}`,
    assignAccount: (id: string) => `${API_SPRING_URL}/emergencia/${id}/assign-account`,
    assignCuenta: (id: string) => `${API_SPRING_URL}/emergencia/${id}/assign-account`,
  },

  // ============================================
  // HOSPITALIZACIÓN
  // ============================================
  hospitalizacion: {
    base: `${API_SPRING_URL}/hospitalizacion`,
    list: `${API_SPRING_URL}/hospitalizacion`,
    byId: (id: string) => `${API_SPRING_URL}/hospitalizacion/${id}`,
    byPatient: (patientId: string) => `${API_SPRING_URL}/hospitalizacion/paciente/${patientId}`,
    nextId: `${API_SPRING_URL}/hospitalizacion/next-id`,
    origins: `${API_SPRING_URL}/hospitalizacion/origins`,
    create: `${API_SPRING_URL}/hospitalizacion`,
    update: (id: string) => `${API_SPRING_URL}/hospitalizacion/${id}`,
    delete: (id: string) => `${API_SPRING_URL}/hospitalizacion/${id}`,
    logicalDelete: (id: string) => `${API_SPRING_URL}/hospitalizacion/${id}/baja`,
    assignAccount: (id: string) => `${API_SPRING_URL}/hospitalizacion/${id}/assign-account`,
  },

  // ============================================
  // CUENTAS
  // ============================================
  cuentas: {
    validate: `${API_SPRING_URL}/cuentas/validate`,
    validateCuentaAndFua: `${API_SPRING_URL}/cuentas/validate-cuenta-fua`,
    searchByInsurance: (pacienteId: string) => `${API_SPRING_URL}/cuentas/buscar-por-seguro/${pacienteId}`,
    byPacienteAndSeguro: (pacienteId: string) => `${API_SPRING_URL}/cuentas/buscar-por-seguro/${pacienteId}`,
    byId: (id: string) => `${API_SPRING_URL}/cuentas/${id}`,
    activaByPaciente: (pacienteId: string) => `${API_SPRING_URL}/cuentas/activa/paciente/${pacienteId}`,
    activaByPacienteAndSeguro: (pacienteId: string, seguro: string) => `${API_SPRING_URL}/cuentas/activa/paciente/${pacienteId}/seguro/${seguro}`,
    updateEstado: (id: string) => `${API_SPRING_URL}/cuentas/${id}/estado`,
    updateSeguro: (id: string) => `${API_SPRING_URL}/cuentas/${id}/seguro`,
    updateObservacionYEmpresa: (id: string) => `${API_SPRING_URL}/cuentas/${id}/observacion-empresa`,
    fua: {
      validate: (fuaNumber: string) => `${API_SPRING_URL}/cuentas/fua/${fuaNumber}/validate`,
      details: (fuaNumber: string) => `${API_SPRING_URL}/cuentas/fua/${fuaNumber}`,
      updateEstado: (fuaNumber: string) => `${API_SPRING_URL}/cuentas/fua/${fuaNumber}/estado`,
      activaByCuenta: (cuentaId: string) => `${API_SPRING_URL}/cuentas/${cuentaId}/fua-activa`,
      checkActivaByPaciente: (pacienteId: string) => `${API_SPRING_URL}/cuentas/fua/check-activa/paciente/${pacienteId}`,
    },
    logicalDelete: (cuentaId: string) => `${API_SPRING_URL}/cuentas/${cuentaId}/baja`,
    updateCuentaAndFua: (cuentaId: string) => `${API_SPRING_URL}/cuentas/${cuentaId}/inactivar-con-fua`,
  },

  // ============================================
  // FILIACIÓN / PACIENTES
  // ============================================
  filiation: {
    search: `${API_SPRING_URL}/historia-clinica/pacientes/buscar`,
    byId: (id: string) => `${API_SPRING_URL}/historia-clinica/pacientes/${id}`,
    create: `${API_SPRING_URL}/historia-clinica/pacientes`,
    update: (id: string) => `${API_SPRING_URL}/historia-clinica/pacientes/${id}`,
    updateHistoria: (id: string) => `${API_SPRING_URL}/historia-clinica/pacientes/actualizar-historia/${id}`,
  },

  // ============================================
  // DIAGNÓSTICOS
  // ============================================
  diagnosticos: {
    search: `${API_SPRING_URL}/diagnosticos/buscar`,
    byEmergencia: (id: string) => `${API_SPRING_URL}/diagnosticos/emergencia/${id}`,
    byConsultaExterna: (id: string) => `${API_SPRING_URL}/diagnosticos/consulta-externa/${id}`,
    byId: (id: string) => `${API_SPRING_URL}/diagnosticos/${id}`,
  },

  // ============================================
  // MASTER TABLES
  // ============================================
  masterTables: {
    // Médicos
    medicos: {
      list: `${API_SPRING_URL}/master-tables/medicos`,
      byId: (id: string) => `${API_SPRING_URL}/master-tables/medicos/${id}`,
      search: `${API_SPRING_URL}/master-tables/medicos/search`,
      suggestCode: `${API_SPRING_URL}/master-tables/medicos/suggest-code`,
    },
    // Consultorios
    consultorios: {
      list: `${API_SPRING_URL}/master-tables/consultorios`,
      byId: (id: string) => `${API_SPRING_URL}/master-tables/consultorios/${id}`,
      search: `${API_SPRING_URL}/master-tables/consultorios/search`,
      bySpecialty: `${API_SPRING_URL}/master-tables/consultorios/by-specialty`,
      types: `${API_SPRING_URL}/master-tables/consultorio-types`,
    },
    // Localidades
    localidades: {
      list: `${API_SPRING_URL}/master-tables/localidades`,
      byId: (id: string) => `${API_SPRING_URL}/master-tables/localidades/${id}`,
      search: `${API_SPRING_URL}/master-tables/localidades/search`,
    },
    // Especialidades
    specialties: `${API_SPRING_URL}/master-tables/specialties`,
    // Profesiones y Colegio
    profesionesColegio: `${API_SPRING_URL}/master-tables/profesiones-colegio`,
  },

  // ============================================
  // CITAS
  // ============================================
  citas: {
    base: `${API_SPRING_URL}/cita`,
    byId: (id: string) => `${API_SPRING_URL}/cita/${id}`,
    assign: (citaId: string) => `${API_SPRING_URL}/cita/${citaId}/asignar`,
    release: (citaId: string) => `${API_SPRING_URL}/cita/${citaId}/liberar`,
    changeRefconState: (citaId: string) => `${API_SPRING_URL}/cita/${citaId}/refcon-estado`,
    changeAuditState: (citaId: string) => `${API_SPRING_URL}/cita/${citaId}/auditoria-estado`,
    availableDates: `${API_SPRING_URL}/cita/fechas-consultorios`,
    search: `${API_SPRING_URL}/cita/buscar`,
    liberadas: `${API_SPRING_URL}/cita/liberadas`,
    resumen: `${API_SPRING_URL}/cita/resumen`,
  },

  // ============================================
  // SERVICIOS EXTERNOS (SIS, RENIEC, REFCON)
  // ============================================
  external: {
    sis: {
      validate: `${API_SPRING_URL}/sis/validar`,
    },
    reniec: {
      datosCompletos: `${API_SPRING_URL}/reniec/datos-completos`,
    },
  },
};

/**
 * Helper para construir URLs con query params
 */
export function buildUrl(baseUrl: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return baseUrl;
  
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  return filteredParams ? `${baseUrl}?${filteredParams}` : baseUrl;
}

/**
 * Headers comunes para las peticiones
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

/**
 * Función helper para hacer fetch con manejo de errores
 */
/**
 * Función simple fetch para compatibilidad
 */
export async function fetchApi(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options?.headers,
    },
  });
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Error ${response.status}: ${response.statusText}`,
        status: response.status,
        data,
      };
    }

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    console.error('API Fetch Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}
