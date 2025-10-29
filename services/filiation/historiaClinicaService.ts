/**
 * Servicio para guardar historia clínica
 */
import { buildCompleteAddress } from '@/utils/reniecMapper'

interface FormDataInput {
  // Step 1 - Datos básicos
  apellidoPaterno: string
  apellidoMaterno: string
  nombres: string
  fechaNacimiento: string // Formato DD/MM/YYYY o YYYY-MM-DD
  sexo: string // M o F
  estadoCivil: string
  lugarNacimiento: string // Ubigeo
  lugarNacimientoReniec?: string // Ubigeo RENIEC
  paisNacimiento: string // Código del país
  direccion: string
  distritoProcedencia: string // Ubigeo
  ubigeoReniec?: string // Ubigeo RENIEC de procedencia
  
  // Step 2 - Datos adicionales
  tipoSeguro: string
  gradoInstruccion: string
  gradoInstruccionReniec?: string // Código RENIEC del grado de instrucción
  ocupacion: string
  religion: string
  etnia: string
  centroPoblado: string
  telefono1: string
  telefono2: string
  hijos: string | number
  correoElectronico: string
  observacion: string
  
  // Step 3 - Datos familiares
  padre: string
  madre: string
  conyuge: string
  ocupacionFamiliar: string
  nombreAcompanante: string
  parentesco: string
  ocupacionAcompanante: string
  direccionAcompanante: string
  telefonoAcompanante1: string
  telefonoAcompanante2: string
}

interface HistoriaClinicaPayload {
  stringFoto: string
  tipoDocumento: string
  documento: string
  edad: string
  paterno: string
  materno: string
  nombre: string
  fechaNacimiento: string // ISO format
  sexo: string
  estadoCivil: string
  pais: string
  lugarNacimiento: string
  direccion: string
  distrito: string
  seguro: string
  gradoInstruccion: string
  gradoInstruccionCod: string // Código RENIEC del grado de instrucción
  ocupacion: string
  religion: string
  codEtnia: string
  telefono1: string
  telefono2: string
  hijos: number
  email: string
  padre: string
  madre: string
  conyugeNombre: string
  conyugeOcupacion: string
  correo: string
  direccionReniec: string
  distritoReniec: string
  validadoReniec: boolean
  localidad: string
}

/**
 * Convierte fecha de DD/MM/YYYY a formato ISO
 */
function convertDateToISO(dateStr: string): string {
  if (!dateStr) return new Date().toISOString()
  
  // Si ya está en formato ISO
  if (dateStr.includes('T')) return dateStr
  
  // Si está en formato DD/MM/YYYY
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/')
    return new Date(`${year}-${month}-${day}`).toISOString()
  }
  
  // Si está en formato YYYY-MM-DD
  if (dateStr.includes('-')) {
    return new Date(dateStr).toISOString()
  }
  
  return new Date().toISOString()
}

/**
 * Obtiene el ubigeo real a partir del ubigeo RENIEC
 * Llama a la API local de Next.js para obtener el ubigeo correcto
 * Retorna código de ubigeo de 7 caracteres (ej: "150118")
 */
async function getUbigeoFromReniec(ubigeoReniec: string): Promise<string> {
  try {
    if (!ubigeoReniec) return ''
    
    console.log(`🔍 Consultando ubigeo para código RENIEC: ${ubigeoReniec}`)
    
    // Llamar directamente a la API externa (CORS habilitado)
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL
    const response = await fetch(`${API_BASE_URL}/maestro/ubigeo/reniec/${ubigeoReniec}`)
    
    if (!response.ok) {
      console.warn(`⚠️ No se pudo obtener ubigeo para RENIEC: ${ubigeoReniec}`)
      return ''
    }
    
    const data = await response.json()
    console.log(`🗺️ Respuesta completa de API:`, data)
    
    // El API debe retornar el campo "ubigeo" con 7 caracteres
    const ubigeoCode = data.ubigeo || ''
    console.log(`✅ Código ubigeo obtenido: "${ubigeoCode}" (length: ${ubigeoCode.length})`)
    
    // NO hacer trim para mantener los 7 caracteres
    return ubigeoCode
  } catch (error) {
    console.error('❌ Error al obtener ubigeo desde RENIEC:', error)
    return ''
  }
}

/**
 * Transforma los datos del formulario al formato de la API
 */
export async function transformFormDataToAPIPayload(
  formData: FormDataInput,
  documentType: string,
  documentNumber: string,
  photoBase64: string = '',
  validadoReniec: boolean = false,
  ubigeoReniecNacimiento?: string,
  ubigeoReniecProcedencia?: string,
  reniecRawData?: any // Datos crudos de RENIEC para construir dirección
): Promise<HistoriaClinicaPayload> {
  
  console.log('🔄 Transformando datos del formulario...')
  console.log('   - ubigeoReniecNacimiento:', ubigeoReniecNacimiento)
  console.log('   - ubigeoReniecProcedencia:', ubigeoReniecProcedencia)
  console.log('   - formData.lugarNacimiento:', formData.lugarNacimiento)
  console.log('   - formData.distritoProcedencia:', formData.distritoProcedencia)
  
  // Obtener ubigeos reales desde los códigos RENIEC o usar los del formulario
  let lugarNacimientoUbigeo = formData.lugarNacimiento || ''
  let distritoUbigeo = formData.distritoProcedencia || ''
  
  // Si hay ubigeo RENIEC de nacimiento Y NO hay lugarNacimiento, obtener el ubigeo real
  if (ubigeoReniecNacimiento && !lugarNacimientoUbigeo) {
    lugarNacimientoUbigeo = await getUbigeoFromReniec(ubigeoReniecNacimiento)
    console.log('🗺️ Ubigeo de nacimiento obtenido desde RENIEC:', lugarNacimientoUbigeo)
  }
  
  // Si hay ubigeo RENIEC de procedencia Y NO hay distritoProcedencia, obtener el ubigeo real
  if (ubigeoReniecProcedencia && !distritoUbigeo) {
    distritoUbigeo = await getUbigeoFromReniec(ubigeoReniecProcedencia)
    console.log('🗺️ Ubigeo de procedencia obtenido desde RENIEC:', distritoUbigeo)
  }
  
  // Validar que los ubigeos tengan exactamente 7 caracteres (padding si es necesario)
  if (lugarNacimientoUbigeo && lugarNacimientoUbigeo.length < 7) {
    console.warn('⚠️ lugarNacimiento tiene menos de 7 caracteres:', lugarNacimientoUbigeo)
  }
  if (distritoUbigeo && distritoUbigeo.length < 7) {
    console.warn('⚠️ distrito tiene menos de 7 caracteres:', distritoUbigeo)
  }
  
  console.log('✅ Ubigeos finales:')
  console.log('   - lugarNacimiento:', `"${lugarNacimientoUbigeo}" (length: ${lugarNacimientoUbigeo.length})`)
  console.log('   - distrito:', `"${distritoUbigeo}" (length: ${distritoUbigeo.length})`)
  
  // Construir dirección completa de RENIEC (sin "SIN DATOS")
  let direccionReniecCompleta = ''
  let distritoReniecCodigo = ''
  
  if (validadoReniec && reniecRawData) {
    direccionReniecCompleta = buildCompleteAddress(reniecRawData)
    console.log('📍 Dirección RENIEC construida:', direccionReniecCompleta)
    // distritoReniec debe ser el ubigeo BD (ya transformado), no el código RENIEC
    distritoReniecCodigo = distritoUbigeo || ''
    console.log('🗺️ Distrito RENIEC (ubigeo BD):', distritoReniecCodigo)
  }
  
  console.log('🔍 Modo de registro:', validadoReniec ? 'CON RENIEC' : 'MANUAL')
  console.log('   - direccionReniec:', validadoReniec ? direccionReniecCompleta : 'null')
  console.log('   - distritoReniec:', validadoReniec ? distritoReniecCodigo : 'null')

  const payload: HistoriaClinicaPayload = {
    stringFoto: photoBase64,
    tipoDocumento: documentType,
    documento: documentNumber,
    edad: formData.fechaNacimiento ? calculateAgeForAPI(formData.fechaNacimiento) : '',
    paterno: formData.apellidoPaterno,
    materno: formData.apellidoMaterno,
    nombre: formData.nombres,
    fechaNacimiento: convertDateToISO(formData.fechaNacimiento),
    sexo: formData.sexo,
    estadoCivil: formData.estadoCivil,
    pais: formData.paisNacimiento,
    lugarNacimiento: lugarNacimientoUbigeo,
    direccion: formData.direccion,
    distrito: distritoUbigeo,
    seguro: formData.tipoSeguro,
    gradoInstruccion: formData.gradoInstruccion,
    gradoInstruccionCod: formData.gradoInstruccionReniec || '', // Código RENIEC
    ocupacion: formData.ocupacion,
    religion: formData.religion,
    codEtnia: formData.etnia,
    telefono1: formData.telefono1,
    telefono2: formData.telefono2,
    hijos: typeof formData.hijos === 'string' ? parseInt(formData.hijos) || 0 : formData.hijos || 0,
    email: formData.observacion, // Email va en observación según el mapeo
    padre: formData.padre,
    madre: formData.madre,
    conyugeNombre: formData.conyuge,
    conyugeOcupacion: formData.ocupacionFamiliar,
    correo: formData.correoElectronico,
    direccionReniec: validadoReniec ? (direccionReniecCompleta || formData.direccion) : '', // null si es manual
    distritoReniec: validadoReniec ? distritoReniecCodigo : '', // null si es manual
    validadoReniec: validadoReniec,
    localidad: formData.centroPoblado
  }
  
  console.log('📦 Payload transformado:', payload)
  return payload
}

/**
 * Calcula la edad en formato string a partir de una fecha de nacimiento
 * Formato: "029a08m01d" con padding de ceros
 */
function calculateAgeForAPI(birthDateStr: string): string {
  if (!birthDateStr) return '000a00m00d'
  
  try {
    let birthDate: Date
    
    // Si está en formato DD/MM/YYYY
    if (birthDateStr.includes('/')) {
      const [day, month, year] = birthDateStr.split('/')
      birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    } 
    // Si está en formato YYYY-MM-DD o ISO
    else {
      birthDate = new Date(birthDateStr)
    }
    
    const today = new Date()
    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()
    let days = today.getDate() - birthDate.getDate()
    
    // Ajustar si los días son negativos
    if (days < 0) {
      months--
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      days = prevMonth.getDate() + days
    }
    
    // Ajustar si los meses son negativos
    if (months < 0) {
      years--
      months = 12 + months
    }
    
    // Formato: "029a08m01d" con padding de ceros
    const yearsStr = years.toString().padStart(3, '0')
    const monthsStr = months.toString().padStart(2, '0')
    const daysStr = days.toString().padStart(2, '0')
    
    return `${yearsStr}a${monthsStr}m${daysStr}d`
  } catch (error) {
    console.error('Error calculando edad:', error)
    return '000a00m00d'
  }
}

/**
 * Guarda la historia clínica llamando al endpoint de Next.js
 */
export async function saveHistoriaClinica(
  payload: HistoriaClinicaPayload
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('💾 Guardando historia clínica...')
      console.log('📍 Localidad a enviar:', `"${payload.localidad}" (length: ${payload.localidad.length})`)
    
    const response = await fetch('/api/filiation/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Error al guardar:', data)
      return {
        success: false,
        error: data.error || 'Error al guardar historia clínica'
      }
    }
    
    console.log('✅ Historia clínica guardada exitosamente:', data)
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('❌ Error al guardar historia clínica:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
