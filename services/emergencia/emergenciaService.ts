import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export interface EmergenciaData {
  EMERGENCIA_ID?: string;
  FECHA?: Date;
  HORA?: string;
  ORDEN?: string;
  PATERNO?: string;
  MATERNO?: string;
  NOMBRE?: string;
  NOMBRES?: string;
  PACIENTE?: string;
  FECHA_NACIMIENTO?: Date | string;
  EDAD?: string;
  SEXO?: string;
  ESTADO_CIVIL?: string;
  DIRECCION?: string;
  DISTRITO?: string;
  TELEFONO1?: string;
  TELEFONO2?: string;
  TIPO_DOCUMENTO?: string;
  DOCUMENTO?: string;
  ACOMPANANTE?: string;
  TIPO_DOCUMENTOA?: string;
  DOCUMENTOA?: string;
  CONSULTORIO?: string;
  MOTIVO_EMERGENCIA?: string;
  SEGURO?: string;
  OBSERVACION1?: string;
  OBSERVACION2?: string;
  ESTADO?: string;
  CUENTAID?: string;
  USUARIO?: string;
  PRE_AFILIACION?: string;
  LOCALIDAD?: string;
  TIPOATENCION?: string;
  RELIGION?: string;
  SEGUROLIQ?: string;
  FORMA_INGRESO?: string;
  HISTORIA?: string;
  CIEX1?: string;
  TIPO_CIEX1?: string;
  // Description fields from joined tables
  MOTIVO_DESCRIPCION?: string;
  DIAGNOSTICO_DESCRIPCION?: string;
  CONSULTORIO_DESCRIPCION?: string;
}

export interface EmergenciaFilter {
  pacienteId?: string;
  fecha?: Date;
  estado?: string;
  consultorio?: string;
  medico?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

class EmergenciaService {
  /**
   * Obtiene todas las emergencias con paginación y filtros opcionales
   */
  async getEmergencias(
    { page = 1, pageSize = 10 }: PaginationParams,
    filter: EmergenciaFilter = {}
  ) {
    try {
      // Construir el filtro
      const where: any = {};
      
      if (filter.pacienteId) {
        where.PACIENTE = filter.pacienteId;
      }
      
      if (filter.fecha) {
        where.FECHA = {
          gte: new Date(filter.fecha.setHours(0, 0, 0, 0)),
          lt: new Date(filter.fecha.setHours(23, 59, 59, 999)),
        };
      }
      
      if (filter.estado) {
        where.ESTADO = filter.estado;
      }
      
      if (filter.consultorio) {
        where.CONSULTORIO = filter.consultorio;
      }
      
      if (filter.medico) {
        where.MEDICO = filter.medico;
      }

      // For simplicity, let's use basic filtering with raw SQL
      // SQL Server 2008 R2 compatible pagination using ROW_NUMBER()
      const skip = (page - 1) * pageSize;
      
      // Build basic WHERE conditions
      let whereConditions = [];
      if (filter.pacienteId) whereConditions.push(`e.PACIENTE = '${filter.pacienteId}'`);
      if (filter.estado) whereConditions.push(`e.ESTADO = '${filter.estado}'`);
      if (filter.consultorio) whereConditions.push(`e.CONSULTORIO = '${filter.consultorio}'`);
      if (filter.medico) whereConditions.push(`e.MEDICO = '${filter.medico}'`);
      if (filter.fecha) {
        const dateStr = filter.fecha.toISOString().split('T')[0];
        whereConditions.push(`CAST(e.FECHA AS DATE) = '${dateStr}'`);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count total records
      const totalQuery = `
        SELECT COUNT(*) as total
        FROM EMERGENCIA e
        ${whereClause}
      `;
      const totalResult = await prisma.$queryRawUnsafe(totalQuery) as any[];
      const total = Number(totalResult[0]?.total || 0);
      
      // Get paginated records with joins
      const emergenciasQuery = `
        WITH EmergenciasPaginadas AS (
          SELECT 
            e.*,
            me.NOMBRE as MOTIVO_DESCRIPCION,
            odd.DESCRIPCION as DIAGNOSTICO_DESCRIPCION,
            c.NOMBRE as CONSULTORIO_DESCRIPCION,
            ROW_NUMBER() OVER (ORDER BY e.FECHA DESC) AS RowNum 
          FROM EMERGENCIA e
          LEFT JOIN MOTIVO_EMERGENCIA me ON e.MOTIVO_EMERGENCIA = me.MOTIVO_EMERGENCIA
          LEFT JOIN oeiDiagnosticoDetalle odd ON e.CIEX1 = odd.CODIGO
          LEFT JOIN CONSULTORIO c ON e.CONSULTORIO = c.CONSULTORIO
          ${whereClause}
        )
        SELECT * FROM EmergenciasPaginadas 
        WHERE RowNum BETWEEN ${skip + 1} AND ${skip + pageSize}
      `;
      const emergenciasRaw = await prisma.$queryRawUnsafe(emergenciasQuery) as any[];
      
      // Convert BigInt values to strings to avoid JSON serialization issues
      const emergencias = emergenciasRaw.map(record => {
        const converted: any = {};
        for (const [key, value] of Object.entries(record)) {
          if (typeof value === 'bigint') {
            converted[key] = value.toString();
          } else {
            converted[key] = value;
          }
        }
        return converted;
      });
      
      // Calcular total de páginas
      const totalPages = Math.ceil(total / pageSize);
      
      return {
        data: emergencias,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error al obtener emergencias:', error);
      throw new Error('Error al obtener emergencias');
    }
  }

  /**
   * Obtiene una emergencia por su ID
   */
  async getEmergenciaById(emergenciaId: string) {
    try {
      // Validar que el ID sea válido antes de hacer la consulta
      if (!emergenciaId || typeof emergenciaId !== 'string' || emergenciaId.trim() === '') {
        console.error('ID de emergencia inválido:', emergenciaId);
        throw new Error('ID de emergencia inválido o no proporcionado');
      }

      console.log(`Buscando emergencia con ID: ${emergenciaId}`);
      
      // Usar consulta SQL nativa en lugar de Prisma ORM para evitar problemas con OFFSET
      const result = await prisma.$queryRaw`
        SELECT TOP 1 * FROM EMERGENCIA 
        WHERE EMERGENCIA_ID = ${emergenciaId}
      `;
      
      // Convertir el resultado a un objeto normal
      const emergencia = Array.isArray(result) && result.length > 0 ? result[0] : null;
      
      if (!emergencia) {
        console.log(`No se encontró emergencia con ID: ${emergenciaId}`);
        return null;
      }
      
      console.log(`Emergencia encontrada con ID: ${emergenciaId}`);
      return emergencia;
    } catch (error: any) {
      const errorMessage = `Error al obtener emergencia con ID ${emergenciaId}: ${error.message || 'Error desconocido'}`;
      console.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtiene el número de cuenta activa del paciente
   */
  async getCuentaActivaByPacienteId(pacienteId: string): Promise<string | null> {
    try {
      // Obtener la cuenta activa más reciente del paciente
      const cuenta = await prisma.$queryRaw`
        SELECT TOP 1 CUENTAID 
        FROM CUENTA 
        WHERE PACIENTE = ${pacienteId} AND ESTADO = '1' 
        ORDER BY CUENTAID DESC
      `;
      
      // Verificar si se encontró una cuenta
      if (Array.isArray(cuenta) && cuenta.length > 0) {
        return cuenta[0].CUENTAID;
      }
      
      return null;
    } catch (error: any) {
      const errorMessage = `Error al obtener cuenta del paciente ${pacienteId}: ${error.message || 'Error desconocido'}`;
      console.error(errorMessage, error);
      return null;
    }
  }

  /**
   * Obtiene todas las emergencias de un paciente
   */
  async getEmergenciasByPacienteId(
    pacienteId: string,
    { page = 1, pageSize = 10 }: PaginationParams
  ) {
    try {
      // Contar total de registros
      const total = await prisma.eMERGENCIA.count({
        where: {
          PACIENTE: pacienteId,
        },
      });
      
      // SQL Server 2008 R2 compatible pagination using ROW_NUMBER()
      // This is compatible with older SQL Server versions that don't support OFFSET/FETCH
      const skip = (page - 1) * pageSize;
      
      // Use Prisma's raw query capability with SQL Server 2008 R2 compatible pagination
      // Include joins for MOTIVO_EMERGENCIA, oeiDiagnosticoDetalle, and CONSULTORIO descriptions
      const emergenciasRaw = await prisma.$queryRaw`
        WITH EmergenciasPaginadas AS (
          SELECT 
            e.*,
            me.NOMBRE as MOTIVO_DESCRIPCION,
            odd.DESCRIPCION as DIAGNOSTICO_DESCRIPCION,
            c.NOMBRE as CONSULTORIO_DESCRIPCION,
            ROW_NUMBER() OVER (ORDER BY e.FECHA DESC) AS RowNum 
          FROM EMERGENCIA e
          LEFT JOIN MOTIVO_EMERGENCIA me ON e.MOTIVO_EMERGENCIA = me.MOTIVO_EMERGENCIA
          LEFT JOIN oeiDiagnosticoDetalle odd ON e.CIEX1 = odd.CODIGO
          LEFT JOIN CONSULTORIO c ON e.CONSULTORIO = c.CONSULTORIO
          WHERE e.PACIENTE = ${pacienteId}
        )
        SELECT * FROM EmergenciasPaginadas 
        WHERE RowNum BETWEEN ${skip + 1} AND ${skip + pageSize}
      ` as any[];
      
      // Convert BigInt values to strings to avoid JSON serialization issues
      const emergencias = emergenciasRaw.map(record => {
        const converted: any = {};
        for (const [key, value] of Object.entries(record)) {
          if (typeof value === 'bigint') {
            converted[key] = value.toString();
          } else {
            converted[key] = value;
          }
        }
        return converted;
      });
      
      // Calcular total de páginas
      const totalPages = Math.ceil(total / pageSize);
      
      return {
        data: emergencias,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error(`Error al obtener emergencias del paciente ${pacienteId}:`, error);
      throw new Error(`Error al obtener emergencias del paciente ${pacienteId}`);
    }
  }

  /**
   * Crea una nueva emergencia
   */
  async createEmergencia(data: EmergenciaData) {
    try {
      // Generar ID único para la emergencia (formato: EYYYYMMDDNNN)
      const today = new Date();
      const dateStr = format(today, 'yyyyMMdd');
      
      // Buscar el último ID de emergencia del día para incrementarlo usando SQL nativo
      // en lugar de Prisma ORM para evitar el uso de OFFSET que no es compatible con SQL Server 2008 R2
      const lastEmergenciaResult = await prisma.$queryRaw`
        SELECT TOP 1 EMERGENCIA_ID 
        FROM EMERGENCIA 
        WHERE EMERGENCIA_ID LIKE 'E${dateStr}%' 
        ORDER BY EMERGENCIA_ID DESC
      `;
      
      // Convertir el resultado a un formato similar al que devolvería Prisma
      const lastEmergencia = Array.isArray(lastEmergenciaResult) && lastEmergenciaResult.length > 0 
        ? lastEmergenciaResult[0] 
        : null;
      
      let newId: string;
      
      if (lastEmergencia) {
        const lastNumber = parseInt(lastEmergencia.EMERGENCIA_ID.substring(9), 10);
        const newNumber = lastNumber + 1;
        newId = `E${dateStr}${newNumber.toString().padStart(3, '0')}`;
      } else {
        newId = `E${dateStr}001`;
      }
      
      // Preparar datos para la creación
      const emergenciaData: any = {
        EMERGENCIA_ID: newId,
        FECHA: data.FECHA || format(new Date(), 'yyyyMMdd'),
        HORA: data.HORA || format(new Date(), 'HH:mm'),
        ORDEN: data.ORDEN || '',
        PATERNO: data.PATERNO || '',
        MATERNO: data.MATERNO || '',
        NOMBRE: data.NOMBRE || '',
        NOMBRES: data.NOMBRES || '',
        PACIENTE: data.PACIENTE || '',
        FECHA_NACIMIENTO: data.FECHA_NACIMIENTO || '',
        EDAD: data.EDAD || '',
        SEXO: data.SEXO || '',
        ESTADO_CIVIL: data.ESTADO_CIVIL || '',
        DIRECCION: data.DIRECCION || '',
        DISTRITO: data.DISTRITO || '',
        TELEFONO1: data.TELEFONO1 || '',
        TELEFONO2: data.TELEFONO2 || '',
        TIPO_DOCUMENTO: data.TIPO_DOCUMENTO || 'D',
        DOCUMENTO: data.DOCUMENTO || '',
        ACOMPANANTE: data.ACOMPANANTE || '',
        TIPO_DOCUMENTOA: data.TIPO_DOCUMENTOA || '',
        DOCUMENTOA: data.DOCUMENTOA || '',
        CONSULTORIO: data.CONSULTORIO || '',
        MOTIVO_EMERGENCIA: data.MOTIVO_EMERGENCIA || '0',
        SEGURO: data.SEGURO || '',
        OBSERVACION1: data.OBSERVACION1 || '',
        OBSERVACION2: data.OBSERVACION2 || '',
        ESTADO: data.ESTADO || '1', // 1 = Activo por defecto
        CUENTAID: data.CUENTAID || '',
        USUARIO: data.USUARIO || 'SISTEMA',
        PRE_AFILIACION: data.PRE_AFILIACION || '',
        LOCALIDAD: data.LOCALIDAD || '',
        TIPOATENCION: data.TIPOATENCION || 'E',
        RELIGION: data.RELIGION || '0',
        SEGUROLIQ: data.SEGUROLIQ || '',
        FORMA_INGRESO: data.FORMA_INGRESO || '1',
        HISTORIA: data.HISTORIA || '',
        CIEX1: data.CIEX1 || '0',
        TIPO_CIEX1: data.TIPO_CIEX1 || '0',
      };
      
      // Crear la emergencia usando SQL nativo en lugar de Prisma ORM
      // Preparar los valores para el INSERT
      
      // Construir la consulta SQL directamente para cada campo
      // Esto es menos elegante pero evita problemas con la sintaxis de SQL Server
      await prisma.$executeRaw`
        INSERT INTO EMERGENCIA (
          EMERGENCIA_ID, FECHA, HORA, ORDEN, PATERNO, MATERNO, NOMBRE, NOMBRES,
          PACIENTE, FECHA_NACIMIENTO, EDAD, SEXO, ESTADO_CIVIL, DIRECCION, DISTRITO,
          TELEFONO1, TELEFONO2, TIPO_DOCUMENTO, DOCUMENTO, ACOMPANANTE, TIPO_DOCUMENTOA,
          DOCUMENTOA, CONSULTORIO, MOTIVO_EMERGENCIA, SEGURO, OBSERVACION1, OBSERVACION2,
          ESTADO, CUENTAID, USUARIO, PRE_AFILIACION, LOCALIDAD, TIPOATENCION, RELIGION,
          SEGUROLIQ, FORMA_INGRESO, HISTORIA, CIEX1, TIPO_CIEX1
        ) VALUES (
          ${emergenciaData.EMERGENCIA_ID},
          ${emergenciaData.FECHA},
          ${emergenciaData.HORA},
          ${emergenciaData.ORDEN},
          ${emergenciaData.PATERNO},
          ${emergenciaData.MATERNO},
          ${emergenciaData.NOMBRE},
          ${emergenciaData.NOMBRES},
          ${emergenciaData.PACIENTE},
          ${emergenciaData.FECHA_NACIMIENTO},
          ${emergenciaData.EDAD},
          ${emergenciaData.SEXO},
          ${emergenciaData.ESTADO_CIVIL},
          ${emergenciaData.DIRECCION},
          ${emergenciaData.DISTRITO},
          ${emergenciaData.TELEFONO1},
          ${emergenciaData.TELEFONO2},
          ${emergenciaData.TIPO_DOCUMENTO},
          ${emergenciaData.DOCUMENTO},
          ${emergenciaData.ACOMPANANTE},
          ${emergenciaData.TIPO_DOCUMENTOA},
          ${emergenciaData.DOCUMENTOA},
          ${emergenciaData.CONSULTORIO},
          ${emergenciaData.MOTIVO_EMERGENCIA},
          ${emergenciaData.SEGURO},
          ${emergenciaData.OBSERVACION1},
          ${emergenciaData.OBSERVACION2},
          ${emergenciaData.ESTADO},
          ${emergenciaData.CUENTAID},
          ${emergenciaData.USUARIO},
          ${emergenciaData.PRE_AFILIACION},
          ${emergenciaData.LOCALIDAD},
          ${emergenciaData.TIPOATENCION},
          ${emergenciaData.RELIGION},
          ${emergenciaData.SEGUROLIQ},
          ${emergenciaData.FORMA_INGRESO},
          ${emergenciaData.HISTORIA},
          ${emergenciaData.CIEX1},
          ${emergenciaData.TIPO_CIEX1}
        )
      `;
      
      // Obtener la emergencia recién creada
      const emergencia = await prisma.$queryRaw`
        SELECT TOP 1 * FROM EMERGENCIA 
        WHERE EMERGENCIA_ID = ${newId}
      `;
      
      return Array.isArray(emergencia) && emergencia.length > 0 ? emergencia[0] : null;
    } catch (error) {
      console.error('Error al crear emergencia:', error);
      throw new Error('Error al crear emergencia');
    }
  }

  /**
   * Actualiza una emergencia existente
   */
  async updateEmergencia(emergenciaId: string, data: EmergenciaData) {
    try {
      // Verificar si la emergencia existe
      const existingEmergencia = await prisma.eMERGENCIA.findUnique({
        where: {
          EMERGENCIA_ID: emergenciaId,
        },
      });
      
      if (!existingEmergencia) {
        throw new Error(`Emergencia con ID ${emergenciaId} no encontrada`);
      }
      
      // Preparar datos para la actualización
      const updateData: any = {};
      
      // Solo actualizar los campos que vienen en data
      if (data.FECHA) updateData.FECHA = data.FECHA;
      if (data.HORA) updateData.HORA = data.HORA;
      if (data.ORDEN !== undefined) updateData.ORDEN = data.ORDEN;
      if (data.PATERNO !== undefined) updateData.PATERNO = data.PATERNO;
      if (data.MATERNO !== undefined) updateData.MATERNO = data.MATERNO;
      if (data.NOMBRE !== undefined) updateData.NOMBRE = data.NOMBRE;
      if (data.NOMBRES !== undefined) updateData.NOMBRES = data.NOMBRES;
      if (data.PACIENTE !== undefined) updateData.PACIENTE = data.PACIENTE;
      if (data.FECHA_NACIMIENTO !== undefined) updateData.FECHA_NACIMIENTO = data.FECHA_NACIMIENTO;
      if (data.EDAD !== undefined) updateData.EDAD = data.EDAD;
      if (data.SEXO !== undefined) updateData.SEXO = data.SEXO;
      if (data.ESTADO_CIVIL !== undefined) updateData.ESTADO_CIVIL = data.ESTADO_CIVIL;
      if (data.DIRECCION !== undefined) updateData.DIRECCION = data.DIRECCION;
      if (data.DISTRITO !== undefined) updateData.DISTRITO = data.DISTRITO;
      if (data.TELEFONO1 !== undefined) updateData.TELEFONO1 = data.TELEFONO1;
      if (data.TELEFONO2 !== undefined) updateData.TELEFONO2 = data.TELEFONO2;
      if (data.TIPO_DOCUMENTO !== undefined) updateData.TIPO_DOCUMENTO = data.TIPO_DOCUMENTO;
      if (data.DOCUMENTO !== undefined) updateData.DOCUMENTO = data.DOCUMENTO;
      if (data.ACOMPANANTE !== undefined) updateData.ACOMPANANTE = data.ACOMPANANTE;
      if (data.TIPO_DOCUMENTOA !== undefined) updateData.TIPO_DOCUMENTOA = data.TIPO_DOCUMENTOA;
      if (data.DOCUMENTOA !== undefined) updateData.DOCUMENTOA = data.DOCUMENTOA;
      if (data.CONSULTORIO !== undefined) updateData.CONSULTORIO = data.CONSULTORIO;
      if (data.MOTIVO_EMERGENCIA !== undefined) updateData.MOTIVO_EMERGENCIA = data.MOTIVO_EMERGENCIA;
      if (data.SEGURO !== undefined) updateData.SEGURO = data.SEGURO;
      if (data.OBSERVACION1 !== undefined) updateData.OBSERVACION1 = data.OBSERVACION1;
      if (data.OBSERVACION2 !== undefined) updateData.OBSERVACION2 = data.OBSERVACION2;
      if (data.ESTADO !== undefined) updateData.ESTADO = data.ESTADO;
      if (data.CUENTAID !== undefined) updateData.CUENTAID = data.CUENTAID;
      if (data.USUARIO !== undefined) updateData.USUARIO = data.USUARIO;
      if (data.PRE_AFILIACION !== undefined) updateData.PRE_AFILIACION = data.PRE_AFILIACION;
      if (data.LOCALIDAD !== undefined) updateData.LOCALIDAD = data.LOCALIDAD;
      if (data.TIPOATENCION !== undefined) updateData.TIPOATENCION = data.TIPOATENCION;
      if (data.RELIGION !== undefined) updateData.RELIGION = data.RELIGION;
      if (data.SEGUROLIQ !== undefined) updateData.SEGUROLIQ = data.SEGUROLIQ;
      if (data.FORMA_INGRESO !== undefined) updateData.FORMA_INGRESO = data.FORMA_INGRESO;
      if (data.HISTORIA !== undefined) updateData.HISTORIA = data.HISTORIA;
      if (data.CIEX1 !== undefined) updateData.CIEX1 = data.CIEX1;
      if (data.TIPO_CIEX1 !== undefined) updateData.TIPO_CIEX1 = data.TIPO_CIEX1;
      
      // Actualizar la emergencia
      const updatedEmergencia = await prisma.eMERGENCIA.update({
        where: {
          EMERGENCIA_ID: emergenciaId,
        },
        data: updateData,
      });
      
      return updatedEmergencia;
    } catch (error) {
      console.error(`Error al actualizar emergencia con ID ${emergenciaId}:`, error);
      throw new Error(`Error al actualizar emergencia con ID ${emergenciaId}`);
    }
  }

  /**
   * Elimina lógicamente una emergencia (cambia su estado a '0')
   */
  async deleteEmergencia(emergenciaId: string) {
    try {
      // Verificar si la emergencia existe usando SQL nativo
      const existingResult = await prisma.$queryRaw`
        SELECT TOP 1 * FROM EMERGENCIA 
        WHERE EMERGENCIA_ID = ${emergenciaId}
      `;
      
      // Convertir el resultado a un objeto normal
      const existingEmergencia = Array.isArray(existingResult) && existingResult.length > 0 ? existingResult[0] : null;
      
      if (!existingEmergencia) {
        throw new Error(`Emergencia con ID ${emergenciaId} no encontrada`);
      }
      
      // Eliminar lógicamente la emergencia (cambiar estado a '0') usando SQL nativo
      const updateResult = await prisma.$executeRaw`
        UPDATE EMERGENCIA 
        SET ESTADO = '0' 
        WHERE EMERGENCIA_ID = ${emergenciaId}
      `;
      
      if (updateResult !== 1) {
        throw new Error(`No se pudo actualizar la emergencia con ID ${emergenciaId}`);
      }
      
      // Obtener la emergencia actualizada
      const updatedResult = await prisma.$queryRaw`
        SELECT TOP 1 * FROM EMERGENCIA 
        WHERE EMERGENCIA_ID = ${emergenciaId}
      `;
      
      const deletedEmergencia = Array.isArray(updatedResult) && updatedResult.length > 0 ? updatedResult[0] : null;
      
      return deletedEmergencia;
    } catch (error) {
      console.error(`Error al eliminar emergencia con ID ${emergenciaId}:`, error);
      throw new Error(`Error al eliminar emergencia con ID ${emergenciaId}`);
    }
  }

  /**
   * Verifica si un paciente tiene emergencias activas
   */
  async hasActiveEmergencias(pacienteId: string) {
    try {
      const count = await prisma.eMERGENCIA.count({
        where: {
          PACIENTE: pacienteId,
          ESTADO: '1', // 1 = Activo
        },
      });
      
      return count > 0;
    } catch (error) {
      console.error(`Error al verificar emergencias activas del paciente ${pacienteId}:`, error);
      throw new Error(`Error al verificar emergencias activas del paciente ${pacienteId}`);
    }
  }
}

export const emergenciaService = new EmergenciaService();
