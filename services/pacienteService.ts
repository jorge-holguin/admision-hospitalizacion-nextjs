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
      const skip = (page - 1) * pageSize;
      console.log('Buscando pacientes con parámetros:', { skip, take: pageSize, filter });
      
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
      
      // Obtener los datos paginados
      const data = await prisma.pACIENTE.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { NOMBRES: 'asc' },
        select: {
          PACIENTE: true,
          HISTORIA: true,
          NOMBRES: true,
          PATERNO: true,
          MATERNO: true,
          NOMBRE: true,
          SEXO: true,
          FECHA_NACIMIENTO: true,
          EDAD: true,
          DOCUMENTO: true,
          TIPO_DOCUMENTO: true,
          DIRECCION: true,
          TELEFONO1: true,
          ESTADO_CIVIL: true,
          FECHA_APERTURA: true,
          HORA_APERTURA: true,
          PADRE: true,
          MADRE: true,
          DISTRITO: true,
          LUGAR_NACIMIENTO: true,
          OCUPACION: true,
          GRADO_INSTRUCCION: true,
          CONYUGE_NOMBRE: true,
          SEGURO: true,
          ENTIDAD: true,
          ANIO: true,
          HIJOS: true,
          CONYUGE_OCUPACION: true,
          CONSULTORIO: true,
          SYSINSERT: true,
          SYSUPDATE: true,
          FECHA_CONSULTA: true,
          TURNO_CONSULTA: true,
          FLAG: true,
          RELIGION: true,
          USUARIO_IMP: true,
          HISTORIA_ANT: true,
          STRING_FOTO: true,
        }
      });
      
      console.log(`Encontrados ${data.length} pacientes de un total de ${total}`);
      
      return serializeBigInt({
        data,
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
      
      const paciente = await prisma.pACIENTE.findUnique({
        where: { PACIENTE: id },
        select: {
          PACIENTE: true,
          HISTORIA: true,
          NOMBRES: true,
          PATERNO: true,
          MATERNO: true,
          NOMBRE: true,
          SEXO: true,
          FECHA_NACIMIENTO: true,
          EDAD: true,
          DOCUMENTO: true,
          TIPO_DOCUMENTO: true,
          DIRECCION: true,
          TELEFONO1: true,
          ESTADO_CIVIL: true,
          FECHA_APERTURA: true,
          HORA_APERTURA: true,
          PADRE: true,
          MADRE: true,
          DISTRITO: true,
          LUGAR_NACIMIENTO: true,
          OCUPACION: true,
          GRADO_INSTRUCCION: true,
          CONYUGE_NOMBRE: true,
          SEGURO: true,
          ENTIDAD: true,
          ANIO: true,
          HIJOS: true,
          CONYUGE_OCUPACION: true,
          CONSULTORIO: true,
          SYSINSERT: true,
          SYSUPDATE: true,
          FECHA_CONSULTA: true,
          TURNO_CONSULTA: true,
          FLAG: true,
          RELIGION: true,
          USUARIO_IMP: true,
          HISTORIA_ANT: true,
          STRING_FOTO: true,
        }
      });
      
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
      
      const pacientes = await prisma.pACIENTE.findMany({
        where: {
          HISTORIA: {
            contains: historia,
          },
        },
        take: 10,
        orderBy: { NOMBRES: 'asc' },
        select: {
          PACIENTE: true,
          HISTORIA: true,
          NOMBRES: true,
          PATERNO: true,
          MATERNO: true,
          NOMBRE: true,
          SEXO: true,
          DOCUMENTO: true,
          FECHA_NACIMIENTO: true,
          EDAD: true,
        }
      });
      
      console.log(`Encontrados ${pacientes.length} pacientes por historia`);
      return serializeBigInt(pacientes);
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
      
      const pacientes = await prisma.pACIENTE.findMany({
        where: {
          DOCUMENTO: {
            contains: documento,
          },
        },
        take: 10,
        orderBy: { NOMBRES: 'asc' },
        select: {
          PACIENTE: true,
          HISTORIA: true,
          NOMBRES: true,
          PATERNO: true,
          MATERNO: true,
          NOMBRE: true,
          SEXO: true,
          DOCUMENTO: true,
          FECHA_NACIMIENTO: true,
          EDAD: true,
        }
      });
      
      console.log(`Encontrados ${pacientes.length} pacientes por documento`);
      return serializeBigInt(pacientes);
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
      
      const pacientes = await prisma.pACIENTE.findMany({
        where: {
          OR: [
            { NOMBRES: { contains: name } },
            { PATERNO: { contains: name } },
            { MATERNO: { contains: name } },
            { NOMBRE: { contains: name } },
          ],
        },
        take: 100,
        orderBy: { NOMBRES: 'asc' },
        select: {
          PACIENTE: true,
          HISTORIA: true,
          NOMBRES: true,
          PATERNO: true,
          MATERNO: true,
          NOMBRE: true,
          SEXO: true,
          DOCUMENTO: true,
          FECHA_NACIMIENTO: true,
          EDAD: true,
        }
      });
      
      console.log(`Encontrados ${pacientes.length} pacientes por nombre`);
      return serializeBigInt(pacientes);
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
