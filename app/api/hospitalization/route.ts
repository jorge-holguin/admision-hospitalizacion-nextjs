import { NextRequest, NextResponse } from 'next/server'
import { ordenHospitalizacionService, OrdenHospitalizacionFilter } from '@/services/hospitalizacion/ordenHospitalizacionService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const getNextId = searchParams.get('next-id')
    
    // Caso 1: Obtener el siguiente ID de hospitalización
    if (getNextId === 'true') {
      console.log('🏥 API: Obteniendo siguiente ID de hospitalización')
      const nextId = await ordenHospitalizacionService.getNextId()
      return NextResponse.json({ 
        success: true,
        nextId: nextId 
      })
    }
    
    // Caso 2: Obtener lista de hospitalizaciones con filtros
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const pacienteId = searchParams.get('pacienteId')

    console.log('🏥 API: Obteniendo hospitalizaciones', { page, pageSize, pacienteId })

    // Construir filtros basados en los parámetros de búsqueda
    const filter: OrdenHospitalizacionFilter = {}
    
    if (pacienteId) {
      filter.pacienteId = pacienteId
    }
    
    console.log('API: Buscando órdenes de hospitalización con filtros:', { filter, page, pageSize })
    
    const result = await ordenHospitalizacionService.getPaginatedOrdenHospitalizacion(filter, { page, pageSize })
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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('🏥 API: Creando/actualizando orden de hospitalización:', data)
    console.log('🏥 API: Campos recibidos:', Object.keys(data))
    
    // Validar datos requeridos - Aceptar tanto PACIENTE como pacienteId
    const pacienteId = data.PACIENTE || data.pacienteId
    if (!pacienteId) {
      return NextResponse.json({ 
        error: 'ID de paciente es requerido',
        received: Object.keys(data)
      }, { status: 400 })
    }
    
    // Normalizar el campo PACIENTE si viene como pacienteId
    if (data.pacienteId && !data.PACIENTE) {
      data.PACIENTE = data.pacienteId
    }
    
    let result
    if (data.IDHOSPITALIZACION || data.id) {
      // Actualizar orden existente
      const id = data.IDHOSPITALIZACION || data.id
      result = await ordenHospitalizacionService.updateOrdenHospitalizacion(id, data)
    } else {
      // Crear nueva orden
      result = await ordenHospitalizacionService.createOrdenHospitalizacion(data)
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error al guardar orden de hospitalización:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ 
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Se requiere el ID de la hospitalización' 
        },
        { status: 400 }
      )
    }
    
    console.log(`🗑️ API: Eliminando orden de hospitalización con ID: ${id}`)
    
    // Eliminar la hospitalización (eliminación lógica)
    const result = await ordenHospitalizacionService.deleteById(id)
    
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('❌ Error al eliminar hospitalización:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar la hospitalización' 
      },
      { status: 500 }
    )
  }
}
