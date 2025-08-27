import { NextRequest, NextResponse } from 'next/server'
import { consultorioEmergenciaService } from '@/services/emergencia/consultorioService'

/**
 * GET /api/consultorio/emergency-departments
 * Obtiene consultorios específicos de emergencia (TIPO = 'E')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    
    // Obtener consultorios de emergencia con paginación
    const result = await consultorioEmergenciaService.getConsultoriosEmergencia(
      page,
      pageSize,
      { search }
    )
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en API de consultorios de emergencia:', error)
    return NextResponse.json(
      { error: 'Error al obtener consultorios de emergencia' },
      { status: 500 }
    )
  }
}
