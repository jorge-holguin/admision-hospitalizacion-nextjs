import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils';

export interface PacienteFilter {
  historia?: string;
  documento?: string;
  nombres?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export const pacienteService = {
  /**
   * Obtener pacientes paginados con filtros opcionales
   */
  async getPaginatedPacientes(
    filter: PacienteFilter = {},
    { page = 1, pageSize = 10 }: PaginationOptions
  ) {
    try {
      console.log('Buscando pacientes con parámetros:', { page, pageSize, filter });
      
      // Construir el objeto where para los filtros
      const where: any = {};
      
      if (filter.historia) {
        where.HISTORIA = {
          contains: filter.historia,
        };
      }
      
      if (filter.documento) {
        where.DOCUMENTO = {
          contains: filter.documento,
        };
      }
      
      if (filter.nombres) {
        where.OR = [
          { NOMBRES: { contains: filter.nombres } },
          { PATERNO: { contains: filter.nombres } },
          { MATERNO: { contains: filter.nombres } },
          { NOMBRE: { contains: filter.nombres } },
        ];
      }
      
      // Obtener el total de registros
      const total = await prisma.pACIENTE.count({ where });
      
      // Para versiones antiguas de SQL Server, usamos TOP y un subquery
      // en lugar de OFFSET/FETCH
      
      // Construir la consulta SQL manualmente
      let whereClause = '';
      
      if (filter.historia) {
        whereClause += ` AND HISTORIA LIKE '%${filter.historia}%'`;
      }
      
      if (filter.documento) {
        whereClause += ` AND DOCUMENTO LIKE '%${filter.documento}%'`;
      }
      
      if (filter.nombres) {
        whereClause += ` AND (NOMBRES LIKE '%${filter.nombres}%' OR PATERNO LIKE '%${filter.nombres}%' OR MATERNO LIKE '%${filter.nombres}%' OR NOMBRE LIKE '%${filter.nombres}%')`;
      }
      
      // Calcular el número de registros a saltar
      const recordsToSkip = (page - 1) * pageSize;
      
      // Consulta SQL compatible con SQL Server 2008 y anteriores
      const query = `
        SELECT TOP ${pageSize} * FROM (
          SELECT 
            PACIENTE, HISTORIA, NOMBRES, PATERNO, MATERNO, NOMBRE, SEXO, 
            FECHA_NACIMIENTO, EDAD, DOCUMENTO, TIPO_DOCUMENTO, DIRECCION, 
            TELEFONO1, ESTADO_CIVIL, FECHA_APERTURA, HORA_APERTURA, PADRE, 
            MADRE, DISTRITO, LUGAR_NACIMIENTO, OCUPACION, GRADO_INSTRUCCION, 
            CONYUGE_NOMBRE, SEGURO, ENTIDAD, ANIO, HIJOS, CONYUGE_OCUPACION, 
            CONSULTORIO, SYSINSERT, SYSUPDATE, FECHA_CONSULTA, TURNO_CONSULTA, 
            FLAG, RELIGION, USUARIO_IMP, HISTORIA_ANT,
            ROW_NUMBER() OVER (ORDER BY NOMBRES ASC) AS RowNum
          FROM dbo.PACIENTE
          WHERE 1=1 ${whereClause}
        ) AS PacientesPaginados
        WHERE RowNum > ${recordsToSkip}
        ORDER BY RowNum
      `;
      
      // Ejecutar la consulta nativa
      const data = await prisma.$queryRawUnsafe(query);
      
      console.log(`Encontrados ${Array.isArray(data) ? data.length : 0} pacientes de un total de ${total}`);
      
      return serializeBigInt({
        data: Array.isArray(data) ? data : [],
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error('Error en getPaginatedPacientes:', error instanceof Error ? error.message : 'Error desconocido', error);
      throw error;
    }
  },
  
  /**
   * Obtener un paciente por su ID
   */
  async getPacienteById(id: string) {
    try {
      console.log(`Buscando paciente con ID: ${id}`);
      
      // Usar SQL nativo para evitar problemas con OFFSET/FETCH
      const query = `
        SELECT 
          PACIENTE, HISTORIA, NOMBRES, PATERNO, MATERNO, NOMBRE, SEXO,
          FECHA_NACIMIENTO, EDAD, DOCUMENTO, TIPO_DOCUMENTO, DIRECCION,
          TELEFONO1, ESTADO_CIVIL, FECHA_APERTURA, HORA_APERTURA, PADRE,
          MADRE, DISTRITO, LUGAR_NACIMIENTO, OCUPACION, GRADO_INSTRUCCION,
          CONYUGE_NOMBRE, SEGURO, ENTIDAD, ANIO, HIJOS, CONYUGE_OCUPACION,
          CONSULTORIO, SYSINSERT, SYSUPDATE, FECHA_CONSULTA, TURNO_CONSULTA,
          FLAG, RELIGION, USUARIO_IMP, HISTORIA_ANT
        FROM dbo.PACIENTE
        WHERE PACIENTE = '${id}'
      `;
      
      const result = await prisma.$queryRawUnsafe(query);
      const paciente = Array.isArray(result) && result.length > 0 ? result[0] : null;
      
      console.log(`Paciente encontrado:`, paciente || 'No encontrado');
      return serializeBigInt(paciente);
    } catch (error) {
      console.error(`Error en getPacienteById(${id}):`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Buscar pacientes por historia clínica
   */
  async searchByHistoria(historia: string) {
    try {
      console.log(`Buscando pacientes por historia: ${historia}`);
      
      // Usar SQL nativo para evitar problemas con OFFSET/FETCH
      const query = `
        SELECT TOP 10
          PACIENTE, HISTORIA, NOMBRES, PATERNO, MATERNO, NOMBRE, SEXO,
          DOCUMENTO, FECHA_NACIMIENTO, EDAD
        FROM dbo.PACIENTE
        WHERE HISTORIA LIKE '%${historia}%'
        ORDER BY NOMBRES ASC
      `;
      
      const pacientes = await prisma.$queryRawUnsafe(query);
      
      console.log(`Encontrados ${Array.isArray(pacientes) ? pacientes.length : 0} pacientes por historia`);
      return serializeBigInt(Array.isArray(pacientes) ? pacientes : []);
    } catch (error) {
      console.error(`Error en searchByHistoria(${historia}):`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Buscar pacientes por documento (DNI)
   */
  async searchByDocumento(documento: string) {
    try {
      console.log(`Buscando pacientes por documento: ${documento}`);
      
      // Usar SQL nativo para evitar problemas con OFFSET/FETCH
      const query = `
        SELECT TOP 10
          PACIENTE, HISTORIA, NOMBRES, PATERNO, MATERNO, NOMBRE, SEXO,
          DOCUMENTO, FECHA_NACIMIENTO, EDAD
        FROM dbo.PACIENTE
        WHERE DOCUMENTO LIKE '%${documento}%'
        ORDER BY NOMBRES ASC
      `;
      
      const pacientes = await prisma.$queryRawUnsafe(query);
      
      console.log(`Encontrados ${Array.isArray(pacientes) ? pacientes.length : 0} pacientes por documento`);
      return serializeBigInt(Array.isArray(pacientes) ? pacientes : []);
    } catch (error) {
      console.error(`Error en searchByDocumento(${documento}):`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Buscar pacientes por nombre o apellidos
   */
  async searchByName(name: string) {
    try {
      console.log(`Buscando pacientes por nombre: ${name}`);
      
      // Usar SQL nativo para evitar problemas con OFFSET/FETCH
      const query = `
        SELECT TOP 100
          PACIENTE, HISTORIA, NOMBRES, PATERNO, MATERNO, NOMBRE, SEXO,
          DOCUMENTO, FECHA_NACIMIENTO, EDAD
        FROM dbo.PACIENTE
        WHERE NOMBRES LIKE '%${name}%' OR PATERNO LIKE '%${name}%' OR MATERNO LIKE '%${name}%' OR NOMBRE LIKE '%${name}%'
        ORDER BY NOMBRES ASC
      `;
      
      const pacientes = await prisma.$queryRawUnsafe(query);
      
      console.log(`Encontrados ${Array.isArray(pacientes) ? pacientes.length : 0} pacientes por nombre`);
      return serializeBigInt(Array.isArray(pacientes) ? pacientes : []);
    } catch (error) {
      console.error(`Error en searchByName(${name}):`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Contar pacientes con filtros opcionales
   */
  async countPacientes(filter: PacienteFilter = {}) {
    try {
      console.log('Contando pacientes con filtros:', filter);
      
      // Construir la condición WHERE para el SQL nativo
      let whereClause = '1=1';
      
      if (filter.historia) {
        whereClause += ` AND HISTORIA LIKE '%${filter.historia}%'`;
      }
      
      if (filter.documento) {
        whereClause += ` AND DOCUMENTO LIKE '%${filter.documento}%'`;
      }
      
      if (filter.nombres) {
        whereClause += ` AND (NOMBRES LIKE '%${filter.nombres}%' OR PATERNO LIKE '%${filter.nombres}%' OR MATERNO LIKE '%${filter.nombres}%' OR NOMBRE LIKE '%${filter.nombres}%')`;
      }
      
      // Consulta SQL para contar registros
      const query = `
        SELECT COUNT(*) as total
        FROM dbo.PACIENTE
        WHERE ${whereClause}
      `;
      
      // Ejecutar la consulta nativa
      const result = await prisma.$queryRawUnsafe(query);
      const total = Array.isArray(result) && result.length > 0 ? Number(result[0].total) : 0;
      
      console.log(`Total de pacientes: ${total}`);
      
      return serializeBigInt({
        success: true,
        data: {
          total
        }
      });
    } catch (error) {
      console.error('Error en countPacientes:', error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al contar pacientes'
      };
    }
  },
};
