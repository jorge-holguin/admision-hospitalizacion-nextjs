import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Obtener una localidad por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const localidad = await prisma.lOCALIDAD.findUnique({
      where: { LOCALIDAD: id },
    });
    
    if (!localidad) {
      return NextResponse.json(
        { error: "Localidad no encontrada" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(localidad);
  } catch (error) {
    console.error(`Error al obtener localidad ${params.id}:`, error);
    return NextResponse.json(
      { error: "Error al obtener localidad" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una localidad por ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Verificar si la localidad existe
    const existingLocalidad = await prisma.lOCALIDAD.findUnique({
      where: { LOCALIDAD: id },
    });
    
    if (!existingLocalidad) {
      return NextResponse.json(
        { error: "Localidad no encontrada" },
        { status: 404 }
      );
    }
    
    // Actualizar la localidad
    const updatedLocalidad = await prisma.lOCALIDAD.update({
      where: { LOCALIDAD: id },
      data: {
        NOMBRE: body.NOMBRE !== undefined ? body.NOMBRE : existingLocalidad.NOMBRE,
        UBIGEO: body.UBIGEO !== undefined ? body.UBIGEO : existingLocalidad.UBIGEO,
        ACTIVO: body.ACTIVO !== undefined ? body.ACTIVO : existingLocalidad.ACTIVO,
      },
    });
    
    return NextResponse.json(updatedLocalidad);
  } catch (error) {
    console.error(`Error al actualizar localidad ${params.id}:`, error);
    return NextResponse.json(
      { error: "Error al actualizar localidad" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una localidad por ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Verificar si la localidad existe
    const existingLocalidad = await prisma.lOCALIDAD.findUnique({
      where: { LOCALIDAD: id },
    });
    
    if (!existingLocalidad) {
      return NextResponse.json(
        { error: "Localidad no encontrada" },
        { status: 404 }
      );
    }
    
    // Eliminar la localidad
    await prisma.lOCALIDAD.delete({
      where: { LOCALIDAD: id },
    });
    
    return NextResponse.json({ message: "Localidad eliminada correctamente" });
  } catch (error) {
    console.error(`Error al eliminar localidad ${params.id}:`, error);
    return NextResponse.json(
      { error: "Error al eliminar localidad" },
      { status: 500 }
    );
  }
}
