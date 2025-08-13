import { prisma } from '@/lib/prisma';

export interface FuaCheckResult {
  hasFua: boolean;
  fuaId: string | null;
  message: string;
}

/**
 * Verifica si un paciente tiene un FUA activo en las últimas 3 horas
 * @param patientId ID del paciente a verificar
 * @returns Objeto con información sobre el estado del FUA
 */
export async function checkActiveFua(patientId: string): Promise<FuaCheckResult> {
  try {
    console.log(`Verificando FUA activo para paciente: ${patientId}`);
    
    // Query para verificar FUA activo en las últimas 3 horas usando Prisma
    // Nota: Aseguramos que PACIENTE se compare como string y que la conversión de fecha/hora sea correcta
    // SQL Server 2008 R2 compatible query
    const activeFua = await prisma.$queryRaw`
      SELECT TOP 1 ID_CUENTA, FECHA_ATENCION, HORA_ATENCION
      FROM ATENCION_SEGURO
      WHERE PACIENTE = ${patientId}
      AND ESTADO = '2'
      AND DATEADD(HOUR, -3, GETDATE()) <= FECHA_ATENCION
      ORDER BY FECHA_ATENCION DESC, HORA_ATENCION DESC
    `;
    
    // Verificar si encontramos un FUA activo
    const hasFua = Array.isArray(activeFua) && activeFua.length > 0;
    const fuaId = hasFua ? activeFua[0].ID_CUENTA : null;
    
    return { 
      hasFua,
      fuaId,
      message: hasFua 
        ? 'Se ha detectado un FUA activo en las últimas 3 horas'
        : 'No se ha detectado un FUA activo en las últimas 3 horas'
    };
  } catch (error) {
    console.error('Error al verificar FUA:', error);
    throw new Error('Error al verificar el estado del FUA');
  }
}

/**
 * Consulta SQL para encontrar FUAs activos en las últimas 3 horas para un paciente específico
 * Esta función devuelve la consulta SQL como string para propósitos de prueba
 */
export function getActiveFuaQuery(patientId: string): string {
  return `
    SELECT TOP 10 ID_CUENTA, PACIENTE, FECHA_ATENCION, HORA_ATENCION, ESTADO,
    CONVERT(VARCHAR(10), FECHA_ATENCION, 120) AS FECHA_FORMATEADA,
    CASE WHEN LEN(HORA_ATENCION) = 5 THEN HORA_ATENCION ELSE '0' + HORA_ATENCION END AS HORA_FORMATEADA,
    CONVERT(DATETIME, CONVERT(VARCHAR(10), FECHA_ATENCION, 120) + ' ' + 
             CASE WHEN LEN(HORA_ATENCION) = 5 THEN HORA_ATENCION ELSE '0' + HORA_ATENCION END) AS FECHA_HORA_COMPLETA,
    GETDATE() AS HORA_ACTUAL,
    DATEADD(HOUR, -3, GETDATE()) AS LIMITE_TRES_HORAS
    FROM ATENCION_SEGURO
    WHERE PACIENTE = '${patientId}'
    AND ESTADO = '2'
    AND DATEADD(HOUR, -3, GETDATE()) <= 
        CONVERT(DATETIME, 
               CONVERT(VARCHAR(10), FECHA_ATENCION, 120) + ' ' + 
               CASE WHEN LEN(HORA_ATENCION) = 5 THEN HORA_ATENCION ELSE '0' + HORA_ATENCION END
        )
    ORDER BY FECHA_ATENCION DESC, HORA_ATENCION DESC
  `;
}

/**
 * Consulta SQL para encontrar todos los FUAs de un paciente (para depuración)
 */
export function getAllPatientFuasQuery(patientId: string): string {
  return `
    SELECT TOP 20 ID_CUENTA, PACIENTE, FECHA_ATENCION, HORA_ATENCION, ESTADO,
    CONVERT(VARCHAR(10), FECHA_ATENCION, 120) AS FECHA_FORMATEADA,
    CASE WHEN LEN(HORA_ATENCION) = 5 THEN HORA_ATENCION ELSE '0' + HORA_ATENCION END AS HORA_FORMATEADA,
    CONVERT(DATETIME, CONVERT(VARCHAR(10), FECHA_ATENCION, 120) + ' ' + 
             CASE WHEN LEN(HORA_ATENCION) = 5 THEN HORA_ATENCION ELSE '0' + HORA_ATENCION END) AS FECHA_HORA_COMPLETA,
    GETDATE() AS HORA_ACTUAL,
    DATEADD(HOUR, -3, GETDATE()) AS LIMITE_TRES_HORAS
    FROM ATENCION_SEGURO
    WHERE PACIENTE = '${patientId}'
    ORDER BY FECHA_ATENCION DESC, HORA_ATENCION DESC
  `;
}
