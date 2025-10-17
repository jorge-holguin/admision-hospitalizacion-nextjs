/**
 * Servicio para consultar la API del SIS (Sistema Integral de Salud)
 */

const SIS_API_URL = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011/api'

export interface SISValidationResponse {
  idError: string
  resultado: string
  tipoDocumento: string
  nroDocumento: string
  apePaterno: string
  apeMaterno: string
  nombres: string
  fecAfiliacion: string
  eess: string
  descEESS: string
  descEESSUbigeo: string
  regimen: string
  tipoSeguro: string
  descTipoSeguro: string
  contrato: string
  fecCaducidad: string
  estado: string
  tabla: string
  idNumReg: string
  genero: string
  fecNacimiento: string
  idUbigeo: string
  direccion: string | null
  disa: string
  tipoFormato: string
  nroContrato: string
  correlativo: string
  idPlan: string
  idGrupoPoblacional: string
  msgConfidencial: string
  eessubigeo: string
}

/**
 * Mapea el tipo de seguro del SIS al código del selector de seguros
 * @param tipoSeguroSIS Código del tipo de seguro del SIS (01, 02, 03, 04, 05)
 * @param nombresPaciente Nombres del paciente para detectar RN
 * @returns Código del seguro para el selector
 */
export function mapSISSeguroToLocal(tipoSeguroSIS: string, nombresPaciente: string = ''): string {
  // Detectar RN solo cuando aparece como palabra separada (ej: "RN PEREZ" o "PEREZ RN")
  // No debe detectar RN dentro de palabras como "FERNANDEZ"
  const nombreUpper = nombresPaciente.toUpperCase()
  const esRN = /\bRN\b/.test(nombreUpper) // \b = word boundary (límite de palabra)
  
  console.log(`🔍 Detectando RN en nombre: "${nombresPaciente}"`)
  console.log(`   - Nombre en mayúsculas: "${nombreUpper}"`)
  console.log(`   - ¿Es RN?: ${esRN}`)
  
  switch (tipoSeguroSIS) {
    case '05':
      return '20' // SIS PARA TODOS
    case '02':
      return '22' // SIS INDEPENDIENTE
    case '01':
      return esRN ? '25' : '21' // SIS GRATUITO o SIS RN
    case '03':
      return '24' // SIS MICROEMPRESAS
    case '04':
      return '23' // SIS EMPRENDEDOR
    default:
      return '21' // Por defecto SIS GRATUITO
  }
}

/**
 * Consulta la API del SIS para validar un paciente
 * @param documentNumber Número de documento del paciente
 * @returns Respuesta de la API del SIS
 */
export async function consultarSIS(documentNumber: string): Promise<{
  success: boolean
  data: SISValidationResponse | null
  error?: string
}> {
  try {
    console.log(`🏥 Consultando SIS para documento: ${documentNumber}`)
    
    // Usar POST con la estructura correcta requerida por la API
    const response = await fetch(`${SIS_API_URL}/sis/validar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intOpcion: "1",
        strTipoDocumento: "1",
        strNroDocumento: documentNumber,
        strTipoFormato: "2",
        strNroContrato: documentNumber
      })
    })

    if (!response.ok) {
      throw new Error(`Error en la API del SIS: ${response.status}`)
    }

    const data: SISValidationResponse = await response.json()

    // Verificar si la respuesta fue exitosa
    if (data.idError === '0' && data.resultado === 'DATOS EXITOSOS') {
      console.log(`✅ Datos del SIS obtenidos exitosamente`)
      console.log(`📋 Tipo de seguro SIS: ${data.tipoSeguro} - ${data.descTipoSeguro}`)
      console.log(`👤 Paciente: ${data.nombres} ${data.apePaterno} ${data.apeMaterno}`)
      console.log(`📅 Estado: ${data.estado}`)
      
      return {
        success: true,
        data
      }
    } else {
      console.warn(`⚠️ SIS no encontró datos: ${data.resultado}`)
      return {
        success: false,
        data: null,
        error: data.resultado
      }
    }
  } catch (error) {
    console.error('❌ Error al consultar SIS:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Obtiene el nombre descriptivo del tipo de seguro SIS
 * @param tipoSeguroSIS Código del tipo de seguro del SIS
 * @returns Nombre descriptivo del seguro
 */
export function getSISSeguroDescription(tipoSeguroSIS: string): string {
  switch (tipoSeguroSIS) {
    case '05':
      return 'SUBSIDIADO (SIS PARA TODOS)'
    case '02':
      return 'SIS INDEPENDIENTE'
    case '01':
      return 'SUBSIDIADO (SIS GRATUITO)'
    case '03':
      return 'SIS MICROEMPRESAS'
    case '04':
      return 'SIS EMPRENDEDOR'
    default:
      return 'SIS'
  }
}
