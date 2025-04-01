import { NextRequest, NextResponse } from 'next/server';
import { emergenciaService } from '@/services/emergencia/emergenciaService';

/**
 * POST /api/emergencia/crear
 * Endpoint para crear una nueva emergencia
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Validar datos mínimos requeridos
    if (!data.PACIENTE) {
      return NextResponse.json(
        { success: false, error: 'El ID del paciente es obligatorio' },
        { status: 400 }
      );
    }
    
    // Crear la emergencia
    const emergencia = await emergenciaService.createEmergencia(data);
    
    return NextResponse.json({
      success: true,
      data: emergencia
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear emergencia:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al crear emergencia' 
      },
      { status: 500 }
    );
  }
}
