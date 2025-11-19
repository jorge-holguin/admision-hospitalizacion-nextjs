/**
 * Servicio para gestionar entidades SIS
 */

export interface EntidadSIS {
  ENTIDADSIS: string
  NOMBRE: string
}

/**
 * Obtiene una entidad SIS por su código
 */
export async function obtenerEntidadSISPorCodigo(codigo: string): Promise<{
  success: boolean
  data?: EntidadSIS
  error?: string
}> {
  try {
    console.log('🏥 Obteniendo entidad SIS por código:', codigo)
    
    const response = await fetch(`/api/appointments/sis-entities/${codigo}`)
    
    if (!response.ok) {
      console.error('❌ Error obteniendo entidad SIS:', response.status)
      return {
        success: false,
        error: `Error ${response.status}: ${response.statusText}`
      }
    }

    const result = await response.json()
    
    if (result.success && result.data) {
      console.log('✅ Entidad SIS obtenida:', result.data)
      return {
        success: true,
        data: result.data
      }
    }

    return {
      success: false,
      error: 'No se encontró la entidad SIS'
    }
  } catch (error) {
    console.error('❌ Error al obtener entidad SIS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
