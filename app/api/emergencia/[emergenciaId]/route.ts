import { NextRequest, NextResponse } from 'next/server';
import { emergenciaService } from '@/services/emergencia/emergenciaService';

/**
 * GET /api/emergencia/[emergenciaId]
 * Endpoint para obtener una emergencia específica por su ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { emergenciaId: string } }
) {
  try {
    const { emergenciaId } = params;
    
    // Validar que el ID de emergencia no esté vacío
    if (!emergenciaId || emergenciaId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'ID de emergencia no válido' },
        { status: 400 }
      );
    }
    
    // Obtener la emergencia por su ID
    const emergencia = await emergenciaService.getEmergenciaById(emergenciaId);
    
    if (!emergencia) {
      return NextResponse.json(
        { success: false, error: 'Emergencia no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: emergencia
    });
  } catch (error: any) {
    console.error(`Error al obtener emergencia ${params.emergenciaId}:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al obtener emergencia' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/emergencia/[emergenciaId]
 * Endpoint para actualizar una emergencia específica
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { emergenciaId: string } }
) {
  try {
    const { emergenciaId } = params;
    
    // Validar que el ID de emergencia no esté vacío
    if (!emergenciaId || emergenciaId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'ID de emergencia no válido' },
        { status: 400 }
      );
    }
    
    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Actualizar la emergencia
    const updatedEmergencia = await emergenciaService.updateEmergencia(emergenciaId, data);
    
    return NextResponse.json({
      success: true,
      data: updatedEmergencia
    });
  } catch (error: any) {
    console.error(`Error al actualizar emergencia ${params.emergenciaId}:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al actualizar emergencia' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/emergencia/[emergenciaId]
 * Endpoint para eliminar lógicamente una emergencia (cambiar su estado a '0')
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { emergenciaId: string } }
) {
  try {
    const { emergenciaId } = params;
    
    // Validar que el ID de emergencia no esté vacío
    if (!emergenciaId || emergenciaId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'ID de emergencia no válido' },
        { status: 400 }
      );
    }
    
    // Eliminar lógicamente la emergencia
    const deletedEmergencia = await emergenciaService.deleteEmergencia(emergenciaId);
    
    return NextResponse.json({
      success: true,
      data: deletedEmergencia
    });
  } catch (error: any) {
    console.error(`Error al eliminar emergencia ${params.emergenciaId}:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al eliminar emergencia' 
      },
      { status: 500 }
    );
  }
}
