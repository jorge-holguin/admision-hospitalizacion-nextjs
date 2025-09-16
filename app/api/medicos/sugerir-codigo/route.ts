import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { nombreCompleto } = await request.json();

    if (!nombreCompleto) {
      return NextResponse.json(
        { error: 'El nombre completo es requerido' },
        { status: 400 }
      );
    }

    // Generar candidatos de código
    const candidatos = generarCandidatos(nombreCompleto);
    
    // Verificar disponibilidad en la base de datos
    const candidatosDisponibles = await verificarDisponibilidad(candidatos);

    return NextResponse.json({
      candidatos: candidatosDisponibles
    });

  } catch (error) {
    console.error('Error al sugerir códigos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function generarCandidatos(nombreCompleto: string): string[] {
  const palabras = nombreCompleto.trim().toUpperCase().split(/\s+/);
  
  if (palabras.length < 2) {
    return [];
  }

  const candidatos: string[] = [];
  
  // Si hay al menos 3 palabras (apellido paterno, materno, nombre)
  if (palabras.length >= 3) {
    const [apellidoPaterno, apellidoMaterno, nombre] = palabras;
    const iniciales = [apellidoPaterno[0], apellidoMaterno[0], nombre[0]];
    
    // Generar todas las permutaciones de 3 letras
    const permutaciones = [
      iniciales.join(''), // ABC
      [iniciales[0], iniciales[2], iniciales[1]].join(''), // ACB
      [iniciales[1], iniciales[0], iniciales[2]].join(''), // BAC
      [iniciales[1], iniciales[2], iniciales[0]].join(''), // BCA
      [iniciales[2], iniciales[0], iniciales[1]].join(''), // CAB
      [iniciales[2], iniciales[1], iniciales[0]].join(''), // CBA
    ];
    
    candidatos.push(...permutaciones);
  }
  
  // Si solo hay 2 palabras, usar las primeras 2 letras de cada una
  else if (palabras.length === 2) {
    const [palabra1, palabra2] = palabras;
    if (palabra1.length >= 2 && palabra2.length >= 1) {
      candidatos.push(palabra1.substring(0, 2) + palabra2[0]);
    }
    if (palabra1.length >= 1 && palabra2.length >= 2) {
      candidatos.push(palabra1[0] + palabra2.substring(0, 2));
    }
  }

  // Eliminar duplicados
  return [...new Set(candidatos)];
}

async function verificarDisponibilidad(candidatos: string[]): Promise<string[]> {
  const candidatosDisponibles: string[] = [];
  
  for (const candidato of candidatos) {
    // Verificar si el código ya existe
    const existente = await prisma.mEDICO.findFirst({
      where: {
        MEDICO: candidato
      }
    });
    
    if (!existente) {
      candidatosDisponibles.push(candidato);
    }
  }
  
  // Si no hay candidatos disponibles, generar con sufijos numéricos
  if (candidatosDisponibles.length === 0 && candidatos.length > 0) {
    const candidatoBase = candidatos[0];
    
    for (let i = 1; i <= 10; i++) {
      const candidatoConSufijo = candidatoBase + i;
      
      const existente = await prisma.mEDICO.findFirst({
        where: {
          MEDICO: candidatoConSufijo
        }
      });
      
      if (!existente) {
        candidatosDisponibles.push(candidatoConSufijo);
        
        // Limitar a máximo 5 sugerencias
        if (candidatosDisponibles.length >= 5) {
          break;
        }
      }
    }
  }
  
  // Limitar a máximo 10 sugerencias
  return candidatosDisponibles.slice(0, 10);
}
