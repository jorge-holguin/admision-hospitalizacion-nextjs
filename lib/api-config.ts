/**
 * Configuración centralizada de URLs de API
 * Esta configuración facilita la migración de Next.js API a Spring Boot
 */

// URL base del backend Spring Boot
export const API_SPRING_URL = import.meta.env.VITE_API_SPRING_URL || 'http://192.168.5.239:9011/api';

// URL base del backend legacy (usado por SIS y otras APIs antiguas)
export const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL || 'http://192.168.0.252:9011/api';

// URLs específicas por módulo
export const API_ENDPOINTS = {
  // ============================================
  // UTILIDADES
  // ============================================
  utils: {
    datetime: `${API_SPRING_URL}/utils/datetime`,
    documentTypes: `${API_SPRING_URL}/maestro/tipoDocumento`,
    insurances: `${API_SPRING_URL}/utils/insurances`,
    ubigeo: `${API_SPRING_URL}/maestro/ubigeo`,
    ocupaciones: `${API_SPRING_URL}/maestro/ocupacion`,
    estadoCivil: `${API_SPRING_URL}/maestro/estadoCivil`,
    gradoInstruccion: `${API_SPRING_URL}/maestro/gradoInstruccion`,
    religiones: `${API_SPRING_URL}/maestro/religion`,
    etnias: `${API_SPRING_URL}/maestro/etnia`,
    paises: `${API_SPRING_URL}/maestro/pais`,
    localidades: `${API_SPRING_URL}/maestro/localidad`,
    empresasSeguro: `${API_SPRING_URL}/maestro/empresaseguro/obtener-todos`,
  },

  // ============================================
  // EMERGENCIA
  // ============================================
  emergencia: {
    base: `${API_SPRING_URL}/emergency`,
    list: `${API_SPRING_URL}/emergency`,
    byMonth: `${API_SPRING_URL}/emergency/por-mes`,
    byId: (id: string) => `${API_SPRING_URL}/emergency/${id}`,
    byPatient: (patientId: string) => `${API_SPRING_URL}/emergency/paciente/${patientId}`,
    byPaciente: (pacienteId: string) => `${API_SPRING_URL}/emergency/paciente/${pacienteId}`,
    checkActiva: (pacienteId: string) => `${API_SPRING_URL}/emergency/paciente/${pacienteId}/activa`,
    nextId: `${API_SPRING_URL}/emergency/next-id`,
    checkAccount: `${API_SPRING_URL}/emergency/check-account`,
    admissionTypes: `${API_SPRING_URL}/emergency/forma-ingreso`,
    reasons: `${API_SPRING_URL}/emergency/motivo-emergencia`,
    create: `${API_SPRING_URL}/emergency`,
    update: (id: string) => `${API_SPRING_URL}/emergency/${id}`,
    delete: (id: string) => `${API_SPRING_URL}/emergency/${id}`,
    assignAccount: (id: string, origen?: string) => `${API_SPRING_URL}/emergency/${id}/assign-account${origen ? `?origen=${origen}` : ''}`,
    assignCuenta: (id: string, origen?: string) => `${API_SPRING_URL}/emergency/${id}/assign-account${origen ? `?origen=${origen}` : ''}`,
  },

  // ============================================
  // HOSPITALIZACIÓN
  // ============================================
  hospitalizacion: {
    base: `${API_SPRING_URL}/hospitalization`,
    list: `${API_SPRING_URL}/hospitalization`,
    ordenes: `${API_SPRING_URL}/hospitalization/ordenes`,
    byId: (id: string) => `${API_SPRING_URL}/hospitalization/${id}`,
    byPatient: (patientId: string) => `${API_SPRING_URL}/hospitalization/paciente/${patientId}`,
    nextId: `${API_SPRING_URL}/hospitalization/next-id`,
    origins: `${API_SPRING_URL}/hospitalization/origins`,
    create: `${API_SPRING_URL}/hospitalization`,
    update: (id: string) => `${API_SPRING_URL}/hospitalization/${id}`,
    delete: (id: string) => `${API_SPRING_URL}/hospitalization/${id}`,
    logicalDelete: (id: string) => `${API_SPRING_URL}/hospitalization/${id}/baja`,
    assignAccount: (id: string, origen?: string) => `${API_SPRING_URL}/hospitalization/${id}/assign-account${origen ? `?origen=${origen}` : ''}`,
  },

  // ============================================
  // CUENTAS
  // ============================================
  accounts: {
    validate: `${API_SPRING_URL}/accounts/validate`,
    deactivate: (cuentaId: string) => `${API_SPRING_URL}/accounts/${cuentaId}/deactivate`,
    byPatient: (pacienteId: string) => `${API_SPRING_URL}/accounts/patient/${pacienteId}`,
  },

  // ============================================
  // CUENTAS
  // ============================================
  cuentas: {
    validate: `${API_SPRING_URL}/cuentas/validate`,
    validateCuentaAndFua: `${API_SPRING_URL}/cuentas/validate-cuenta-fua`,
    searchByInsurance: (pacienteId: string) => `${API_SPRING_URL}/accounts/patient/${pacienteId}`,
    byPacienteAndSeguro: (pacienteId: string) => `${API_SPRING_URL}/accounts/patient/${pacienteId}`,
    byId: (id: string) => `${API_SPRING_URL}/cuentas/${id}`,
    activaByPaciente: (pacienteId: string) => `${API_SPRING_URL}/accounts/patient/${pacienteId}`,
    activaByPacienteAndSeguro: (pacienteId: string) => `${API_SPRING_URL}/accounts/patient/${pacienteId}`,
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
    searchByDocument: `${API_SPRING_URL}/historia-clinica/pacientes/busqueda-documento`,
    searchByName: `${API_SPRING_URL}/historia-clinica/pacientes/busqueda-nombres`,
    searchByHistoria: `${API_SPRING_URL}/historia-clinica/pacientes/busqueda-historia`,
    byId: (id: string) => `${API_SPRING_URL}/historia-clinica/pacientes/${id}`,
    create: `${API_SPRING_URL}/historia-clinica/pacientes`,
    update: (id: string) => `${API_SPRING_URL}/historia-clinica/pacientes/${id}`,
    updateHistoria: (id: string) => `${API_SPRING_URL}/historia-clinica/pacientes/actualizar-historia/${id}`,
    anular: (id: string) => `${API_SPRING_URL}/historia-clinica/pacientes/anular/${id}`,
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
    diagnosticos: (id: string) => `${API_SPRING_URL}/cita/${id}/diagnosticos`,
    assign: (citaId: string) => `${API_SPRING_URL}/cita/${citaId}/asignar`,
    release: (citaId: string) => `${API_SPRING_URL}/cita/${citaId}/liberar`,
    changeRefconState: (citaId: string) => `${API_SPRING_URL}/cita/${citaId}/refcon-estado`,
    changeAuditState: (citaId: string) => `${API_SPRING_URL}/cita/${citaId}/auditoria-estado`,
    availableDates: `${API_SPRING_URL}/cita/fechas-consultorios`,
    search: `${API_SPRING_URL}/cita/buscar`,
    historialPorDocumento: `${API_SPRING_URL}/cita/historial/por-documento`,
    tipos: `${API_SPRING_URL}/cita/tipos`,
    liberadas: `${API_SPRING_URL}/cita/liberadas`,
    resumen: `${API_SPRING_URL}/cita/resumen`,
    sisEntities: `${API_SPRING_URL}/cita/sis-entities`,
    sisEntityByCode: (code: string) => `${API_SPRING_URL}/cita/sis-entities/${code}`,
  },

  // ============================================
  // DEMANDA INSATISFECHA / CALL CENTER
  // ============================================
  demandaInsatisfecha: {
    base: `${API_BACKEND_URL}/call-center/demandas-insatisfechas`,
    list: `${API_BACKEND_URL}/call-center/demandas-insatisfechas`,
    byId: (id: number) => `${API_BACKEND_URL}/call-center/demandas-insatisfechas/${id}`,
    create: `${API_BACKEND_URL}/call-center/demandas-insatisfechas`,
    update: (id: number) => `${API_BACKEND_URL}/call-center/demandas-insatisfechas/${id}`,
    delete: (id: number) => `${API_BACKEND_URL}/call-center/demandas-insatisfechas/${id}`,
  },
  callCenter: {
    motivosLlamada: `${API_BACKEND_URL}/cita/motivos`,
    maestros: `${API_BACKEND_URL}/call-center/maestros`,
    especialidadesFua: `${API_BACKEND_URL}/maestro/especialidad/fua`,
  },
  personal: {
    buscar: `${API_BACKEND_URL}/personal/buscar`,
    buscarPorDni: `${API_BACKEND_URL}/personal/buscar-dni`,
  },

  // ============================================
  // SERVICIOS EXTERNOS (SIS, RENIEC, REFCON)
  // ============================================
  external: {
    sis: {
      validate: `${API_BACKEND_URL}/sis/validar`,
    },
    reniec: {
      datosCompletos: `${API_SPRING_URL}/reniec/datos-completos`,
    },
  },
};

/**
 * Normaliza la respuesta del backend de hospitalización.
 * El backend Spring Boot devuelve los campos en lowerCamelCase (ej: idHospitalizacion),
 * pero los componentes del frontend esperan los nombres de columna de la BD en mayúsculas (ej: IDHOSPITALIZACION).
 */
export function normalizeHospitalizationData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const toString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };

  const normalizeDate = (value: any): string => {
    if (!value) return '';
    const str = String(value).trim();

    // Ya está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    // Formato ISO (ej: 2026-08-19T00:00:00)
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // Formato YYYYMMDD
    if (/^\d{8}$/.test(str)) {
      return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
    }

    // Formato DD/MM/YYYY
    const ddmmyyyyMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      return `${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2]}-${ddmmyyyyMatch[1]}`;
    }

    return str;
  };

  const normalized: any = { ...data };

  const fieldMap: Record<string, string> = {
    idHospitalizacion: 'IDHOSPITALIZACION',
    paciente: 'PACIENTE',
    nombres: 'NOMBRES',
    consultorio1: 'CONSULTORIO1',
    hora1: 'HORA1',
    fecha1: 'FECHA1',
    origen: 'ORIGEN',
    seguro: 'SEGURO',
    medico1: 'MEDICO1',
    estado: 'ESTADO',
    usuario: 'USUARIO',
    usuarioImp: 'USUARIO_IMP',
    diagnostico: 'DIAGNOSTICO',
    edad: 'EDAD',
    origenId: 'ORIGENID',
    acompananteNombre: 'ACOMPANANTE_NOMBRE',
    acompananteTelefono: 'ACOMPANANTE_TELEFONO',
    acompananteDireccion: 'ACOMPANANTE_DIRECCION',
    cuentaId: 'CUENTAID',
    // Campos adicionales de la lista / filiación
    historia: 'HISTORIA',
    sexo: 'SEXO',
    estadoCivil: 'ESTADO_CIVIL',
    direccion: 'DIRECCION',
    distrito: 'DISTRITO',
    telefono1: 'TELEFONO1',
    fechaNacimiento: 'FECHA_NACIMIENTO',
    tipoDocumento: 'TIPO_DOCUMENTO',
    documento: 'DOCUMENTO',
    // Nombres descriptivos de la vista de hospitalización
    consulNombre: 'CONSULNOMBRE',
    medicoNombre: 'MEDICONOMBRE',
    seguroNombre: 'SEGURONOMBRE',
    diagnosticoNombre: 'DIAGNOSTICONOMBRE',
    origenNombre: 'ORIGENOMBRE',
  };

  // Campos que deben normalizarse como fechas
  const dateFields = ['fecha1', 'fechaNacimiento'];

  Object.entries(fieldMap).forEach(([lower, upper]) => {
    if (data[lower] !== undefined) {
      if (dateFields.includes(lower)) {
        normalized[upper] = normalizeDate(data[lower]);
      } else if (lower === 'cuentaId') {
        normalized[upper] = data[lower];
      } else {
        normalized[upper] = toString(data[lower]);
      }
    }
  });

  // Asegurar compatibilidad con variante sin guión bajo
  if (data.estadoCivil !== undefined && normalized.ESTADOCIVIL === undefined) {
    normalized.ESTADOCIVIL = toString(data.estadoCivil);
  }

  return normalized;
}

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
