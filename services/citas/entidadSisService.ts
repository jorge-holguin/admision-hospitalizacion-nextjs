import { prisma } from '@/lib/prisma';

export interface EntidadSis {
  ENTIDADSIS: string;
  NOMBRE: string;
}

export const entidadSisService = {
  async getEntidadesSis(limit = 10, search?: string): Promise<EntidadSis[]> {
    try {
      console.log('Obteniendo entidades SIS activas', { limit, search });
      
      let query = `
        SELECT TOP ${limit} RTRIM(ENTIDADSIS) AS ENTIDADSIS, RTRIM(NOMBRE) AS NOMBRE 
        FROM ENTIDADSIS 
        WHERE ESTADO = '1'
      `;
      
      // Agregar filtro de búsqueda si se proporciona
      if (search) {
        query += ` AND (ENTIDADSIS LIKE '%${search}%' OR NOMBRE LIKE '%${search}%')`;
      }

      query += ` ORDER BY NOMBRE`;

      const result = await prisma.$queryRawUnsafe(query);

      console.log(`Encontradas ${Array.isArray(result) ? result.length : 0} entidades SIS`);
      return Array.isArray(result) ? result as EntidadSis[] : [];
    } catch (error) {
      console.error('Error al obtener entidades SIS:', error);
      throw new Error('Error al obtener entidades SIS');
    }
  },

  async getEntidadSisByCode(code: string): Promise<EntidadSis | null> {
    try {
      console.log('Obteniendo entidad SIS por código:', code);
      
      const query = `
        SELECT TOP 1 RTRIM(ENTIDADSIS) AS ENTIDADSIS, RTRIM(NOMBRE) AS NOMBRE 
        FROM ENTIDADSIS 
        WHERE RTRIM(ENTIDADSIS) = '${code.trim()}' AND ESTADO = '1'
      `;

      const result = await prisma.$queryRawUnsafe(query) as EntidadSis[];

      if (Array.isArray(result) && result.length > 0) {
        console.log('✅ Entidad SIS encontrada:', result[0]);
        return result[0];
      }

      console.log('⚠️ Entidad SIS no encontrada para código:', code);
      return null;
    } catch (error) {
      console.error('Error al obtener entidad SIS por código:', error);
      throw new Error('Error al obtener entidad SIS');
    }
  }
};
