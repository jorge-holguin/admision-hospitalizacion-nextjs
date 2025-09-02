import { prisma } from '@/lib/prisma';

export interface CuentaValidationResult {
  isValid: boolean;
  cuentaId: string | null;
  fuaId: string | null;
  message: string;
  tipoValidacion: 'SIS' | 'PAGANTE_SOAT';
}

export interface CuentaActiva {
  CUENTAID: string;
  PACIENTE: string;
  SEGURO: string;
  ESTADO: string;
  ORIGEN: string;
  NROFUA?: string;
}

export interface FuaActivo {
  NUMATENCION: string;
  PACIENTE: string;
  ESTADO: string;
  FECHA_ATENCION: Date;
  HORA_ATENCION: string;
}

/**
 * Servicio para validar cuentas activas según el tipo de seguro
 */
export class CuentaValidationService {
  
  /**
   * Obtiene cuenta activa del paciente por tipo de seguro
   */
  async getCuentaActivaByPacienteIdAndSeguro(pacienteId: string, tipoSeguro: string): Promise<CuentaActiva | null> {
    try {
      console.log(`Buscando cuenta activa para paciente: ${pacienteId} con seguro: ${tipoSeguro}`);
      
      const seguroTrimmed = tipoSeguro.trim();
      let codigoSeguro: string;
      let usarCodigoOriginal = false;
      
      // Determinar si es PAGANTE/SOAT (usar código original) o SIS (mapear a 01)
      if (seguroTrimmed === '0' || seguroTrimmed === '00') {
        codigoSeguro = '00'; // Pagante
        usarCodigoOriginal = true;
      } else if (seguroTrimmed === '02') {
        codigoSeguro = '02'; // SOAT
        usarCodigoOriginal = true;
      } else if (['20', '21', '22', '23', '24', '25'].includes(seguroTrimmed)) {
        codigoSeguro = '01'; // SIS - todos los tipos de SIS usan código 01
      } else if (seguroTrimmed === '17') {
        codigoSeguro = '17'; // Otros programas
        usarCodigoOriginal = true;
      } else {
        codigoSeguro = '01'; // Default SIS
      }
      
      if (usarCodigoOriginal) {
        console.log(`Seguro recibido: '${tipoSeguro}' -> Buscando por código original: '${seguroTrimmed}'`);
      } else {
        console.log(`Seguro recibido: '${tipoSeguro}' -> Buscando SIS por código original '${seguroTrimmed}' o mapeado '${codigoSeguro}'`);
      }
      
      // Obtener la cuenta activa más reciente del paciente con origen 'HO' y estado '1'
      let cuenta: CuentaActiva[];
      
      if (usarCodigoOriginal) {
        // Para PAGANTE/SOAT/Otros, buscar por el código original
        cuenta = await prisma.$queryRaw`
          SELECT TOP 1 CUENTAID, PACIENTE, SEGURO, ESTADO, ORIGEN, NROFUA
          FROM CUENTA 
          WHERE PACIENTE = ${pacienteId} 
          AND ESTADO = '1' 
          AND ORIGEN = 'HO' 
          AND SEGURO = ${seguroTrimmed}
          ORDER BY CUENTAID DESC
        ` as CuentaActiva[];
      } else {
        // Para SIS, buscar tanto por el código original como por el código mapeado (01)
        cuenta = await prisma.$queryRaw`
          SELECT TOP 1 CUENTAID, PACIENTE, SEGURO, ESTADO, ORIGEN, NROFUA
          FROM CUENTA 
          WHERE PACIENTE = ${pacienteId} 
          AND ESTADO = '1' 
          AND ORIGEN = 'HO' 
          AND (SEGURO = ${seguroTrimmed} OR SEGURO = ${codigoSeguro})
          ORDER BY CUENTAID DESC
        ` as CuentaActiva[];
      }
      
      if (Array.isArray(cuenta) && cuenta.length > 0) {
        console.log(`Cuenta encontrada para paciente ${pacienteId}:`, cuenta[0]);
        console.log(`Seguro en cuenta encontrada: '${cuenta[0].SEGURO}'`);
        return cuenta[0];
      }
      
      console.log(`No se encontró cuenta activa para paciente ${pacienteId} con los criterios de búsqueda especificados`);
      return null;
    } catch (error: any) {
      console.error(`Error al obtener cuenta del paciente ${pacienteId} con seguro ${tipoSeguro}:`, error);
      return null;
    }
  }

  /**
   * Valida si un FUA está activo según las reglas de 3 u 8 horas
   */
  async validateFuaActivo(fuaNumber: string): Promise<boolean> {
    try {
      console.log(`Validando FUA activo: ${fuaNumber}`);
      
      // Primero obtenemos los datos básicos del FUA para verificar si existe y está activo
      const fuaBasic = await prisma.$queryRaw`
        SELECT TOP 1 NUMATENCION, PACIENTE, ESTADO, FECHA_ATENCION, HORA_ATENCION
        FROM ATENCION_SEGURO
        WHERE NUMATENCION = ${fuaNumber}
        AND ESTADO = '2'
      ` as any[];
      
      if (!Array.isArray(fuaBasic) || fuaBasic.length === 0) {
        console.log(`FUA ${fuaNumber} no encontrado o no está activo`);
        return false;
      }
      
      // Verificamos si la fecha es reciente (último día)
      const fechaReciente = await prisma.$queryRaw`
        SELECT 
        CASE 
          WHEN FECHA_ATENCION >= CAST(DATEADD(DAY, -1, GETDATE()) AS DATE) THEN 1
          ELSE 0
        END AS ES_RECIENTE
        FROM ATENCION_SEGURO
        WHERE NUMATENCION = ${fuaNumber}
      ` as any[];
      
      const esReciente = Array.isArray(fechaReciente) && fechaReciente.length > 0 && fechaReciente[0].ES_RECIENTE === 1;
      
      if (!esReciente) {
        console.log(`FUA ${fuaNumber} no es reciente (más de un día)`);
        return false;
      }
      
      // Calculamos los minutos transcurridos usando FECHA_ATENCION que ya es datetime
      // Primero verificamos si FECHA_ATENCION ya incluye la hora o solo la fecha
      const tiempoTranscurrido = await prisma.$queryRaw`
        SELECT 
        DATEDIFF(MINUTE, FECHA_ATENCION, GETDATE()) AS MINUTOS_TRANSCURRIDOS,
        GETDATE() AS HORA_ACTUAL,
        FECHA_ATENCION,
        HORA_ATENCION AS HORA_ORIGINAL,
        DATEPART(HOUR, FECHA_ATENCION) AS HORA_EN_FECHA,
        DATEPART(MINUTE, FECHA_ATENCION) AS MINUTO_EN_FECHA
        FROM ATENCION_SEGURO
        WHERE NUMATENCION = ${fuaNumber}
      ` as any[];
      
      if (!Array.isArray(tiempoTranscurrido) || tiempoTranscurrido.length === 0) {
        console.log(`No se pudo obtener información de tiempo para FUA ${fuaNumber}`);
        return false;
      }
      
      const fuaData = tiempoTranscurrido[0];
      let minutosTranscurridos = fuaData.MINUTOS_TRANSCURRIDOS;
      
      // Si FECHA_ATENCION solo contiene la fecha (hora = 00:00) y tenemos HORA_ATENCION
      const horaEnFecha = fuaData.HORA_EN_FECHA || 0;
      const minutoEnFecha = fuaData.MINUTO_EN_FECHA || 0;
      const horaOriginal = fuaData.HORA_ORIGINAL;
      
      console.log(`FUA ${fuaNumber} - Fecha: ${fuaData.FECHA_ATENCION}, Hora en fecha: ${horaEnFecha}:${minutoEnFecha}, Hora original: ${horaOriginal}`);
      
      // Si la fecha no tiene hora (00:00) pero tenemos HORA_ATENCION, intentamos ajustar
      if (horaEnFecha === 0 && minutoEnFecha === 0 && horaOriginal && horaOriginal.trim()) {
        try {
          // Intentamos parsear HORA_ATENCION para ajustar el cálculo
          const horaLimpia = horaOriginal.trim();
          let horasParsed = 0;
          let minutosParsed = 0;
          
          if (horaLimpia.includes(':')) {
            // Formato HH:MM o H:MM
            const partes = horaLimpia.split(':');
            horasParsed = parseInt(partes[0]) || 0;
            minutosParsed = parseInt(partes[1]) || 0;
          } else if (horaLimpia.length >= 3) {
            // Formato HHMM o HMM
            if (horaLimpia.length === 3) {
              horasParsed = parseInt(horaLimpia.substring(0, 1)) || 0;
              minutosParsed = parseInt(horaLimpia.substring(1, 3)) || 0;
            } else if (horaLimpia.length === 4) {
              horasParsed = parseInt(horaLimpia.substring(0, 2)) || 0;
              minutosParsed = parseInt(horaLimpia.substring(2, 4)) || 0;
            }
          } else {
            // Solo hora
            horasParsed = parseInt(horaLimpia) || 0;
          }
          
          // Validar que las horas y minutos sean válidos
          if (horasParsed >= 0 && horasParsed <= 23 && minutosParsed >= 0 && minutosParsed <= 59) {
            // Ajustar el cálculo restando las horas y minutos parseados
            const minutosAjuste = (horasParsed * 60) + minutosParsed;
            minutosTranscurridos = minutosTranscurridos - minutosAjuste;
            
            console.log(`FUA ${fuaNumber} - Ajuste aplicado: ${horasParsed}:${minutosParsed} (${minutosAjuste} minutos)`);
          }
        } catch (parseError) {
          console.log(`FUA ${fuaNumber} - No se pudo parsear HORA_ATENCION: ${horaOriginal}`);
        }
      }
      
      const horasTranscurridas = Math.floor(minutosTranscurridos / 60);
      
      // Validar según las reglas: debe ser menor a 8 horas para ser válido
      const esValido = horasTranscurridas <= 8;
      
      console.log(`FUA ${fuaNumber} - Minutos transcurridos: ${minutosTranscurridos}, Horas: ${horasTranscurridas}, Es reciente: ${esReciente}, Válido: ${esValido} (límite: 8 horas)`);
      console.log(`FUA ${fuaNumber} - Fecha: ${tiempoTranscurrido[0].FECHA_ATENCION}, Hora original: ${tiempoTranscurrido[0].HORA_ORIGINAL}, Hora actual: ${tiempoTranscurrido[0].HORA_ACTUAL}`);
      
      return esValido;
    } catch (error) {
      console.error(`Error al validar FUA ${fuaNumber}:`, error);
      
      // Intentamos un enfoque de último recurso usando solo la existencia del FUA activo
      try {
        const fuaExiste = await prisma.$queryRaw`
          SELECT COUNT(*) AS EXISTE
          FROM ATENCION_SEGURO
          WHERE NUMATENCION = ${fuaNumber}
          AND ESTADO = '2'
          AND FECHA_ATENCION >= CAST(DATEADD(DAY, -1, GETDATE()) AS DATE)
        ` as any[];
        
        const existe = Array.isArray(fuaExiste) && fuaExiste.length > 0 && fuaExiste[0].EXISTE > 0;
        
        console.log(`FUA ${fuaNumber} - Enfoque de último recurso - Existe FUA activo reciente: ${existe}`);
        
        return existe;
      } catch (fallbackError) {
        console.error(`Error en enfoque de último recurso para FUA ${fuaNumber}:`, fallbackError);
        return false;
      }
    }
  }

  /**
   * Valida cuenta y FUA según el tipo de seguro
   */
  async validateCuentaAndFua(pacienteId: string, tipoSeguro: string): Promise<CuentaValidationResult> {
    try {
      const seguroTrimmed = tipoSeguro.trim();
      
      // Determinar el tipo de validación según el seguro
      const esSIS = ['20', '21', '22', '23', '24', '25'].includes(seguroTrimmed);
      const esPagante = seguroTrimmed === '0' || seguroTrimmed === '00';
      const esSOAT = seguroTrimmed === '02';
      
      if (esSIS) {
        return await this.validateSISAccount(pacienteId, tipoSeguro);
      } else if (esPagante || esSOAT) {
        return await this.validatePaganteSoatAccount(pacienteId, tipoSeguro);
      } else {
        return {
          isValid: false,
          cuentaId: null,
          fuaId: null,
          message: `Tipo de seguro no reconocido: ${tipoSeguro}`,
          tipoValidacion: 'SIS'
        };
      }
    } catch (error) {
      console.error(`Error al validar cuenta y FUA para paciente ${pacienteId}:`, error);
      return {
        isValid: false,
        cuentaId: null,
        fuaId: null,
        message: 'Error interno al validar cuenta y FUA',
        tipoValidacion: 'SIS'
      };
    }
  }

  /**
   * Valida cuenta SIS (requiere CUENTA activa + FUA activo)
   */
  private async validateSISAccount(pacienteId: string, tipoSeguro: string): Promise<CuentaValidationResult> {
    console.log(`Validando cuenta SIS para paciente: ${pacienteId}, seguro: ${tipoSeguro}`);
    
    // 1. Buscar cuenta activa
    const cuenta = await this.getCuentaActivaByPacienteIdAndSeguro(pacienteId, tipoSeguro);
    
    if (!cuenta) {
      return {
        isValid: false,
        cuentaId: null,
        fuaId: null,
        message: 'No se encontró cuenta activa para el paciente con seguro SIS',
        tipoValidacion: 'SIS'
      };
    }

    // 2. Verificar que la cuenta tenga NROFUA
    if (!cuenta.NROFUA || cuenta.NROFUA.trim() === '') {
      return {
        isValid: false,
        cuentaId: cuenta.CUENTAID,
        fuaId: null,
        message: 'La cuenta activa no tiene número de FUA asociado',
        tipoValidacion: 'SIS'
      };
    }

    // 3. Validar que el FUA esté activo
    const fuaActivo = await this.validateFuaActivo(cuenta.NROFUA.trim());
    
    if (!fuaActivo) {
      return {
        isValid: false,
        cuentaId: cuenta.CUENTAID,
        fuaId: cuenta.NROFUA,
        message: 'El FUA asociado a la cuenta no está activo o ha expirado',
        tipoValidacion: 'SIS'
      };
    }

    return {
      isValid: true,
      cuentaId: cuenta.CUENTAID,
      fuaId: cuenta.NROFUA,
      message: 'Cuenta SIS válida con FUA activo',
      tipoValidacion: 'SIS'
    };
  }

  /**
   * Valida cuenta PAGANTE/SOAT (solo requiere CUENTA activa)
   */
  private async validatePaganteSoatAccount(pacienteId: string, tipoSeguro: string): Promise<CuentaValidationResult> {
    console.log(`Validando cuenta PAGANTE/SOAT para paciente: ${pacienteId}, seguro: ${tipoSeguro}`);
    
    // Solo buscar cuenta activa
    const cuenta = await this.getCuentaActivaByPacienteIdAndSeguro(pacienteId, tipoSeguro);
    
    if (!cuenta) {
      return {
        isValid: false,
        cuentaId: null,
        fuaId: null,
        message: `No se encontró cuenta activa para el paciente con seguro ${tipoSeguro === '0' || tipoSeguro === '00' ? 'PAGANTE' : 'SOAT'}`,
        tipoValidacion: 'PAGANTE_SOAT'
      };
    }

    return {
      isValid: true,
      cuentaId: cuenta.CUENTAID,
      fuaId: null, // No se requiere FUA para PAGANTE/SOAT
      message: `Cuenta ${tipoSeguro === '0' || tipoSeguro === '00' ? 'PAGANTE' : 'SOAT'} válida`,
      tipoValidacion: 'PAGANTE_SOAT'
    };
  }

  /**
   * Obtiene información detallada de una cuenta específica
   */
  async getCuentaDetails(cuentaId: string): Promise<CuentaActiva | null> {
    try {
      const cuenta = await prisma.$queryRaw`
        SELECT CUENTAID, PACIENTE, SEGURO, ESTADO, ORIGEN, NROFUA
        FROM CUENTA 
        WHERE CUENTAID = ${cuentaId}
      ` as CuentaActiva[];
      
      return Array.isArray(cuenta) && cuenta.length > 0 ? cuenta[0] : null;
    } catch (error) {
      console.error(`Error al obtener detalles de cuenta ${cuentaId}:`, error);
      return null;
    }
  }

  /**
   * Obtiene información detallada de un FUA específico
   */
  async getFuaDetails(fuaNumber: string): Promise<FuaActivo | null> {
    try {
      const fua = await prisma.$queryRaw`
        SELECT NUMATENCION, PACIENTE, ESTADO, FECHA_ATENCION, HORA_ATENCION
        FROM ATENCION_SEGURO 
        WHERE NUMATENCION = ${fuaNumber}
      ` as FuaActivo[];
      
      return Array.isArray(fua) && fua.length > 0 ? fua[0] : null;
    } catch (error) {
      console.error(`Error al obtener detalles de FUA ${fuaNumber}:`, error);
      return null;
    }
  }

  /**
   * Obtiene el número de FUA activa asociado a una cuenta
   */
  async getFUAActivaByCuentaId(cuentaId: string): Promise<string | null> {
    try {
      console.log(`Buscando FUA activa para cuenta: ${cuentaId}`);
      
      const cuenta = await prisma.$queryRaw`
        SELECT NROFUA 
        FROM CUENTA 
        WHERE CUENTAID = ${cuentaId} AND ESTADO = '1'
      ` as any[];
      
      if (Array.isArray(cuenta) && cuenta.length > 0 && cuenta[0].NROFUA) {
        const nroFua = cuenta[0].NROFUA.trim();
        console.log(`FUA encontrada para cuenta ${cuentaId}: ${nroFua}`);
        return nroFua;
      }
      
      console.log(`No se encontró FUA activa para la cuenta ${cuentaId}`);
      return null;
    } catch (error: any) {
      console.error(`Error al obtener FUA de cuenta ${cuentaId}:`, error);
      return null;
    }
  }

  /**
   * Actualiza el estado de una FUA a 0 (inactiva)
   */
  async updateFUA(nroFua: string): Promise<boolean> {
    try {
      console.log(`Actualizando estado de FUA ${nroFua} a inactivo`);
      
      await prisma.$executeRaw`
        UPDATE ATENCION_SEGURO
        SET ESTADO = '0'
        WHERE NUMATENCION = ${nroFua}
      `;
      
      console.log(`FUA ${nroFua} actualizada a estado inactivo`);
      return true;
    } catch (error: any) {
      console.error(`Error al actualizar estado de FUA ${nroFua}:`, error);
      return false;
    }
  }

  /**
   * Actualiza el estado de una cuenta a 0 (inactiva)
   */
  async updateCUENTA(cuentaId: string): Promise<boolean> {
    try {
      console.log(`Actualizando estado de cuenta ${cuentaId} a inactivo`);
      
      await prisma.$executeRaw`
        UPDATE CUENTA
        SET ESTADO = '0'
        WHERE CUENTAID = ${cuentaId}
      `;
      
      console.log(`Cuenta ${cuentaId} actualizada a estado inactivo`);
      return true;
    } catch (error: any) {
      console.error(`Error al actualizar estado de cuenta ${cuentaId}:`, error);
      return false;
    }
  }

  /**
   * Actualiza tanto la cuenta como la FUA asociada a estado inactivo (0)
   * Implementa borrado lógico
   */
  async updateCuentaAndFUA(cuentaId: string): Promise<{ success: boolean, message: string }> {
    try {
      console.log(`Iniciando borrado lógico para cuenta: ${cuentaId}`);
      
      // Primero obtenemos el número de FUA asociado a la cuenta
      const nroFua = await this.getFUAActivaByCuentaId(cuentaId);
      
      if (!nroFua) {
        // Si no hay FUA, solo actualizamos la cuenta
        const cuentaUpdated = await this.updateCUENTA(cuentaId);
        if (!cuentaUpdated) {
          return { 
            success: false, 
            message: `Error al actualizar la cuenta ${cuentaId}` 
          };
        }
        
        return { 
          success: true, 
          message: `Cuenta ${cuentaId} actualizada correctamente a estado inactivo (sin FUA asociada)` 
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

// Instancia singleton del servicio
export const cuentaValidationService = new CuentaValidationService();
