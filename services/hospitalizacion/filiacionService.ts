// filiacionService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, buildUrl, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface FiliacionFilter {
  historia?: string;
  documento?: string;
  nombres?: string;
  tipoDocumento?: string;
  estado?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface Filiacion {
  PACIENTE: string;
  HISTORIA: string;
  NOMBRES: string;
  SEXO: string;
  NOMBRE_ESTADO_CIVIL: string;
  FECHA_APERTURA: Date | string;
  HORA_APERTURA: string;
  PADRE: string;
  MADRE: string;
  DIRECCION: string;
  TELEFONO1: string;
  FECHA_NACIMIENTO: Date | string;
  DISTRITO: string;
  NOMBRE_DOCUMENTO: string;
  DOCUMENTO: string;
  NOMBRE_OCUPACION: string;
  NOMBRE_GRADO_INSTRUCCION: string;
  NOMBRE_CONYUGE: string;
  NOMBRE_SEGURO: string;
  NOMBRE_ENTIDAD: string;
  ANIO: string;
  PATERNO: string;
  MATERNO: string;
  NOMBRE: string;
  LUGAR_NACIMIENTO: string;
  HIJOS: number;
  CONYUGE_OCUPACION: string;
  CONSULTORIO: string;
  CONSUL: string;
  EDAD: number;
  ESTADO_CIVIL: string;
  SYSINSERT: Date | string;
  SYSUPDATE: Date | string;
  FECHA_CONSULTA: Date | string;
  TURNO_CONSULTA: string;
  Nombre_Localidad: string;
  Provincia_Nac: string;
  Departamento_Nac: string;
  Distrito_Dir: string;
  Provincia_Dir: string;
  Departamento_Dir: string;
  USUARIO: string;
  FLAG: string;
  RELIGION: string;
  DESRELIGION: string;
  USUARIO_IMP: string;
  HISTORIA_ANT: string;
  CODIGOBARRAS: string;
  STRING_FOTO: string;
  TIPO_DOCUMENTO: string;
  LOCALIDAD: string;
  TELEFONO2: string;
  SEGURO: string;
  Expr2: string;
  COD_DISTRITO: string;
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
// SERVICIOS DE FILIACIÓN - SPRING BOOT API
// ============================================================================

export const filiacionService = {
  /**
   * Get paginated filiacion records with optional filtering
   */
  async getPaginatedFiliacion(
    filter: FiliacionFilter = {},
    { page = 1, pageSize = 10 }: PaginationOptions
  ): Promise<PaginatedResponse<Filiacion>> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        pageSize: pageSize.toString(),
      };

      if (filter.estado) {
        params.estado = filter.estado;
      }

      // Helper para agregar filtro de estado a URLs puntuales
      const withEstado = (base: string) => {
        if (!filter.estado) return base;
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}estado=${encodeURIComponent(filter.estado)}`;
      };

      // Historia clínica
      if (filter.historia) {
        const url = withEstado(`${API_ENDPOINTS.filiation.searchByHistoria}?historia=${encodeURIComponent(filter.historia)}&page=${page}&pageSize=${pageSize}`);
        const response = await fetchApi(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Error en la respuesta:', errorData);
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          data.data = data.data.map((record: any) => mapFromBackend(record));
        }
        return data;
      }

      // Documento → nueva API optimizada
      if (filter.documento && !filter.historia) {
        const tipoDoc = (filter.tipoDocumento || 'D').trim();
        const docTrimmed = filter.documento.trim();
        const p = new URLSearchParams({ documento: docTrimmed });
        // Solo incluir tipodocumento si NO es DNI con longitud distinta a 8 dígitos
        if (tipoDoc !== 'D' || docTrimmed.length === 8) {
          p.set('tipoDocumento', tipoDoc);
        }
        const url = withEstado(`${API_ENDPOINTS.filiation.searchByDocument}?${p}`);
        const response = await fetchApi(url);
        if (response.status === 204 || response.headers.get('content-length') === '0' || !response.body) {
          return { data: [], pagination: { total: 0, page, pageSize, totalPages: 0 } };
        }
        const raw = response.ok ? await response.json().catch(() => null) : null;
        const list: any[] = Array.isArray(raw) ? raw
          : Array.isArray(raw?.data) ? raw.data
          : (raw && !raw.error && (raw.PACIENTE || raw.paciente)) ? [raw]
          : [];
        const mapped = list.map((r: any) => mapFromBackend(r));
        return { data: mapped, pagination: { total: mapped.length, page, pageSize, totalPages: Math.ceil(mapped.length / pageSize) } };
      }

      // Nombres → nueva API optimizada
      if (filter.nombres && !filter.historia) {
        const url = withEstado(`${API_ENDPOINTS.filiation.searchByName}?nombres=${encodeURIComponent(filter.nombres)}`);
        const response = await fetchApi(url);
        const raw = response.ok ? await response.json() : null;
        const list: any[] = Array.isArray(raw) ? raw
          : Array.isArray(raw?.data) ? raw.data
          : Array.isArray(raw?.pacientes) ? raw.pacientes
          : Array.isArray(raw?.content) ? raw.content
          : [];
        const mapped = list.map((r: any) => mapFromBackend(r));
        return { data: mapped, pagination: { total: mapped.length, page, pageSize, totalPages: Math.ceil(mapped.length / pageSize) } };
      }

      const url = buildUrl(API_ENDPOINTS.filiation.searchByDocument, params);
      const response = await fetchApi(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error en la respuesta:', errorData);
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        data.data = data.data.map((record: any) => mapFromBackend(record));
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error en getPaginatedFiliacion:', error);
      return {
        data: [],
        pagination: {
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        },
      };
    }
  },
  
  /**
   * Get a single filiacion record by ID (PACIENTE or HISTORIA)
   */
  async getFiliacionById(id: string): Promise<Filiacion | null> {
    try {
      if (!id || typeof id !== 'string') {
        console.error(`ID inválido: ${id}`);
        return null;
      }
      
      const url = API_ENDPOINTS.filiation.byId(id);
      const response = await fetchApi(url);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return mapFromBackend(data);
    } catch (error) {
      console.error(`❌ Error en getFiliacionById(${id}):`, error);
      return null;
    }
  },
  
  /**
   * Search filiacion records by historia clinica
   */
  async searchByHistoria(historia: string): Promise<Filiacion[]> {
    try {
      const url = `${API_ENDPOINTS.filiation.searchByHistoria}?historia=${encodeURIComponent(historia)}&pageSize=10`;
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return (data.data || []).map((record: any) => mapFromBackend(record));
    } catch (error) {
      console.error(`❌ Error en searchByHistoria(${historia}):`, error);
      return [];
    }
  },
  
  /**
   * Search filiacion records by DNI/documento
   */
  async searchByDocumento(documento: string, tipoDocumento: string = 'D'): Promise<Filiacion[]> {
    try {
      const params = new URLSearchParams({ tipoDocumento, documento });
      const url = `${API_ENDPOINTS.filiation.searchByDocument}?${params}`;
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const list: any[] = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : (data && !data.error && (data.PACIENTE || data.paciente)) ? [data]
        : [];
      return list.map((record: any) => mapFromBackend(record));
    } catch (error) {
      console.error(`❌ Error en searchByDocumento(${documento}):`, error);
      return [];
    }
  },
  
  /**
   * Search filiacion records by name (nombres, apellidos)
   */
  async searchByName(name: string): Promise<Filiacion[]> {
    try {
      const url = `${API_ENDPOINTS.filiation.searchByName}?nombres=${encodeURIComponent(name)}`;
      
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const list: any[] = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.pacientes) ? data.pacientes
        : Array.isArray(data?.content) ? data.content
        : [];
      return list.map((record: any) => mapFromBackend(record));
    } catch (error) {
      console.error(`❌ Error en searchByName(${name}):`, error);
      return [];
    }
  },
  
  /**
   * Count filiacion records with optional filtering
   */
  async countFiliacion(filter: FiliacionFilter = {}): Promise<number> {
    try {
      const withEstado = (base: string) => {
        if (!filter.estado) return base;
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}estado=${encodeURIComponent(filter.estado)}`;
      };

      let url
      if (filter.historia) {
        url = withEstado(`${API_ENDPOINTS.filiation.searchByHistoria}?historia=${encodeURIComponent(filter.historia)}&page=1&pageSize=1`)
      } else if (filter.documento) {
        const tipoDoc = (filter.tipoDocumento || 'D').trim()
        url = withEstado(`${API_ENDPOINTS.filiation.searchByDocument}?tipoDocumento=${tipoDoc}&documento=${encodeURIComponent(filter.documento)}&page=1&pageSize=1`)
      } else if (filter.nombres) {
        url = withEstado(`${API_ENDPOINTS.filiation.searchByName}?nombres=${encodeURIComponent(filter.nombres)}&page=1&pageSize=1`)
      } else {
        url = withEstado(`${API_ENDPOINTS.filiation.searchByDocument}?page=1&pageSize=1`)
      }
      const response = await fetchApi(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const total = data.pagination?.total || 0;
      return total;
    } catch (error) {
      console.error('❌ Error en countFiliacion:', error);
      return 0;
    }
  },
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Extrae un valor escalar string de un campo que puede ser string u objeto.
 * Cuando el backend devuelve un campo como objeto anidado, se intenta extraer
 * el valor de las claves más comunes (codigo, id, seguro, descripcion, nombre).
 */
function toStr(primary: any, fallback: any = undefined): string {
  const raw = primary !== undefined && primary !== null ? primary : fallback;
  if (raw === undefined || raw === null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return String(raw);
  if (typeof raw === 'object') {
    return String(
      raw.codigo ?? raw.id ?? raw.seguro ?? raw.tipoDocumento ??
      raw.descripcion ?? raw.nombre ?? ''
    );
  }
  return String(raw);
}

// Normaliza un campo que puede venir como string o como objeto de ubigeo
function normalizeUbigeo(value: any, prefer: 'distrito' | 'provincia' | 'departamento' | 'ubigeo' = 'distrito'): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (typeof value[prefer] === 'string') return value[prefer].trim();
    if (typeof value[prefer] === 'number') return String(value[prefer]);
    const candidates = ['distrito', 'provincia', 'departamento', 'ubigeo', 'nombre', 'descripcion', 'codigo', 'id'];
    for (const k of candidates) {
      if (typeof value[k] === 'string') return value[k].trim();
      if (typeof value[k] === 'number') return String(value[k]);
    }
  }
  return String(value).trim();
}

function mapFromBackend(record: any): any {
  if (!record) return record;

  const rawSeguro      = record.SEGURO    ?? record.seguro;
  const rawTipoDoc     = record.TIPO_DOCUMENTO ?? record.tipoDocumento;
  const rawEstadoCivil = record.ESTADO_CIVIL ?? record.estadoCivil;

  const mapped: any = {
    PACIENTE:                  record.PACIENTE               ?? record.paciente,
    HISTORIA:                  record.HISTORIA               ?? record.historia,
    NOMBRES:                   record.NOMBRES                ?? record.nombres,
    SEXO:                      record.SEXO                   ?? record.sexo,
    NOMBRE_ESTADO_CIVIL:       record.NOMBRE_ESTADO_CIVIL ?? record.nombreEstadoCivil ?? (typeof rawEstadoCivil === 'object' ? rawEstadoCivil?.nombre : undefined),
    FECHA_APERTURA:            record.FECHA_APERTURA         ?? record.fechaApertura,
    HORA_APERTURA:             record.HORA_APERTURA          ?? record.horaApertura,
    PADRE:                     record.PADRE                  ?? record.padre,
    MADRE:                     record.MADRE                  ?? record.madre,
    DIRECCION:                 record.DIRECCION              ?? record.direccion,
    TELEFONO1:                 record.TELEFONO1              ?? record.telefono1,
    FECHA_NACIMIENTO:          record.FECHA_NACIMIENTO       ?? record.fechaNacimiento,
    DISTRITO:                  normalizeUbigeo(record.DISTRITO  ?? record.distrito,  'distrito'),
    NOMBRE_DOCUMENTO:          record.NOMBRE_DOCUMENTO       ?? record.nombreDocumento,
    DOCUMENTO:                 record.DOCUMENTO              ?? record.documento,
    NOMBRE_OCUPACION:          record.NOMBRE_OCUPACION       ?? record.nombreOcupacion,
    NOMBRE_GRADO_INSTRUCCION:  record.NOMBRE_GRADO_INSTRUCCION ?? record.nombreGradoInstruccion,
    NOMBRE_CONYUGE:            record.NOMBRE_CONYUGE         ?? record.nombreConyuge,
    NOMBRE_SEGURO:             toStr(record.NOMBRE_SEGURO    ?? record.nombreSeguro
                                     ?? (typeof rawSeguro === 'object' ? rawSeguro?.nombre : undefined)),
    NOMBRE_ENTIDAD:            record.NOMBRE_ENTIDAD         ?? record.nombreEntidad,
    ANIO:                      record.ANIO                   ?? record.anio,
    PATERNO:                   record.PATERNO                ?? record.paterno,
    MATERNO:                   record.MATERNO                ?? record.materno,
    NOMBRE:                    record.NOMBRE                 ?? record.nombre,
    LUGAR_NACIMIENTO:          record.LUGAR_NACIMIENTO       ?? record.lugarNacimiento,
    HIJOS:                     record.HIJOS                  ?? record.hijos,
    CONYUGE_OCUPACION:         record.CONYUGE_OCUPACION      ?? record.conyugeOcupacion,
    CONSULTORIO:               record.CONSULTORIO            ?? record.consultorio,
    CONSUL:                    record.CONSUL                 ?? record.consul,
    EDAD:                      record.EDAD                   ?? record.edad,
    ESTADO_CIVIL:              record.ESTADO_CIVIL ?? (typeof rawEstadoCivil === 'object' ? rawEstadoCivil?.estadoCivil : rawEstadoCivil),
    SYSINSERT:                 record.SYSINSERT              ?? record.sysInsert,
    SYSUPDATE:                 record.SYSUPDATE              ?? record.sysUpdate,
    FECHA_CONSULTA:            record.FECHA_CONSULTA         ?? record.fechaConsulta,
    TURNO_CONSULTA:            record.TURNO_CONSULTA         ?? record.turnoConsulta,
    Nombre_Localidad:          record.Nombre_Localidad       ?? record.nombreLocalidad,
    Provincia_Nac:             normalizeUbigeo(record.Provincia_Nac   ?? record.provinciaNac,   'provincia'),
    Departamento_Nac:          normalizeUbigeo(record.Departamento_Nac ?? record.departamentoNac, 'departamento'),
    Distrito_Dir:              normalizeUbigeo(record.Distrito_Dir     ?? record.distritoDir,    'distrito'),
    Provincia_Dir:             normalizeUbigeo(record.Provincia_Dir    ?? record.provinciaDir,   'provincia'),
    Departamento_Dir:          normalizeUbigeo(record.Departamento_Dir ?? record.departamentoDir, 'departamento'),
    USUARIO:                   record.USUARIO                ?? record.usuario,
    FLAG:                      record.FLAG                   ?? record.flag,
    RELIGION:                  record.RELIGION               ?? record.religion,
    DESRELIGION:               record.DESRELIGION            ?? record.desReligion,
    USUARIO_IMP:               record.USUARIO_IMP            ?? record.usuarioImp,
    HISTORIA_ANT:              record.HISTORIA_ANT           ?? record.historiaAnt,
    CODIGOBARRAS:              record.CODIGOBARRAS           ?? record.codigoBarras,
    STRING_FOTO:               record.STRING_FOTO            ?? record.stringFoto,
    TIPO_DOCUMENTO:            toStr(rawTipoDoc),
    LOCALIDAD:                 record.LOCALIDAD              ?? record.localidad,
    TELEFONO2:                 record.TELEFONO2              ?? record.telefono2,
    SEGURO:                    toStr(rawSeguro),
    Expr2:                     record.Expr2                  ?? record.expr2,
    COD_DISTRITO:              record.COD_DISTRITO           ?? record.codDistrito ?? record.expr2,
  };

  return processDateFields(mapped);
}

/**
 * Procesa los campos de fecha en un registro
 */
function processDateFields(record: any): any {
  if (!record) return record;
  
  const dateFields = ['FECHA_NACIMIENTO', 'FECHA_APERTURA', 'SYSINSERT', 'SYSUPDATE', 'FECHA_CONSULTA'];
  const processed = { ...record };
  
  for (const fieldName of dateFields) {
    if (processed[fieldName]) {
      try {
        const fecha = new Date(processed[fieldName]);
        if (!isNaN(fecha.getTime())) {
          processed[fieldName] = fecha.toISOString().split('T')[0];
        } else {
          processed[fieldName] = String(processed[fieldName]);
        }
      } catch (error) {
        processed[fieldName] = String(processed[fieldName]);
      }
    }
  }
  
  return processed;
}

export default filiacionService;
