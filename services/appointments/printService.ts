/**
 * Servicio para imprimir citas
 */

/**
 * Formatea una fecha a DD/MM/YYYY
 */
export function formatDateToDDMMYYYY(dateString: string): string {
  try {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error('Error al formatear fecha:', error)
    return dateString
  }
}

/**
 * Formatea una fecha y hora a DD/MM/YYYY HH:mm:ss
 */
export function formatDateTimeToDDMMYYYY(dateString: string): string {
  try {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error('Error al formatear fecha y hora:', error)
    return dateString
  }
}

export interface CitaDto {
  numero: string
  numeroAtencion: string
  paciente: string
  consultorio: string
  medico: string
  diaAtencion: string
  turno: string
  hora: string
  historiaClinica: string | null
  emitidoEl: string
  operador: string
  seguro: string
  nroRef?: string  // Número de referencia SIS (opcional)
  eess?: string    // Entidad SIS (opcional)
}

/**
 * Imprime una cita enviando los datos al servicio de impresión
 */
export async function imprimirCita(citaDto: CitaDto): Promise<void> {
  const PRINT_API_URL = import.meta.env.VITE_PRINT_API_URL || 'http://localhost:9100'
  
  try {
    const response = await fetch(`${PRINT_API_URL}/cita`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(citaDto),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error al imprimir: ${response.status} - ${errorText}`)
    }

    console.log('✅ Impresión enviada correctamente')
  } catch (error) {
    console.error('❌ Error al enviar impresión:', error)
    throw error
  }
}
