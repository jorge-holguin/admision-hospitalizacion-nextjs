import { NextRequest, NextResponse } from 'next/server'
import { ordenHospitalizacionService } from '@/services/ordenHospitalizacionService'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar que el ID exista y sea válido
    if (!params || !params.id || params.id === 'undefined' || params.id.trim() === '') {
      console.error('API: ID de orden de hospitalización inválido o no proporcionado:', params?.id);
      return NextResponse.json({ error: 'ID de orden de hospitalización inválido o no proporcionado' }, { status: 400 });
    }
    
    const id = params.id;
    console.log(`API: Buscando orden de hospitalización con ID: ${id}`);
    
    const result = await ordenHospitalizacionService.getOrdenHospitalizacionById(id);
    
    if (!result) {
      return NextResponse.json({ error: 'Orden de hospitalización no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    const idValue = params?.id || 'desconocido';
    console.error(`Error fetching orden de hospitalización ${idValue}:`, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
