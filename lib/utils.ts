import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte valores BigInt a string en un objeto para poder serializarlo a JSON
 * @param data Objeto o array que puede contener valores BigInt
 * @returns El mismo objeto con los BigInt convertidos a string
 */
export function serializeBigInt<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return data.toString() as unknown as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeBigInt(item)) as unknown as T;
  }
  
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Manejar objetos de fecha vacíos (SQL Server 2008 R2)
        if (
          key === 'FECHA_NACIMIENTO' || 
          key === 'FECHA1' || 
          key === 'FECHA_INGRESO' ||
          key === 'FECHA_EGRESO'
        ) {
          const value = (data as Record<string, any>)[key];
          // Si es un objeto vacío o no tiene propiedades, convertirlo a null
          if (value && typeof value === 'object' && Object.keys(value).length === 0) {
            result[key] = null;
          } else {
            result[key] = serializeBigInt(value);
          }
        } else {
          result[key] = serializeBigInt((data as Record<string, any>)[key]);
        }
      }
    }
    return result as T;
  }
  
  return data;
}

/**
 * Formatea una fecha en formato YYYY-MM-DD o un objeto Date a formato DD/MM/YYYY
 * @param dateString Fecha en formato string o Date
 * @returns Fecha formateada como DD/MM/YYYY o el string original si no se puede formatear
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  
  // Manejar objetos vacíos que vienen de SQL Server
  if (dateString && typeof dateString === 'object' && Object.keys(dateString).length === 0) {
    return '-';
  }
  
  try {
    // Si es un string en formato ISO o similar
    if (typeof dateString === 'string') {
      // Si ya está en formato DD/MM/YYYY
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString;
      }
      
      // Si está en formato YYYY-MM-DD
      const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [_, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
    }
    
    // Si es un objeto Date o puede convertirse en uno
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // Si no se puede formatear
    return typeof dateString === 'string' ? dateString : String(dateString);
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return typeof dateString === 'string' ? dateString : 'Fecha inválida';
  }
}

/**
 * Extrae el código de un string con formato "CODIGO - NOMBRE"
 * @param value String con formato "CODIGO - NOMBRE"
 * @returns El código extraído o null si no se encuentra
 */
export function extractCode(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const match = value.match(/^([^\s-]+)\s*-/);
  return match ? match[1].trim() : null;
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 * @param birthDateStr Fecha de nacimiento en formato DD/MM/YYYY
 * @returns Edad en formato "X años, Y meses, Z días"
 */
export function calculateAge(birthDateStr: string): string {
  try {
    // Parse the birthdate string (assuming DD/MM/YYYY format)
    const parts = birthDateStr.split('/');
    if (parts.length !== 3) return "";
    
    const birthDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    const today = new Date();
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    
    // Adjust for negative days
    if (days < 0) {
      months--;
      // Get the last day of the previous month
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += lastDayOfMonth;
    }
    
    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return `${years} años, ${months} meses, ${days} días`;
  } catch (error) {
    console.error('Error al calcular edad:', error);
    return "";
  }
}
