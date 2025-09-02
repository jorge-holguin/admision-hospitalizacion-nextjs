import { NextRequest, NextResponse } from 'next/server';
import { cuentaValidationService } from '@/services/hospitalizacion/cuentaValidationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cuentaId } = body;
    
    if (!cuentaId) {
      return NextResponse.json({ 
        error: 'Se requiere el ID de la cuenta' 
      }, { status: 400 });
    }
    
    const result = await cuentaValidationService.updateCuentaAndFUA(cuentaId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error al desactivar cuenta:', error);
    return NextResponse.json({ 
      error: 'Error al desactivar la cuenta',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { cuentaId, onlyAccount = false } = body;
    
    if (!cuentaId) {
      return NextResponse.json({ 
        error: 'Se requiere el ID de la cuenta' 
      }, { status: 400 });
    }
    
    let result;
    
    if (onlyAccount) {
      // Solo actualizar la cuenta
      const success = await cuentaValidationService.updateCUENTA(cuentaId);
      result = {
        success,
        message: success 
          ? `Cuenta ${cuentaId} actualizada a estado inactivo`
          : `Error al actualizar la cuenta ${cuentaId}`
      };
    } else {
      // Actualizar cuenta y FUA
      result = await cuentaValidationService.updateCuentaAndFUA(cuentaId);
    }
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    return NextResponse.json({ 
      error: 'Error al actualizar la cuenta',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
