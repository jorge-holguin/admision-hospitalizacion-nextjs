import { prisma } from '@/lib/prisma';

export interface EntidadSis {
  ENTIDADSIS: string;
  NOMBRE: string;
}

export const entidadSisService = {
  /**
   * Get active ENTIDADSIS records with optional limit and search
   */
  async getEntidadesSis(limit?: number, search?: string): Promise<EntidadSis[]> {
    try {
      console.log('Obteniendo entidades SIS activas', { limit, search });
      
      let query = `
        SELECT RTRIM(ENTIDADSIS) AS ENTIDADSIS, RTRIM(NOMBRE) AS NOMBRE 
        FROM ENTIDADSIS 
        WHERE ESTADO='1'
      `;
      
      // Agregar filtro de búsqueda si se proporciona
      if (search) {
        query += ` AND (ENTIDADSIS LIKE '%${search}%' OR NOMBRE LIKE '%${search}%')`;
      }
      
      query += ` ORDER BY NOMBRE`;
      
      // Agregar límite si se proporciona
      if (limit) {
        query += ` OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY`;
      }
      
      const result = await prisma.$queryRawUnsafe(query);
      console.log(`Encontradas ${Array.isArray(result) ? result.length : 0} entidades SIS`);
      
      return Array.isArray(result) ? result as EntidadSis[] : [];
    } catch (error) {
      console.error('Error al obtener entidades SIS:', error);
      throw new Error('Error al obtener entidades SIS');
    }
  }
};
