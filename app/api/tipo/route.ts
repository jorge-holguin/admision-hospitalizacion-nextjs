import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch tipos from Tabla where Tabla='T'
    const tipos = await prisma.$queryRaw`
      SELECT Codigo, Nombre 
      FROM Tabla 
      WHERE Tabla = 'T'
      ORDER BY Codigo
    `;

    return NextResponse.json(tipos);
  } catch (error) {
    console.error('Error fetching tipos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los tipos' },
      { status: 500 }
    );
  }
}
