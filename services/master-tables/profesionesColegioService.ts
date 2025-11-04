/**
 * Servicio para gestionar Profesiones y Colegios
 */

export interface ProfesionColegio {
  id_profesion: string
  Profesion: string
  id_colegio: string
  Colegio: string
  ACTIVO: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL

/**
 * Obtiene todas las profesiones y colegios activos
 */
export async function getProfesionesColegio(): Promise<ProfesionColegio[]> {
  try {
    const response = await fetch(`api/master-tables/profesiones-colegio`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Error al obtener profesiones y colegios: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error en getProfesionesColegio:', error)
    throw error
  }
}

/**
 * Obtiene una profesión y colegio por ID
 */
export async function getProfesionColegioById(id: string): Promise<ProfesionColegio | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/maestro/profesiones-colegio/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Error al obtener profesión y colegio: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error en getProfesionColegioById:', error)
    throw error
  }
}

/**
 * Busca profesiones y colegios por término de búsqueda
 */
export async function searchProfesionesColegio(searchTerm: string): Promise<ProfesionColegio[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/maestro/profesiones-colegio/search?q=${encodeURIComponent(searchTerm)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      throw new Error(`Error al buscar profesiones y colegios: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error en searchProfesionesColegio:', error)
    throw error
  }
}
