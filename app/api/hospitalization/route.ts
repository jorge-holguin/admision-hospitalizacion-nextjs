import { NextRequest, NextResponse } from 'next/server';
import hospitalizaService, { HospitalizaData } from '@/services/hospitalizacion/hospitalizaService';
import { revalidatePath } from 'next/cache';

// GET /api/hospitaliza - Obtener hospitalizaciones o el siguiente ID

// POST /api/hospitaliza - Crear una nueva hospitalización
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validar datos requeridos
    const baseRequiredFields = [
      'IDHOSPITALIZACION', 'PACIENTE', 'NOMBRES', 'CONSULTORIO1', 
      'HORA1', 'FECHA1', 'ORIGEN', 'SEGURO', 'MEDICO1', 
      'ESTADO', 'USUARIO', 'DIAGNOSTICO', 'EDAD'
    ];
    
    // ORIGENID es requerido solo si ORIGEN no es 'RN'
    const requiredFields = data.ORIGEN === 'RN' 
      ? baseRequiredFields 
      : [...baseRequiredFields, 'ORIGENID'];
    
    // Si ORIGEN es 'RN', aseguramos que ORIGENID sea un string vacío
    if (data.ORIGEN === 'RN') {
      data.ORIGENID = '';
    }
    
    const missingFields = requiredFields.filter(field => data[field] === undefined || data[field] === null);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos requeridos: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Crear la hospitalización
    const result = await hospitalizaService.create(data as HospitalizaData);
    
    // Retornar en el formato esperado por el frontend
    return NextResponse.json({ 
      success: true, 
      data: result 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error en API de hospitalización:', error);
    
    // Extraer mensaje de error personalizado
    let errorMessage = error.message || 'Error al crear la hospitalización';
    
    // Si el error contiene información de Prisma, intentar extraer el mensaje real
    if (errorMessage.includes('Invalid `prisma.$executeRaw()` invocation')) {
      // Detectar error de trigger de emergencia no cerrada
      if (errorMessage.includes('3616') || errorMessage.includes('desencadenador')) {
        errorMessage = 'La atención de Emergencia aún no ha sido cerrada (estado = \'3\'). Solicitar al médico cerrar o dar de alta la atención.';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la hospitalización' },
        { status: 400 }
      );
    }
    
    // Eliminar la hospitalización
    const result = await hospitalizaService.deleteById(id);
    
    // Revalidar la ruta para actualizar la UI
    revalidatePath('/hospitalization/orders');
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error al eliminar hospitalización:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la hospitalización' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const getNextId = searchParams.get('next-id');
    
    // Obtener el siguiente ID de hospitalización
    if (getNextId === 'true') {
      const nextId = await hospitalizaService.getNextId();
      return NextResponse.json(nextId, { status: 200 });
    }
    
    // Obtener una hospitalización específica por ID
    if (id) {
      const hospitalizacion = await hospitalizaService.findById(id);
      if (!hospitalizacion) {
        return NextResponse.json(
          { error: 'Hospitalización no encontrada' },
          { status: 404 }
        );
      }
      return NextResponse.json(hospitalizacion);
    }
    
    // Obtener todas las hospitalizaciones
    const hospitalizaciones = await hospitalizaService.findAll();
    return NextResponse.json(hospitalizaciones);
  } catch (error: any) {
    console.error('Error al obtener hospitalizaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener hospitalizaciones' },
      { status: 500 }
    );
  }
}
