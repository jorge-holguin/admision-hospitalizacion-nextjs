import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const tiposCita = await prisma.$queryRaw`
      SELECT Tipo_cita, Nombre 
      FROM Tipo_Cita
      ORDER BY Nombre
    `;

    return NextResponse.json(tiposCita);
  } catch (error) {
    console.error('Error fetching tipos de cita:', error);
    return NextResponse.json(
      { error: 'Error al obtener los tipos de cita' },
      { status: 500 }
    );
  }
}
