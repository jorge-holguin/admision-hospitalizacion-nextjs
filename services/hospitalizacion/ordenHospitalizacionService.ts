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
   * Check if a patient has editable hospitalization orders (ESTADO = '1' or ESTADO = '2')
   */
  async checkEditableStatus(pacienteId: string) {
    try {
      console.log(`Verificando estado editable para paciente: ${pacienteId}`);
      
      // Primero verificar si la vista existe
      try {
        const viewCheck = await prisma.$queryRawUnsafe(`
          SELECT TOP 1 * FROM INFORMATION_SCHEMA.VIEWS 
          WHERE TABLE_NAME = 'V_HOSPITALIZA'
        `);
        
        const viewExists = Array.isArray(viewCheck) && viewCheck.length > 0;
        console.log(`Vista V_HOSPITALIZA existe: ${viewExists}`);
        
        if (!viewExists) {
          console.log('Usando tabla HOSPITALIZA en lugar de vista V_HOSPITALIZA');
          // Si la vista no existe, intentar con la tabla directamente
          const result = await prisma.$queryRawUnsafe(`
            SELECT TOP 1 * FROM HOSPITALIZA
            WHERE PACIENTE = '${pacienteId}' AND (ESTADO = '1' OR ESTADO = '2')
          `);
          
          const isEditable = Array.isArray(result) && result.length > 0;
          console.log(`Estado editable (usando tabla) para paciente ${pacienteId}: ${isEditable}`);
          console.log('Resultado de la consulta:', JSON.stringify(result));
          return { isEditable, source: 'table' };
        }
      } catch (viewError) {
        console.error('Error al verificar si la vista existe:', viewError);
        // Continuar con la consulta original si hay un error al verificar la vista
      }
      
      // Verificar si existe un registro con ESTADO = '1' o ESTADO = '2' para este paciente
      const query = `
        SELECT TOP 1 * FROM V_HOSPITALIZA
        WHERE PACIENTE = '${pacienteId}' AND (ESTADO = '1' OR ESTADO = '2')
      `;
      
      console.log('Ejecutando consulta:', query);
      const result = await prisma.$queryRawUnsafe(query);
      console.log('Resultado de la consulta:', JSON.stringify(result));
      
      // Si hay resultados, significa que hay órdenes editables
      const isEditable = Array.isArray(result) && result.length > 0;
      
      console.log(`Estado editable para paciente ${pacienteId}: ${isEditable}`);
      return { isEditable, source: 'view' };
    } catch (error) {
      console.error('Error al verificar estado editable:', error);
      return { isEditable: false, error: String(error), source: 'error' };
    }
  },
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
      
      // Convertir fechas a formato string ISO y asegurar que idHOSPITALIZACION esté presente
      const processedData = data.map((record: any) => {
        // Asegurarse de que idHOSPITALIZACION esté presente y sea un string
        if (record.idHOSPITALIZACION === undefined && record.IDHOSPITALIZACION !== undefined) {
          console.log('Corrigiendo campo idHOSPITALIZACION usando IDHOSPITALIZACION');
          record.idHOSPITALIZACION = String(record.IDHOSPITALIZACION);
        } else if (record.idHOSPITALIZACION === undefined && record.ID_HOSPITALIZACION !== undefined) {
          console.log('Corrigiendo campo idHOSPITALIZACION usando ID_HOSPITALIZACION');
          record.idHOSPITALIZACION = String(record.ID_HOSPITALIZACION);
        }
        
        // Procesar la fecha
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
        
        // Registrar para depuración
        console.log('Registro procesado:', {
          idHOSPITALIZACION: record.idHOSPITALIZACION,
          IDHOSPITALIZACION: record.IDHOSPITALIZACION,
          ID_HOSPITALIZACION: record.ID_HOSPITALIZACION
        });
        
        return record;
      });
      
      // Si estamos filtrando por pacienteId, devolvemos los datos en un formato compatible con el endpoint anterior
      if (filter.pacienteId) {
        console.log(`Devolviendo datos en formato compatible para pacienteId ${filter.pacienteId}`);
        return serializeBigInt({
          success: true,
          data: processedData,
          pagination: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
          },
        });
      } else {
        // Formato estándar para otros casos
        return serializeBigInt({
          success: true,
          data: {
            records: processedData,
            pagination: {
              total,
              page,
              pageSize,
              totalPages: Math.ceil(total / pageSize),
            },
          },
        });
      }
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
      // Validar que el ID sea válido
      if (!id || id === 'undefined' || id.trim() === '') {
        console.error(`ID de orden hospitalización inválido: "${id}"`);
        return null;
      }
      
      console.log(`Buscando registro de orden hospitalización con ID: "${id}"`);
      
      // Usar CONVERT para formatear las fechas en SQL Server 2008 R2
      // Incluir los campos de acompañante y ORIGENID en la consulta
      const idTrimmed = id.trim();
      console.log(`ID después de trim: "${idTrimmed}" (longitud: ${idTrimmed.length})`);
      
      const query = `
        SELECT 
          V.*,
          CONVERT(VARCHAR(10), V.FECHA_NACIMIENTO, 103) AS FECHA_NACIMIENTO_STR,
          CONVERT(VARCHAR(10), V.FECHA1, 103) AS FECHA1_STR,
          H.ACOMPANANTE_NOMBRE,
          H.ACOMPANANTE_DIRECCION,
          H.ACOMPANANTE_TELEFONO,
          H.ORIGENID,
          (SELECT TOP 1 Nombre FROM CIEXHIS_V2 WHERE Codigo = V.DIAGNOSTICO) AS DIAGNOSTICONOMBRE
        FROM V_HOSPITALIZA V
        LEFT JOIN HOSPITALIZA H ON V.idHOSPITALIZACION = H.IDHOSPITALIZACION
        WHERE V.idHOSPITALIZACION = '${idTrimmed}'
      `;
      
      console.log('Ejecutando consulta:', query);
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
      console.log('Campos recibidos:', Object.keys(data));
      
      // Construir solo los campos que tienen valor (no null)
      const campos: string[] = [];
      const valores: string[] = [];
      
      // Campos obligatorios
      if (data.IDHOSPITALIZACION) {
        campos.push('IDHOSPITALIZACION');
        valores.push(`'${data.IDHOSPITALIZACION}'`);
      }
      if (data.PACIENTE) {
        campos.push('PACIENTE');
        valores.push(`'${data.PACIENTE}'`);
      }
      if (data.NOMBRES) {
        campos.push('NOMBRES');
        valores.push(`'${data.NOMBRES.replace(/'/g, "''")}'`); // Escapar comillas simples
      }
      if (data.CONSULTORIO1) {
        campos.push('CONSULTORIO1');
        valores.push(`'${data.CONSULTORIO1}'`);
      }
      if (data.HORA1) {
        campos.push('HORA1');
        valores.push(`'${data.HORA1}'`);
      }
      if (data.FECHA1) {
        campos.push('FECHA1');
        valores.push(`'${data.FECHA1}'`);
      }
      if (data.ORIGEN) {
        campos.push('ORIGEN');
        valores.push(`'${data.ORIGEN}'`);
      }
      if (data.SEGURO) {
        campos.push('SEGURO');
        valores.push(`'${data.SEGURO}'`);
      }
      if (data.MEDICO1) {
        campos.push('MEDICO1');
        valores.push(`'${String(data.MEDICO1).trim()}'`);
      }
      if (data.ESTADO) {
        campos.push('ESTADO');
        valores.push(`'${data.ESTADO}'`);
      }
      if (data.USUARIO) {
        campos.push('USUARIO');
        valores.push(`'${data.USUARIO}'`);
      }
      if (data.DIAGNOSTICO) {
        campos.push('DIAGNOSTICO');
        valores.push(`'${String(data.DIAGNOSTICO).trim()}'`);
      }
      if (data.EDAD) {
        campos.push('EDAD');
        valores.push(`'${String(data.EDAD).trim()}'`);
      }
      if (data.ORIGENID !== undefined) { // Puede ser string vacío
        campos.push('ORIGENID');
        valores.push(`'${data.ORIGENID}'`);
      }
      if (data.USUARIO_IMP) {
        campos.push('USUARIO_IMP');
        valores.push(`'${data.USUARIO_IMP}'`);
      }
      
      // Campos opcionales del acompañante
      if (data.ACOMPANANTE_NOMBRE) {
        campos.push('ACOMPANANTE_NOMBRE');
        valores.push(`'${data.ACOMPANANTE_NOMBRE.replace(/'/g, "''")}'`);
      }
      if (data.ACOMPANANTE_TELEFONO) {
        campos.push('ACOMPANANTE_TELEFONO');
        valores.push(`'${data.ACOMPANANTE_TELEFONO}'`);
      }
      if (data.ACOMPANANTE_DIRECCION) {
        campos.push('ACOMPANANTE_DIRECCION');
        // Limitar ACOMPANANTE_DIRECCION a 60 caracteres para evitar problemas con la vista de BD
        const direccionTruncada = data.ACOMPANANTE_DIRECCION.slice(0, 60).replace(/'/g, "''");
        valores.push(`'${direccionTruncada}'`);
      }
      
      console.log(`Insertando ${campos.length} campos:`, campos);
      
      // Construir la consulta SQL dinámica
      const query = `
        INSERT INTO HOSPITALIZA (${campos.join(', ')})
        VALUES (${valores.join(', ')});
        
        SELECT SCOPE_IDENTITY() AS id;
      `;
      
      console.log('Query SQL a ejecutar:', query);
      
      const result = await prisma.$queryRawUnsafe(query);
      const id = result[0]?.id || data.IDHOSPITALIZACION;
      
      console.log(`✅ Registro de orden hospitalización creado con ID: ${id}`);
      
      return serializeBigInt({
        success: true,
        data: { id, IDHOSPITALIZACION: data.IDHOSPITALIZACION },
        message: 'Orden de hospitalización creada exitosamente'
      });
    } catch (error) {
      console.error('❌ Error en createOrdenHospitalizacion:', error instanceof Error ? error.message : 'Error desconocido');
      console.error('Stack trace:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing orden hospitalización record
   */
  async updateOrdenHospitalizacion(id: string, data: any) {
    try {
      console.log(`Actualizando registro de orden hospitalización con ID ${id}:`, data);
      console.log('Campos recibidos para actualización:', Object.keys(data));
      
      // Construir solo los campos que tienen valor y deben actualizarse
      const updates: string[] = [];
      
      // Campos actualizables
      if (data.NOMBRES) {
        updates.push(`NOMBRES = '${data.NOMBRES.replace(/'/g, "''")}'`);
      }
      if (data.CONSULTORIO1) {
        updates.push(`CONSULTORIO1 = '${data.CONSULTORIO1}'`);
      }
      if (data.HORA1) {
        updates.push(`HORA1 = '${data.HORA1}'`);
      }
      if (data.FECHA1) {
        updates.push(`FECHA1 = '${data.FECHA1}'`);
      }
      if (data.ORIGEN) {
        updates.push(`ORIGEN = '${data.ORIGEN}'`);
      }
      if (data.SEGURO) {
        updates.push(`SEGURO = '${data.SEGURO}'`);
      }
      if (data.MEDICO1) {
        updates.push(`MEDICO1 = '${data.MEDICO1}'`);
      }
      if (data.DIAGNOSTICO) {
        updates.push(`DIAGNOSTICO = '${data.DIAGNOSTICO}'`);
      }
      if (data.EDAD) {
        updates.push(`EDAD = '${data.EDAD}'`);
      }
      if (data.ORIGENID !== undefined) {
        updates.push(`ORIGENID = '${data.ORIGENID}'`);
      }
      if (data.ACOMPANANTE_NOMBRE) {
        updates.push(`ACOMPANANTE_NOMBRE = '${data.ACOMPANANTE_NOMBRE.replace(/'/g, "''")}'`);
      }
      if (data.ACOMPANANTE_TELEFONO) {
        updates.push(`ACOMPANANTE_TELEFONO = '${data.ACOMPANANTE_TELEFONO}'`);
      }
      if (data.ACOMPANANTE_DIRECCION) {
        // Limitar ACOMPANANTE_DIRECCION a 60 caracteres para evitar problemas con la vista de BD
        const direccionTruncada = data.ACOMPANANTE_DIRECCION.slice(0, 60).replace(/'/g, "''");
        updates.push(`ACOMPANANTE_DIRECCION = '${direccionTruncada}'`);
      }
      
      if (updates.length === 0) {
        console.warn('⚠️ No hay campos para actualizar');
        return serializeBigInt({
          success: true,
          data: { id },
          message: 'No hay cambios para actualizar'
        });
      }
      
      console.log(`Actualizando ${updates.length} campos:`, updates);
      
      // Construir la consulta SQL dinámica
      const query = `
        UPDATE HOSPITALIZA 
        SET ${updates.join(', ')}
        WHERE IDHOSPITALIZACION = '${id}';
      `;
      
      console.log('Query SQL a ejecutar:', query);
      
      await prisma.$queryRawUnsafe(query);
      
      console.log(`✅ Registro de orden hospitalización con ID ${id} actualizado exitosamente`);
      
      return serializeBigInt({
        success: true,
        data: { id, IDHOSPITALIZACION: id },
        message: 'Orden de hospitalización actualizada exitosamente'
      });
    } catch (error) {
      console.error(`❌ Error en updateOrdenHospitalizacion(${id}):`, error instanceof Error ? error.message : 'Error desconocido');
      console.error('Stack trace:', error);
      throw error;
    }
  },

  /**
   * Get the next available hospitalization ID
   */
  async getNextId(): Promise<string> {
    try {
      console.log('🏥 Obteniendo siguiente ID de hospitalización');
      
      // Buscar el último registro ordenado por IDHOSPITALIZACION de forma descendente
      const result = await prisma.$queryRawUnsafe<Array<{ IDHOSPITALIZACION: string }>>(` 
        SELECT TOP 1 IDHOSPITALIZACION 
        FROM HOSPITALIZA 
        ORDER BY LEN(IDHOSPITALIZACION) DESC, IDHOSPITALIZACION DESC
      `);
      
      if (!result || result.length === 0) {
        console.log('No se encontraron registros de hospitalización, usando ID base');
        return '25000001';
      }
      
      // Obtener el último ID
      const lastId = result[0].IDHOSPITALIZACION.trim();
      console.log('Último ID de hospitalización encontrado:', lastId);
      
      // Asegurarse de que es un número y luego incrementarlo
      const lastIdNumber = parseInt(lastId, 10);
      if (isNaN(lastIdNumber)) {
        console.log('El ID no es un número válido, usando ID base');
        return '25000001';
      }
      
      const nextId = (lastIdNumber + 1).toString();
      console.log('Siguiente ID de hospitalización generado:', nextId);
      
      return nextId;
    } catch (error) {
      console.error('Error al obtener el siguiente ID de hospitalización:', error);
      // Devolver un ID por defecto en caso de error
      return '25000001';
    }
  },

  /**
   * Delete a hospitalization order by ID (logical deletion - set ESTADO = '0')
   */
  async deleteById(id: string) {
    try {
      console.log(`🗑️ Eliminando (lógicamente) orden de hospitalización con ID: ${id}`);
      
      // Verificar que el ID existe
      const checkQuery = `
        SELECT IDHOSPITALIZACION, ESTADO 
        FROM HOSPITALIZA 
        WHERE IDHOSPITALIZACION = '${id.trim()}'
      `;
      
      const existing = await prisma.$queryRawUnsafe<Array<{ IDHOSPITALIZACION: string; ESTADO: string }>>(checkQuery);
      
      if (!existing || existing.length === 0) {
        throw new Error(`No se encontró orden de hospitalización con ID: ${id}`);
      }
      
      console.log(`Orden encontrada con ESTADO: ${existing[0].ESTADO}`);
      
      // Realizar eliminación lógica (ESTADO = '0')
      const deleteQuery = `
        UPDATE HOSPITALIZA 
        SET ESTADO = '0'
        WHERE IDHOSPITALIZACION = '${id.trim()}'
      `;
      
      await prisma.$queryRawUnsafe(deleteQuery);
      
      console.log(`✅ Orden de hospitalización ${id} eliminada lógicamente (ESTADO = '0')`);
      
      return serializeBigInt({
        success: true,
        message: 'Orden de hospitalización eliminada exitosamente',
        data: { id }
      });
    } catch (error) {
      console.error(`❌ Error al eliminar orden de hospitalización ${id}:`, error);
      throw error;
    }
  },
};
