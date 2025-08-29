import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { cuentaService } from './cuentaService';

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
            ROW_NUMBER() OVER (ORDER BY e.EMERGENCIA_ID DESC) AS RowNum 
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
            ROW_NUMBER() OVER (ORDER BY e.EMERGENCIA_ID DESC) AS RowNum 
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
      // Usar el ID proporcionado en la solicitud si existe, de lo contrario generar uno nuevo
      let emergenciaId: string;
      
      if (data.EMERGENCIA_ID && data.EMERGENCIA_ID.trim() !== '') {
        // Usar el ID proporcionado en la solicitud
        emergenciaId = data.EMERGENCIA_ID;
        console.log('Usando EMERGENCIA_ID proporcionado en la solicitud:', emergenciaId);
      } else {
        // Generar un nuevo ID si no se proporciona uno
        console.log('No se proporcionó EMERGENCIA_ID, generando uno nuevo');
        
        // Obtener el último ID para incrementarlo
        const lastEmergencia = await prisma.$queryRaw`
          SELECT TOP 1 EMERGENCIA_ID 
          FROM EMERGENCIA 
          ORDER BY EMERGENCIA_ID DESC
        ` as any[];
        
        if (lastEmergencia && lastEmergencia.length > 0) {
          const lastId = lastEmergencia[0].EMERGENCIA_ID;
          const lastNumber = parseInt(lastId, 10);
          if (!isNaN(lastNumber)) {
            const newNumber = lastNumber + 1;
            emergenciaId = newNumber.toString().padStart(8, '0');
          } else {
            emergenciaId = '25000001';
          }
        } else {
          emergenciaId = '25000001';
        }
        
        console.log('Nuevo EMERGENCIA_ID generado:', emergenciaId);
      }
      
      // Preparar datos para la creación
      const emergenciaData: any = {
        EMERGENCIA_ID: emergenciaId,
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
        WHERE EMERGENCIA_ID = ${emergenciaId}
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
      // Verificar si la emergencia existe usando SQL nativo
      const existingEmergencia = await prisma.$queryRaw`
        SELECT TOP 1 * FROM EMERGENCIA WHERE EMERGENCIA_ID = ${emergenciaId}
      `;
      
      if (!existingEmergencia || (Array.isArray(existingEmergencia) && existingEmergencia.length === 0)) {
        throw new Error(`Emergencia con ID ${emergenciaId} no encontrada`);
      }
      
      // Actualizar solo si hay campos para actualizar
      // Usamos un enfoque más directo con prisma.$executeRaw para cada campo
      // para evitar problemas de conversión de tipos
      
      // Actualizar cada campo individualmente para evitar problemas de conversión
      // Solo incluir los campos que vienen en data
      if (data.FECHA) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET FECHA = ${data.FECHA} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.HORA) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET HORA = ${data.HORA} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.ORDEN !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET ORDEN = ${data.ORDEN} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.PATERNO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET PATERNO = ${data.PATERNO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.MATERNO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET MATERNO = ${data.MATERNO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.NOMBRE !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET NOMBRE = ${data.NOMBRE} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.NOMBRES !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET NOMBRES = ${data.NOMBRES} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.PACIENTE !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET PACIENTE = ${data.PACIENTE} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.FECHA_NACIMIENTO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET FECHA_NACIMIENTO = ${data.FECHA_NACIMIENTO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.EDAD !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET EDAD = ${data.EDAD} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.SEXO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET SEXO = ${data.SEXO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.ESTADO_CIVIL !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET ESTADO_CIVIL = ${data.ESTADO_CIVIL} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.DIRECCION !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET DIRECCION = ${data.DIRECCION} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.DISTRITO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET DISTRITO = ${data.DISTRITO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.TELEFONO1 !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET TELEFONO1 = ${data.TELEFONO1} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.TELEFONO2 !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET TELEFONO2 = ${data.TELEFONO2} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.TIPO_DOCUMENTO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET TIPO_DOCUMENTO = ${data.TIPO_DOCUMENTO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.DOCUMENTO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET DOCUMENTO = ${data.DOCUMENTO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.ACOMPANANTE !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET ACOMPANANTE = ${data.ACOMPANANTE} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.TIPO_DOCUMENTOA !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET TIPO_DOCUMENTOA = ${data.TIPO_DOCUMENTOA} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.DOCUMENTOA !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET DOCUMENTOA = ${data.DOCUMENTOA} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.CONSULTORIO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET CONSULTORIO = ${data.CONSULTORIO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.MOTIVO_EMERGENCIA !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET MOTIVO_EMERGENCIA = ${data.MOTIVO_EMERGENCIA} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.SEGURO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET SEGURO = ${data.SEGURO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.OBSERVACION1 !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET OBSERVACION1 = ${data.OBSERVACION1} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.OBSERVACION2 !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET OBSERVACION2 = ${data.OBSERVACION2} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.ESTADO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET ESTADO = ${data.ESTADO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.CUENTAID !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET CUENTAID = ${data.CUENTAID} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.USUARIO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET USUARIO = ${data.USUARIO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.PRE_AFILIACION !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET PRE_AFILIACION = ${data.PRE_AFILIACION} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.LOCALIDAD !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET LOCALIDAD = ${data.LOCALIDAD} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.TIPOATENCION !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET TIPOATENCION = ${data.TIPOATENCION} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.RELIGION !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET RELIGION = ${data.RELIGION} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.SEGUROLIQ !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET SEGUROLIQ = ${data.SEGUROLIQ} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.FORMA_INGRESO !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET FORMA_INGRESO = ${data.FORMA_INGRESO} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.HISTORIA !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET HISTORIA = ${data.HISTORIA} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.CIEX1 !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET CIEX1 = ${data.CIEX1} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      if (data.TIPO_CIEX1 !== undefined) {
        await prisma.$executeRaw`UPDATE EMERGENCIA SET TIPO_CIEX1 = ${data.TIPO_CIEX1} WHERE EMERGENCIA_ID = ${emergenciaId}`;
      }
      
      // Obtener la emergencia actualizada
      const updatedEmergencia = await prisma.$queryRaw`
        SELECT TOP 1 * FROM EMERGENCIA WHERE EMERGENCIA_ID = ${emergenciaId}
      `;
      
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
      
      // Actualizar cuenta según el tipo de seguro liquidador
      if (existingEmergencia.CUENTAID) {
        const seguroLiq = existingEmergencia.SEGUROLIQ?.trim();
        console.log(`SEGUROLIQ de la emergencia: '${seguroLiq}'`);
        
        // Seguros que requieren solo cierre de cuenta (sin FUA): 0, 02, 17
        const segurosSimples = ["0", "02", "17"];
        
        if (segurosSimples.includes(seguroLiq)) {
          console.log(`Cerrando cuenta simple para seguro ${seguroLiq}, cuenta: ${existingEmergencia.CUENTAID}`);
          try {
            const cuentaResult = await cuentaService.updateCUENTA(existingEmergencia.CUENTAID);
            if (!cuentaResult) {
              console.warn(`Advertencia: No se pudo cerrar la cuenta ${existingEmergencia.CUENTAID}`);
            } else {
              console.log(`Cuenta ${existingEmergencia.CUENTAID} cerrada correctamente`);
            }
          } catch (cuentaError: any) {
            console.warn(`Advertencia: Error al cerrar cuenta: ${cuentaError.message}`);
          }
        } else {
          // Para otros seguros (SIS: 20,21,22,23,24,25) usar el método con FUA
          console.log(`Actualizando cuenta y FUA para seguro SIS ${seguroLiq}, cuenta: ${existingEmergencia.CUENTAID}`);
          try {
            const cuentaResult = await cuentaService.updateCuentaAndFUA(existingEmergencia.CUENTAID);
            if (!cuentaResult.success) {
              console.warn(`Advertencia: No se pudo actualizar cuenta y FUA: ${cuentaResult.message}`);
            } else {
              console.log(`Cuenta y FUA actualizadas correctamente: ${cuentaResult.message}`);
            }
          } catch (cuentaError: any) {
            console.warn(`Advertencia: Error al actualizar cuenta y FUA: ${cuentaError.message}`);
          }
        }
      } else {
        console.log(`No se encontró CUENTAID para la emergencia ${emergenciaId}, omitiendo actualización de cuenta`);
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
