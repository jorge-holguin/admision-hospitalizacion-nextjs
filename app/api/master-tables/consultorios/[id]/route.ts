import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/master-tables/consultorios/[id]
 * Obtiene un consultorio por su ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Buscar el consultorio por ID
    const consultorio = await prisma.$queryRaw`
      SELECT CONSULTORIO, NOMBRE, ABREVIATURA, ESPECIALIDAD, HIS_NOMSERVICIO, ACTIVO
      FROM CONSULTORIO
      WHERE CONSULTORIO = ${id}
    `;
    
    // Verificar si se encontró el consultorio
    if (!consultorio || (Array.isArray(consultorio) && consultorio.length === 0)) {
      return NextResponse.json(
        { error: 'Consultorio no encontrado' },
        { status: 404 }
      );
    }
    
    // Devolver el consultorio encontrado
    return NextResponse.json(Array.isArray(consultorio) ? consultorio[0] : consultorio);
  } catch (error) {
    console.error(`Error al obtener consultorio ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Error al obtener consultorio' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/master-tables/consultorios/[id]
 * Actualiza un consultorio existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const consultorioData = await request.json();
    
    // Validar datos requeridos
    if (!consultorioData.NOMBRE) {
      return NextResponse.json(
        { error: 'El nombre del consultorio es requerido' },
        { status: 400 }
      );
    }
    
    // Actualizar el consultorio en la base de datos
    await prisma.$executeRaw`
      UPDATE CONSULTORIO
      SET NOMBRE = ${consultorioData.NOMBRE},
          SERVICIO = ${consultorioData.SERVICIO || ''}
      WHERE CONSULTORIO = ${id}
    `;
    
    // Obtener el consultorio actualizado
    const consultorioActualizado = await prisma.$queryRaw`
      SELECT CONSULTORIO, NOMBRE, SERVICIO, ACTIVO
      FROM CONSULTORIO
      WHERE CONSULTORIO = ${id}
    `;
    
    return NextResponse.json(Array.isArray(consultorioActualizado) ? consultorioActualizado[0] : consultorioActualizado);
  } catch (error) {
    console.error(`Error al actualizar consultorio ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar consultorio' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/master-tables/consultorios/[id]
 * Elimina un consultorio (marcándolo como inactivo)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // En lugar de eliminar físicamente, marcar como inactivo
    await prisma.$executeRaw`
      UPDATE CONSULTORIO
      SET ACTIVO = 'N'
      WHERE CONSULTORIO = ${id}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error al eliminar consultorio ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Error al eliminar consultorio' },
      { status: 500 }
    );
  }
}
