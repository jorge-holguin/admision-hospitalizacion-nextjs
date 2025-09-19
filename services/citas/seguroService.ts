import { prisma } from '@/lib/prisma';

export interface Seguro {
  Seguro: string;
  Nombre: string;
}

export const seguroService = {
  /**
   * Get seguros for citas
   * @param codCita - Código de cita (default: '1')
   */
  async getSegurosByCodCita(codCita: string = '1'): Promise<Seguro[]> {
    try {
      console.log('Obteniendo seguros para citas con CODCITA:', codCita);
      
      const query = `
        SELECT Seguro, Nombre 
        FROM Seguro 
        WHERE CODCITA = '${codCita}' 
        ORDER BY SEGURO
      `;
      
      const result = await prisma.$queryRawUnsafe(query);
      
      console.log(`Encontrados ${Array.isArray(result) ? result.length : 0} seguros para citas`);
      return Array.isArray(result) ? result as Seguro[] : [];
    } catch (error) {
      console.error('Error al obtener seguros para citas:', error);
      throw new Error('Error al obtener seguros para citas');
    }
  }
};
