import { NextRequest } from 'next/server';
import { cuentaService } from '@/services/emergencia/cuentaService';

export async function GET(
  request: NextRequest,
  { params }: { params: { pacienteId: string } }
) {
  try {
    // En Next.js 15, params debe ser awaited
    const { pacienteId } = await params;

    if (!pacienteId) {
      return Response.json(
        { success: false, error: 'ID de paciente no proporcionado' },
        { status: 400 }
      );
    }

    // Obtener el número de cuenta activa del paciente
    const cuentaId = await cuentaService.getCuentaActivaByPacienteId(pacienteId);
    const FUAId = await cuentaService.getFUAActivaByCuentaId(cuentaId);
    
    return Response.json({
      success: true,
      data: { cuentaId, FUAId }
    });
  } catch (error) {
    console.error('Error al obtener número de cuenta:', error);
    return Response.json(
      { success: false, error: 'Error al obtener número de cuenta' },
      { status: 500 }
    );
  }
}
