/**
 * Convierte una hora en formato 24h a formato 12h con AM/PM
 * @param hora - Hora en formato "HH:MM" o "HH:MM:SS"
 * @returns Hora en formato "HH:MM AM/PM"
 * @example convertTo12HourFormat("08:00") => "08:00 AM"
 * @example convertTo12HourFormat("14:30") => "02:30 PM"
 */
export function convertTo12HourFormat(hora: string): string {
  if (!hora) return '12:00 AM'
  
  // Extraer horas y minutos
  const [hoursStr, minutesStr] = hora.trim().split(':')
  let hours = parseInt(hoursStr) || 0
  const minutes = minutesStr || '00'
  
  // Determinar AM o PM
  const period = hours >= 12 ? 'PM' : 'AM'
  
  // Convertir a formato 12 horas
  if (hours === 0) {
    hours = 12
  } else if (hours > 12) {
    hours = hours - 12
  }
  
  // Formatear con padding
  const hoursFormatted = hours.toString().padStart(2, '0')
  const minutesFormatted = minutes.padStart(2, '0')
  
  return `${hoursFormatted}:${minutesFormatted} ${period}`
}

/**
 * Formatea una fecha para SQL Server
 * @param date - Objeto Date
 * @returns Fecha en formato "DD/MM/YYYY"
 */
export function formatDateForSQL(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}/${month}/${year}`
}

/**
 * Convierte un string ISO a formato DD/MM/YYYY
 * @param isoString - String en formato ISO o Date
 * @returns Fecha en formato "DD/MM/YYYY"
 */
export function convertISOToSQLDate(isoString: string | Date): string {
  if (typeof isoString === 'string') {
    // Si viene como YYYY-MM-DD (sin hora), tratarlo como fecha local para evitar desfase de zona horaria
    const parts = isoString.split('-')
    if (parts.length === 3 && parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
  }
  const date = typeof isoString === 'string' ? new Date(isoString) : isoString
  return formatDateForSQL(date)
}
