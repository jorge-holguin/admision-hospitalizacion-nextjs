import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cuentaValidationService } from '@/services/hospitalizacion/cuentaValidationService';

/**
 * Endpoint para probar la validación de FUAs con diferentes formatos de hora
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fuaNumber = searchParams.get('fuaNumber');
  
  if (!fuaNumber) {
    return NextResponse.json({ error: 'Se requiere el número de FUA' }, { status: 400 });
  }
  
  try {
    console.log(`=== TEST VALIDACIÓN FUA ===`);
    console.log(`FUA: ${fuaNumber}`);
    
    // 1. Obtener datos originales del FUA
    const fuaOriginal = await prisma.$queryRaw`
      SELECT NUMATENCION, PACIENTE, ESTADO, FECHA_ATENCION, HORA_ATENCION
      FROM ATENCION_SEGURO
      WHERE NUMATENCION = ${fuaNumber}
    ` as any[];
    
    // 2. Validar el FUA con el método mejorado
    const esValido = await cuentaValidationService.validateFuaActivo(fuaNumber);
    
    // 3. Probar con diferentes formatos de hora modificados
    const formatosHora = [
      '8:30',      // Formato HH:MM estándar
      '08:30',     // Formato HH:MM con ceros
      '830',       // Formato HHMM sin separador
      '0830',      // Formato HHMM con ceros sin separador
      '8',         // Solo hora
      '08',        // Solo hora con cero
      '',          // Vacío
      null,        // Null
      '8:30:00',   // Con segundos
      '08:30:00',  // Con segundos y ceros
      '8.30',      // Con punto como separador
      '08.30'      // Con punto y ceros
    ];
    
    // Resultados de pruebas
    const resultadosPruebas: any[] = [];
    
    // Solo ejecutar pruebas si encontramos el FUA original
    if (Array.isArray(fuaOriginal) && fuaOriginal.length > 0) {
      const fechaOriginal = fuaOriginal[0].FECHA_ATENCION;
      
      for (const formato of formatosHora) {
        try {
          // Construir la fecha y hora para la prueba
          const fechaHora = `${fechaOriginal.toISOString().split('T')[0]} ${formato || '00:00'}`;
          
          // Intentar convertir a datetime en SQL Server
          const prueba = await prisma.$queryRaw`
            SELECT 
            TRY_CAST(${fechaHora} AS DATETIME) AS FECHA_CONVERTIDA,
            CASE WHEN TRY_CAST(${fechaHora} AS DATETIME) IS NULL THEN 'ERROR' ELSE 'OK' END AS RESULTADO
          ` as any[];
          
          resultadosPruebas.push({
            formato,
            fechaHora,
            resultado: prueba[0].RESULTADO,
            fechaConvertida: prueba[0].FECHA_CONVERTIDA
          });
        } catch (error) {
          resultadosPruebas.push({
            formato,
            fechaHora: `${fechaOriginal.toISOString().split('T')[0]} ${formato || '00:00'}`,
            resultado: 'ERROR',
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }
    }
    
    return NextResponse.json({
      fuaNumber,
      esValido,
      fuaOriginal: Array.isArray(fuaOriginal) && fuaOriginal.length > 0 ? fuaOriginal[0] : null,
      pruebasFormatos: resultadosPruebas
    });
    
  } catch (error) {
    console.error('Error al probar validación de FUA:', error);
    return NextResponse.json({ 
      error: 'Error al probar validación de FUA',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
