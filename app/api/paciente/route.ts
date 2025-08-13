import { NextRequest, NextResponse } from 'next/server'
import { pacienteService, PacienteFilter } from '@/services/hospitalizacion/pacienteService'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1
    const pageSize = searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 10
    
    // Construir filtros basados en los parámetros de búsqueda
    const filter: PacienteFilter = {}
    
    if (searchParams.has('historia')) {
      filter.historia = searchParams.get('historia') || ''
    }
    
    if (searchParams.has('documento')) {
      filter.documento = searchParams.get('documento') || ''
    }
    
    if (searchParams.has('nombres')) {
      filter.nombres = searchParams.get('nombres') || ''
    }
    
    console.log('API: Buscando pacientes con filtros:', { filter, page, pageSize })
    
    const result = await pacienteService.getPaginatedPacientes(filter, { page, pageSize })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching pacientes:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
