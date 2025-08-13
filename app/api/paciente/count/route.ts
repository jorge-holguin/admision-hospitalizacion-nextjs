import { NextRequest, NextResponse } from 'next/server'
import { pacienteService, PacienteFilter } from '@/services/hospitalizacion/pacienteService'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
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
    
    console.log('API: Contando pacientes con filtros:', filter)
    
    const response = await pacienteService.countPacientes(filter)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error counting pacientes:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ 
      success: false, 
      message: 'Internal Server Error' 
    }, { status: 500 })
  }
}
