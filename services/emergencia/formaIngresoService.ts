import { prisma } from '@/lib/prisma/client'

export interface FormaIngreso {
  FORMA_INGRESO: string
  NOMBRE: string
}

export class FormaIngresoService {
  async findAll() {
    try {
      // Intento 1: si existe columna ACTIVO
      const result = await prisma.$queryRaw<FormaIngreso[]>`
        SELECT FORMA_INGRESO, NOMBRE
        FROM FORMA_INGRESO
        WHERE ACTIVO = '1'
        ORDER BY NOMBRE
      `;
      return result;
    } catch (error) {
      console.error('Error al obtener forma de ingreso (ACTIVO=1):', error);

      // Fallback: sin filtro ACTIVO
      try {
        const result = await prisma.$queryRaw<FormaIngreso[]>`
          SELECT FORMA_INGRESO, NOMBRE
          FROM FORMA_INGRESO
          ORDER BY NOMBRE
        `;
        return result;
      } catch (fallbackError) {
        console.error('Error en consulta fallback FORMA_INGRESO:', fallbackError);
        return [];
      }
    }
  }
}

export const formaIngresoService = new FormaIngresoService();
