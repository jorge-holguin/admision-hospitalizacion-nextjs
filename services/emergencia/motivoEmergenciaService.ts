import { prisma } from '@/lib/prisma/client'

export interface MotivoEmergencia {
  MOTIVO_EMERGENCIA: string
  NOMBRE: string
}

export class MotivoEmergenciaService {
  async findAll() {
    try {
      // Primer intento: con filtro ACTIVO si existe
      const result = await prisma.$queryRaw<MotivoEmergencia[]>`
        SELECT MOTIVO_EMERGENCIA, NOMBRE
        FROM MOTIVO_EMERGENCIA
        WHERE ACTIVO = '1'
        ORDER BY NOMBRE
      `;
      return result;
    } catch (error) {
      console.error('Error al obtener motivo de emergencia (ACTIVO=1):', error);

      // Fallback: sin filtro ACTIVO
      try {
        const result = await prisma.$queryRaw<MotivoEmergencia[]>`
          SELECT MOTIVO_EMERGENCIA, NOMBRE
          FROM MOTIVO_EMERGENCIA
          ORDER BY NOMBRE
        `;
        return result;
      } catch (fallbackError) {
        console.error('Error en consulta fallback MOTIVO_EMERGENCIA:', fallbackError);
        return [];
      }
    }
  }
}

export const motivoEmergenciaService = new MotivoEmergenciaService();
