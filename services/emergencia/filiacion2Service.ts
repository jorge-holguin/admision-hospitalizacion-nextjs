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
  TIPO_DOCUMENTO: string;
  LOCALIDAD: string;
  TELEFONO2: string;
  SEGURO: string;
  Expr2: string;
  // Código de ubigeo del distrito
  COD_DISTRITO: string;
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
            Distrito_Dir: item.distritoDir || '',
            // Campos adicionales
            TIPO_DOCUMENTO: item.tipoDocumento || '',
            LOCALIDAD: item.localidad || '',
            TELEFONO1: item.telefono1 || '',
            TELEFONO2: item.telefono2 || '',
            SEGURO: item.seguro || ''
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
      
      // Para otros tipos de búsqueda, usar consulta directa a tablas (sin vista)
      console.log('🔍 Usando consulta directa a tablas PACIENTE (sin vista V_FILIACION2)');
      
      // Construir la cláusula WHERE basada en los filtros proporcionados
      let whereClause = '';
      const conditions = [];
      
      if (filter.historia) {
        conditions.push(`P.HISTORIA LIKE '%${filter.historia}%'`);
      }
      
      if (filter.documento) {
        conditions.push(`P.DOCUMENTO LIKE '%${filter.documento}%'`);
      }
      
      if (filter.nombres) {
        conditions.push(`(P.NOMBRES LIKE '%${filter.nombres}%' OR P.PATERNO LIKE '%${filter.nombres}%' OR P.MATERNO LIKE '%${filter.nombres}%' OR P.NOMBRE LIKE '%${filter.nombres}%')`);
      }
      
      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }
      
      // Consulta directa a tablas para obtener el total de registros
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM dbo.PACIENTE P
        ${whereClause}
      `;
      console.log('Consulta de conteo:', countQuery);
      
      const countResult = await prisma.$queryRawUnsafe(countQuery);
      const total = Number(countResult[0]?.total || 0);
      
      // Consulta directa a tablas para obtener los datos paginados
      // Replica la estructura de V_FILIACION2 pero con LEFT JOIN para no perder registros
      const dataQuery = `
        WITH NumberedData AS (
          SELECT 
            P.PACIENTE, P.HISTORIA, P.NOMBRES, P.SEXO, P.DIRECCION, P.TELEFONO1, 
            P.FECHA_NACIMIENTO, P.DOCUMENTO, S.NOMBRE AS NOMBRE_SEGURO, 
            P.PATERNO, P.MATERNO, P.NOMBRE, P.LUGAR_NACIMIENTO, P.EDAD,
            L.Nombre AS Nombre_Localidad, 
            U1.DISTRITO AS Distrito_Dir, 
            U1.DEPARTAMENTO AS Departamento_Dir,
            P.RELIGION, R.NOMBRE AS DESRELIGION, P.STRING_FOTO, 
            P.LOCALIDAD, P.TELEFONO2, P.SEGURO, P.DISTRITO AS Expr2, 
            P.TIPO_DOCUMENTO, EC.NOMBRE AS NOMBRE_ESTADO_CIVIL, 
            EC.ESTADO_CIVIL, U2.DISTRITO,
            ROW_NUMBER() OVER (ORDER BY P.NOMBRES ASC) AS RowNum
          FROM dbo.PACIENTE P
          LEFT JOIN dbo.ESTADO_CIVIL EC ON P.ESTADO_CIVIL = EC.ESTADO_CIVIL
          LEFT JOIN dbo.SEGURO S ON P.SEGURO = S.SEGURO
          LEFT JOIN dbo.LOCALIDAD L ON P.LOCALIDAD = L.Localidad
          LEFT JOIN dbo.UBIGEO U1 ON P.DISTRITO = U1.UBIGEO
          LEFT JOIN dbo.UBIGEO U2 ON P.LUGAR_NACIMIENTO = U2.UBIGEO
          LEFT JOIN dbo.RELIGION R ON P.RELIGION = R.RELIGION
          ${whereClause}
        )
        SELECT * FROM NumberedData
        WHERE RowNum > ${skip} AND RowNum <= ${skip + pageSize}
      `;
      console.log('Consulta de datos (directa a tablas):', dataQuery);
      
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
      console.log(`🔍 Buscando registro de filiación con ID: ${id} (consulta directa a tablas)`);
      
      // Validar el ID antes de usarlo en la consulta SQL
      if (!id || typeof id !== 'string') {
        console.error(`ID inválido: ${id}`);
        throw new Error(`ID inválido: ${id}`);
      }
      
      // Verificar formato del ID (asumiendo que debe ser numérico)
      if (!/^\d+$/.test(id)) {
        console.error(`Formato de ID inválido (debe ser numérico): ${id}`);
        throw new Error(`Formato de ID inválido (debe ser numérico): ${id}`);
      }
      
      // Escapar comillas simples en el ID para prevenir SQL injection
      const safeId = id.replace(/'/g, "''");
      
      // Consulta directa a tablas (sin vista) - replica estructura de V_FILIACION2
      // Buscar por PACIENTE (numérico) o HISTORIA (string)
      // PACIENTE es numérico, HISTORIA es varchar
      const query = `
        SELECT TOP 1
          P.PACIENTE, P.HISTORIA, P.NOMBRES, P.SEXO, P.DIRECCION, P.TELEFONO1,
          P.FECHA_NACIMIENTO, P.DOCUMENTO, S.NOMBRE AS NOMBRE_SEGURO,
          P.PATERNO, P.MATERNO, P.NOMBRE, P.LUGAR_NACIMIENTO, P.EDAD,
          L.Nombre AS Nombre_Localidad,
          U1.DISTRITO AS Distrito_Dir,
          U1.DEPARTAMENTO AS Departamento_Dir,
          P.RELIGION, R.NOMBRE AS DESRELIGION, P.STRING_FOTO,
          P.LOCALIDAD, P.TELEFONO2, P.SEGURO, P.DISTRITO AS Expr2,
          P.TIPO_DOCUMENTO, EC.NOMBRE AS NOMBRE_ESTADO_CIVIL,
          EC.ESTADO_CIVIL, U2.DISTRITO
        FROM dbo.PACIENTE P
        LEFT JOIN dbo.ESTADO_CIVIL EC ON P.ESTADO_CIVIL = EC.ESTADO_CIVIL
        LEFT JOIN dbo.SEGURO S ON P.SEGURO = S.SEGURO
        LEFT JOIN dbo.LOCALIDAD L ON P.LOCALIDAD = L.Localidad
        LEFT JOIN dbo.UBIGEO U1 ON P.DISTRITO = U1.UBIGEO
        LEFT JOIN dbo.UBIGEO U2 ON P.LUGAR_NACIMIENTO = U2.UBIGEO
        LEFT JOIN dbo.RELIGION R ON P.RELIGION = R.RELIGION
        WHERE P.PACIENTE = ${safeId} OR P.HISTORIA = '${safeId}'
      `;
      console.log('🔍 Ejecutando consulta directa a tablas (PACIENTE numérico, HISTORIA string):', query);
      
      let result;
      try {
        result = await prisma.$queryRawUnsafe(query);
        console.log('Resultado de la consulta:', result ? 'Datos obtenidos' : 'Sin resultados');
      } catch (queryError) {
        console.error('Error al ejecutar la consulta SQL:', queryError);
        throw new Error(`Error al ejecutar la consulta SQL: ${queryError instanceof Error ? queryError.message : 'Error desconocido'}`);
      }
      
      if (!result) {
        console.log(`Resultado nulo para ID ${id}`);
        return null;
      }
      
      if (Array.isArray(result) && result.length > 0) {
        console.log(`Registro de filiación encontrado con ID ${id}`);
        
        // Procesar el registro para manejar correctamente las fechas
        const record = {...result[0]}; // Crear una copia para evitar modificar el objeto original
        
        // Log para verificar si los campos requeridos están presentes
        console.log('Campos requeridos en el resultado de la base de datos:',
          {
            TIPO_DOCUMENTO: record.TIPO_DOCUMENTO !== undefined ? 'presente' : 'ausente',
            LOCALIDAD: record.LOCALIDAD !== undefined ? 'presente' : 'ausente',
            TELEFONO2: record.TELEFONO2 !== undefined ? 'presente' : 'ausente',
            SEGURO: record.SEGURO !== undefined ? 'presente' : 'ausente',
            COD_DISTRITO: record.COD_DISTRITO !== undefined ? 'presente' : 'ausente',
            LUGAR_NACIMIENTO: record.LUGAR_NACIMIENTO !== undefined ? 'presente' : 'ausente'
          }
        );
        
        // Mapear Expr2 a COD_DISTRITO si existe
        if (record.Expr2 !== undefined && !record.COD_DISTRITO) {
          console.log(' Mapeando Expr2 a COD_DISTRITO:', record.Expr2);
          record.COD_DISTRITO = record.Expr2;
        }
        
        // Log específico para el campo COD_DISTRITO (ubigeo)
        if (record.COD_DISTRITO !== undefined) {
          console.log('Valor de COD_DISTRITO (ubigeo):', record.COD_DISTRITO, 'Tipo:', typeof record.COD_DISTRITO);
        } else {
          console.log('Campo COD_DISTRITO (ubigeo) no encontrado en el registro');
          console.log(' Verificar si existe Expr2:', record.Expr2);
        }
        
        // Log de todos los campos disponibles en el registro
        console.log('Todos los campos disponibles en el registro:', Object.keys(record));
        
        // Procesar todas las fechas en el registro
        const dateFields = ['FECHA_NACIMIENTO', 'FECHA_APERTURA', 'SYSINSERT', 'SYSUPDATE', 'FECHA_CONSULTA'];
        
        for (const fieldName of dateFields) {
          if (record[fieldName]) {
            try {
              // Intentar convertir la fecha a un formato estándar
              const fecha = new Date(record[fieldName]);
              if (!isNaN(fecha.getTime())) {
                // Convertir a formato YYYY-MM-DD para que el frontend pueda procesarlo correctamente
                record[fieldName] = fecha.toISOString().split('T')[0];
              } else {
                // Si no se puede convertir, asegurarse de que sea un string
                record[fieldName] = String(record[fieldName]);
              }
            } catch (error) {
              console.error(`Error al procesar fecha ${fieldName}:`, error);
              // En caso de error, mantener el valor original como string
              record[fieldName] = String(record[fieldName]);
            }
          }
        }
        
        return serializeBigInt(record);
      }
      
      console.log(`No se encontró registro de filiación con ID ${id}`);
      return null;
    } catch (error) {
      console.error(`Error en getFiliacionById(${id}):`, error);
      if (error instanceof Error) {
        console.error('Mensaje de error:', error.message);
        console.error('Stack trace:', error.stack);
      }
      // Propagar el error para que la API pueda manejarlo adecuadamente
      throw error;
    }
  },
  
  /**
   * Search filiacion records by historia clinica using raw SQL
   */
  async searchByHistoria(historia: string) {
    try {
      console.log(`🔍 Buscando registros de filiación por historia: ${historia} (consulta directa)`);
      
      // Consulta directa a tablas (sin vista)
      const query = `
        SELECT TOP 10
          P.PACIENTE, P.HISTORIA, P.NOMBRES, P.SEXO, P.DIRECCION, P.TELEFONO1,
          P.FECHA_NACIMIENTO, P.DOCUMENTO, S.NOMBRE AS NOMBRE_SEGURO,
          P.PATERNO, P.MATERNO, P.NOMBRE, P.LUGAR_NACIMIENTO, P.EDAD,
          L.Nombre AS Nombre_Localidad,
          U1.DISTRITO AS Distrito_Dir,
          U1.DEPARTAMENTO AS Departamento_Dir,
          P.RELIGION, R.NOMBRE AS DESRELIGION, P.STRING_FOTO,
          P.LOCALIDAD, P.TELEFONO2, P.SEGURO, P.DISTRITO AS Expr2,
          P.TIPO_DOCUMENTO, EC.NOMBRE AS NOMBRE_ESTADO_CIVIL,
          EC.ESTADO_CIVIL, U2.DISTRITO
        FROM dbo.PACIENTE P
        LEFT JOIN dbo.ESTADO_CIVIL EC ON P.ESTADO_CIVIL = EC.ESTADO_CIVIL
        LEFT JOIN dbo.SEGURO S ON P.SEGURO = S.SEGURO
        LEFT JOIN dbo.LOCALIDAD L ON P.LOCALIDAD = L.Localidad
        LEFT JOIN dbo.UBIGEO U1 ON P.DISTRITO = U1.UBIGEO
        LEFT JOIN dbo.UBIGEO U2 ON P.LUGAR_NACIMIENTO = U2.UBIGEO
        LEFT JOIN dbo.RELIGION R ON P.RELIGION = R.RELIGION
        WHERE P.HISTORIA LIKE '%${historia}%'
        ORDER BY P.NOMBRES ASC
      `;
      
      const result = await prisma.$queryRawUnsafe(query);
      console.log(`✅ Encontrados ${result.length} registros de filiación por historia`);
      
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
      console.log(`🔍 Buscando registros de filiación por documento: ${documento} (consulta directa)`);
      
      // Consulta directa a tablas (sin vista)
      const query = `
        SELECT TOP 10
          P.PACIENTE, P.HISTORIA, P.NOMBRES, P.SEXO, P.DIRECCION, P.TELEFONO1,
          P.FECHA_NACIMIENTO, P.DOCUMENTO, S.NOMBRE AS NOMBRE_SEGURO,
          P.PATERNO, P.MATERNO, P.NOMBRE, P.LUGAR_NACIMIENTO, P.EDAD,
          L.Nombre AS Nombre_Localidad,
          U1.DISTRITO AS Distrito_Dir,
          U1.DEPARTAMENTO AS Departamento_Dir,
          P.RELIGION, R.NOMBRE AS DESRELIGION, P.STRING_FOTO,
          P.LOCALIDAD, P.TELEFONO2, P.SEGURO, P.DISTRITO AS Expr2,
          P.TIPO_DOCUMENTO, EC.NOMBRE AS NOMBRE_ESTADO_CIVIL,
          EC.ESTADO_CIVIL, U2.DISTRITO
        FROM dbo.PACIENTE P
        LEFT JOIN dbo.ESTADO_CIVIL EC ON P.ESTADO_CIVIL = EC.ESTADO_CIVIL
        LEFT JOIN dbo.SEGURO S ON P.SEGURO = S.SEGURO
        LEFT JOIN dbo.LOCALIDAD L ON P.LOCALIDAD = L.Localidad
        LEFT JOIN dbo.UBIGEO U1 ON P.DISTRITO = U1.UBIGEO
        LEFT JOIN dbo.UBIGEO U2 ON P.LUGAR_NACIMIENTO = U2.UBIGEO
        LEFT JOIN dbo.RELIGION R ON P.RELIGION = R.RELIGION
        WHERE P.DOCUMENTO LIKE '%${documento}%'
          AND P.HISTORIA IS NOT NULL
          AND P.HISTORIA <> ''
          AND P.HISTORIA <> '0'
        ORDER BY P.NOMBRES ASC
      `;
      
      const result = await prisma.$queryRawUnsafe(query);
      console.log(`✅ Encontrados ${result.length} registros de filiación por documento`);
      
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
      console.log(`🔍 Buscando registros de filiación por nombre: ${name} (consulta directa)`);
      
      // Consulta directa a tablas (sin vista)
      const query = `
        SELECT TOP 100
          P.PACIENTE, P.HISTORIA, P.NOMBRES, P.SEXO, P.DIRECCION, P.TELEFONO1,
          P.FECHA_NACIMIENTO, P.DOCUMENTO, S.NOMBRE AS NOMBRE_SEGURO,
          P.PATERNO, P.MATERNO, P.NOMBRE, P.LUGAR_NACIMIENTO, P.EDAD,
          L.Nombre AS Nombre_Localidad,
          U1.DISTRITO AS Distrito_Dir,
          U1.DEPARTAMENTO AS Departamento_Dir,
          P.RELIGION, R.NOMBRE AS DESRELIGION, P.STRING_FOTO,
          P.LOCALIDAD, P.TELEFONO2, P.SEGURO, P.DISTRITO AS Expr2,
          P.TIPO_DOCUMENTO, EC.NOMBRE AS NOMBRE_ESTADO_CIVIL,
          EC.ESTADO_CIVIL, U2.DISTRITO
        FROM dbo.PACIENTE P
        LEFT JOIN dbo.ESTADO_CIVIL EC ON P.ESTADO_CIVIL = EC.ESTADO_CIVIL
        LEFT JOIN dbo.SEGURO S ON P.SEGURO = S.SEGURO
        LEFT JOIN dbo.LOCALIDAD L ON P.LOCALIDAD = L.Localidad
        LEFT JOIN dbo.UBIGEO U1 ON P.DISTRITO = U1.UBIGEO
        LEFT JOIN dbo.UBIGEO U2 ON P.LUGAR_NACIMIENTO = U2.UBIGEO
        LEFT JOIN dbo.RELIGION R ON P.RELIGION = R.RELIGION
        WHERE P.NOMBRES LIKE '%${name}%'
          OR P.PATERNO LIKE '%${name}%'
          OR P.MATERNO LIKE '%${name}%'
          OR P.NOMBRE LIKE '%${name}%'
        ORDER BY P.NOMBRES ASC
      `;
      
      const result = await prisma.$queryRawUnsafe(query);
      console.log(`✅ Encontrados ${result.length} registros de filiación por nombre`);
      
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
        conditions.push(`P.HISTORIA LIKE '%${filter.historia}%'`);
      }
      
      if (filter.documento) {
        conditions.push(`P.DOCUMENTO LIKE '%${filter.documento}%'`);
      }
      
      if (filter.nombres) {
        conditions.push(`(P.NOMBRES LIKE '%${filter.nombres}%' OR P.PATERNO LIKE '%${filter.nombres}%' OR P.MATERNO LIKE '%${filter.nombres}%' OR P.NOMBRE LIKE '%${filter.nombres}%')`);
      }
      
      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }
      
      // Consulta directa a tablas para obtener el total de registros
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM dbo.PACIENTE P
        ${whereClause}
      `;
      console.log('Consulta de conteo (directa a tablas):', countQuery);
      
      const result = await prisma.$queryRawUnsafe(countQuery);
      const total = Number(result[0]?.total || 0);
      
      console.log(`✅ Total de registros de filiación: ${total}`);
      
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
  