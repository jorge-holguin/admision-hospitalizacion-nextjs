import { NextRequest, NextResponse } from 'next/server'
import { filiacionService, FiliacionFilter } from '@/services/hospitalizacion/filiacionService'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Construir filtros basados en los parámetros de búsqueda
    const filter: FiliacionFilter = {}
    
    if (searchParams.has('historia')) {
      filter.historia = searchParams.get('historia') || ''
    }
    
    if (searchParams.has('documento')) {
      filter.documento = searchParams.get('documento') || ''
    }
    
    if (searchParams.has('nombres')) {
      filter.nombres = searchParams.get('nombres') || ''
    }
    
    console.log('API: Contando filiaciones con filtros:', filter)
    
    const response = await filiacionService.countFiliacion(filter)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error counting filiaciones:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ 
      success: false, 
      message: 'Internal Server Error' 
    }, { status: 500 })
  }
}
