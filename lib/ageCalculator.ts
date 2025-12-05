/**
 * Utilidad para calcular la edad a partir de una fecha de nacimiento
 * Formato de salida: 000a00m00d (años, meses, días)
 */

export interface AgeResult {
  formatted: string;  // Formato: "029a08m01d"
  years: number;
  months: number;
  days: number;
}

/**
 * Parsea una fecha de nacimiento en diferentes formatos
 * Soporta: YYYY-MM-DD, DD/MM/YYYY, YYYYMMDD, ISO string, Date object
 */
function parseBirthDate(fechaNacimiento: string | Date): Date | null {
  if (!fechaNacimiento) return null;

  try {
    let birthDate: Date;

    if (fechaNacimiento instanceof Date) {
      birthDate = fechaNacimiento;
    } else if (typeof fechaNacimiento === 'string') {
      const fechaStr = fechaNacimiento.trim();
      
      // Formato ISO: YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
      if (fechaStr.includes('-')) {
        birthDate = new Date(fechaStr);
      }
      // Formato YYYYMMDD (8 caracteres numéricos)
      else if (fechaStr.length === 8 && /^\d{8}$/.test(fechaStr)) {
        const year = parseInt(fechaStr.substring(0, 4));
        const month = parseInt(fechaStr.substring(4, 6)) - 1; // Meses en JS son 0-11
        const day = parseInt(fechaStr.substring(6, 8));
        birthDate = new Date(year, month, day);
      }
      // Formato DD/MM/YYYY
      else if (fechaStr.includes('/')) {
        const [day, month, year] = fechaStr.split('/').map(Number);
        birthDate = new Date(year, month - 1, day);
      }
      else {
        // Intentar parsear como fecha genérica
        birthDate = new Date(fechaStr);
      }
    } else {
      return null;
    }

    // Validar que la fecha sea válida
    if (isNaN(birthDate.getTime())) {
      return null;
    }

    return birthDate;
  } catch (error) {
    console.error('Error al parsear fecha de nacimiento:', error);
    return null;
  }
}

/**
 * Calcula la edad actual en formato string a partir de una fecha de nacimiento
 * Formato de salida: "029a08m01d" (años, meses, días con padding de ceros)
 * 
 * @param fechaNacimiento - Fecha de nacimiento en formato string o Date
 * @param fechaReferencia - Fecha de referencia para calcular la edad (por defecto: fecha actual)
 * @returns Objeto con la edad formateada y sus componentes
 */
export function calculateAge(
  fechaNacimiento: string | Date,
  fechaReferencia?: Date
): AgeResult {
  const defaultResult: AgeResult = {
    formatted: '000a00m00d',
    years: 0,
    months: 0,
    days: 0
  };

  const birthDate = parseBirthDate(fechaNacimiento);
  if (!birthDate) {
    console.warn('⚠️ No se pudo parsear la fecha de nacimiento:', fechaNacimiento);
    return defaultResult;
  }

  const today = fechaReferencia || new Date();

  // Calcular años, meses y días
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  // Ajustar si los días son negativos
  if (days < 0) {
    months--;
    // Obtener el último día del mes anterior
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }

  // Ajustar si los meses son negativos
  if (months < 0) {
    years--;
    months += 12;
  }

  // Asegurar que no haya valores negativos
  years = Math.max(0, years);
  months = Math.max(0, months);
  days = Math.max(0, days);

  // Formatear como 000a00m00d
  const formatted = `${years.toString().padStart(3, '0')}a${months.toString().padStart(2, '0')}m${days.toString().padStart(2, '0')}d`;

  return {
    formatted,
    years,
    months,
    days
  };
}

/**
 * Calcula la edad y devuelve solo el string formateado
 * Atajo para usar cuando solo se necesita el string
 * 
 * @param fechaNacimiento - Fecha de nacimiento
 * @returns String en formato "000a00m00d"
 */
export function calculateAgeFormatted(fechaNacimiento: string | Date): string {
  return calculateAge(fechaNacimiento).formatted;
}

/**
 * Extrae solo los años de una edad formateada
 * 
 * @param edadFormateada - Edad en formato "000a00m00d"
 * @returns Número de años
 */
export function extractYearsFromFormattedAge(edadFormateada: string): number {
  if (!edadFormateada || typeof edadFormateada !== 'string') return 0;
  
  const match = edadFormateada.match(/^(\d{3})a/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}

/**
 * Convierte una edad formateada a un objeto con años, meses y días
 * 
 * @param edadFormateada - Edad en formato "000a00m00d"
 * @returns Objeto con years, months, days
 */
export function parseFormattedAge(edadFormateada: string): { years: number; months: number; days: number } {
  const defaultResult = { years: 0, months: 0, days: 0 };
  
  if (!edadFormateada || typeof edadFormateada !== 'string') return defaultResult;
  
  const match = edadFormateada.match(/^(\d{3})a(\d{2})m(\d{2})d$/);
  if (match) {
    return {
      years: parseInt(match[1], 10),
      months: parseInt(match[2], 10),
      days: parseInt(match[3], 10)
    };
  }
  
  return defaultResult;
}

/**
 * Formatea una edad para mostrar de manera legible
 * Ejemplo: "29 años, 8 meses, 1 día"
 * 
 * @param edadFormateada - Edad en formato "000a00m00d"
 * @returns String legible
 */
export function formatAgeReadable(edadFormateada: string): string {
  const { years, months, days } = parseFormattedAge(edadFormateada);
  
  const parts: string[] = [];
  
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  }
  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
  }
  
  return parts.join(', ');
}
