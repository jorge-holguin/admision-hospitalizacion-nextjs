import { NextRequest, NextResponse } from 'next/server'
import { consultorioService } from '@/services/consultorioService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tipo = searchParams.get('tipo') || 'H'
    
    // Por defecto, obtenemos los departamentos de hospital (tipo H)
    const items = await consultorioService.findHospitalDepartments()
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error en API de consultorios:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos de consultorios' },
      { status: 500 }
    )
  }
}
