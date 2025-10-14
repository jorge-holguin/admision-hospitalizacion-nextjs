import { NextRequest, NextResponse } from 'next/server';
import { emergenciaService } from '@/services/emergencia/emergenciaService';

/**
 * GET /api/emergencia/paciente/[pacienteId]
 * Endpoint para obtener todas las emergencias de un paciente específico
 * Parámetros opcionales:
 * - page: Número de página (por defecto: 1)
 * - pageSize: Tamaño de página (por defecto: 10)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ patientId: string }> }
) {
  // Define pacienteId at function scope so it's available in catch block
  let pacienteId: string = '';
  
  try {
    // Await params before accessing properties
    const params = await context.params;
    pacienteId = params.patientId;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '10';
    
    // Convertir parámetros de paginación a números
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    
    // Validar parámetros de paginación
    if (isNaN(pageNum) || isNaN(pageSizeNum) || pageNum < 1 || pageSizeNum < 1) {
      return NextResponse.json(
        { success: false, error: 'Parámetros de paginación inválidos' },
        { status: 400 }
      );
    }
    
    // Validar que el ID del paciente no esté vacío
    if (!pacienteId || pacienteId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'ID de paciente no válido' },
        { status: 400 }
      );
    }
    
    // Obtener emergencias del paciente
    const result = await emergenciaService.getEmergenciasByPacienteId(
      pacienteId,
      { page: pageNum, pageSize: pageSizeNum }
    );
    
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    // Use the pacienteId variable which is already defined
    console.error(`Error al obtener emergencias del paciente ${pacienteId}:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al obtener emergencias del paciente' 
      },
      { status: 500 }
    );
  }
}
