import { NextRequest, NextResponse } from 'next/server';
import { cuentaService } from '@/services/emergencia/cuentaService';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId: cuentaId } = await params;
    
    console.log('📝 API: Actualizando cuenta con ID:', cuentaId);
    
    if (!cuentaId) {
      return NextResponse.json(
        { success: false, error: 'ID de cuenta no proporcionado' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { seguro } = body;

    // Si se proporciona un nuevo seguro, actualizar el campo SEGURO
    if (seguro !== undefined) {
      console.log(`Actualizando cuenta ${cuentaId} con nuevo seguro: ${seguro}`);
      
      const result = await cuentaService.updateCuentaSeguro(cuentaId, seguro);
      
      if (result) {
        return NextResponse.json({
          success: true,
          message: `Cuenta ${cuentaId} actualizada correctamente con seguro ${seguro}`,
          data: result
        });
      } else {
        return NextResponse.json(
          { success: false, error: `Error al actualizar el seguro de la cuenta ${cuentaId}` },
          { status: 500 }
        );
      }
    }

    // Lógica original para actualizar estado a inactivo
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
