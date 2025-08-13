import { NextRequest, NextResponse } from 'next/server';
import hospitalizaService from '@/services/hospitalizacion/hospitalizaService';
import { revalidatePath } from 'next/cache';

// GET /api/hospitaliza/[id] - Obtener una hospitalización por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la hospitalización' },
        { status: 400 }
      );
    }
    
    const hospitalizacion = await hospitalizaService.findById(id);
    
    if (!hospitalizacion) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(hospitalizacion);
  } catch (error: any) {
    console.error('Error al obtener hospitalización:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener la hospitalización' },
      { status: 500 }
    );
  }
}

// DELETE /api/hospitaliza/[id] - Eliminar una hospitalización por ID (eliminación lógica)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Asegurar que params.id está disponible antes de usarlo
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la hospitalización' },
        { status: 400 }
      );
    }
    
    // Obtener el motivo de la eliminación del cuerpo de la solicitud (opcional)
    let motivo: string | undefined;
    let usuarioBaja: string = 'SISTEMA'; // Valor por defecto
    
    try {
      const body = await request.json();
      motivo = body.motivo;
      
      // Obtener el apellido del usuario desde el cuerpo de la solicitud
      if (body.usuario) {
        usuarioBaja = body.usuario;
      }
    } catch (e) {
      // Si no hay cuerpo o no se puede parsear, continuamos con los valores por defecto
      console.log('No se proporcionó cuerpo en la solicitud o no se pudo parsear');
    }
    
    console.log(`Intentando eliminar lógicamente hospitalización con ID: ${id}`);
    console.log(`Usuario que realiza la baja: ${usuarioBaja}`);
    
    // Realizar la eliminación lógica de la hospitalización
    const result = await hospitalizaService.logicalDeleteById(id, usuarioBaja, motivo);
    
    // Revalidar la ruta para actualizar la UI
    revalidatePath('/hospitalization/orders');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Hospitalización marcada como eliminada correctamente', 
      data: result 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error al eliminar hospitalización:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la hospitalización' },
      { status: 500 }
    );
  }
}
