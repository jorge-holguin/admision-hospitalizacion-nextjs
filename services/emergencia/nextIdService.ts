import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

interface NextIds {
  emergenciaId: string;
  orden: string;
}

class NextIdService {
  /**
   * Obtiene el siguiente ID de emergencia y número de orden
   */
  async getNextIds(): Promise<NextIds> {
    try {
      const today = new Date();
      
      // 1. Calcular el siguiente ID de emergencia (formato numérico incremental)
      // Buscar el último ID de emergencia para incrementarlo
      const lastEmergencia = await prisma.$queryRaw`
        SELECT TOP 1 EMERGENCIA_ID 
        FROM EMERGENCIA 
        ORDER BY EMERGENCIA_ID DESC
      ` as any[];
      
      let nextEmergenciaId: string;
      
      if (lastEmergencia && lastEmergencia.length > 0) {
        const lastId = lastEmergencia[0].EMERGENCIA_ID;
        console.log('Último ID de emergencia encontrado:', lastId);
        
        // Asegurarse de que el ID tenga 8 caracteres
        if (lastId && lastId.length > 0) {
          // Incrementar el ID numérico
          const lastNumber = parseInt(lastId, 10);
          if (!isNaN(lastNumber)) {
            const newNumber = lastNumber + 1;
            // Asegurar que tenga 8 dígitos
            nextEmergenciaId = newNumber.toString().padStart(8, '0');
            console.log('Siguiente ID de emergencia generado:', nextEmergenciaId);
          } else {
            // Si no es un número válido, usar un valor predeterminado
            nextEmergenciaId = '25000001';
            console.log('ID anterior no es numérico, usando valor predeterminado:', nextEmergenciaId);
          }
        } else {
          // Si el ID está vacío, usar un valor predeterminado
          nextEmergenciaId = '25000001';
          console.log('ID anterior está vacío, usando valor predeterminado:', nextEmergenciaId);
        }
      } else {
        // Si no hay emergencias, empezar con un valor predeterminado
        nextEmergenciaId = '25000001'; // Valor inicial de 8 dígitos
        console.log('No se encontraron emergencias previas, usando ID inicial:', nextEmergenciaId);
      }
      
      console.log('Siguiente ID de emergencia generado:', nextEmergenciaId);
      
      // 2. Calcular el siguiente número de orden
      // El orden se reinicia a las 00:00 cada día
      const currentHour = today.getHours();
      const currentMinutes = today.getMinutes();
      
      // Buscar el último orden del día actual
      const lastOrden = await prisma.$queryRaw`
        SELECT TOP 1 ORDEN 
        FROM EMERGENCIA 
        WHERE CONVERT(DATE, FECHA) = CONVERT(DATE, GETDATE())
        ORDER BY ORDEN DESC
      ` as any[];
      
      let nextOrden: string;
      
      if (lastOrden && lastOrden.length > 0 && lastOrden[0].ORDEN) {
        // Asegurarse de que el valor de ORDEN sea un número válido
        const ordenValue = lastOrden[0].ORDEN.toString().trim();
        const lastOrdenNum = parseInt(ordenValue, 10);
        
        if (isNaN(lastOrdenNum)) {
          console.log('Valor de orden no numérico encontrado:', ordenValue, 'usando orden 001');
          nextOrden = '001';
        } else {
          console.log('Último número de orden encontrado:', lastOrdenNum);
          
          // Si es medianoche (00:00), reiniciar el contador
          if (currentHour === 0 && currentMinutes === 0) {
            nextOrden = '001';
          } else {
            // Incrementar el último orden y formatear con ceros a la izquierda
            nextOrden = (lastOrdenNum + 1).toString().padStart(3, '0');
          }
        }
      } else {
        // Si no hay órdenes para hoy, empezar con 001
        nextOrden = '001';
        console.log('No se encontraron órdenes para hoy, iniciando con orden 001');
      }
      
      console.log(`Generado siguiente ID: ${nextEmergenciaId}, Orden: ${nextOrden}`);
      
      return {
        emergenciaId: nextEmergenciaId,
        orden: nextOrden
      };
    } catch (error) {
      console.error('Error al obtener los siguientes IDs:', error);
      throw new Error('Error al obtener los siguientes IDs de emergencia');
    }
  }
}

export const nextIdService = new NextIdService();
