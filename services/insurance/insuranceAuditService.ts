// Servicios para el módulo de Seguros (Auditoría de FUAs)
// Endpoints base: NEXT_PUBLIC_API_CITAS_MASTER_URL

const API_BASE = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL

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

// Mapeo para estadoFua: "0" = ANULADO, "1" = ACTIVO, "2" = LIQUIDADO
export const ESTADO_FUA_LABEL: Record<string, string> = {
  "0": "Anulado",
  "1": "Activo",
  "2": "Liquidado",
}

export const ESTADO_FUA_BADGE: Record<string, string> = {
  "0": "bg-red-100 text-red-800 border border-red-300",
  "1": "bg-green-100 text-green-800 border border-green-300",
  "2": "bg-blue-100 text-blue-800 border border-blue-300",
}
