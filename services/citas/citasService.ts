// citasService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface CitaSearchFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: number;
  consultorio?: string;
  medico?: string;
}

export interface CitaHistorial {
  id: string;
  fecha: string;
  hora: string;
  estado: number;
  consultorio: string;
  consultorioNombre?: string;
  medico: string;
  medicoNombre?: string;
  paciente: string;
  documento?: string;
  nombre: string;
  numero?: string;
  turno?: string;
  observacion?: string;
  seguro?: string;
  seguroNombre?: string;
  tipoConsulta?: string;
  entidadSis?: string;
  numRef?: string;
  diagnostico?: string;
  // Datos del paciente (cuando el backend Spring los incluya)
  tipoDocumento?: string;
  sexo?: string;
  fechaNacimiento?: string;
  direccion?: string;
  distrito?: string;
  distritoDir?: string;
  telefono1?: string;
  telefono2?: string;
  foto?: string;
  stringFoto?: string;
}

export interface CitaSearchResult {
  content: CitaHistorial[];
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface MedicoByDate {
  MEDICO: string;
  NOMBRE: string;
}

// ============================================================================
// FUNCIONES DE NORMALIZACIÓN
// ============================================================================

function normalizeCita(cita: any): CitaHistorial {
  return {
    id: String(cita.CITA_ID || cita.citaId || cita.id || ''),
    fecha: cita.FECHA || cita.fecha || '',
    hora: cita.HORA || cita.hora || '',
    estado: Number(cita.ESTADO || cita.estado || 0),
    consultorio: cita.CONSULTORIO || cita.consultorio || '',
    consultorioNombre: cita.CONSULTORIO_NOMBRE || cita.consultorioNombre || undefined,
    medico: cita.MEDICO || cita.medico || '',
    medicoNombre: cita.MEDICO_NOMBRE || cita.medicoNombre || undefined,
    paciente: cita.PACIENTE || cita.paciente || '',
    documento: cita.DOCUMENTO || cita.documento || undefined,
    nombre: cita.NOMBRE || cita.nombre || '',
    numero: cita.NUMERO || cita.numero || undefined,
    turno: cita.TURNO_CONSULTA || cita.turno || undefined,
    observacion: cita.OBSERVACION || cita.observacion || undefined,
    seguro: cita.SEGURO || cita.seguro || undefined,
    seguroNombre: cita.SEGURO_NOMBRE || cita.seguroNombre || undefined,
    tipoConsulta: cita.TIPO_CITA || cita.tipoConsulta || undefined,
    entidadSis: cita.ENTIDADSIS || cita.entidadSis || undefined,
    numRef: cita.NUMREF || cita.numRef || undefined,
    diagnostico: cita.DIAGNOSTICO || cita.diagnostico || undefined,
    tipoDocumento: cita.TIPO_DOCUMENTO || cita.tipoDocumento || undefined,
    sexo: cita.SEXO || cita.sexo || undefined,
    fechaNacimiento: cita.FECHA_NACIMIENTO || cita.fechaNacimiento || cita.fechaNac || undefined,
    direccion: cita.DIRECCION || cita.direccion || undefined,
    distrito: cita.DISTRITO || cita.distrito || undefined,
    distritoDir: cita.DISTRITO_DIR || cita.distritoDir || undefined,
    telefono1: cita.TELEFONO1 || cita.telefono1 || cita.telefono || undefined,
    telefono2: cita.TELEFONO2 || cita.telefono2 || undefined,
    foto: cita.FOTO || cita.foto || undefined,
    stringFoto: cita.STRING_FOTO || cita.stringFoto || undefined,
  };
}

// ============================================================================
// SERVICIOS DE CITAS - SPRING BOOT API
// ============================================================================

/**
 * Busca citas por documento o historia clínica del paciente.
 * El endpoint correcto de Spring es /cita/historial/por-documento
 * y requiere (o acepta) el parámetro tipoDocumento.
 */
export async function searchCitasByDocumento(
  documento: string,
  filters: CitaSearchFilters = {},
  page: number = 0,
  size: number = 10,
  tipoDocumento: string = 'D'
): Promise<CitaSearchResult> {
  try {    const params: Record<string, string> = {
      documento,
      tipoDocumento,
      page: page.toString(),
      size: size.toString(),
    };

    if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde;
    if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta;
    if (filters.estado && filters.estado !== 0) params.estado = filters.estado.toString();
    if (filters.consultorio && filters.consultorio !== 'all') params.consultorio = filters.consultorio;
    if (filters.medico && filters.medico !== 'all') params.medico = filters.medico;

    const url = buildUrl(API_ENDPOINTS.citas.historialPorDocumento, params);
    const response = await fetchApi(url);

    if (!response.ok) {
      if (response.status === 404) {
        return { content: [], totalElements: 0, totalPages: 0, last: true };
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Normalizar respuesta del backend
    const content = (result.content || result.data || []).map(normalizeCita);
    const totalElements = result.totalElements || result.total || content.length;
    const totalPages = result.totalPages || Math.ceil(totalElements / size);    return {
      content,
      totalElements,
      totalPages,
      last: page >= totalPages - 1,
    };
  } catch (error) {
    console.error('❌ Error searching citas by documento:', error);
    throw new Error('Error al buscar citas por documento');
  }
}

/**
 * Busca citas por apellidos y nombres del paciente.
 * El endpoint /busqueda/paciente-por-nombre devuelve pacientes; se toma
 * el primer paciente encontrado y se consulta su historial de citas por documento.
 */
export async function searchCitasByNombres(
  nombres: string,
  filters: CitaSearchFilters = {},
  page: number = 0,
  size: number = 10
): Promise<CitaSearchResult> {
  try {    const url = buildUrl(API_ENDPOINTS.filiation.searchByName, { nombres });
    const response = await fetchApi(url);

    if (!response.ok) {
      if (response.status === 404) {
        return { content: [], totalElements: 0, totalPages: 0, last: true };
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const pacientes = Array.isArray(result)
      ? result
      : (result.data || result.content || result.pacientes || result.result || []);

    if (pacientes.length === 0) {      return { content: [], totalElements: 0, totalPages: 0, last: true };
    }

    const paciente = pacientes[0];
    const documento =
      (typeof paciente.DOCUMENTO === 'string' ? paciente.DOCUMENTO.trim() : undefined) ||
      (typeof paciente.documento === 'string' ? paciente.documento.trim() : undefined) ||
      (typeof paciente.document === 'string' ? paciente.document.trim() : undefined);

    if (!documento) {      return { content: [], totalElements: 0, totalPages: 0, last: true };
    }

    const tipoDocumento =
      (typeof paciente.TIPO_DOCUMENTO === 'string' ? paciente.TIPO_DOCUMENTO.trim() : undefined) ||
      (typeof paciente.tipoDocumento === 'string' ? paciente.tipoDocumento.trim() : undefined) ||
      (typeof paciente.tipoDocument === 'string' ? paciente.tipoDocument.trim() : undefined) ||
      (typeof paciente.documentType === 'string' ? paciente.documentType.trim() : undefined) ||
      'D';    return searchCitasByDocumento(documento, filters, page, size, tipoDocumento);
  } catch (error) {
    console.error('❌ Error searching citas by nombres:', error);
    throw new Error('Error al buscar citas por nombres');
  }
}

/**
 * Actualiza la FECHA_PAGO y ESTADO de una cita
 */
export async function updateFechaPago(
  citaId: string,
  fechaPago: Date,
  estado: string = '3'
): Promise<void> {
  try {    const url = `${API_ENDPOINTS.citas.byId(citaId)}/fecha-pago`;
    const response = await fetchApi(url, {
      method: 'PUT',
      body: JSON.stringify({
        fechaPago: fechaPago.toISOString(),
        estado,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }  } catch (error) {
    console.error('❌ Error al actualizar FECHA_PAGO y ESTADO:', error);
    throw new Error('Error al actualizar fecha de pago y estado de la cita');
  }
}

/**
 * Obtiene médicos únicos que tienen citas en una fecha específica
 * @param fecha Fecha en formato DD/MM/YYYY (ej: "14/11/2025")
 * @param consultorio Código del consultorio (opcional)
 * @returns Lista de médicos con código y nombre
 */
export async function getMedicosByDate(
  fecha: string,
  consultorio?: string
): Promise<MedicoByDate[]> {
  try {    const params: Record<string, string> = { fecha };
    if (consultorio) params.consultorio = consultorio;

    const url = buildUrl(`${API_ENDPOINTS.citas.base}/medicos-por-fecha`, params);
    const response = await fetchApi(url);

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const data = Array.isArray(result) ? result : (result.data || []);

    const medicos = data.map((item: any) => ({
      MEDICO: (item.MEDICO || item.medico || '').trim(),
      NOMBRE: (item.NOMBRE || item.nombre || '').trim(),
    }));    return medicos;
  } catch (error) {
    console.error('❌ Error al obtener médicos por fecha:', error);
    throw new Error('Error al obtener médicos por fecha');
  }
}
