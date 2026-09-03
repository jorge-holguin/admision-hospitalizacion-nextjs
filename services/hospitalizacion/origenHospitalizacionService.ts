export interface OrigenHospitalizacion {
  ORIGEN: string
  CODIGO: string
  ID_CITA?: string
  CONSULTORIO?: string
  NOM_CONSULTORIO: string
  PACIENTE?: string
  FECHA?: string | Date
  HORA?: string
  MEDICO?: string
  NOM_MEDICO?: string
  NOMBRES?: string
  DNI?: string
  EDAD?: string
  SEXO?: string
  ESTADO?: string
  DX?: string
  DX_DES?: string
  SEGURO?: string
  PESO?: string
  TALLA?: string
  TEMPERATURA?: string
  PRESION?: string
  PULSO?: string
  OBSERVACION?: string
  MOTIVO_EMERGENCIA?: string
  DESTINO?: string
}

interface FindAllParams {
  skip?: number
  take?: number
  search?: string
  patientId?: string
  pacienteId?: string // alias para compatibilidad
  origen?: string
  onlyPending?: boolean
}

const API_SPRING_URL = import.meta.env.VITE_API_SPRING_URL

async function fetchAttentions(
  params: FindAllParams
): Promise<{ data: OrigenHospitalizacion[]; total: number; message?: string }> {
  const {
    skip = 0,
    take = 10,
    search = '',
    patientId,
    pacienteId,
    origen = '',
    onlyPending = false,
  } = params

  const effectivePatientId = patientId || pacienteId || ''

  if (!API_SPRING_URL) {
    throw new Error('NEXT_PUBLIC_API_SPRING_URL no está configurada')
  }

  const queryParams = new URLSearchParams()
  queryParams.set('skip', skip.toString())
  queryParams.set('take', take.toString())
  if (search) queryParams.set('search', search)
  if (origen) queryParams.set('origen', origen)
  if (onlyPending) queryParams.set('onlyPending', 'true')

  const basePath = effectivePatientId
    ? `${API_SPRING_URL}/hospitalization/attentions/${encodeURIComponent(effectivePatientId)}`
    : `${API_SPRING_URL}/hospitalization/attentions`

  const url = `${basePath}?${queryParams.toString()}`  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    if (response.status === 404) {
      return { data: [], total: 0, message: 'No se encontraron orígenes de hospitalización' }
    }
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }

  const result = await response.json()
  return {
    ...result,
    data: Array.isArray(result.data) ? result.data.map(mapAtencion) : result.data,
  }
}

function mapAtencion(raw: any): OrigenHospitalizacion {
  if (!raw) return raw

  const get = (key: string, fallback = '') => {
    const value = raw[key] ?? raw[key.toUpperCase()] ?? raw[key.toLowerCase()]
    return value != null ? String(value) : fallback
  }

  const consultorio = raw.consultorio ?? raw.CONSULTORIO ?? ''
  const nombreConsultorio =
    raw.nombreConsultorio ??
    raw.NOM_CONSULTORIO ??
    raw.nom_consultorio ??
    raw.NOMBRE ??
    ''

  const idCita =
    raw.idCita ?? raw.ID_CITA ?? raw.id_cita ?? raw.CODIGO ?? raw.codigo ?? raw.id

  return {
    ORIGEN: get('origen', 'EM'),
    CODIGO: String(idCita ?? ''),
    ID_CITA: raw.idCita ?? raw.ID_CITA ?? raw.id_cita ?? undefined,
    CONSULTORIO: String(consultorio),
    NOM_CONSULTORIO: String(nombreConsultorio),
    PACIENTE: get('paciente'),
    FECHA: raw.fecha ?? raw.FECHA ?? undefined,
    HORA: get('hora'),
    MEDICO: get('medico'),
    NOM_MEDICO:
      raw.nombreMedico ?? raw.NOM_MEDICO ?? raw.nom_medico ?? raw.NOMBRE_MEDICO ?? '',
    NOMBRES: get('nombres'),
    DNI: get('documento'),
    EDAD: get('edad'),
    SEXO: get('sexo'),
    ESTADO: get('estado'),
    DX: get('dx'),
    DX_DES: raw.dxDes ?? raw.DX_DES ?? raw.dx_des ?? undefined,
    SEGURO: get('seguro'),
    PESO: get('peso'),
    TALLA: get('talla'),
    TEMPERATURA: get('temperatura'),
    PRESION: get('presion'),
    PULSO: get('pulso'),
    OBSERVACION: get('observacion'),
    MOTIVO_EMERGENCIA: get('motivoEmergencia'),
    DESTINO: get('destino'),
  }
}

export const origenHospitalizacionService = {
  async findAll(params: FindAllParams = {}): Promise<OrigenHospitalizacion[]> {
    const result = await fetchAttentions(params)
    return Array.isArray(result.data) ? result.data : []
  },

  async count(params: Omit<FindAllParams, 'skip' | 'take'> = {}): Promise<number> {
    const result = await fetchAttentions({ ...params, skip: 0, take: 1 })
    return result.total || 0
  },
}
