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
  // Limpiar el nombre: eliminar números y caracteres especiales, solo letras
  const nombreLimpio = nombreCompleto.trim().toUpperCase().replace(/[^A-Z\s]/g, '');
  const palabras = nombreLimpio.split(/\s+/).filter(p => p.length > 0);
  
  console.log('📝 Nombre original:', nombreCompleto);
  console.log('📝 Nombre limpio:', nombreLimpio);
  console.log('📝 Palabras:', palabras);
  
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
    
    // Agregar variaciones con 2 letras del apellido paterno
    if (apellidoPaterno.length >= 2) {
      candidatos.push(apellidoPaterno.substring(0, 2) + nombre[0]); // AAC
      candidatos.push(apellidoPaterno.substring(0, 2) + apellidoMaterno[0]); // AAB
    }
  }
  
  // Si solo hay 2 palabras, generar más variaciones
  else if (palabras.length === 2) {
    const [palabra1, palabra2] = palabras;
    
    if (palabra1.length >= 2 && palabra2.length >= 1) {
      candidatos.push(palabra1.substring(0, 2) + palabra2[0]); // AAB
      candidatos.push(palabra1[0] + palabra1[1] + palabra2[0]); // ABC
    }
    if (palabra1.length >= 1 && palabra2.length >= 2) {
      candidatos.push(palabra1[0] + palabra2.substring(0, 2)); // ABB
      candidatos.push(palabra1[0] + palabra2[0] + palabra2[1]); // ABC
    }
    if (palabra1.length >= 3) {
      candidatos.push(palabra1.substring(0, 3)); // AAA
    }
    if (palabra2.length >= 3) {
      candidatos.push(palabra2.substring(0, 3)); // BBB
    }
  }
  
  // Si solo hay 1 palabra, usar las primeras 3 letras
  else if (palabras.length === 1) {
    const palabra = palabras[0];
    if (palabra.length >= 3) {
      candidatos.push(palabra.substring(0, 3));
    }
    if (palabra.length >= 2) {
      candidatos.push(palabra.substring(0, 2) + 'X');
    }
    if (palabra.length >= 1) {
      candidatos.push(palabra[0] + 'XX');
    }
  }

  console.log('🎯 Candidatos generados:', candidatos);
  
  // Eliminar duplicados
  return [...new Set(candidatos)];
}

async function verificarDisponibilidad(candidatos: string[]): Promise<string[]> {
  const candidatosDisponibles: string[] = [];
  
  console.log('🔍 Verificando disponibilidad de candidatos:', candidatos);
  
  // Verificar candidatos originales
  for (const candidato of candidatos) {
    // Usar queryRaw para evitar el error de OFFSET en SQL Server
    const resultado: any = await prisma.$queryRawUnsafe(
      `SELECT TOP 1 MEDICO FROM MEDICO WHERE MEDICO = '${candidato}'`
    );
    
    const existente = Array.isArray(resultado) && resultado.length > 0;
    
    if (!existente) {
      candidatosDisponibles.push(candidato);
      console.log(`✅ Disponible: ${candidato}`);
    } else {
      console.log(`❌ Ocupado: ${candidato}`);
    }
  }
  
  // Si ya tenemos suficientes, retornar
  if (candidatosDisponibles.length >= 5) {
    console.log('✅ Suficientes candidatos encontrados:', candidatosDisponibles.slice(0, 10));
    return candidatosDisponibles.slice(0, 10);
  }
  
  // Si no hay suficientes, generar con sufijos numéricos
  console.log('⚠️ Generando códigos con sufijos numéricos...');
  
  const candidatoBase = candidatos.length > 0 ? candidatos[0] : 'MED';
  
  for (let i = 1; i <= 99; i++) {
    const candidatoConSufijo = candidatoBase + i;
    
    const resultado: any = await prisma.$queryRawUnsafe(
      `SELECT TOP 1 MEDICO FROM MEDICO WHERE MEDICO = '${candidatoConSufijo}'`
    );
    
    const existente = Array.isArray(resultado) && resultado.length > 0;
    
    if (!existente) {
      candidatosDisponibles.push(candidatoConSufijo);
      console.log(`✅ Generado: ${candidatoConSufijo}`);
      
      // Limitar a máximo 10 sugerencias
      if (candidatosDisponibles.length >= 10) {
        break;
      }
    }
  }
  
  // Si aún no hay suficientes, generar códigos aleatorios
  if (candidatosDisponibles.length < 5) {
    console.log('⚠️ Generando códigos aleatorios...');
    
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let intentos = 0;
    const maxIntentos = 100;
    
    while (candidatosDisponibles.length < 10 && intentos < maxIntentos) {
      // Generar código aleatorio de 3 letras
      const codigo = Array.from({ length: 3 }, () => 
        letras[Math.floor(Math.random() * letras.length)]
      ).join('');
      
      // Verificar si ya está en la lista de candidatos
      if (candidatosDisponibles.includes(codigo)) {
        intentos++;
        continue;
      }
      
      // Verificar en la base de datos
      const resultado: any = await prisma.$queryRawUnsafe(
        `SELECT TOP 1 MEDICO FROM MEDICO WHERE MEDICO = '${codigo}'`
      );
      
      const existente = Array.isArray(resultado) && resultado.length > 0;
      
      if (!existente) {
        candidatosDisponibles.push(codigo);
        console.log(`✅ Aleatorio: ${codigo}`);
      }
      
      intentos++;
    }
  }
  
  console.log('🎯 Candidatos finales:', candidatosDisponibles);
  
  // Asegurar que siempre devolvemos al menos 5 sugerencias
  if (candidatosDisponibles.length === 0) {
    console.error('❌ No se pudieron generar códigos disponibles');
    // Como último recurso, devolver códigos genéricos
    return ['MED1', 'MED2', 'MED3', 'MED4', 'MED5'];
  }
  
  return candidatosDisponibles.slice(0, 10);
}
