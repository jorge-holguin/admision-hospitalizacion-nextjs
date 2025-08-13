import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmergenciaData {
  Estado: string | null;
  Emergencia_id: string;
  Fecha: Date;
  Hora: string | null;
  Orden: string;
  Paciente: string | null;
  Historia: string | null;
  Nombres: string | null;
  Sexo: string;
  Nombre_Seguro: string | null;
  Consultorio: string | null;
  Nombre_Consultorio: string | null;
  Nombre_motivo: string | null;
  Usuario: string;
  TipoAtencion: string | null;
}

export interface EmergenciaFilter {
  month: number;
  year: number;
  searchTerm?: string;
  page: number;
  pageSize: number;
}

export interface EmergenciaResult {
  data: EmergenciaData[];
  total: number;
}

const emergenciaService = {
  /**
   * Lista las emergencias filtradas por mes y año
   * @param month - Mes (1-12)
   * @param year - Año (ej. 2025)
   * @returns Lista de emergencias
   */
  async listarEmergencias(month: number, year: number): Promise<EmergenciaData[]> {
    try {
      // Convertir el mes a formato de dos dígitos para la consulta
      const monthFormatted = month.toString().padStart(2, '0');
      
      // Consultar las emergencias usando Prisma y el modelo SEEM_V_EMERGENCIA
      const emergencias = await prisma.$queryRaw<EmergenciaData[]>`
        SELECT 
          Estado,
          Emergencia_id,
          Fecha,
          Hora,
          Orden,
          Paciente,
          Historia,
          Nombres,
          Sexo,
          Nombre_Seguro,
          Consultorio,
          Nombre_Consultorio,
          Nombre_motivo,
          Usuario,
          TipoAtencion 
        FROM SEEM_V_EMERGENCIA 
        WHERE MONTH(FECHA) = ${monthFormatted} 
        AND YEAR(FECHA) = ${year} 
        ORDER BY Emergencia_id DESC
      `;
      
      return emergencias;
    } catch (error) {
      console.error('Error al listar emergencias:', error);
      throw error;
    }
  },

  /**
   * Lista las emergencias del mes y año actual
   * @returns Lista de emergencias del mes actual
   */
  async listarEmergenciasActuales(): Promise<EmergenciaData[]> {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() devuelve 0-11
      const currentYear = currentDate.getFullYear();
      
      return this.listarEmergencias(currentMonth, currentYear);
    } catch (error) {
      console.error('Error al listar emergencias actuales:', error);
      throw error;
    }
  },
  
  /**
   * Lista las emergencias con paginación y filtros
   * @param filter - Filtros y configuración de paginación
   * @returns Resultado paginado de emergencias
   */
  async listarEmergenciasPaginadas(filter: EmergenciaFilter): Promise<EmergenciaResult> {
    try {
      const { month, year, searchTerm, page, pageSize } = filter;
      
      // Convertir el mes a formato de dos dígitos para la consulta
      const monthFormatted = month.toString().padStart(2, '0');
      
      // Calcular el offset para la paginación
      const offset = (page - 1) * pageSize;
      
      // Construir la condición de búsqueda si se proporciona un término
      let searchCondition = '';
      if (searchTerm && searchTerm.trim() !== '') {
        const searchValue = `%${searchTerm.trim()}%`;
        searchCondition = `AND (
          Emergencia_id LIKE '${searchValue}' OR
          Historia LIKE '${searchValue}' OR
          Nombres LIKE '${searchValue}' OR
          Nombre_Consultorio LIKE '${searchValue}' OR
          Nombre_motivo LIKE '${searchValue}'
        )`;
      }
      
      // Consulta para obtener el total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM SEEM_V_EMERGENCIA 
        WHERE MONTH(FECHA) = '${monthFormatted}' 
        AND YEAR(FECHA) = ${year}
        ${searchCondition}
      `;
      
      // Ejecutar la consulta de conteo
      const countResult = await prisma.$queryRawUnsafe<{total: number}[]>(countQuery);
      const total = countResult[0]?.total || 0;
      
      // Consulta para obtener los datos paginados
      const dataQuery = `
        SELECT 
          Estado,
          Emergencia_id,
          Fecha,
          Hora,
          Orden,
          Paciente,
          Historia,
          Nombres,
          Sexo,
          Nombre_Seguro,
          Consultorio,
          Nombre_Consultorio,
          Nombre_motivo,
          Usuario,
          TipoAtencion 
        FROM SEEM_V_EMERGENCIA 
        WHERE MONTH(FECHA) = '${monthFormatted}' 
        AND YEAR(FECHA) = ${year}
        ${searchCondition}
        ORDER BY Emergencia_id DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${pageSize} ROWS ONLY
      `;
      
      // Ejecutar la consulta de datos
      const data = await prisma.$queryRawUnsafe<EmergenciaData[]>(dataQuery);
      
      return { data, total };
    } catch (error) {
      console.error('Error al listar emergencias paginadas:', error);
      throw error;
    }
  }
};

export default emergenciaService;
