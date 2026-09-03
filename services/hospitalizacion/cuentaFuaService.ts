// cuentaFuaService.ts - Migrado a Spring Boot API
import { API_ENDPOINTS, fetchApi } from '@/lib/api-config';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface FuaCheckResult {
  hasFua: boolean;
  fuaId: string | null;
  message: string;
}

// ============================================================================
// FUNCIONES DE VERIFICACIÓN DE FUA - SPRING BOOT API
// ============================================================================

/**
 * Verifica si un paciente tiene un FUA activo en las últimas 3 horas
 */
export async function checkActiveFua(patientId: string): Promise<FuaCheckResult> {
  try {    const url = API_ENDPOINTS.cuentas.fua.checkActivaByPaciente(patientId);
    const response = await fetchApi(url);
    
    if (response.status === 404) {
      return { 
        hasFua: false,
        fuaId: null,
        message: 'No se ha detectado un FUA activo en las últimas 3 horas'
      };
    }
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const hasFua = data && (data.hasFua || data.ID_CUENTA);
    const fuaId = hasFua ? (data.fuaId || data.ID_CUENTA) : null;    return { 
      hasFua,
      fuaId,
      message: hasFua 
        ? 'Se ha detectado un FUA activo en las últimas 3 horas'
        : 'No se ha detectado un FUA activo en las últimas 3 horas'
    };
  } catch (error) {
    console.error('❌ Error al verificar FUA:', error);
    throw new Error('Error al verificar el estado del FUA');
  }
}

/**
 * Consulta SQL para encontrar FUAs activos en las últimas 3 horas para un paciente específico
 * Esta función devuelve la consulta SQL como string para propósitos de prueba
 * @deprecated Esta función es solo para referencia, la lógica ahora está en el backend
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
 * @deprecated Esta función es solo para referencia, la lógica ahora está en el backend
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
