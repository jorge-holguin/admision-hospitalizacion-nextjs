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
  const nombreUpper = nombresPaciente.toUpperCase()
  const esRN = /\bRN\b/.test(nombreUpper)
  
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
    // Crear un AbortController para el timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos
    
    try {
      // Determinar el tipo de documento: 9 dígitos = Carné de Extranjería (tipo "3"), sino DNI (tipo "1")
      const tipoDocumento = documentNumber.length === 9 ? "3" : "1";
      
      // Usar POST con la estructura correcta requerida por la API
      const response = await fetch(`${SIS_API_URL}/sis/validar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intOpcion: "1",
          strTipoDocumento: tipoDocumento,
          strNroDocumento: documentNumber,
          strTipoFormato: "2",
          strNroContrato: documentNumber
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Error en la API del SIS: ${response.status}`)
      }

      const data: SISValidationResponse = await response.json()

      // Verificar si la respuesta fue exitosa
      if (data.idError === '0' && data.resultado === 'DATOS EXITOSOS') {
        return {
          success: true,
          data
        }
      } else {
        return {
          success: false,
          data: null,
          error: data.resultado
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      // Verificar si fue un timeout
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return {
          success: false,
          data: null,
          error: 'El servicio de verificación SIS no responde'
        }
      }
      
      throw fetchError
    }
  } catch (error) {
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
