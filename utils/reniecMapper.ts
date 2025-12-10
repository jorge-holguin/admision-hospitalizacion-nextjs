/**
 * Utilidad para mapear datos de RENIEC al formato del sistema
 */

interface ReniecData {
  dni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  fechaNacimiento: string;
  sexo: string;
  estadoCivil: string;
  pais: string;
  departamentoNacimiento: string;
  direccion: string;
  numero?: string;
  block?: string;
  prefijoBlock?: string;
  interior?: string;
  etapa?: string;
  manzana?: string;
  lote?: string;
  distrito: string;
  nombrePadre: string;
  nombreMadre: string;
  imagenFoto: string;
  nivelEstudios?: string;  // Código RENIEC de nivel de estudios
  gradoInstruccionCod?: string;  // Código RENIEC de grado de instrucción (campo alternativo)
  // Códigos de ubigeo RENIEC
  codUbigeoDepNac?: string;
  codUbigeoProvNac?: string;
  codUbigeoDistNac?: string;
  codUbigeoDepartamento?: string;
  codUbigeoProvincia?: string;
  codUbigeoDistrito?: string;
}

interface PatientFormData {
  // Información del Sistema
  historyNumber: string;
  age: string;
  patientId: string;
  photoReniec: string;

  // Datos Personales
  paternalSurname: string;
  maternalSurname: string;
  names: string;
  birthDate: string;
  sex: string;
  maritalStatus: string;
  birthCountry: string;
  birthPlace: string;
  address: string;
  district: string;
  direccionReniec?: string;  // Dirección de RENIEC (para referencia)
  distritoReniec?: string;  // Código ubigeo BD del distrito de RENIEC
  educationLevel?: string;  // Grado de instrucción (código BD)
  educationLevelReniec?: string;  // Código RENIEC de grado de instrucción

  // Datos Familiares
  fatherName: string;
  motherName: string;

  // Documento
  document: string;
  documentType: string;

  // Códigos de ubigeo RENIEC
  ubigeoReniecNacimiento?: string;
  ubigeoReniecProcedencia?: string;
}

/**
 * Calcula la edad en formato "AAaMMmDDd" a partir de una fecha de nacimiento
 */
export function calculateAge(birthDateStr: string): string {
  try {
    // La fecha viene en formato DD/MM/YYYY
    const [day, month, year] = birthDateStr.split('/');
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // Ajustar si los días son negativos
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }

    // Ajustar si los meses son negativos
    if (months < 0) {
      years--;
      months += 12;
    }

    // Formato: "AAaMMmDDd"
    const yearsStr = years.toString().padStart(3, '0');
    const monthsStr = months.toString().padStart(2, '0');
    const daysStr = days.toString().padStart(2, '0');

    return `${yearsStr}a${monthsStr}m${daysStr}d`;
  } catch (error) {
    return '000a00m00d';
  }
}

/**
 * Convierte fecha de DD/MM/YYYY a YYYY-MM-DD para inputs de tipo date
 */
export function convertDateFormat(dateStr: string): string {
  try {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (error) {
    return '';
  }
}

/**
 * Mapea el sexo de RENIEC al formato del sistema
 * RENIEC: '1' = Mujer, '2' = Hombre
 * Sistema: 'F' = Femenino, 'M' = Masculino
 */
export function mapSex(reniecSex: string): string {
  return reniecSex === '2' ? 'F' : 'M';
}

/**
 * Mapea el estado civil de RENIEC al formato del sistema
 * RENIEC: '1' = Soltero, '2' = Casado, '3' = Viudo, '4' = Divorciado
 */
export function mapMaritalStatus(reniecEstadoCivil: string): string {
  const mapping: Record<string, string> = {
    '1': 'S', // Soltero
    '2': 'C', // Casado
    '3': 'V', // Viudo
    '4': 'D', // Divorciado
    '5': 'X', // Conviviente
  };
  return mapping[reniecEstadoCivil] || 'S';
}

/**
 * Construye la dirección completa a partir de los componentes de RENIEC
 * Combina: direccion, numero, block, interior, etapa, manzana, lote
 * Excluye campos con "SIN DATOS" y urbanización (innecesaria)
 */
export function buildCompleteAddress(reniecData: ReniecData): string {
  const parts: string[] = [];
  
  const addPart = (value: string | undefined, prefix?: string) => {
    if (value && value !== 'SIN DATOS') {
      parts.push(prefix ? `${prefix} ${value}` : value);
    }
  };
  
  // Dirección principal
  addPart(reniecData.direccion);
  
  // Número
  addPart(reniecData.numero, 'N°');
  
  // Block con prefijo
  if (reniecData.block && reniecData.block !== 'SIN DATOS') {
    const prefix = reniecData.prefijoBlock && reniecData.prefijoBlock !== 'SIN DATOS' 
      ? `Block ${reniecData.prefijoBlock}-` 
      : 'Block ';
    parts.push(`${prefix}${reniecData.block}`);
  }
  
  // Interior, Etapa, Manzana, Lote
  addPart(reniecData.interior, 'Int.');
  addPart(reniecData.etapa, 'Etapa');
  addPart(reniecData.manzana, 'Mz.');
  addPart(reniecData.lote, 'Lt.');
  
  return parts.join(' ');
}

/**
 * Construye el código de ubigeo RENIEC a partir de los códigos individuales
 * Formato: depProvDist (ej: 090202, 140112)
 */
export function buildUbigeoReniecCode(dep?: string, prov?: string, dist?: string): string | undefined {
  if (!dep || !prov || !dist) return undefined;
  return `${dep}${prov}${dist}`;
}

/**
 * Mapea datos de RENIEC al formato del formulario de paciente
 */
export async function mapReniecToPatientForm(reniecData: ReniecData): Promise<Partial<PatientFormData>> {
  // Construir códigos de ubigeo RENIEC
  const ubigeoReniecNacimiento = buildUbigeoReniecCode(
    reniecData.codUbigeoDepNac,
    reniecData.codUbigeoProvNac,
    reniecData.codUbigeoDistNac
  );
  
  const ubigeoReniecProcedencia = buildUbigeoReniecCode(
    reniecData.codUbigeoDepartamento,
    reniecData.codUbigeoProvincia,
    reniecData.codUbigeoDistrito
  );

  // Mapear grado de instrucción de RENIEC a código de BD
  let gradoInstruccionBD: string | undefined = undefined;
  const codigoReniec = reniecData.gradoInstruccionCod || reniecData.nivelEstudios;
  if (codigoReniec) {
    gradoInstruccionBD = await getGradoInstruccionByReniecCode(codigoReniec);
  }

  // Mapear ubigeo RENIEC de procedencia a código de BD
  let distritoReniecBD: string | undefined = undefined;
  if (ubigeoReniecProcedencia) {
    distritoReniecBD = await getUbigeoByReniecCode(ubigeoReniecProcedencia);
  }

  // Construir dirección RENIEC
  const direccionReniec = buildCompleteAddress(reniecData);

  return {
    // Información del Sistema
    historyNumber: reniecData.dni, // N° Historia Clínica = DNI
    age: calculateAge(reniecData.fechaNacimiento),
    patientId: '', // Se colocará de la API después de crear
    photoReniec: reniecData.imagenFoto,

    // Datos Personales
    paternalSurname: reniecData.apellidoPaterno,
    maternalSurname: reniecData.apellidoMaterno,
    names: reniecData.nombres,
    birthDate: convertDateFormat(reniecData.fechaNacimiento),
    sex: mapSex(reniecData.sexo),
    maritalStatus: mapMaritalStatus(reniecData.estadoCivil),
    birthCountry: reniecData.pais,
    birthPlace: reniecData.departamentoNacimiento,
    address: buildCompleteAddress(reniecData), // Construir dirección completa
    district: reniecData.distrito === 'SIN DATOS' ? '' : reniecData.distrito,
    direccionReniec,  // Dirección de RENIEC
    distritoReniec: ubigeoReniecProcedencia,  // ✅ Código RENIEC original (6 dígitos), NO ubigeo BD
    educationLevel: gradoInstruccionBD,  // Código BD del grado de instrucción
    educationLevelReniec: reniecData.gradoInstruccionCod || reniecData.nivelEstudios,  // Código RENIEC original

    // Datos Familiares
    fatherName: reniecData.nombrePadre === 'SIN DATOS' ? '' : reniecData.nombrePadre,
    motherName: reniecData.nombreMadre === 'SIN DATOS' ? '' : reniecData.nombreMadre,

    // Documento
    document: reniecData.dni,
    documentType: 'D', // DNI

    // Códigos de ubigeo RENIEC
    ubigeoReniecNacimiento,
    ubigeoReniecProcedencia,
  };
}

/**
 * Obtiene la IP del cliente desde los headers de la request
 */
export function getClientIP(request: Request): string {
  // Intentar obtener la IP real del cliente
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback a localhost si no se puede determinar
  return '127.0.0.1';
}

/**
 * Consulta el UBIGEO correcto usando el código RENIEC
 * @param codigoReniec Código RENIEC de 6 dígitos (ej: "140133")
 * @returns UBIGEO correcto o undefined si no se encuentra
 */
export async function getUbigeoByReniecCode(codigoReniec: string): Promise<string | undefined> {
  if (!codigoReniec || codigoReniec.length !== 6) return undefined;
  
  try {
    const response = await fetch(`/api/ubigeo/by-reniec/${codigoReniec}`);
    if (!response.ok) return undefined;
    
    const data = await response.json();
    return data.ubigeo;
  } catch {
    return undefined;
  }
}

/**
 * Consulta el grado de instrucción correcto usando el código RENIEC
 * @param codigoReniec Código RENIEC de grado de instrucción (ej: "20" para Secundaria Completa)
 * @returns Código de grado de instrucción de la BD (ej: "05") o undefined si no se encuentra
 */
export async function getGradoInstruccionByReniecCode(codigoReniec: string): Promise<string | undefined> {
  if (!codigoReniec) return undefined;
  
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011/api';
    const response = await fetch(`${API_BASE_URL}/maestro/grado-instruccion/buscar?limite=50`);
    
    if (!response.ok) return undefined;

    const gradosInstruccion = await response.json();
    const codigoNormalizado = codigoReniec.trim();
    
    const gradoEncontrado = gradosInstruccion.find((grado: any) => 
      grado.reniec?.trim() === codigoNormalizado
    );
    
    return gradoEncontrado?.gradoInstruccion;
  } catch {
    return undefined;
  }
}
