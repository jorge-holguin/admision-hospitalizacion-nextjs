import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo');

    if (!codigo) {
      return NextResponse.json(
        { error: 'Código es requerido' },
        { status: 400 }
      );
    }

    // Check if codigo exists
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as Cantidad 
      FROM Localidad 
      WHERE Localidad = ${codigo}
    ` as any[];

    const exists = result[0]?.Cantidad > 0;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking codigo:', error);
    return NextResponse.json(
      { error: 'Error al verificar el código' },
      { status: 500 }
    );
  }
}
