// Servicio para sincronizar citas con REFCON

const API_REFCON_URL = process.env.NEXT_PUBLIC_API_REFCON_URL || 'http://192.168.0.31:9011/api'
const API_REFCON_CITA_URL = 'http://192.168.0.252:9011/api'

// Códigos de seguros SIS
const SEGUROS_SIS = ['20', '21', '22', '23', '24', '25']

interface DatosCita {
  consultorio: string
  fecha: string // formato: YYYYMMDD
  hora: string
  turno: string
}

interface DatosMedico {
  apellidoMaterno: string
  apellidoPaterno: string
  fechaNacimiento: string
  nombres: string
  nroDocumento: string
  sexo: string
  tipoDocumento: string
}

interface PersonalRegistra {
  apellidoMaterno: string
  apellidoPaterno: string
  fechaNacimiento: string
  idcolegio: string
  idprofesion: string
  nombres: string
  nroDocumento: string
  sexo: string
  tipoDocumento: string
}

interface RefconSyncPayload {
  codUnicoDestino: string
  idReferencia: string
  datosCita: DatosCita
  datosMedico: DatosMedico
  personalRegistra: PersonalRegistra
}

/**
 * Verifica si un código de seguro es tipo SIS
 */
export function esSeguroSIS(codigoSeguro: string): boolean {
  const codigo = codigoSeguro.trim()
  return SEGUROS_SIS.includes(codigo)
}

/**
 * Obtiene los datos de la cita desde REFCON para sincronización
 */
export async function obtenerDatosCitaRefcon(citaId: string, usuarioAsigna: string): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    console.log('🔍 Obteniendo datos de cita desde REFCON:', citaId)

    const response = await fetch(`${API_REFCON_CITA_URL}/cita/refcon/recibir-cita/${citaId}`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'usuarioAsgina': usuarioAsigna
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error obteniendo datos de REFCON:', errorText)
      throw new Error(`Error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Datos de cita obtenidos desde REFCON:', data)

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('❌ Error al obtener datos de REFCON:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener datos de REFCON'
    }
  }
}

/**
 * Sincroniza una cita asignada con el sistema REFCON
 */
export async function sincronizarCitaConRefcon(payload: RefconSyncPayload): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    console.log('🔄 Sincronizando cita con REFCON:', payload)

    const response = await fetch(`${API_REFCON_URL}/referencia/recibir-cita`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error sincronizando con REFCON:', errorText)
      throw new Error(`Error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Cita sincronizada exitosamente con REFCON:', data)

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('❌ Error en sincronización con REFCON:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al sincronizar con REFCON'
    }
  }
}

/**
 * Formatea una fecha DD/MM/YYYY a YYYYMMDD
 */
export function formatDateToRefcon(date: string): string {
  // Si viene en formato DD/MM/YYYY
  if (date.includes('/')) {
    const [day, month, year] = date.split('/')
    return `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`
  }
  
  // Si viene en formato YYYY-MM-DD
  if (date.includes('-')) {
    return date.replace(/-/g, '')
  }
  
  return date
}

/**
 * Formatea una fecha de nacimiento DD/MM/YYYY a YYYYMMDD
 */
export function formatBirthDateToRefcon(birthDate: string): string {
  if (!birthDate) return ''
  
  // Si viene en formato DD/MM/YYYY
  if (birthDate.includes('/')) {
    const [day, month, year] = birthDate.split('/')
    return `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`
  }
  
  // Si viene en formato YYYY-MM-DD
  if (birthDate.includes('-')) {
    return birthDate.replace(/-/g, '')
  }
  
  return birthDate
}

/**
 * Obtiene el tipo de documento en formato REFCON (1=DNI, 2=CE, etc)
 */
export function getTipoDocumentoRefcon(tipoDoc: string): string {
  if (tipoDoc === 'D' || tipoDoc === 'DNI') return '1'
  if (tipoDoc === 'CE' || tipoDoc === 'C') return '2'
  return tipoDoc
}

/**
 * Actualiza el estado de REFCON para una cita
 * Estados:
 * 0 — Validación manual: La referencia no fue validada con REFCON
 * 1 — API consultada, pendiente: Se consumió la API, pero el estado aún no se actualiza (REFCON falló)
 * 2 — Validado y actualizado: REFCON validó correctamente y el estado de la referencia fue cambiado
 * 3 — Validado pero con referencia reutilizada: REFCON validó, pero la referencia ya estaba CITADA o RECIBIDA
 */
export async function actualizarEstadoRefcon(citaId: string, estadoRefcon: number): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    console.log(`🔄 Actualizando estado REFCON para cita ${citaId} a estado: ${estadoRefcon}`)

    const response = await fetch(`${API_REFCON_CITA_URL}/cita/${citaId}/refcon-estado?estadoRefcon=${estadoRefcon}`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error actualizando estado REFCON:', errorText)
      throw new Error(`Error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Estado REFCON actualizado exitosamente:', data)

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('❌ Error al actualizar estado REFCON:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar estado REFCON'
    }
  }
}
