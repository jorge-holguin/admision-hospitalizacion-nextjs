import { API_ENDPOINTS, API_BACKEND_URL, buildUrl, fetchApi } from '@/lib/api-config'

export interface RegistroDemandaInsatisfecha {
  idDemanda?: number
  especialidad?: string
  nombreEspecialidad?: string
  medicoDocumento?: string
  nombreMedico?: string
  medico?: string
  turno?: string
  nombreTurno?: string
  fecha?: string
  fechaHoraInicio?: string
  motivoLlamada?: string
  descripcionMotivo?: string
  motivo?: string
  documentoPaciente?: string
  dni?: string
  paciente?: string
  nombrePaciente?: string
  tipoDocumento?: string
  nombreTipoDocumento?: string
  tipoComunicacion?: string
  descripcionTipoComunicacion?: string
  observacion?: string
  estado?: string | number
  regUsuarioCreacion?: string
  regFechaCreacion?: string
}

export interface DemandaPayload {
  especialidad: string
  medicoDocumento: string
  fecha: string | null
  turno: string
  tipoDocumento: string
  documentoPaciente: string
  nombrePaciente: string
  tipoComunicacion: string
  motivo: string
  observacion?: string
  estado: string
  origen: string
}

export interface DemandaListParams {
  page?: number
  size?: number
  fechaDesde?: string
  fechaHasta?: string
  fecha?: string
  estado?: string
  especialidad?: string
  tipoComunicacion?: string
  tipoDocumento?: string
  documentoPaciente?: string
  sort?: string
}

function unwrapItems(response: any): any[] {
  if (Array.isArray(response)) return response
  if (response?.content && Array.isArray(response.content)) return response.content
  if (response?.data?.content && Array.isArray(response.data.content)) return response.data.content
  if (response?.data && Array.isArray(response.data)) return response.data
  return []
}

function mapItem(item: any): RegistroDemandaInsatisfecha {
  return {
    idDemanda: item.idDemanda,
    especialidad: item.especialidad,
    nombreEspecialidad: item.nombreEspecialidad || item.especialidad,
    medicoDocumento: item.medicoDocumento,
    nombreMedico: item.nombreMedico || item.medicoDocumento,
    medico: item.nombreMedico || item.medicoDocumento,
    turno: item.turno,
    nombreTurno: item.nombreTurno || item.turno,
    fecha: item.fecha,
    fechaHoraInicio: item.fecha,
    motivoLlamada: item.descripcionMotivo || item.motivo,
    descripcionMotivo: item.descripcionMotivo || item.motivo,
    motivo: item.motivo,
    documentoPaciente: item.documentoPaciente,
    dni: item.documentoPaciente,
    paciente: item.nombrePaciente,
    nombrePaciente: item.nombrePaciente,
    tipoDocumento: item.tipoDocumento,
    nombreTipoDocumento: item.nombreTipoDocumento || item.tipoDocumento,
    tipoComunicacion: item.tipoComunicacion,
    descripcionTipoComunicacion: item.descripcionTipoComunicacion || item.tipoComunicacion,
    observacion: item.observacion,
    estado: item.estado,
    regUsuarioCreacion: item.regUsuarioCreacion,
    regFechaCreacion: item.regFechaCreacion,
  }
}

export async function listarDemandasInsatisfechas(params: DemandaListParams = {}): Promise<{ items: RegistroDemandaInsatisfecha[], total: number }> {
  const { page = 0, size = 1000, ...rest } = params
  const url = buildUrl(API_ENDPOINTS.demandaInsatisfecha.list, { page, size, ...rest } as any)
  const res = await fetchApi(url)
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  const response = await res.json()
  const items = unwrapItems(response).map(mapItem)
  const total = response.totalElements ?? response.data?.totalElements ?? response.total ?? items.length
  return { items, total }
}

export async function obtenerDemandaById(id: number): Promise<RegistroDemandaInsatisfecha> {
  const url = API_ENDPOINTS.demandaInsatisfecha.byId(id)
  const res = await fetchApi(url)
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  const response = await res.json()
  const data = response.data || response.content || response
  return mapItem(data)
}

export async function guardarDemandaInsatisfecha(payload: DemandaPayload, usuario: string): Promise<any> {
  const url = buildUrl(API_ENDPOINTS.demandaInsatisfecha.create, { usuario })
  const res = await fetchApi(url, {
    method: 'POST',
    body: JSON.stringify({ ...payload, origen: 'A' }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Error ${res.status}: ${err || res.statusText}`)
  }
  return res.json()
}

export async function actualizarDemandaInsatisfecha(id: number, payload: DemandaPayload, usuario: string): Promise<any> {
  const url = buildUrl(API_ENDPOINTS.demandaInsatisfecha.update(id), { usuario })
  const res = await fetchApi(url, {
    method: 'PUT',
    body: JSON.stringify({ ...payload, origen: 'A' }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Error ${res.status}: ${err || res.statusText}`)
  }
  return res.json()
}

export async function eliminarDemandaInsatisfecha(id: number, usuario: string): Promise<any> {
  const url = buildUrl(API_ENDPOINTS.demandaInsatisfecha.delete(id), { usuario })
  const res = await fetchApi(url, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Error ${res.status}: ${err || res.statusText}`)
  }
  return res.json().catch(() => ({}))
}

export async function getMotivosLlamada(): Promise<any[]> {
  try {
    const res = await fetchApi(API_ENDPOINTS.callCenter.motivosLlamada)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data?.data || data?.content || [])
  } catch {
    return []
  }
}

export async function getMaestrosCallCenter(): Promise<any[]> {
  try {
    const res = await fetchApi(API_ENDPOINTS.callCenter.maestros)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data?.data || data?.content || [])
  } catch {
    return []
  }
}

export async function getEspecialidadesFUA(): Promise<any[]> {
  try {
    const res = await fetchApi(API_ENDPOINTS.callCenter.especialidadesFua)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data?.data || data?.content || [])
  } catch {
    return []
  }
}

function formatDateDDMMYYYY(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

// GET /api/cita/medicos?fechaInicio=dd/mm/yyyy&fechaFin=dd/mm/yyyy&idEspecialidad=COD
// Rango de fechas: fechaFin - 30 días hasta fechaFin (por defecto: hoy - 30 días a hoy).
export async function buscarMedicosPorEspecialidad(idEspecialidad: string, fechaFin?: string): Promise<any[]> {
  try {
    const fin = fechaFin ? parseISODate(fechaFin) : new Date()
    const inicio = new Date(fin)
    inicio.setDate(fin.getDate() - 30)

    const params = {
      fechaInicio: formatDateDDMMYYYY(inicio),
      fechaFin: formatDateDDMMYYYY(fin),
      idEspecialidad,
    }

    const url = buildUrl(`${API_BACKEND_URL}/cita/medicos`, params as any)
    const res = await fetchApi(url)
    if (!res.ok) return []
    const data = await res.json()
    const items = Array.isArray(data) ? data : (data?.data || data?.content || [data])
    return items.map((m: any) => ({
      ...m,
      dni: m.documento ?? m.dni ?? m.DNI ?? m.MEDICODOCUMENTO ?? m.medicoDocumento ?? '',
      nombre: m.medicoId ?? m.nombreMedico ?? m.nombres ?? m.NOMBRES ?? m.nombre ?? m.NOMBRE ?? '',
    }))
  } catch {
    return []
  }
}

export async function buscarPersonal(query: string): Promise<any[]> {
  try {
    const isDni = /^\d+$/.test(query)
    const params = isDni ? { dni: query } : { nombre: query }
    const url = buildUrl(API_ENDPOINTS.personal.buscar, params as any)
    const res = await fetchApi(url)
    if (!res.ok) return []
    const data = await res.json()
    const items = Array.isArray(data) ? data : (data?.data || data?.content || [])
    return items.map((p: any) => ({
      ...p,
      dni: p.dni || p.DNI || p.documento || p.DOCUMENTO || p.medicoDocumento || p.MEDICODOCUMENTO || '',
      nombre: p.nombre || p.NOMBRE || p.nombres || p.NOMBRES || p.name || p.NAME || p.medico || p.MEDICO || '',
    }))
  } catch {
    return []
  }
}
