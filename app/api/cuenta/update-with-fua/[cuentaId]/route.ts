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

    const result = await cuentaService.updateCuentaAndFUA(cuentaId);
    
    return NextResponse.json({
      success: result.success,
      message: result.message
    }, { status: result.success ? 200 : 500 });
    
  } catch (error: any) {
    console.error('Error al actualizar cuenta y FUA:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar cuenta y FUA' },
      { status: 500 }
    );
  }
}
