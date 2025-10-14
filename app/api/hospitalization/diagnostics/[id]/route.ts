import { NextRequest, NextResponse } from 'next/server'
import { diagnosticoService } from '@/services/hospitalizacion/diagnosticoService'

/**
 * GET /api/hospitalization/diagnostics/[id]
 * Obtiene el diagnóstico para una emergencia o consulta específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: 'ID de emergencia/consulta es requerido' },
        { status: 400 }
      )
    }
    
    console.log(`📋 API: Buscando diagnóstico para ID: ${id}`)
    
    // Buscar diagnóstico por ID de emergencia
    const diagnostico = await diagnosticoService.findByEmergenciaId(id.trim())
    
    if (!diagnostico) {
      return NextResponse.json(
        { 
          success: false,
          message: 'No se encontró diagnóstico para este ID',
          data: null
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: diagnostico
    })
    
  } catch (error) {
    console.error(`❌ Error al obtener diagnóstico para ID ${params.id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
