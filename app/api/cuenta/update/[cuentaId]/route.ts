import { NextRequest, NextResponse } from 'next/server';
import { cuentaService } from '@/services/emergencia/cuentaService';

export async function PUT(
  request: NextRequest,
  { params }: { params: { cuentaId: string } }
) {
  try {
    const cuentaId = params.cuentaId;
    
    if (!cuentaId) {
      return NextResponse.json(
        { success: false, error: 'ID de cuenta no proporcionado' },
        { status: 400 }
      );
    }

    const result = await cuentaService.updateCUENTA(cuentaId);
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: `Cuenta ${cuentaId} actualizada correctamente a estado inactivo`
      });
    } else {
      return NextResponse.json(
        { success: false, error: `Error al actualizar la cuenta ${cuentaId}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error al actualizar cuenta:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar cuenta' },
      { status: 500 }
    );
  }
}
