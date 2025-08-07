import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils';

const API_BACKEND_URL = process.env.NEXT_PUBLIC_API_BACKEND_URL;

export interface FiliacionFilter {
  historia?: string;
  documento?: string;
  nombres?: string;
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

export interface Filiacion {
  PACIENTE: string;
  HISTORIA: string;
  NOMBRES: string;
  SEXO: string;
  NOMBRE_ESTADO_CIVIL: string;
  FECHA_APERTURA: Date;
  HORA_APERTURA: string;
  PADRE: string;
  MADRE: string;
  DIRECCION: string;
  TELEFONO1: string;
  FECHA_NACIMIENTO: Date;
  DISTRITO: string;
  NOMBRE_DOCUMENTO: string;
  DOCUMENTO: string;
  NOMBRE_OCUPACION: string;
  NOMBRE_GRADO_INSTRUCCION: string;
  NOMBRE_CONYUGE: string;
  NOMBRE_SEGURO: string;
  NOMBRE_ENTIDAD: string;
  ANIO: string;
  PATERNO: string;
  MATERNO: string;
  NOMBRE: string;
  LUGAR_NACIMIENTO: string;
  HIJOS: number;
  CONYUGE_OCUPACION: string;
  CONSULTORIO: string;
  CONSUL: string;
  EDAD: number;
  ESTADO_CIVIL: string;
  SYSINSERT: Date;
  SYSUPDATE: Date;
  FECHA_CONSULTA: Date;
  TURNO_CONSULTA: string;
  Nombre_Localidad: string;
  Provincia_Nac: string;
  Departamento_Nac: string;
  Distrito_Dir: string;
  Provincia_Dir: string;
  Departamento_Dir: string;
  USUARIO: string;
  FLAG: string;
  RELIGION: string;
  DESRELIGION: string;
  USUARIO_IMP: string;
  HISTORIA_ANT: string;
  CODIGOBARRAS: string;
  STRING_FOTO: string;
  // Campos adicionales para debugging
  [key: string]: any;
}

export const filiacionService = {
  /**
   * Get paginated filiacion records with optional filtering using raw SQL
   */
  async getPaginatedFiliacion(
    filter: FiliacionFilter = {},
    { page = 1, pageSize = 10 }: PaginationOptions
  ) {
    try {
      const skip = (page - 1) * pageSize;
      console.log('Buscando registros de filiación con parámetros:', { skip, take: pageSize, filter });
      
      // Si es una búsqueda por nombre, usar la API externa
      if (filter.nombres && filter.nombres.trim() !== '') {
        console.log('Usando API externa para búsqueda por nombre:', filter.nombres);
        try {
          // Llamar a la API externa para búsqueda por nombre
          const apiUrl = `${API_BACKEND_URL}/busqueda/paciente-por-nombre?nombres=${encodeURIComponent(filter.nombres)}`;
          console.log('Llamando a API externa:', apiUrl);
          
          const response = await fetch(apiUrl, { 
            // Aumentar el tiempo de espera para la respuesta
            signal: AbortSignal.timeout(10000) // 10 segundos de timeout
          });
          
          if (!response.ok) {
            console.error(`Error en la consulta externa: Status ${response.status}`);
            throw new Error(`Error en la consulta externa: ${response.status}`);
          }
          
          const apiData = await response.json();
          console.log(`API externa devolvió ${Array.isArray(apiData) ? apiData.length : 'no'} resultados`, apiData);
          
          // Verificar que apiData sea un array
          if (!Array.isArray(apiData)) {
            console.error('La API externa no devolvió un array:', apiData);
            // Si no es un array, devolver un array vacío para evitar errores
            return serializeBigInt({
              data: [],
              pagination: {
                total: 0,
                page,
                pageSize,
                totalPages: 0,
              },
            });
          }
          
          // Mapear los datos de la API al formato esperado por el frontend
          const processedData = apiData.map((item: any) => ({
            PACIENTE: item.paciente || '',
            HISTORIA: item.historia || '',
            NOMBRES: item.nombres || '',
            SEXO: item.sexo || '',
            DIRECCION: item.direccion || '',
            FECHA_NACIMIENTO: item.fechaNacimiento || '',
            DISTRITO: item.distrito || '',
            NOMBRE_DOCUMENTO: item.nombreDocumento || '',
            DOCUMENTO: item.documento || '',
            NOMBRE_SEGURO: item.nombreSeguro || '',
            Nombre_Localidad: item.nombreLocalidad || '',
            Distrito_Dir: item.distritoDir || ''
          }));
          
          // Devolver los resultados en el formato esperado
          return serializeBigInt({
            data: processedData,
            pagination: {
              total: processedData.length,
              page,
              pageSize,
              totalPages: Math.ceil(processedData.length / pageSize),
            },
          });
        } catch (apiError) {
          console.error('Error al consultar API externa:', apiError);
          // En lugar de lanzar un error, devolver un resultado vacío
          return serializeBigInt({
            data: [],
            pagination: {
              total: 0,
              page,
              pageSize,
              totalPages: 0,
            },
          });
        }
      }
      
      // Para otros tipos de búsqueda, usar la consulta SQL original
      // Verificar primero si la vista existe
      try {
        const checkView = await prisma.$queryRaw`SELECT TOP 1 * FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME = 'V_FILIACION'`;
        console.log('Verificación de vista V_FILIACION:', checkView);
      } catch (checkError) {
        console.error('Error al verificar la vista V_FILIACION:', checkError);
      }
      
      // Construir la cláusula WHERE basada en los filtros proporcionados
      let whereClause = '';
      const conditions = [];
      
      if (filter.historia) {
        conditions.push(`HISTORIA LIKE '%${filter.historia}%'`);
      }
      
      if (filter.documento) {
        conditions.push(`DOCUMENTO LIKE '%${filter.documento}%'`);
      }
      
      // Nota: Ya no necesitamos esta condición para nombres, ya que se maneja arriba
      // pero la mantenemos por si acaso se llama sin el filtro de nombres
      if (filter.nombres) {
        conditions.push(`(NOMBRES LIKE '%${filter.nombres}%' OR PATERNO LIKE '%${filter.nombres}%' OR MATERNO LIKE '%${filter.nombres}%' OR NOMBRE LIKE '%${filter.nombres}%')`);
      }
      
      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }
      
      // Consulta para obtener el total de registros
      const countQuery = `SELECT COUNT(*) as total FROM V_FILIACION ${whereClause}`;
      console.log('Consulta de conteo:', countQuery);
      
      const countResult = await prisma.$queryRawUnsafe(countQuery);
      const total = Number(countResult[0]?.total || 0);
      
      // Consulta para obtener los datos paginados usando una técnica compatible con SQL Server 2008
      const dataQuery = `
        WITH NumberedData AS (
          SELECT *, ROW_NUMBER() OVER (ORDER BY NOMBRES ASC) AS RowNum
          FROM V_FILIACION
          ${whereClause}  
        )
        SELECT * FROM NumberedData
        WHERE RowNum > ${skip} AND RowNum <= ${skip + pageSize}
      `;
      console.log('Consulta de datos:', dataQuery);
      
      const data = await prisma.$queryRawUnsafe(dataQuery);
      
      // Depuración de fechas de nacimiento
      console.log('Ejemplo de registro con fecha:', data[0] ? {
        PACIENTE: data[0].PACIENTE,
        HISTORIA: data[0].HISTORIA,
        NOMBRES: data[0].NOMBRES,
        FECHA_NACIMIENTO: data[0].FECHA_NACIMIENTO,
        FECHA_NACIMIENTO_TIPO: typeof data[0].FECHA_NACIMIENTO,
        FECHA_NACIMIENTO_JSON: JSON.stringify(data[0].FECHA_NACIMIENTO)
      } : 'No hay datos');
      
      console.log(`Encontrados ${data.length} registros de filiación de un total de ${total}`);
      
      // Convertir fechas a formato string ISO para mejor manejo en el frontend
      const processedData = data.map((record: any) => {
        if (record.FECHA_NACIMIENTO) {
          try {
            // Intentar convertir la fecha a un formato estándar
            const fecha = new Date(record.FECHA_NACIMIENTO);
            if (!isNaN(fecha.getTime())) {
              // Convertir a formato YYYY-MM-DD para que el frontend pueda procesarlo correctamente
              record.FECHA_NACIMIENTO = fecha.toISOString().split('T')[0];
            } else {
              // Si no se puede convertir, asegurarse de que sea un string
              record.FECHA_NACIMIENTO = String(record.FECHA_NACIMIENTO);
            }
          } catch (error) {
            console.error('Error al procesar fecha:', error);
            // En caso de error, mantener el valor original como string
            record.FECHA_NACIMIENTO = String(record.FECHA_NACIMIENTO);
          }
        }
        return record;
      });
      
      // Formato esperado por useFiliacion hook
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
      console.error('Error en getPaginatedFiliacion:', error instanceof Error ? error.message : 'Error desconocido', error);
      throw error;
    }
  },
  
  /**
   * Get a single filiacion record by ID using raw SQL
   */
  async getFiliacionById(id: string) {
    try {
      console.log(`Buscando registro de filiación con ID: ${id}`);
      
      const query = `SELECT * FROM V_FILIACION WHERE PACIENTE = '${id}'`;
      const result = await prisma.$queryRawUnsafe(query);
      
      if (Array.isArray(result) && result.length > 0) {
        console.log(`Registro de filiación encontrado con ID ${id}`);
        
        // Procesar el registro para manejar correctamente las fechas
        const record = result[0];
        
        // Procesar FECHA_NACIMIENTO de la misma manera que en getPaginatedFiliacion
        if (record.FECHA_NACIMIENTO) {
          try {
            // Intentar convertir la fecha a un formato estándar
            const fecha = new Date(record.FECHA_NACIMIENTO);
            if (!isNaN(fecha.getTime())) {
              // Convertir a formato YYYY-MM-DD para que el frontend pueda procesarlo correctamente
              record.FECHA_NACIMIENTO = fecha.toISOString().split('T')[0];
              console.log(`FECHA_NACIMIENTO procesada: ${record.FECHA_NACIMIENTO}`);
            } else {
              // Si no se puede convertir, asegurarse de que sea un string
              record.FECHA_NACIMIENTO = String(record.FECHA_NACIMIENTO);
              console.log(`FECHA_NACIMIENTO no convertible: ${record.FECHA_NACIMIENTO}`);
            }
          } catch (error) {
            console.error('Error al procesar fecha:', error);
            // En caso de error, mantener el valor original como string
            record.FECHA_NACIMIENTO = String(record.FECHA_NACIMIENTO);
          }
        } else {
          console.log('FECHA_NACIMIENTO no está presente en el registro');
        }
        
        return serializeBigInt(record);
      }
      
      console.log(`No se encontró registro de filiación con ID ${id}`);
      return null;
    } catch (error) {
      console.error(`Error en getFiliacionById(${id}):`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Search filiacion records by historia clinica using raw SQL
   */
  async searchByHistoria(historia: string) {
    try {
      console.log(`Buscando registros de filiación por historia: ${historia}`);
      
      // Consulta compatible con SQL Server 2008
      const query = `
        SELECT TOP 10 * FROM V_FILIACION 
        WHERE HISTORIA LIKE '%${historia}%' 
        ORDER BY NOMBRES ASC
      `;
      
      const result = await prisma.$queryRawUnsafe(query);
      console.log(`Encontrados ${result.length} registros de filiación por historia`);
      
      return serializeBigInt(result);
    } catch (error) {
      console.error(`Error en searchByHistoria(${historia}):`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Search filiacion records by DNI/documento using raw SQL
   */
  async searchByDocumento(documento: string) {
    try {
      console.log(`Buscando registros de filiación por documento: ${documento}`);
      
      // Consulta compatible con SQL Server 2008
      const query = `
        SELECT TOP 10 * FROM V_FILIACION 
        WHERE DOCUMENTO LIKE '%${documento}%' 
        ORDER BY NOMBRES ASC
      `;
      
      const result = await prisma.$queryRawUnsafe(query);
      console.log(`Encontrados ${result.length} registros de filiación por documento`);
      
      return serializeBigInt(result);
    } catch (error) {
      console.error(`Error en searchByDocumento(${documento}):`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Search filiacion records by name or apellidos using raw SQL
   */
  async searchByName(name: string) {
    try {
      console.log(`Buscando registros de filiación por nombre: ${name}`);
      
      // Consulta compatible con SQL Server 2008
      const query = `
        SELECT TOP 100 * FROM V_FILIACION 
        WHERE NOMBRES LIKE '%${name}%' 
          OR PATERNO LIKE '%${name}%' 
          OR MATERNO LIKE '%${name}%' 
          OR NOMBRE LIKE '%${name}%' 
        ORDER BY NOMBRES ASC
      `;
      
      const result = await prisma.$queryRawUnsafe(query);
      console.log(`Encontrados ${result.length} registros de filiación por nombre`);
      
      return serializeBigInt(result);
    } catch (error) {
      console.error(`Error en searchByName(${name}):`, error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    }
  },
  
  /**
   * Count filiacion records with optional filtering using raw SQL
   */
  async countFiliacion(filter: FiliacionFilter = {}): Promise<CountResponse> {
    try {
      console.log('Contando registros de filiación con filtros:', filter);
      
      // Construir la cláusula WHERE basada en los filtros proporcionados
      let whereClause = '';
      const conditions = [];
      
      if (filter.historia) {
        conditions.push(`HISTORIA LIKE '%${filter.historia}%'`);
      }
      
      if (filter.documento) {
        conditions.push(`DOCUMENTO LIKE '%${filter.documento}%'`);
      }
      
      if (filter.nombres) {
        conditions.push(`(NOMBRES LIKE '%${filter.nombres}%' OR PATERNO LIKE '%${filter.nombres}%' OR MATERNO LIKE '%${filter.nombres}%' OR NOMBRE LIKE '%${filter.nombres}%')`);
      }
      
      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }
      
      // Consulta para obtener el total de registros
      const countQuery = `SELECT COUNT(*) as total FROM V_FILIACION ${whereClause}`;
      console.log('Consulta de conteo:', countQuery);
      
      const result = await prisma.$queryRawUnsafe(countQuery);
      const total = Number(result[0]?.total || 0);
      
      console.log(`Total de registros de filiación: ${total}`);
      
      return serializeBigInt({
        success: true,
        data: {
          total
        }
      });
    } catch (error) {
      console.error('Error en countFiliacion:', error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al contar registros de filiación'
      };
    }
  },
};
  