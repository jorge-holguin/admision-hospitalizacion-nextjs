import { NextRequest, NextResponse } from 'next/server';
import hospitalizaService from '@/services/hospitalizaService';
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

// DELETE /api/hospitaliza/[id] - Eliminar una hospitalización por ID
export async function DELETE(
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
    
    console.log(`Intentando eliminar hospitalización con ID: ${id}`);
    
    // Eliminar la hospitalización
    const result = await hospitalizaService.deleteById(id);
    
    // Revalidar la ruta para actualizar la UI
    revalidatePath('/hospitalization/orders');
    
    return NextResponse.json({ success: true, message: 'Hospitalización eliminada correctamente', data: result }, { status: 200 });
  } catch (error: any) {
    console.error('Error al eliminar hospitalización:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la hospitalización' },
      { status: 500 }
    );
  }
}
