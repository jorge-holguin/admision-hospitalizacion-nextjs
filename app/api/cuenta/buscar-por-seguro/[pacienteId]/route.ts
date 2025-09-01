import { NextRequest, NextResponse } from 'next/server';
import { cuentaService } from '@/services/emergencia/cuentaService';

/**
 * Endpoint para buscar cuenta activa de un paciente por tipo de seguro
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { pacienteId: string } }
) {
  try {
    const { pacienteId } = params;
    const { searchParams } = new URL(request.url);
    const tipoSeguro = searchParams.get('seguro');

    if (!pacienteId) {
      return NextResponse.json(
        { error: 'ID de paciente es requerido' },
        { status: 400 }
      );
    }

    if (!tipoSeguro) {
      return NextResponse.json(
        { error: 'Tipo de seguro es requerido' },
        { status: 400 }
      );
    }

    console.log(`Buscando cuenta para paciente ${pacienteId} con seguro ${tipoSeguro}`);

    const cuentaId = await cuentaService.getCuentaActivaByPacienteIdAndSeguro(
      pacienteId,
      tipoSeguro
    );

    if (!cuentaId) {
      return NextResponse.json(
        { 
          success: false,
          message: `No se encontró cuenta activa para el paciente con seguro ${tipoSeguro}`,
          cuentaId: null
        },
        { status: 200 } // Devolver 200 en lugar de 404 para manejar mejor este caso en el cliente
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta encontrada',
      cuentaId: cuentaId
    });

  } catch (error) {
    console.error('Error al buscar cuenta por seguro:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
