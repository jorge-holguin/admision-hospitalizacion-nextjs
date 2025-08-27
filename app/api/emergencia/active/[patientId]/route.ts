import { NextRequest, NextResponse } from 'next/server';
import { emergenciaService } from '@/services/emergencia/emergenciaService';

/**
 * GET /api/emergencia/activa/[pacienteId]
 * Endpoint para verificar si un paciente tiene emergencias activas
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  let pacienteId: string = '';
  
  try {
    const resolvedParams = await params;
    pacienteId = resolvedParams.patientId;
    
    // Validar que el ID del paciente no esté vacío
    if (!pacienteId || pacienteId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'ID de paciente no válido' },
        { status: 400 }
      );
    }
    
    // Verificar si el paciente tiene emergencias activas
    const hasActiveEmergencias = await emergenciaService.hasActiveEmergencias(pacienteId);
    
    return NextResponse.json({
      success: true,
      hasActiveEmergencias
    });
  } catch (error: any) {
    console.error(`Error al verificar emergencias activas del paciente ${pacienteId}:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al verificar emergencias activas' 
      },
      { status: 500 }
    );
  }
}
