import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CuentaService {
  /**
   * Obtiene el número de cuenta activa del paciente
   */
  async getCuentaActivaByPacienteId(pacienteId: string): Promise<string | null> {
    try {
      console.log(`Buscando cuenta activa para paciente: ${pacienteId}`);
      
      // Obtener la cuenta activa más reciente del paciente
      const cuenta = await prisma.$queryRaw`
        SELECT TOP 1 CUENTAID 
        FROM CUENTA 
        WHERE PACIENTE = ${pacienteId} AND ESTADO = '1' 
        ORDER BY CUENTAID DESC
      ` as any[];
      
      // Verificar si se encontró una cuenta
      if (Array.isArray(cuenta) && cuenta.length > 0) {
        console.log(`Cuenta encontrada para paciente ${pacienteId}:`, cuenta[0].CUENTAID);
        return cuenta[0].CUENTAID;
      }
      
      console.log(`No se encontró cuenta activa para paciente ${pacienteId}`);
      return null;
    } catch (error: any) {
      const errorMessage = `Error al obtener cuenta del paciente ${pacienteId}: ${error.message || 'Error desconocido'}`;
      console.error(errorMessage, error);
      return null;
    }
  }
}

export const cuentaService = new CuentaService();
