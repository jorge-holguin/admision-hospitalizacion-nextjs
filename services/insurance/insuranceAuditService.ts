// Servicios para el módulo de Seguros (Auditoría de FUAs)
// Endpoints base: NEXT_PUBLIC_API_CITAS_MASTER_URL

const API_BASE = import.meta.env.VITE_API_CITAS_MASTER_URL

export interface Cita {
  citaId: string
  pagoId?: string
  pacienteId?: string
  medicoId?: string
  consultorioId?: string
  especialidadId?: string
  especialidadSolicitudId?: string
  numeroFua?: string
  numAtencion?: string
  numeroHistoria?: string
  historia?: string
  pacienteNombre?: string
  paciente?: string
  nombre?: string
  fecha?: string
  hora?: string
  turnoConsulta?: string
  seguro?: string
  seguroNombre?: string
  estado?: string
  tipoSolicitud?: string
  tipoPrestacion?: string
  estadoFua?: string | null   // "0" = ANULADO, "1" = ACTIVO, "2" = LIQUIDADO
  consultorioNombre?: string
  medicoNombre?: string
  auditorNombre?: string
  auditorApepaterno?: string
  auditorApematerno?: string
  auditorNombres?: string
  auditorDocumento?: string | null
  firmado?: boolean
  numRef?: string
  entidadSis?: string
}

export interface CitaResponse {
  content: Cita[]
  number: number
  size: number
  totalPages: number
  totalElements: number
}

export interface MedicoItem {
  medico: string
  nombreMedico: string
  consultorio?: string
  nombreConsultorio?: string
}

export interface EspecialidadItem {
  especialidadId: string       // Código SGH (ej: "1091")
  especialidad?: string        // Código local (ej: "0009")
  nombre: string
}

// Formatear fecha como dd/MM/yyyy para el endpoint /cita-auditoria/buscar
function formatDateDDMMYYYY(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0")
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

// Formatear fecha como yyyy-MM-dd para el endpoint /cita/medicos
function formatDateYYYYMMDD(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0")
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const y = date.getFullYear()
  return `${y}-${m}-${d}`
}

export interface BuscarCitasParams {
  desde: Date
  hasta: Date
  especialidadSolicitudArray?: string[]  // Array de IDs de especialidad (repeated query param)
  medico?: string
  turnoConsulta?: "M" | "T"
  estadoFua?: string       // "0" = ANULADO, "1" = ACTIVO, "2" = LIQUIDADO
  estadoCita?: string      // Por defecto "4" (atendida)
  sis?: boolean
  page?: number
  size?: number
}

// GET /api/cita-auditoria/buscar
export async function buscarCitas(params: BuscarCitasParams): Promise<CitaResponse> {
  const qs = new URLSearchParams()
  qs.append("desde", formatDateDDMMYYYY(params.desde))
  qs.append("hasta", formatDateDDMMYYYY(params.hasta))
  qs.append("estado", params.estadoCita ?? "4")
  if (params.sis !== undefined) qs.append("sis", String(params.sis))
  qs.append("page", String(params.page ?? 0))
  qs.append("size", String(params.size ?? 20))
  if (params.especialidadSolicitudArray && params.especialidadSolicitudArray.length > 0) {
    for (const id of params.especialidadSolicitudArray) {
      qs.append("especialidadSolicitudArray", id)
    }
  }
  if (params.medico && params.medico !== "todos") qs.append("medico", params.medico)
  if (params.turnoConsulta) qs.append("turnoConsulta", params.turnoConsulta)
  if (params.estadoFua) qs.append("estadoFua", params.estadoFua)

  const url = `${API_BASE}/cita-auditoria/buscar?${qs.toString()}`
  const res = await fetch(url, { headers: { accept: "*/*" } })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  const data = await res.json()
  // Normalizar: algunos endpoints devuelven directamente un array, otros con .content
  if (Array.isArray(data)) {
    return {
      content: data,
      number: 0,
      size: data.length,
      totalPages: 1,
      totalElements: data.length
    }
  }
  return data as CitaResponse
}

// GET /api/cita/medicos?fechaInicio=...&fechaFin=...&idEspecialidadSolicitud=...
// Nota: la API retorna un formato "invertido" donde `nombre` es el código
// (ej: "AJC") y `medicoId` es el nombre completo (ej: "ANICAMA JORGES...").
// Normalizamos a nuestro MedicoItem estándar.
export async function listarMedicos(
  fechaInicio: Date,
  fechaFin: Date,
  idEspecialidadSolicitud: string
): Promise<MedicoItem[]> {
  const qs = new URLSearchParams()
  qs.append("fechaInicio", formatDateYYYYMMDD(fechaInicio))
  qs.append("fechaFin", formatDateYYYYMMDD(fechaFin))
  qs.append("idEspecialidadSolicitud", idEspecialidadSolicitud)

  const url = `${API_BASE}/cita/medicos?${qs.toString()}`
  const res = await fetch(url, { headers: { accept: "*/*" } })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  const data = await res.json()
  const list = Array.isArray(data) ? data : data?.content || []
  return list.map((m: any) => {
    // Caso 1: API actual → { nombre: "AJC", medicoId: "ANICAMA JORGES..." }
    // Caso 2: formato "estándar" → { medico: "AJC", nombreMedico: "ANICAMA..." }
    const codigo = m.medico ?? m.nombre ?? ""
    const nombreCompleto = m.nombreMedico ?? m.medicoId ?? ""
    return {
      medico: String(codigo).trim(),
      nombreMedico: String(nombreCompleto).trim(),
      consultorio: m.consultorio,
      nombreConsultorio: m.nombreConsultorio,
    }
  }).filter((m: MedicoItem) => m.medico)
}

// GET /api/seguros/atenciones/cita-id?numatencion=XXXXXXXXXXXXXXX
// Devuelve el citaId (string/número) asociado al número de atención (FUA).
// El endpoint puede devolver directamente un string/número o un objeto { citaId }.
export async function buscarCitaIdPorNumAtencion(numatencion: string): Promise<string> {
  const url = `${API_BASE}/seguros/atenciones/cita-id?numatencion=${encodeURIComponent(numatencion)}`
  const res = await fetch(url, { headers: { accept: "*/*" } })
  if (!res.ok) throw new Error(`No se encontró el FUA ${numatencion}`)
  // Intentar como texto primero (endpoint devuelve el ID directo)
  const text = await res.text()
  if (!text) throw new Error(`Respuesta vacía para FUA ${numatencion}`)
  // Si es JSON, intentar parsear
  try {
    const data = JSON.parse(text)
    if (typeof data === "string" || typeof data === "number") return String(data)
    if (data && (data.citaId || data.id)) return String(data.citaId ?? data.id)
  } catch {
    // No es JSON, usar el texto plano
  }
  // Quitar comillas envolventes si existen
  return text.replaceAll(/^"|"$/g, "").trim()
}

// GET /api/cita-auditoria/buscar/idcita?idcita=XXX  (usada para búsqueda por ID de cita)
export async function buscarCitaPorId(citaId: string): Promise<Cita> {
  if (!citaId || citaId === "undefined") {
    throw new Error("ID de cita inválido")
  }
  const url = `${API_BASE}/cita-auditoria/buscar/idcita?idcita=${encodeURIComponent(citaId)}`
  const res = await fetch(url, { headers: { accept: "*/*" } })
  if (!res.ok) throw new Error(`No se encontró la cita ${citaId}`)
  return await res.json()
}

// GET /api/maestro/especialidad/fua
// Devuelve el catálogo completo de especialidades para el FUA.
export async function listarEspecialidades(): Promise<EspecialidadItem[]> {
  const url = `${API_BASE}/maestro/especialidad/fua`
  const res = await fetch(url, { headers: { accept: "*/*" } })
  if (!res.ok) throw new Error(`Error al cargar especialidades: ${res.status}`)
  const data = await res.json()
  const list = Array.isArray(data) ? data : data?.content || data?.data || []
  return list
    .map((e: any) => {
      // El endpoint /maestro/especialidad/fua devuelve:
      // { especialidad: "0001", nombre: "Medicina Interna", activo: 1, semprofesion: "01" }
      const rawId = e.especialidad ?? e.idEspecialidad ?? e.idEspecialidadSolicitud ?? e.especialidadId ?? null
      return {
        especialidadId: rawId != null ? String(rawId) : "",
        especialidad: e.codigo ?? e.Codigo,
        nombre: (e.nombre ?? e.nombreEspecialidad ?? e.Nombre ?? "").toString().trim(),
      }
    })
    .filter((e: EspecialidadItem) => e.especialidadId && e.especialidadId !== "null")
}

// Mapeo para estadoFua: "2" = ACTIVO, "0" = INACTIVO, "1" = PENDIENTE
export const ESTADO_FUA_LABEL: Record<string, string> = {
  "0": "Inactivo",
  "1": "Pendiente",
  "2": "Activo",
}

export const ESTADO_FUA_BADGE: Record<string, string> = {
  "0": "bg-red-100 text-red-800 border border-red-300",
  "1": "bg-yellow-100 text-yellow-800 border border-yellow-300",
  "2": "bg-green-100 text-green-800 border border-green-300",
}

// ============================================================================
// NUEVO ENDPOINT: /api/atencion-seguro/buscar
// ============================================================================

export interface AtencionSeguro {
  rowId?: string
  atencionSeguroId?: string
  numeroFua?: string
  idCuenta?: string
  origen?: string               // "EM" | "HO" | "CE" | "AD"
  seguro?: string
  estadoFua?: string | null     // "0" | "1" | "2"
  estadoCuenta?: string | null  // "0" | "1" | "2" ...
  tipoPrestacion?: string
  tipoPrestacionNombre?: string
  idOrigenTecnico?: string
  pacienteId?: string
  pacienteNombre?: string
  fecha?: string
  hora?: string
  medicoNombre?: string
  consultorioNombre?: string
  estadoProceso?: string | number | null
  // Usuario que registró / procesó la atención
  usuario?: string
  usuarioNombre?: string
  // Auditor (campo futuro que el backend incorporará en una mejora)
  auditorNombre?: string
  auditorApepaterno?: string
  auditorApematerno?: string
  auditorNombres?: string
  auditorDocumento?: string | null
}

export interface AtencionSeguroResponse {
  content: AtencionSeguro[]
  number: number
  size: number
  totalPages: number
  totalElements: number
}

export interface BuscarAtencionesSeguroParams {
  desde: Date
  hasta: Date
  origen?: "EM" | "HO" | "CE" | "AD"
  especialidadSolicitudArray?: string[]  // IDs de especialidad (repeated query param)
  consultorio?: string
  medico?: string
  tipoPrestacion?: string       // código de tipo de prestación (ej: "056")
  estadoFua?: boolean           // true = activo, false = inactivo, undefined = todos
  estadoCuenta?: string         // "0" | "1" | "2" | "4"
  sis?: boolean                  // por defecto true
  page?: number
  size?: number
}

// GET /api/atencion-seguro/buscar
export async function buscarAtencionesSeguro(
  params: BuscarAtencionesSeguroParams
): Promise<AtencionSeguroResponse> {
  const qs = new URLSearchParams()
  qs.append("desde", formatDateDDMMYYYY(params.desde))
  qs.append("hasta", formatDateDDMMYYYY(params.hasta))
  if (params.origen) qs.append("origen", params.origen)
  if (params.especialidadSolicitudArray && params.especialidadSolicitudArray.length > 0) {
    for (const id of params.especialidadSolicitudArray) {
      qs.append("especialidadSolicitudArray", id)
    }
  }
  if (params.consultorio) qs.append("consultorio", params.consultorio)
  if (params.medico) qs.append("medico", params.medico)
  if (params.tipoPrestacion) qs.append("tipoPrestacion", params.tipoPrestacion)
  if (params.estadoFua !== undefined) qs.append("estadoFua", String(params.estadoFua))
  if (params.estadoCuenta) qs.append("estadoCuenta", params.estadoCuenta)
  // SIS por defecto en true
  qs.append("sis", String(params.sis ?? true))
  qs.append("page", String(params.page ?? 0))
  qs.append("size", String(params.size ?? 20))

  const url = `${API_BASE}/atencion-seguro/buscar?${qs.toString()}`
  const res = await fetch(url, { headers: { accept: "application/json" } })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  const data = await res.json()
  // Normalizar: algunos endpoints devuelven directamente un array, otros con .content
  if (Array.isArray(data)) {
    return {
      content: data,
      number: 0,
      size: data.length,
      totalPages: 1,
      totalElements: data.length,
    }
  }
  return data as AtencionSeguroResponse
}

// GET /api/atencion-seguro/buscar/excel
// Descarga un archivo .xlsx con TODOS los registros que cumplen los filtros
// (sin paginación). Acepta los mismos parámetros que /buscar excepto page/size.
export async function exportarAtencionesSeguroExcel(
  params: Omit<BuscarAtencionesSeguroParams, "page" | "size">
): Promise<Blob> {
  const qs = new URLSearchParams()
  qs.append("desde", formatDateDDMMYYYY(params.desde))
  qs.append("hasta", formatDateDDMMYYYY(params.hasta))
  if (params.origen) qs.append("origen", params.origen)
  if (params.especialidadSolicitudArray && params.especialidadSolicitudArray.length > 0) {
    for (const id of params.especialidadSolicitudArray) {
      qs.append("especialidadSolicitudArray", id)
    }
  }
  if (params.consultorio) qs.append("consultorio", params.consultorio)
  if (params.medico) qs.append("medico", params.medico)
  if (params.tipoPrestacion) qs.append("tipoPrestacion", params.tipoPrestacion)
  if (params.estadoFua !== undefined) qs.append("estadoFua", String(params.estadoFua))
  if (params.estadoCuenta) qs.append("estadoCuenta", params.estadoCuenta)
  qs.append("sis", String(params.sis ?? true))

  const url = `${API_BASE}/atencion-seguro/buscar/excel?${qs.toString()}`
  const res = await fetch(url, {
    headers: {
      accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  return await res.blob()
}

// ============================================================================
// Médicos-Consultorios (para selectores de médico y consultorio en /insurance)
// ============================================================================

export interface MedicoConsultorioItem {
  medico: string
  nombreMedico: string
  consultorio: string
  nombreConsultorio: string
}

// GET /api/cita/medicos-consultorios?desde=dd/MM/yyyy&hasta=dd/MM/yyyy
export async function listarMedicosConsultorios(
  desde: Date,
  hasta: Date
): Promise<MedicoConsultorioItem[]> {
  const qs = new URLSearchParams()
  qs.append("desde", formatDateDDMMYYYY(desde))
  qs.append("hasta", formatDateDDMMYYYY(hasta))
  const url = `${API_BASE}/cita/medicos-consultorios?${qs.toString()}`
  const res = await fetch(url, { headers: { accept: "*/*" } })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  const data = await res.json()
  const list = Array.isArray(data) ? data : data?.content || []
  return list.map((m: any) => ({
    medico: String(m.medico ?? "").trim(),
    nombreMedico: String(m.nombreMedico ?? "").trim(),
    consultorio: String(m.consultorio ?? "").trim(),
    nombreConsultorio: String(m.nombreConsultorio ?? "").trim(),
  }))
}

// Mapeo para estadoCuenta
// 0 ANULADA, 1 ACTIVO, 2 LIQUIDADO, 4 AUDITADO
export const ESTADO_CUENTA_LABEL: Record<string, string> = {
  "0": "Anulada",
  "1": "Activa",
  "2": "Liquidada",
  "4": "Auditada",
}

export const ESTADO_CUENTA_BADGE: Record<string, string> = {
  "0": "bg-red-100 text-red-800 border border-red-300",
  "1": "bg-green-100 text-green-800 border border-green-300",
  "2": "bg-blue-100 text-blue-800 border border-blue-300",
  "4": "bg-amber-100 text-amber-800 border border-amber-300",
}

// Mapeo para origen (módulo que generó la atención)
export const ORIGEN_LABEL: Record<string, string> = {
  EM: "Emergencia",
  HO: "Hospitalización",
  CE: "Consulta Externa",
  AD: "Apoyo al Diagnostico",
  AA: "Atención Ambulatoria",
}

// Abreviatura compacta para mostrar en tablas donde el espacio es crítico.
// E = Emergencia, AD = Apoyo al Diagnóstico, HO = Hospitalización, CE = Consulta Externa, AA = Atención Ambulatoria
export const ORIGEN_ABBR: Record<string, string> = {
  EM: "E",
  HO: "HO",
  CE: "CE",
  AD: "AD",
  AA: "AA",
}

// ============================================================================
// ESTADO PROCESO (estado interno de la atención)
// 0: ANULADO
// 1: SIN ASIGNAR CITA
// 2: CITA ASIGNADA SIN FUA
// 3: YA TIENE FUA O ESTÁ PAGADO
// 4: ATENDIDO
// 5: DESERCIÓN
// ============================================================================
export const ESTADO_PROCESO_LABEL: Record<string, string> = {
  "0": "ANULADO",
  "1": "SIN ASIGNAR CITA",
  "2": "CITA ASIGNADA SIN PAGO O SIN FUA",
  "3": "PAGADO O CON FUA",
  "4": "ATENDIDO",
  "5": "DESERCION",
}

// Versión compacta para mostrar en badges de tabla donde el espacio es limitado.
// El texto completo (arriba) se muestra en el tooltip (title) al pasar el mouse.
export const ESTADO_PROCESO_SHORT_LABEL: Record<string, string> = {
  "0": "ANULADO",
  "1": "SIN CITA",
  "2": "SIN PAGO/FUA",
  "3": "CON FUA",
  "4": "ATENDIDO",
  "5": "DESERCION",
}

export const ESTADO_PROCESO_BADGE: Record<string, string> = {
  "0": "bg-gray-200 text-gray-700 border border-gray-400",           // Plomo
  "1": "bg-yellow-100 text-yellow-800 border border-yellow-300",     // Amarillo
  "2": "bg-orange-100 text-orange-800 border border-orange-300",     // Naranja
  "3": "bg-blue-100 text-blue-800 border border-blue-300",           // Azul
  "4": "bg-green-100 text-green-800 border border-green-300",        // Verde
  "5": "bg-red-100 text-red-800 border border-red-300",              // Rojo
}

// ============================================================================
// ESTADO PROCESO POR ORIGEN
// EM = Emergencia  |  HO = Hospitalización  |  AD = Apoyo al Diagnóstico
// ============================================================================
export const EM_ESTADO_LABEL: Record<string, string> = {
  "0": "ANULADO",
  "2": "REGISTRADO",
  "3": "EN ATENCIÓN",
  "4": "ATENDIDO",
  "5": "CERRADO",
  "6": "AUSENCIA",
}
export const EM_ESTADO_BADGE: Record<string, string> = {
  "0": "bg-gray-200 text-gray-800",
  "2": "bg-blue-200 text-blue-800",
  "3": "bg-yellow-200 text-yellow-800",
  "4": "bg-green-200 text-green-800",
  "5": "bg-purple-200 text-purple-800",
  "6": "bg-indigo-200 text-indigo-800",
}

export const HO_ESTADO_LABEL: Record<string, string> = {
  "0": "ANULADO",
  "2": "ACTIVO",
  "3": "ACEPTADA",
}
export const HO_ESTADO_BADGE: Record<string, string> = {
  "0": "bg-gray-200 text-gray-800",
  "2": "bg-yellow-200 text-yellow-800",
  "3": "bg-green-200 text-green-800",
}

export const AD_ESTADO_LABEL = "POR DETERMINAR"
export const AD_ESTADO_BADGE = "bg-gray-300 text-gray-600"

export function estadoProcesoDisplay(origen: string, estado: string) {
  const o = (origen || "").trim()
  const e = (estado || "").trim()

  if (o === "AD" || o === "AA") {
    return { label: AD_ESTADO_LABEL, className: AD_ESTADO_BADGE }
  }

  if (o === "EM") {
    return {
      label: EM_ESTADO_LABEL[e] || e || "—",
      className: EM_ESTADO_BADGE[e] || "bg-gray-100 text-gray-800",
    }
  }

  if (o === "HO") {
    return {
      label: HO_ESTADO_LABEL[e] || e || "—",
      className: HO_ESTADO_BADGE[e] || "bg-gray-100 text-gray-800",
    }
  }

  // Default: CE (Consulta Externa)
  return {
    label: ESTADO_PROCESO_SHORT_LABEL[e] || e || "—",
    fullLabel: ESTADO_PROCESO_LABEL[e] || "Sin estado",
    className: ESTADO_PROCESO_BADGE[e] || "bg-gray-100 text-gray-800 border border-gray-300",
  }
}

// ============================================================================
// FUA por origen: endpoints que reciben numatencion (no citaId)
// ============================================================================
//   GET /api/atencion-seguro/fua/consulta-externa?numatencion=...
//   GET /api/atencion-seguro/fua/emergencia?numatencion=...
//   GET /api/atencion-seguro/fua/hospitalizacion?numatencion=...
const FUA_ENDPOINT_BY_ORIGEN: Record<string, string> = {
  CE: "atencion-seguro/fua/consulta-externa",
  EM: "atencion-seguro/fua/emergencia",
  HO: "atencion-seguro/fua/hospitalizacion",
  AD: "atencion-seguro/fua/atencion-ambulatoria",
  AA: "atencion-seguro/fua/atencion-ambulatoria",
}

export function getFuaUrlByOrigen(
  origen: string | undefined | null,
  numatencion: string | undefined | null
): string {
  if (!origen || !numatencion) return ""
  const path = FUA_ENDPOINT_BY_ORIGEN[origen.trim().toUpperCase()]
  if (!path) return ""
  return `${API_BASE}/${path}?numatencion=${encodeURIComponent(numatencion.toString().trim())}`
}

// GET /api/atencion-seguro/fua/{origen}?numatencion=...
// Devuelve la información del FUA en formato JSON (no es un PDF).
// Se usa para mostrar el registro como una fila en la tabla cuando se busca
// directamente por N° de FUA.
export async function obtenerFuaPorOrigen(
  origen: string,
  numatencion: string
): Promise<AtencionSeguro> {
  const path = FUA_ENDPOINT_BY_ORIGEN[origen.trim().toUpperCase()]
  if (!path) throw new Error(`Origen inválido: ${origen}`)
  const url = `${API_BASE}/${path}?numatencion=${encodeURIComponent(numatencion.trim())}`
  const res = await fetch(url, { headers: { accept: "*/*" } })
  if (!res.ok) throw new Error(`No se encontró el FUA ${numatencion}`)
  const data = await res.json()
  // Algunas respuestas pueden venir como array o como objeto
  const item = Array.isArray(data) ? data[0] : data
  if (!item || (typeof item === "object" && Object.keys(item).length === 0)) {
    throw new Error(`No se encontró el FUA ${numatencion}`)
  }
  // Normalizar campos: los endpoints /fua/{origen} usan nombres distintos a /buscar
  //   paciente        → pacienteId
  //   nombres         → pacienteNombre
  //   fechaAtencion   → fecha
  //   horaAtencion    → hora
  //   detalleId       → idOrigenTecnico (para abrir FUA/Liquidación)
  const normalized: AtencionSeguro = {
    ...item,
    origen: origen.trim().toUpperCase(),
    pacienteId: item.pacienteId ?? item.paciente ?? undefined,
    pacienteNombre: item.pacienteNombre ?? item.nombres ?? undefined,
    fecha: item.fecha ?? item.fechaAtencion ?? undefined,
    hora: item.hora ?? item.horaAtencion ?? undefined,
    idOrigenTecnico:
      item.idOrigenTecnico ?? item.detalleId ?? item.cuentaId ?? undefined,
    medicoNombre:
      item.medicoNombre ?? item.detalleMedicoNombre ?? undefined,
    consultorioNombre:
      item.consultorioNombre ?? item.detalleConsultorioNombre ?? undefined,
    idCuenta: item.idCuenta ?? item.cuentaId ?? undefined,
  }
  return normalized
}

// ============================================================================
// Catálogo: consultorios por tipo
// ============================================================================
//   CE (Consulta Externa)  → tipo=C
//   EM (Emergencia)        → tipo=E
//   HO (Hospitalización)   → tipo=H
//   TODOS (sin filtro)     → tipo=undefined (omite el parámetro tipo)
export interface ConsultorioMaestroItem {
  consultorio: string        // código (ej: "1015")
  nombreConsultorio: string
  tipo?: string
  activo?: number | boolean
}

export const ORIGEN_TO_CONSULTORIO_TIPO: Record<string, "C" | "E" | "H" | "D" | undefined> = {
  TODOS: undefined,
  CE: "C",
  EM: "E",
  HO: "H",
  AD: "D",
  AA: "D",
}

// GET /api/maestro/consultorio/buscar?tipo=X&soloActivos=true
// Si tipo es undefined, no se incluye el parámetro tipo (retorna todos los consultorios)
export async function listarConsultoriosPorTipo(
  tipo: "C" | "E" | "H" | "D" | undefined,
  soloActivos: boolean = true
): Promise<ConsultorioMaestroItem[]> {
  const qs = new URLSearchParams()
  if (tipo) qs.append("tipo", tipo)
  qs.append("soloActivos", String(soloActivos))
  const url = `${API_BASE}/maestro/consultorio/buscar?${qs.toString()}`
  const res = await fetch(url, { headers: { accept: "*/*" } })
  if (!res.ok) throw new Error(`Error al cargar consultorios: ${res.status}`)
  const data = await res.json()
  const list = Array.isArray(data) ? data : data?.content || []
  return list
    .map((c: any) => ({
      consultorio: String(
        c.consultorio ?? c.codigo ?? c.idConsultorio ?? ""
      ).trim(),
      nombreConsultorio: String(
        c.nombreConsultorio ?? c.nombre ?? c.descripcion ?? ""
      ).trim(),
      tipo: c.tipo,
      activo: c.activo,
    }))
    .filter((c: ConsultorioMaestroItem) => c.consultorio)
}

// ============================================================================
// Catálogo: tipos de prestación
// ============================================================================

export interface TipoPrestacionItem {
  tipoPrestacion: string  // código (ej: "056")
  nombre: string
}

// GET /api/maestro/tipo-prestacion/obtener-todos
export async function listarTiposPrestacion(): Promise<TipoPrestacionItem[]> {
  const url = `${API_BASE}/maestro/tipo-prestacion/obtener-todos`
  const res = await fetch(url, { headers: { accept: "*/*" } })
  if (!res.ok) throw new Error(`Error al cargar tipos de prestación: ${res.status}`)
  const data = await res.json()
  const list = Array.isArray(data) ? data : data?.content || []
  return list
    .map((t: any) => ({
      tipoPrestacion: String(t.tipoPrestacion ?? t.codigo ?? "").trim(),
      nombre: String(t.nombre ?? t.descripcion ?? "").trim(),
    }))
    .filter((t: TipoPrestacionItem) => t.tipoPrestacion)
}

export const ORIGEN_BADGE: Record<string, string> = {
  EM: "bg-red-100 text-red-800 border border-red-300",
  HO: "bg-blue-100 text-blue-800 border border-blue-300",
  CE: "bg-green-100 text-green-800 border border-green-300",
  AD: "bg-purple-100 text-purple-800 border border-purple-300",
  AA: "bg-indigo-100 text-indigo-800 border border-indigo-300",
}
