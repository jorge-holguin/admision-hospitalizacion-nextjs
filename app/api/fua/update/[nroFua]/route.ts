import { NextRequest, NextResponse } from 'next/server';
import { cuentaService } from '@/services/emergencia/cuentaService';

export async function PUT(
  request: NextRequest,
  { params }: { params: { nroFua: string } }
) {
  try {
    const nroFua = params.nroFua;
    
    if (!nroFua) {
      return NextResponse.json(
        { success: false, error: 'Número de FUA no proporcionado' },
        { status: 400 }
      );
    }

    const result = await cuentaService.updateFUA(nroFua);
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: `FUA ${nroFua} actualizada correctamente a estado inactivo`
      });
    } else {
      return NextResponse.json(
        { success: false, error: `Error al actualizar la FUA ${nroFua}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error al actualizar FUA:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar FUA' },
      { status: 500 }
    );
  }
}
