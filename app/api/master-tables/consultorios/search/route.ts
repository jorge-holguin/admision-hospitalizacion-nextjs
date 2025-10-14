import { NextRequest, NextResponse } from 'next/server'
import { consultorioService } from '@/services/hospitalizacion/consultorioService'
import { consultorioEmergenciaService } from '@/services/emergencia/consultorioService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tipo = searchParams.get('tipo') || 'H'
    const search = searchParams.get('search') || ''
    
    let items;
    
    if (tipo === 'E') {
      // Obtener consultorios de emergencia (tipo E)
      items = await consultorioEmergenciaService.getAllConsultoriosEmergencia(search)
    } else if (tipo === 'C') {
      // Obtener consultorios de citas (tipo C)
      items = await consultorioEmergenciaService.getAllConsultoriosCitas(search)
    } else {
      // Por defecto, obtenemos los departamentos de hospital (tipo H)
      items = await consultorioService.findHospitalDepartments()
    }
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error en API de consultorios:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos de consultorios' },
      { status: 500 }
    )
  }
}
