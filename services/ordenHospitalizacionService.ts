import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils';

export interface OrdenHospitalizacionFilter {
  pacienteId?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface CountResponse {
  success: boolean;
  data?: {
    total: number;
  };
  message?: string;
}

export interface OrdenHospitalizacion {
  ESTADO: string;
  idHOSPITALIZACION: string;
  PACIENTE: string;
  Historia: string;
  CONSULNOMBRE: string;
  FECHA1: Date;
  HORA1: string;
  ORIGENOMBRE: string;
  SEGURONOMBRE: string;
  MEDICONOMBRE: string;
  // Campos adicionales para debugging
  [key: string]: any;
}

export const ordenHospitalizacionService = {
  /**
   * Get paginated orden hospitalización records with optional filtering using raw SQL
   */
  async getPaginatedOrdenHospitalizacion(
    filter: OrdenHospitalizacionFilter = {},
    { page = 1, pageSize = 10 }: PaginationOptions
  ) {
    try {
      const skip = (page - 1) * pageSize;
      console.log('Buscando registros de orden hospitalización con parámetros:', { skip, take: pageSize, filter });
      
      // Verificar primero si la vista existe
      try {
        const checkView = await prisma.$queryRaw`SELECT TOP 1 * FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME = 'V_HOSPITALIZA'`;
        console.log('Verificación de vista V_HOSPITALIZA:', checkView);
      } catch (checkError) {
        console.error('Error al verificar la vista V_HOSPITALIZA:', checkError);
      }
      
      // Construir la cláusula WHERE basada en los filtros proporcionados
      let whereClause = '';
      
      if (filter.pacienteId) {
        whereClause = `WHERE Paciente='${filter.pacienteId}'`;
      }
      
      // Consulta para obtener el total de registros
      const countQuery = `SELECT COUNT(*) as total FROM V_HOSPITALIZA ${whereClause}`;
      console.log('Consulta de conteo:', countQuery);
      
      const countResult = await prisma.$queryRawUnsafe(countQuery);
      const total = Number(countResult[0]?.total || 0);
      
      // Consulta para obtener los datos paginados usando una técnica compatible con SQL Server 2008
      const dataQuery = `
        WITH NumberedData AS (
          SELECT *, ROW_NUMBER() OVER (ORDER BY idHOSPITALIZACION DESC) AS RowNum
          FROM V_HOSPITALIZA
          ${whereClause}  
        )
        SELECT * FROM NumberedData
        WHERE RowNum > ${skip} AND RowNum <= ${skip + pageSize}
      `;
      console.log('Consulta de datos:', dataQuery);
      
      const data = await prisma.$queryRawUnsafe(dataQuery);
      
      // Depuración de fechas
      console.log('Ejemplo de registro:', data[0] ? {
        ESTADO: data[0].ESTADO,
        idHOSPITALIZACION: data[0].idHOSPITALIZACION,
        PACIENTE: data[0].PACIENTE,
        Historia: data[0].Historia,
        FECHA1: data[0].FECHA1,
        FECHA1_TIPO: typeof data[0].FECHA1,
        FECHA1_JSON: JSON.stringify(data[0].FECHA1)
      } : 'No hay datos');
      
      console.log(`Encontrados ${data.length} registros de orden hospitalización de un total de ${total}`);
      
      // Convertir fechas a formato string ISO para mejor manejo en el frontend
      const processedData = data.map((record: any) => {
        if (record.FECHA1) {
          try {
            // Intentar convertir la fecha a un formato estándar
            const fecha = new Date(record.FECHA1);
            if (!isNaN(fecha.getTime())) {
              // Convertir a formato YYYY-MM-DD para que el frontend pueda procesarlo correctamente
              record.FECHA1 = fecha.toISOString().split('T')[0];
            } else {
              // Si no se puede convertir, asegurarse de que sea un string
              record.FECHA1 = String(record.FECHA1);
            }
          } catch (error) {
            console.error('Error al procesar fecha:', error);
            // En caso de error, mantener el valor original como string
            record.FECHA1 = String(record.FECHA1);
          }
        }
        return record;
      });
      
      // Formato esperado por el hook
      return serializeBigInt({
        data: processedData,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error('Error en getPaginatedOrdenHospitalizacion:', error instanceof Error ? error.message : 'Error desconocido', error);
      throw error;
    }
  },
  
  /**
   * Get a single orden hospitalización record by ID using raw SQL
   */
  async getOrdenHospitalizacionById(id: string) {
    try {
      console.log(`Buscando registro de orden hospitalización con ID: ${id}`);
      
      // Usar CONVERT para formatear las fechas en SQL Server 2008 R2
      const query = `
        SELECT 
          *,
          CONVERT(VARCHAR(10), FECHA_NACIMIENTO, 103) AS FECHA_NACIMIENTO_STR,
          CONVERT(VARCHAR(10), FECHA1, 103) AS FECHA1_STR
        FROM V_HOSPITALIZA 
        WHERE idHOSPITALIZACION = '${id}'
      `;
      
      const result = await prisma.$queryRawUnsafe(query);
      
      if (Array.isArray(result) && result.length > 0) {
        console.log(`Registro de orden hospitalización encontrado con ID ${id}`);
        
        // Procesar el resultado para manejar fechas
        const processedResult = result[0];
        
        // Reemplazar objetos de fecha vacíos con los valores formateados
        if (processedResult.FECHA_NACIMIENTO && typeof processedResult.FECHA_NACIMIENTO === 'object' && 
            Object.keys(processedResult.FECHA_NACIMIENTO).length === 0) {
          processedResult.FECHA_NACIMIENTO = processedResult.FECHA_NACIMIENTO_STR || null;
        }
        
        if (processedResult.FECHA1 && typeof processedResult.FECHA1 === 'object' && 
            Object.keys(processedResult.FECHA1).length === 0) {
          processedResult.FECHA1 = processedResult.FECHA1_STR || null;
        }
        
        // Eliminar campos auxiliares
        delete processedResult.FECHA_NACIMIENTO_STR;
        delete processedResult.FECHA1_STR;
        
        return serializeBigInt(processedResult);
      }
      
      console.log(`No se encontró registro de orden hospitalización con ID ${id}`);
      return null;
    } catch (error) {
      console.error(`Error en getOrdenHospitalizacionById(${id}):`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Get all orden hospitalización records for a patient
   */
  async getOrdenHospitalizacionByPaciente(pacienteId: string) {
    try {
      console.log(`Buscando registros de orden hospitalización para paciente: ${pacienteId}`);
      
      // Consulta compatible con SQL Server 2008
      const query = `
        SELECT ESTADO, idHOSPITALIZACION, PACIENTE, Historia, CONSULNOMBRE, FECHA1, HORA1, ORIGENOMBRE, SEGURONOMBRE, MEDICONOMBRE 
        FROM V_HOSPITALIZA 
        WHERE Paciente='${pacienteId}' 
        ORDER BY idHOSPITALIZACION DESC
      `;
      
      const result = await prisma.$queryRawUnsafe(query);
      console.log(`Encontrados ${result.length} registros de orden hospitalización para el paciente`);
      
      // Procesar fechas
      const processedData = result.map((record: any) => {
        if (record.FECHA1) {
          try {
            const fecha = new Date(record.FECHA1);
            if (!isNaN(fecha.getTime())) {
              record.FECHA1 = fecha.toISOString().split('T')[0];
            } else {
              record.FECHA1 = String(record.FECHA1);
            }
          } catch (error) {
            console.error('Error al procesar fecha:', error);
            record.FECHA1 = String(record.FECHA1);
          }
        }
        return record;
      });
      
      return serializeBigInt(processedData);
    } catch (error) {
      console.error(`Error en getOrdenHospitalizacionByPaciente(${pacienteId}):`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Count orden hospitalización records with optional filtering using raw SQL
   */
  async countOrdenHospitalizacion(filter: OrdenHospitalizacionFilter = {}): Promise<CountResponse> {
    try {
      console.log('Contando registros de orden hospitalización con filtros:', filter);
      
      // Construir la cláusula WHERE basada en los filtros proporcionados
      let whereClause = '';
      
      if (filter.pacienteId) {
        whereClause = `WHERE Paciente='${filter.pacienteId}'`;
      }
      
      // Consulta para obtener el total de registros
      const countQuery = `SELECT COUNT(*) as total FROM V_HOSPITALIZA ${whereClause}`;
      console.log('Consulta de conteo:', countQuery);
      
      const result = await prisma.$queryRawUnsafe(countQuery);
      const total = Number(result[0]?.total || 0);
      
      console.log(`Total de registros de orden hospitalización: ${total}`);
      
      return serializeBigInt({
        success: true,
        data: {
          total
        }
      });
    } catch (error) {
      console.error('Error en countOrdenHospitalizacion:', error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al contar registros de orden hospitalización'
      };
    }
  },

  /**
   * Create a new orden hospitalización record
   */
  async createOrdenHospitalizacion(data: any) {
    try {
      console.log('Creando nuevo registro de orden hospitalización:', data);
      
      // Formatear la fecha y hora para SQL Server
      const fechaFormateada = data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const horaFormateada = data.time || new Date().toTimeString().split(' ')[0];
      
      // Consulta SQL para insertar un nuevo registro
      const query = `
        INSERT INTO HOSPITALIZA (
          PACIENTE, 
          FECHA1, 
          HORA1, 
          ORIGEN, 
          SEGURO, 
          MEDICO, 
          DIAGNOSTICO, 
          FINANCIAMIENTO, 
          ESTADO
        ) VALUES (
          '${data.pacienteId}', 
          '${fechaFormateada}', 
          '${horaFormateada}', 
          '${data.hospitalizationOrigin || ''}', 
          '${data.insurance || ''}', 
          '${data.authorizingDoctor || ''}', 
          '${data.diagnosis || ''}', 
          '${data.financing || ''}', 
          'A'
        );
        
        SELECT SCOPE_IDENTITY() AS id;
      `;
      
      const result = await prisma.$queryRawUnsafe(query);
      const id = result[0]?.id || null;
      
      console.log(`Registro de orden hospitalización creado con ID: ${id}`);
      
      return serializeBigInt({
        success: true,
        data: { id, ...data },
        message: 'Orden de hospitalización creada exitosamente'
      });
    } catch (error) {
      console.error('Error en createOrdenHospitalizacion:', error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Update an existing orden hospitalización record
   */
  async updateOrdenHospitalizacion(id: string, data: any) {
    try {
      console.log(`Actualizando registro de orden hospitalización con ID ${id}:`, data);
      
      // Formatear la fecha y hora para SQL Server
      const fechaFormateada = data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const horaFormateada = data.time || new Date().toTimeString().split(' ')[0];
      
      // Consulta SQL para actualizar un registro existente
      const query = `
        UPDATE HOSPITALIZA SET 
          FECHA1 = '${fechaFormateada}', 
          HORA1 = '${horaFormateada}', 
          ORIGEN = '${data.hospitalizationOrigin || ''}', 
          SEGURO = '${data.insurance || ''}', 
          MEDICO = '${data.authorizingDoctor || ''}', 
          DIAGNOSTICO = '${data.diagnosis || ''}', 
          FINANCIAMIENTO = '${data.financing || ''}'
        WHERE idHOSPITALIZACION = ${id};
      `;
      
      await prisma.$queryRawUnsafe(query);
      
      console.log(`Registro de orden hospitalización con ID ${id} actualizado exitosamente`);
      
      return serializeBigInt({
        success: true,
        data: { id, ...data },
        message: 'Orden de hospitalización actualizada exitosamente'
      });
    } catch (error) {
      console.error(`Error en updateOrdenHospitalizacion(${id}):`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
};
