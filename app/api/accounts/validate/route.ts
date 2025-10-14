import { NextRequest, NextResponse } from 'next/server';
import { cuentaValidationService } from '@/services/hospitalizacion/cuentaValidationService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const patientId = searchParams.get('patientId');
  const tipoSeguro = searchParams.get('tipoSeguro');
  const debug = searchParams.get('debug') === 'true';
  
  if (!patientId) {
    return NextResponse.json({ error: 'Se requiere el ID del paciente' }, { status: 400 });
  }
  
  if (!tipoSeguro) {
    return NextResponse.json({ error: 'Se requiere el tipo de seguro' }, { status: 400 });
  }
  
  try {
    console.log(`=== VALIDACIÓN CUENTA ===`);
    console.log(`Paciente: ${patientId}, Seguro: ${tipoSeguro}, Debug: ${debug}`);
    
    const result = await cuentaValidationService.validateCuentaAndFua(patientId, tipoSeguro);
    
    if (debug) {
      // En modo debug, agregar información adicional
      const cuenta = await cuentaValidationService.getCuentaActivaByPacienteIdAndSeguro(patientId, tipoSeguro);
      let fuaDetails = null;
      
      if (cuenta && cuenta.NROFUA) {
        fuaDetails = await cuentaValidationService.getFuaDetails(cuenta.NROFUA.trim());
      }
      
      return NextResponse.json({
        ...result,
        debug: {
          cuenta,
          fuaDetails,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error al validar cuenta:', error);
    return NextResponse.json({ 
      error: 'Error al validar la cuenta',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, tipoSeguro } = body;
    
    if (!patientId || !tipoSeguro) {
      return NextResponse.json({ 
        error: 'Se requieren patientId y tipoSeguro' 
      }, { status: 400 });
    }
    
    const result = await cuentaValidationService.validateCuentaAndFua(patientId, tipoSeguro);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error al validar cuenta:', error);
    return NextResponse.json({ 
      error: 'Error al validar la cuenta',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
