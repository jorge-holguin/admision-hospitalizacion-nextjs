import { prisma } from '@/lib/prisma/client'

export interface Consultorio {
  CONSULTORIO: string
  NOMBRE: string
}

export class ConsultorioService {
  async findHospitalDepartments() {
    try {
      // Intentar usar la consulta SQL directa
      const result = await prisma.$queryRaw<Consultorio[]>`
        SELECT CONSULTORIO, NOMBRE FROM CONSULTORIO 
        WHERE TIPO = 'H' AND ACTIVO = '1' 
        ORDER BY NOMBRE
      `;
      
      return result;
    } catch (error) {
      console.error('Error al obtener departamentos de hospital:', error);
      
      // Fallback a una consulta más genérica si la anterior falla
      try {
        const result = await prisma.$queryRaw<Consultorio[]>`
          SELECT CONSULTORIO, NOMBRE FROM CONSULTORIO 
          WHERE TIPO = 'H'
          ORDER BY NOMBRE
        `;
        
        return result;
      } catch (fallbackError) {
        console.error('Error en consulta fallback:', fallbackError);
        return [];
      }
    }
  }
}

export const consultorioService = new ConsultorioService();
