import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateAge, calculateAgeFormatted } from '@/lib/ageCalculator';

const prisma = new PrismaClient();

/**
 * API para calcular la edad actual de un paciente basado en su fecha de nacimiento
 * Formato de salida: 000a00m00d (años, meses, días)
 * 
 * Opciones:
 * - Solo calcular: POST { fechaNacimiento: "1995-04-15" }
 * - Calcular y actualizar PACIENTE: POST { fechaNacimiento: "1995-04-15", pacienteId: "12345", updateDatabase: true }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fechaNacimiento, pacienteId, updateDatabase } = body;

    if (!fechaNacimiento) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Fecha de nacimiento es requerida' 
        },
        { status: 400 }
      );
    }

    console.log('📅 Calculando edad para fecha de nacimiento:', fechaNacimiento);
    if (pacienteId) {
      console.log('👤 Paciente ID:', pacienteId);
    }

    // Parsear la fecha de nacimiento
    let birthDate: Date;
    
    // Intentar diferentes formatos de fecha
    if (typeof fechaNacimiento === 'string') {
      // Formato ISO: YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
      if (fechaNacimiento.includes('-')) {
        birthDate = new Date(fechaNacimiento);
      }
      // Formato YYYYMMDD
      else if (fechaNacimiento.length === 8) {
        const year = parseInt(fechaNacimiento.substring(0, 4));
        const month = parseInt(fechaNacimiento.substring(4, 6)) - 1; // Meses en JS son 0-11
        const day = parseInt(fechaNacimiento.substring(6, 8));
        birthDate = new Date(year, month, day);
      }
      // Formato DD/MM/YYYY
      else if (fechaNacimiento.includes('/')) {
        const [day, month, year] = fechaNacimiento.split('/').map(Number);
        birthDate = new Date(year, month - 1, day);
      }
      else {
        throw new Error('Formato de fecha no reconocido');
      }
    } else if (fechaNacimiento instanceof Date) {
      birthDate = fechaNacimiento;
    } else {
      throw new Error('Tipo de fecha no válido');
    }

    // Validar que la fecha sea válida
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Fecha de nacimiento inválida' 
        },
        { status: 400 }
      );
    }

    // Obtener la fecha actual
    const today = new Date();
    
    // Calcular años, meses y días
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // Ajustar si los días son negativos
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }

    // Ajustar si los meses son negativos
    if (months < 0) {
      years--;
      months += 12;
    }

    // Formatear como 000a00m00d
    const formattedAge = `${years.toString().padStart(3, '0')}a${months.toString().padStart(2, '0')}m${days.toString().padStart(2, '0')}d`;

    console.log('✅ Edad calculada:', formattedAge);
    console.log(`   Años: ${years}, Meses: ${months}, Días: ${days}`);

    // Si se solicita actualizar la base de datos y hay pacienteId
    let databaseUpdated = false;
    if (updateDatabase && pacienteId) {
      try {
        await prisma.$executeRaw`
          UPDATE PACIENTE SET EDAD = ${formattedAge} WHERE PACIENTE = ${pacienteId}
        `;
        console.log(`✅ Edad actualizada en BD para paciente ${pacienteId}: ${formattedAge}`);
        databaseUpdated = true;
      } catch (dbError) {
        console.error('❌ Error al actualizar edad en BD:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        edad: formattedAge,
        years,
        months,
        days,
        fechaNacimiento: birthDate.toISOString().split('T')[0],
        fechaCalculo: today.toISOString().split('T')[0],
        databaseUpdated
      }
    });

  } catch (error) {
    console.error('❌ Error al calcular edad:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al calcular edad' 
      },
      { status: 500 }
    );
  }
}
