/**
 * Utilidades para formateo de fechas y horas
 */

/**
 * Convierte una fecha del formato DD/MM/YYYY al formato YYYY-MM-DD
 * @param dateString Fecha en formato DD/MM/YYYY
 * @returns Fecha en formato YYYY-MM-DD o string vacío si el formato es inválido
 */
export function convertDateFormat(dateString: string): string {
  if (!dateString) return '';
  
  // Limpiar espacios en blanco
  dateString = dateString.trim();
  
  // Verificar si la fecha ya está en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Intentar convertir desde formato ISO (YYYY-MM-DDTHH:mm:ss)
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Intentar convertir desde formato YYYYMMDD
  if (/^\d{8}$/.test(dateString)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  // Intentar convertir desde formato DD/MM/YYYY
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    
    // Validar que sean números válidos
    if (!isNaN(Number(day)) && !isNaN(Number(month)) && !isNaN(Number(year))) {
      return `${year}-${month}-${day}`;
    }
  }
  
  console.error('Formato de fecha inválido:', dateString);
  return '';
}

/**
 * Convierte una hora del formato 12h (HH:MM AM/PM) al formato 24h (HH:MM)
 * @param timeString Hora en formato 12h (ej: "11:10 PM")
 * @returns Hora en formato 24h (HH:MM) o string vacío si el formato es inválido
 */
export function convertTimeFormat(timeString: string): string {
  if (!timeString) return '';
  
  // Limpiar espacios en blanco
  timeString = timeString.trim();
  
  // Verificar si la hora ya está en formato 24h (HH:MM)
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(timeString)) {
    return timeString;
  }
  
  // Intentar convertir desde formato 12h
  const regex = /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)\s*$/;
  const match = timeString.match(regex);
  
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    // Convertir a formato 24h
    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  console.error('Formato de hora inválido:', timeString);
  return '';
}

/**
 * Convierte una hora del formato 24h (HH:MM) al formato 12h (HH:MM AM/PM)
 * @param timeString Hora en formato 24h (ej: "23:10")
 * @returns Hora en formato 12h (HH:MM AM/PM) o string vacío si el formato es inválido
 */
export function convertTo12HourFormat(timeString: string): string {
  if (!timeString) return '';
  
  // Limpiar espacios en blanco
  timeString = timeString.trim();
  
  // Verificar si la hora ya está en formato 12h
  if (/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)\s*$/.test(timeString)) {
    return timeString;
  }
  
  // Verificar si la hora está en formato 24h (HH:MM)
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const match = timeString.match(regex);
  
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convertir a formato 12h
    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }
    
    // Formatear con dos espacios al final para mantener consistencia con el formato existente
    return `${hours.toString().padStart(2, '0')}:${minutes} ${period}  `;
  }
  
  console.error('Formato de hora inválido para conversión a 12h:', timeString);
  return '';
}

/**
 * Convierte una fecha YYYY-MM-DD al formato LocalDateTime ISO que acepta el backend
 * @param dateString Fecha en formato YYYY-MM-DD (ej: "1994-05-11")
 * @returns Fecha en formato ISO con hora (ej: "1994-05-11T00:00:00.000Z")
 */
export function convertToLocalDateTime(dateString: string): string {
  if (!dateString) return '';
  
  // Limpiar espacios en blanco
  dateString = dateString.trim();
  
  // Si ya tiene formato ISO completo, devolverlo
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
    return dateString;
  }
  
  // Si es formato YYYY-MM-DD, agregar hora medianoche
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return `${dateString}T00:00:00.000Z`;
  }
  
  // Si es formato DD/MM/YYYY, convertir primero
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const converted = convertDateFormat(dateString);
    if (converted) {
      return `${converted}T00:00:00.000Z`;
    }
  }
  
  console.error('Formato de fecha inválido para LocalDateTime:', dateString);
  return '';
}
