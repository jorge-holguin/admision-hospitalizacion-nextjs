import { prisma } from '@/lib/prisma';

export interface Medico {
  MEDICO: string;
  NOMBRE: string;
}

export const medicoService = {
  /**
   * Obtiene todos los médicos activos, ordenados por nombre
   */
  async findAll(): Promise<Medico[]> {
    try {
      // Usar consulta SQL nativa para compatibilidad con SQL Server 2008
      const medicos = await prisma.$queryRaw<Medico[]>`
        SELECT MEDICO, NOMBRE 
        FROM MEDICO 
        WHERE ACTIVO = '1' 
        ORDER BY NOMBRE
      `;
      
      return medicos;
    } catch (error) {
      console.error('Error al buscar médicos:', error);
      throw new Error('Error al buscar médicos');
    }
  },

  /**
   * Obtiene médicos filtrados por consultorio
   */
  async findByConsultorio(consultorioId: string): Promise<Medico[]> {
    try {
      // Usar consulta SQL nativa para compatibilidad con SQL Server 2008
      const medicos = await prisma.$queryRaw<Medico[]>`
        SELECT DISTINCT m.MEDICO, m.NOMBRE 
        FROM MEDICO m
        INNER JOIN CONSULTORIO_MEDICO cm ON m.MEDICO = cm.MEDICO
        WHERE cm.CONSULTORIO = ${consultorioId}
        AND m.ACTIVO = '1'
        ORDER BY m.NOMBRE
      `;
      
      return medicos;
    } catch (error) {
      console.error('Error al buscar médicos por consultorio:', error);
      throw new Error('Error al buscar médicos por consultorio');
    }
  },

  /**
   * Busca médicos por nombre o código
   */
  async search(searchTerm: string): Promise<Medico[]> {
    try {
      // Limitar la búsqueda a los primeros 50 resultados para mejorar el rendimiento
      const medicos = await prisma.$queryRaw<Medico[]>`
        SELECT TOP 50 MEDICO, NOMBRE 
        FROM MEDICO 
        WHERE (MEDICO LIKE ${`%${searchTerm}%`} OR NOMBRE LIKE ${`%${searchTerm}%`})
        AND ACTIVO = '1'
        ORDER BY NOMBRE
      `;
      
      return medicos;
    } catch (error) {
      console.error('Error al buscar médicos:', error);
      throw new Error('Error al buscar médicos');
    }
  }
};
