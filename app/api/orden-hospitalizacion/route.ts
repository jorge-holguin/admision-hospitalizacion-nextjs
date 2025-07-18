import { NextRequest, NextResponse } from 'next/server'
import { ordenHospitalizacionService, OrdenHospitalizacionFilter } from '@/services/ordenHospitalizacionService'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1
    const pageSize = searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 10
    
    // Construir filtros basados en los parámetros de búsqueda
    const filter: OrdenHospitalizacionFilter = {}
    
    if (searchParams.has('pacienteId')) {
      filter.pacienteId = searchParams.get('pacienteId') || ''
    }
    
    console.log('API: Buscando órdenes de hospitalización con filtros:', { filter, page, pageSize })
    
    const result = await ordenHospitalizacionService.getPaginatedOrdenHospitalizacion(filter, { page, pageSize })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching órdenes de hospitalización:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log('API: Creando/actualizando orden de hospitalización:', data)
    
    // Validar datos requeridos
    if (!data.pacienteId) {
      return NextResponse.json({ error: 'ID de paciente es requerido' }, { status: 400 })
    }
    
    let result
    if (data.id) {
      // Actualizar orden existente
      result = await ordenHospitalizacionService.updateOrdenHospitalizacion(data.id, data)
    } else {
      // Crear nueva orden
      result = await ordenHospitalizacionService.createOrdenHospitalizacion(data)
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error al guardar orden de hospitalización:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
