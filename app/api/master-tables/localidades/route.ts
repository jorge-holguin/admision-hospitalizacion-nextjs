import { NextRequest, NextResponse } from "next/server";
import { localidadServerService } from '@/services/master-tables/localidadService';

// GET: Obtener todas las localidades con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    
    // Filtros
    const nombre = searchParams.get("nombre");
    const codigo = searchParams.get("codigo");
    
    const filters = {
      ...(nombre && { nombre }),
      ...(codigo && { codigo })
    };
    
    const result = await localidadServerService.getLocalidades(page, pageSize, filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al obtener localidades:", error);
    return NextResponse.json(
      { error: "Error al obtener localidades" },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva localidad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos requeridos
    if (!body.NOMBRE) {
      return NextResponse.json(
        { error: "El nombre de localidad es obligatorio" },
        { status: 400 }
      );
    }
    
    const newLocalidad = await localidadServerService.createLocalidad(body);
    
    return NextResponse.json(newLocalidad, { status: 201 });
  } catch (error) {
    console.error("Error al crear localidad:", error);
    
    if (error instanceof Error && error.message.includes('Ya existe una localidad')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Error al crear localidad" },
      { status: 500 }
    );
  }
}
