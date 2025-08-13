import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils';

export const dashboardService = {
  /**
   * Obtener el total de citas
   * SELECT COUNT(*) AS TotalRegistros FROM CITA;
   */
  async getTotalCitas() {
    try {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) AS TotalRegistros FROM CITA
      `;
      
      return serializeBigInt(result[0]);
    } catch (error) {
      console.error('Error al obtener total de citas:', error);
      throw new Error('No se pudo obtener el total de citas');
    }
  },

  /**
   * Obtener el total de hospitalizaciones
   * SELECT COUNT(*) AS TotalRegistros FROM hospitaliza;
   */
  async getTotalHospitalizaciones() {
    try {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) AS TotalRegistros FROM hospitaliza
      `;
      
      return serializeBigInt(result[0]);
    } catch (error) {
      console.error('Error al obtener total de hospitalizaciones:', error);
      throw new Error('No se pudo obtener el total de hospitalizaciones');
    }
  },

  /**
   * Obtener nuevos ingresos del día actual
   * SELECT COUNT(*) AS TotalRegistros FROM hospitaliza
   * WHERE CONVERT(DATE, FECHA_HOSPITALIZACION) = CONVERT(DATE, GETDATE());
   */
  async getNuevosIngresosHoy() {
    try {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) AS TotalRegistros 
        FROM hospitaliza
        WHERE CONVERT(DATE, FECHA_HOSPITALIZACION) = CONVERT(DATE, GETDATE())
      `;
      
      return serializeBigInt(result[0]);
    } catch (error) {
      console.error('Error al obtener nuevos ingresos de hoy:', error);
      throw new Error('No se pudo obtener el total de nuevos ingresos de hoy');
    }
  },

  /**
   * Obtener el total de altas médicas
   * SELECT COUNT(*) FROM EMERGENCIA WHERE destino = '07'
   */
  async getTotalAltasMedicas() {
    try {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) AS TotalRegistros 
        FROM EMERGENCIA
        WHERE destino = '07'
      `;
      
      return serializeBigInt(result[0]);
    } catch (error) {
      console.error('Error al obtener total de altas médicas:', error);
      throw new Error('No se pudo obtener el total de altas médicas');
    }
  }
};
