import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/master-tables/profesiones-colegio
 * Obtiene todas las profesiones y colegios activos
 */
export async function GET(request: NextRequest) {
  try {
    const profesiones = await prisma.$queryRaw`
      SELECT 
        id_profesion,
        Profesion,
        id_colegio,
        Colegio,
        ACTIVO
      FROM ProfesionesColegio
      WHERE ACTIVO = 1
      ORDER BY Profesion ASC
    `;

    return NextResponse.json(profesiones, { status: 200 });
  } catch (error) {
    console.error('Error fetching profesiones y colegios:', error);
    return NextResponse.json(
      { error: 'Error al obtener profesiones y colegios' },
      { status: 500 }
    );
  }
}
