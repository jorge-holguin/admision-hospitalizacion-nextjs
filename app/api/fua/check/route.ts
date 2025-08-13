import { NextRequest, NextResponse } from 'next/server';
import { checkActiveFua, getActiveFuaQuery, getAllPatientFuasQuery } from '@/services/hospitalizacion/fuaService';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Obtener ID del paciente de los parámetros de consulta
  const searchParams = request.nextUrl.searchParams;
  const patientId = searchParams.get('patientId');
  const debug = searchParams.get('debug') === 'true';
  const rawQuery = searchParams.get('rawQuery') === 'true';
  
  if (!patientId) {
    return NextResponse.json({ error: 'Se requiere el ID del paciente' }, { status: 400 });
  }
  
  try {
    // Si se solicita modo debug, devolver las consultas SQL para pruebas
    if (debug) {
      return NextResponse.json({
        activeFuaQuery: getActiveFuaQuery(patientId),
        allFuasQuery: getAllPatientFuasQuery(patientId)
      });
    }
    
    // Si se solicita consulta directa, ejecutar y devolver resultados crudos
    if (rawQuery) {
      // Obtener todos los FUAs del paciente para depuración
      const allFuas = await prisma.$queryRaw`
        SELECT TOP 20 ID_CUENTA, PACIENTE, FECHA_ATENCION, HORA_ATENCION, ESTADO,
        CONVERT(VARCHAR(10), FECHA_ATENCION, 120) AS FECHA_FORMATEADA,
        CASE WHEN LEN(HORA_ATENCION) = 5 THEN HORA_ATENCION ELSE '0' + HORA_ATENCION END AS HORA_FORMATEADA
        FROM ATENCION_SEGURO
        WHERE PACIENTE = ${patientId}
        ORDER BY FECHA_ATENCION DESC, HORA_ATENCION DESC
      `;
      
      // Obtener FUAs activos en las últimas 3 horas
      const activeFuas = await prisma.$queryRaw`
        SELECT TOP 10 ID_CUENTA, PACIENTE, FECHA_ATENCION, HORA_ATENCION, ESTADO,
        CONVERT(VARCHAR(10), FECHA_ATENCION, 120) AS FECHA_FORMATEADA,
        CASE WHEN LEN(HORA_ATENCION) = 5 THEN HORA_ATENCION ELSE '0' + HORA_ATENCION END AS HORA_FORMATEADA
        FROM ATENCION_SEGURO
        WHERE PACIENTE = ${patientId}
        AND ESTADO = '2'
        AND DATEADD(HOUR, -3, GETDATE()) <= FECHA_ATENCION
        ORDER BY FECHA_ATENCION DESC, HORA_ATENCION DESC
      `;
      
      return NextResponse.json({
        allFuas,
        activeFuas,
        currentTime: new Date().toISOString(),
        threeHoursAgo: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // Usar el servicio para verificar FUA activo
    const result = await checkActiveFua(patientId);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error al verificar FUA:', error);
    return NextResponse.json({ error: 'Error al verificar el estado del FUA' }, { status: 500 });
  }
}
