import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const especialidad = searchParams.get('especialidad');

    let consultorios;
    
    if (especialidad && especialidad !== '0001') {
      // Filter by especialidad if provided and not '0001'
      consultorios = await prisma.$queryRaw`
        SELECT Consultorio, Nombre 
        FROM Consultorio 
        WHERE especialidad = ${especialidad} OR especialidad = '0'
        ORDER BY Nombre
      `;
    } else {
      // For especialidad '0001' or no filter, show all consultorios
      consultorios = await prisma.$queryRaw`
        SELECT Consultorio, Nombre 
        FROM Consultorio 
        WHERE especialidad = '0001' OR especialidad = '0'
        ORDER BY Nombre
      `;
    }

    return NextResponse.json({
      success: true,
      data: consultorios
    });
  } catch (error) {
    console.error('Error fetching consultorios by especialidad:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener consultorios por especialidad' 
      },
      { status: 500 }
    );
  }
}
