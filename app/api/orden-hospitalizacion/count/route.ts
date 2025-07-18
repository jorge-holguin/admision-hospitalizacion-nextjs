import { NextRequest, NextResponse } from 'next/server'
import { ordenHospitalizacionService, OrdenHospitalizacionFilter } from '@/services/ordenHospitalizacionService'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Construir filtros basados en los parámetros de búsqueda
    const filter: OrdenHospitalizacionFilter = {}
    
    if (searchParams.has('pacienteId')) {
      filter.pacienteId = searchParams.get('pacienteId') || ''
    }
    
    console.log('API: Contando órdenes de hospitalización con filtros:', filter)
    
    const result = await ordenHospitalizacionService.countOrdenHospitalizacion(filter)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error contando órdenes de hospitalización:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
