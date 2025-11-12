import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const especialidades = await prisma.$queryRaw`
      SELECT Especialidad AS Codigo, Nombre 
      FROM Especialidad
      WHERE Activo = '1' 
      ORDER BY Codigo
    `;

    return NextResponse.json({
      success: true,
      data: especialidades
    });
  } catch (error) {
    console.error('Error fetching especialidades:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener especialidades' 
      },
      { status: 500 }
    );
  }
}
