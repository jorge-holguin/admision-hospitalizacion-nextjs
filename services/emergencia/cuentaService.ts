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
        WHERE PACIENTE = ${pacienteId} AND ESTADO = '1' AND ORIGEN = 'EM' AND SEGURO = '01'
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

  /**
   * Obtiene el número de cuenta activa del paciente por tipo de seguro
   */
  async getCuentaActivaByPacienteIdAndSeguro(pacienteId: string, tipoSeguro: string): Promise<string | null> {
    try {
      console.log(`Buscando cuenta activa para paciente: ${pacienteId} con seguro: ${tipoSeguro}`);
      
      // Mapear el tipo de seguro al código correcto
      let codigoSeguro: string;
      const seguroTrimmed = tipoSeguro.trim();
      
      if (seguroTrimmed === '0' || seguroTrimmed === '00') {
        codigoSeguro = '00'; // Pagante - asegurarse de usar '00' para consistencia
      } else if (seguroTrimmed === '02') {
        codigoSeguro = '02'; // SOAT
      } else if (['20', '21', '22', '23', '24', '25'].includes(seguroTrimmed)) {
        codigoSeguro = '01'; // SIS - todos los tipos de SIS usan código 01 para buscar cuenta
      } else {
        codigoSeguro = '01'; // Default SIS
      }
      
      console.log(`Seguro recibido: '${tipoSeguro}' -> Código para búsqueda: '${codigoSeguro}'`);
      
      // Obtener la cuenta activa más reciente del paciente con el tipo de seguro específico
      const cuenta = await prisma.$queryRaw`
        SELECT TOP 1 CUENTAID 
        FROM CUENTA 
        WHERE PACIENTE = ${pacienteId} AND ESTADO = '1' AND ORIGEN = 'EM' AND SEGURO = ${codigoSeguro}
        ORDER BY CUENTAID DESC
      ` as any[];
      
      // Verificar si se encontró una cuenta
      if (Array.isArray(cuenta) && cuenta.length > 0) {
        console.log(`Cuenta encontrada para paciente ${pacienteId} con seguro ${codigoSeguro}:`, cuenta[0].CUENTAID);
        return cuenta[0].CUENTAID;
      }
      
      console.log(`No se encontró cuenta activa para paciente ${pacienteId} con seguro ${codigoSeguro}`);
      return null;
    } catch (error: any) {
      const errorMessage = `Error al obtener cuenta del paciente ${pacienteId} con seguro ${tipoSeguro}: ${error.message || 'Error desconocido'}`;
      console.error(errorMessage, error);
      return null;
    }
  }

  async getFUAActivaByCuentaId(cuentaId: string): Promise<string | null> {
    try {
      console.log(`Buscando FUA activa para cuenta: ${cuentaId}`);
      
      // Obtener la FUA activa más reciente de la cuenta
      const fua = await prisma.$queryRaw`
        SELECT TOP 1 NROFUA
        FROM CUENTA
        WHERE CUENTAID = ${cuentaId} AND ESTADO = '1' AND ORIGEN = 'EM'
        ORDER BY CUENTAID DESC
      ` as any[];
      
      // Verificar si se encontró una FUA
      if (Array.isArray(fua) && fua.length > 0) {
        console.log(`FUA encontrada para cuenta ${cuentaId}:`, fua[0].NROFUA);
        return fua[0].NROFUA;
      }
      
      console.log(`No se encontró FUA activa para cuenta ${cuentaId}`);
      return null;
    } catch (error: any) {
      const errorMessage = `Error al obtener FUA de la cuenta ${cuentaId}: ${error.message || 'Error desconocido'}`;
      console.error(errorMessage, error);
      return null;
    }
  }

  /**
   * Actualiza el estado de una cuenta a 0 (inactiva)
   */
  async updateCUENTA(cuentaId: string): Promise<boolean> {
    try {
      console.log(`Actualizando estado de cuenta ${cuentaId} a inactivo`);
      
      // Actualizar el estado de la cuenta a 0 (inactivo)
      await prisma.$executeRaw`
        UPDATE CUENTA
        SET ESTADO = '0'
        WHERE CUENTAID = ${cuentaId}
      `;
      
      console.log(`Cuenta ${cuentaId} actualizada a estado inactivo`);
      return true;
    } catch (error: any) {
      const errorMessage = `Error al actualizar estado de cuenta ${cuentaId}: ${error.message || 'Error desconocido'}`;
      console.error(errorMessage, error);
      return false;
    }
  }

  /**
   * Actualiza el estado de una FUA a 0 (inactiva) en la tabla ATENCION_SEGURO
   */
  async updateFUA(nroFua: string): Promise<boolean> {
    try {
      console.log(`Actualizando estado de FUA ${nroFua} a inactivo`);
      
      // Buscar el registro en ATENCION_SEGURO por el número de FUA usando NUMATENCION
      const atencionSeguro = await prisma.$queryRaw`
        SELECT ATENCION_SEGURO_ID
        FROM ATENCION_SEGURO
        WHERE NUMATENCION = ${nroFua}
      ` as any[];
      
      if (!Array.isArray(atencionSeguro) || atencionSeguro.length === 0) {
        console.log(`No se encontró FUA ${nroFua} en ATENCION_SEGURO`);
        return false;
      }
      
      const atencionSeguroId = atencionSeguro[0].ATENCION_SEGURO_ID;
      
      // Actualizar el estado de la FUA a 0 (inactivo)
      await prisma.$executeRaw`
        UPDATE ATENCION_SEGURO
        SET ESTADO = '0'
        WHERE ATENCION_SEGURO_ID = ${atencionSeguroId}
      `;
      
      console.log(`FUA ${nroFua} (ID: ${atencionSeguroId}) actualizada a estado inactivo`);
      return true;
    } catch (error: any) {
      const errorMessage = `Error al actualizar estado de FUA ${nroFua}: ${error.message || 'Error desconocido'}`;
      console.error(errorMessage, error);
      return false;
    }
  }

  /**
   * Actualiza tanto la cuenta como la FUA asociada a estado inactivo (0)
   */
  async updateCuentaAndFUA(cuentaId: string): Promise<{ success: boolean, message: string }> {
    try {
      // Primero obtenemos el número de FUA asociado a la cuenta
      const nroFua = await this.getFUAActivaByCuentaId(cuentaId);
      
      if (!nroFua) {
        return { 
          success: false, 
          message: `No se encontró FUA activa para la cuenta ${cuentaId}` 
        };
      }
      
      // Actualizamos el estado de la FUA en ATENCION_SEGURO
      const fuaUpdated = await this.updateFUA(nroFua);
      if (!fuaUpdated) {
        return { 
          success: false, 
          message: `Error al actualizar la FUA ${nroFua}` 
        };
      }
      
      // Actualizamos el estado de la cuenta
      const cuentaUpdated = await this.updateCUENTA(cuentaId);
      if (!cuentaUpdated) {
        return { 
          success: false, 
          message: `Error al actualizar la cuenta ${cuentaId}` 
        };
      }
      
      return { 
        success: true, 
        message: `Cuenta ${cuentaId} y FUA ${nroFua} actualizadas correctamente a estado inactivo` 
      };
    } catch (error: any) {
      const errorMessage = `Error al actualizar cuenta y FUA: ${error.message || 'Error desconocido'}`;
      console.error(errorMessage, error);
      return { success: false, message: errorMessage };
    }
  }
}

export const cuentaService = new CuentaService();
