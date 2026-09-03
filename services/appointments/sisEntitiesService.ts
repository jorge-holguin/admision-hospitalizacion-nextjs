import { entidadSisService } from '@/services/citas/entidadSisService'

export interface EntidadSIS {
  ENTIDADSIS: string
  NOMBRE: string
}

/**
 * Obtiene una entidad SIS por su código directamente desde el backend Spring Boot
 */
export async function obtenerEntidadSISPorCodigo(codigo: string): Promise<{
  success: boolean
  data?: EntidadSIS
  error?: string
}> {
  try {    const entidad = await entidadSisService.getEntidadSisByCode(codigo)

    if (entidad) {      return {
        success: true,
        data: {
          ENTIDADSIS: entidad.ENTIDADSIS,
          NOMBRE: entidad.NOMBRE
        }
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
