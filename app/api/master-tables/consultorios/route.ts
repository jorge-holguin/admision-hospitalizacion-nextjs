import { NextRequest, NextResponse } from 'next/server';
import { consultorioServerService } from '@/services/master-tables/consultorioService';

/**
 * GET /api/master-tables/consultorios
 * Obtiene la lista de consultorios con paginación y filtros
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const nombre = searchParams.get('nombre');
    const codigo = searchParams.get('codigo');
    const servicio = searchParams.get('servicio');
    
    const filters = {
      ...(nombre && { nombre }),
      ...(codigo && { codigo }),
      ...(servicio && { servicio })
    };
    
    const result = await consultorioServerService.getConsultorios(page, pageSize, filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en API de consultorios:', error);
    return NextResponse.json(
      { error: 'Error al obtener consultorios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/master-tables/consultorios
 * Crea un nuevo consultorio
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos requeridos
    if (!body.NOMBRE) {
      return NextResponse.json(
        { error: 'El nombre del consultorio es requerido' },
        { status: 400 }
      );
    }
    
    const newConsultorio = await consultorioServerService.createConsultorio(body);
    
    return NextResponse.json(newConsultorio, { status: 201 });
  } catch (error) {
    console.error('Error al crear consultorio:', error);
    
    if (error instanceof Error && error.message.includes('Ya existe un consultorio')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear consultorio' },
      { status: 500 }
    );
  }
}
