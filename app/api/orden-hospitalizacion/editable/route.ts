import { NextRequest, NextResponse } from 'next/server';
import { ordenHospitalizacionService } from '@/services/ordenHospitalizacionService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get('pacienteId');
    
    if (!pacienteId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del paciente' },
        { status: 400 }
      );
    }
    
    const result = await ordenHospitalizacionService.checkEditableStatus(pacienteId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en API de verificación de estado editable:', error);
    return NextResponse.json(
      { error: 'Error al verificar estado editable', isEditable: false },
      { status: 500 }
    );
  }
}
