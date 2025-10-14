import { NextRequest, NextResponse } from 'next/server'
import { searchCitasByNombres, CitaSearchFilters } from '@/services/citas/citasService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parámetro requerido
    const nombres = searchParams.get('nombres')
    if (!nombres) {
      return NextResponse.json(
        { error: 'El parámetro nombres es requerido' },
        { status: 400 }
      )
    }

    // Parámetros opcionales de filtro
    const filters: CitaSearchFilters = {}
    
    const fechaDesde = searchParams.get('fechaDesde')
    if (fechaDesde) filters.fechaDesde = fechaDesde
    
    const fechaHasta = searchParams.get('fechaHasta')
    if (fechaHasta) filters.fechaHasta = fechaHasta
    
    const estado = searchParams.get('estado')
    if (estado && estado !== 'all') filters.estado = parseInt(estado)
    
    const consultorio = searchParams.get('consultorio')
    if (consultorio && consultorio !== 'all') filters.consultorio = consultorio
    
    const medico = searchParams.get('medico')
    if (medico && medico !== 'all') filters.medico = medico

    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '10')

    const result = await searchCitasByNombres(nombres, filters, page, size)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error in search-by-nombres API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
