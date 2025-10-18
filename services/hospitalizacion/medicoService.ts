import { prisma } from '@/lib/prisma';

export interface Medico {
  MEDICO: string;
  NOMBRE: string;
  ACTIVO?: string;
}

export const medicoService = {
  /**
   * Busca médicos por una lista de códigos
   */
  async findByCodigos(codigos: string[]): Promise<Medico[]> {
    try {
      if (!codigos.length) return [];
      
      // Construir la condición IN para la consulta SQL
      const codigosLimpios = codigos.map(c => c.trim()).filter(Boolean);
      
      if (!codigosLimpios.length) return [];
      
      // Usar consulta SQL nativa para compatibilidad con SQL Server 2008
      // Construir la consulta SQL directamente con los valores
      const placeholders = codigosLimpios.map(c => `'${c}'`).join(', ');
      
      // Usar Prisma.sql para construir la consulta segura
      const query = `
        SELECT MEDICO, NOMBRE, ACTIVO 
        FROM MEDICO 
        WHERE MEDICO IN (${placeholders})
        AND ACTIVO = '1' 
        ORDER BY NOMBRE
      `;
      
      const medicos = await prisma.$queryRawUnsafe(query) as Medico[];
      return medicos;
    } catch (error) {
      console.error('Error al buscar médicos por códigos:', error);
      throw new Error('Error al buscar médicos por códigos');
    }
  },

  /**
   * Obtiene todos los médicos activos, ordenados por nombre
   */
  async findAll(): Promise<Medico[]> {
    try {
      // Usar consulta SQL nativa para compatibilidad con SQL Server 2008
      const medicos = await prisma.$queryRaw<Medico[]>`
        SELECT MEDICO, NOMBRE, ACTIVO 
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
        SELECT DISTINCT m.MEDICO, m.NOMBRE, m.ACTIVO 
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
   * @param searchTerm Término de búsqueda
   * @param limit Límite de resultados (por defecto 50)
   */
  async search(searchTerm: string, limit: number = 50): Promise<Medico[]> {
    try {
      // Usar el límite proporcionado o 50 por defecto
      // Construir la consulta SQL directamente para evitar problemas con parámetros
      const query = `
        SELECT TOP ${limit} MEDICO, NOMBRE, ACTIVO 
        FROM MEDICO 
        WHERE (MEDICO LIKE '%${searchTerm}%' OR NOMBRE LIKE '%${searchTerm}%')
        AND ACTIVO = '1'
        ORDER BY NOMBRE
      `;
      
      const medicos = await prisma.$queryRawUnsafe(query) as Medico[];
      
      return medicos;
    } catch (error) {
      console.error('Error al buscar médicos:', error);
      throw new Error('Error al buscar médicos');
    }
  }
};
