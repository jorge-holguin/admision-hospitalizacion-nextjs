import { NextRequest, NextResponse } from 'next/server'
import { ordenHospitalizacionService, OrdenHospitalizacionFilter } from '@/services/hospitalizacion/ordenHospitalizacionService'

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    console.log('🏥 API: Obteniendo hospitalizaciones para paciente:', patientId)

    // Validar parámetros
    if (!patientId) {
      return NextResponse.json(
        { success: false, message: 'ID de paciente requerido' },
        { status: 400 }
      )
    }

    // Construir filtros
    const filter: OrdenHospitalizacionFilter = {
      pacienteId: patientId
    }
    
    console.log('API: Buscando órdenes de hospitalización con filtros:', { filter, page, pageSize })
    
    const result = await ordenHospitalizacionService.getPaginatedOrdenHospitalizacion(filter, { page, pageSize })
    
    console.log('✅ API: Hospitalizaciones obtenidas exitosamente')
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ API: Error al obtener hospitalizaciones:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
