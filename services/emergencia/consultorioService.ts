import { prisma } from '@/lib/prisma';

export interface ConsultorioEmergencia {
  CONSULTORIO: string;
  NOMBRE: string;
  ESPECIALIDAD?: string;
  ACTIVO?: string;
}

export interface ConsultorioEmergenciaFilters {
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class ConsultorioEmergenciaService {
  /**
   * Obtiene consultorios de emergencia (TIPO = 'E')
   */
  async getConsultoriosEmergencia(
    page: number = 1,
    pageSize: number = 50,
    filters: ConsultorioEmergenciaFilters = {}
  ): Promise<PaginatedResponse<ConsultorioEmergencia>> {
    const skip = (page - 1) * pageSize;
    const { search } = filters;

    try {
      let totalResult;
      let consultorios;

      if (search) {
        // Búsqueda con filtro
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total 
          FROM CONSULTORIO 
          WHERE TIPO = 'E' 
          AND (NOMBRE LIKE ${`%${search}%`} OR CONSULTORIO LIKE ${`%${search}%`})
        `;
        
        consultorios = await prisma.$queryRaw`
          SELECT CONSULTORIO, NOMBRE 
          FROM CONSULTORIO 
          WHERE TIPO = 'E' 
          AND (NOMBRE LIKE ${`%${search}%`} OR CONSULTORIO LIKE ${`%${search}%`})
          ORDER BY NOMBRE 
          OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY
        `;
      } else {
        // Sin filtro de búsqueda
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total 
          FROM CONSULTORIO 
          WHERE TIPO = 'E'
        `;
        
        consultorios = await prisma.$queryRaw`
          SELECT CONSULTORIO, NOMBRE 
          FROM CONSULTORIO 
          WHERE TIPO = 'E' 
          ORDER BY NOMBRE 
          OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY
        `;
      }

      const total = Number((totalResult as any)[0].total);

      return {
        data: consultorios as ConsultorioEmergencia[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('Error en ConsultorioEmergenciaService.getConsultoriosEmergencia:', error);
      throw error;
    }
  }

  /**
   * Obtiene consultorios de citas (TIPO = 'C')
   */
  async getConsultoriosCitas(
    page: number = 1,
    pageSize: number = 50,
    filters: ConsultorioEmergenciaFilters = {}
  ): Promise<PaginatedResponse<ConsultorioEmergencia>> {
    const skip = (page - 1) * pageSize;
    const { search } = filters;

    try {
      let totalResult;
      let consultorios;

      if (search) {
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total 
          FROM CONSULTORIO 
          WHERE TIPO = 'C' 
          AND (NOMBRE LIKE ${`%${search}%`} OR CONSULTORIO LIKE ${`%${search}%`})
        `;
        consultorios = await prisma.$queryRaw`
          SELECT CONSULTORIO, NOMBRE, ESPECIALIDAD, ACTIVO 
          FROM CONSULTORIO 
          WHERE TIPO = 'C' 
          AND (NOMBRE LIKE ${`%${search}%`} OR CONSULTORIO LIKE ${`%${search}%`})
          ORDER BY NOMBRE 
          OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY
        `;
      } else {
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total 
          FROM CONSULTORIO 
          WHERE TIPO = 'C'
        `;
        consultorios = await prisma.$queryRaw`
          SELECT CONSULTORIO, NOMBRE, ESPECIALIDAD, ACTIVO 
          FROM CONSULTORIO 
          WHERE TIPO = 'C' 
          ORDER BY NOMBRE 
          OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY
        `;
      }

      const total = Number((totalResult as any)[0].total);

      return {
        data: consultorios as ConsultorioEmergencia[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('Error en ConsultorioEmergenciaService.getConsultoriosCitas:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los consultorios de citas sin paginación (TIPO = 'C')
   */
  async getAllConsultoriosCitas(search: string = ""): Promise<ConsultorioEmergencia[]> {
    try {
      let consultorios;
      if (search) {
        consultorios = await prisma.$queryRaw`
          SELECT CONSULTORIO, NOMBRE, ESPECIALIDAD, ACTIVO 
          FROM CONSULTORIO 
          WHERE TIPO = 'C' 
          AND (NOMBRE LIKE ${`%${search}%`} OR CONSULTORIO LIKE ${`%${search}%`})
          ORDER BY NOMBRE
        `;
      } else {
        consultorios = await prisma.$queryRaw`
          SELECT CONSULTORIO, NOMBRE, ESPECIALIDAD, ACTIVO 
          FROM CONSULTORIO 
          WHERE TIPO = 'C' 
          ORDER BY NOMBRE
        `;
      }
      return consultorios as ConsultorioEmergencia[];
    } catch (error) {
      console.error('Error en ConsultorioEmergenciaService.getAllConsultoriosCitas:', error);
      throw error;
    }
  }

  /**
   * Obtiene un consultorio de citas por ID (TIPO = 'C')
   */
  async getConsultorioCitasById(id: string): Promise<ConsultorioEmergencia | null> {
    try {
      const consultorio = await prisma.$queryRaw`
        SELECT CONSULTORIO, NOMBRE, ESPECIALIDAD, ACTIVO
        FROM CONSULTORIO
        WHERE CONSULTORIO = ${id} AND TIPO = 'C'
      `;
      if (!consultorio || (Array.isArray(consultorio) && consultorio.length === 0)) {
        return null;
      }
      return Array.isArray(consultorio) ? consultorio[0] as ConsultorioEmergencia : consultorio as ConsultorioEmergencia;
    } catch (error) {
      console.error(`Error en ConsultorioEmergenciaService.getConsultorioCitasById(${id}):`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los consultorios de emergencia sin paginación
   */
  async getAllConsultoriosEmergencia(search: string = ""): Promise<ConsultorioEmergencia[]> {
    try {
      let consultorios;

      if (search) {
        consultorios = await prisma.$queryRaw`
          SELECT CONSULTORIO, NOMBRE 
          FROM CONSULTORIO 
          WHERE TIPO = 'E' 
          AND (NOMBRE LIKE ${`%${search}%`} OR CONSULTORIO LIKE ${`%${search}%`})
          ORDER BY NOMBRE
        `;
      } else {
        consultorios = await prisma.$queryRaw`
          SELECT CONSULTORIO, NOMBRE 
          FROM CONSULTORIO 
          WHERE TIPO = 'E' 
          ORDER BY NOMBRE
        `;
      }

      return consultorios as ConsultorioEmergencia[];
    } catch (error) {
      console.error('Error en ConsultorioEmergenciaService.getAllConsultoriosEmergencia:', error);
      throw error;
    }
  }

  /**
   * Obtiene un consultorio de emergencia por ID
   */
  async getConsultorioEmergenciaById(id: string): Promise<ConsultorioEmergencia | null> {
    try {
      const consultorio = await prisma.$queryRaw`
        SELECT CONSULTORIO, NOMBRE
        FROM CONSULTORIO
        WHERE CONSULTORIO = ${id} AND TIPO = 'E'
      `;

      if (!consultorio || (Array.isArray(consultorio) && consultorio.length === 0)) {
        return null;
      }

      return Array.isArray(consultorio) ? consultorio[0] as ConsultorioEmergencia : consultorio as ConsultorioEmergencia;
    } catch (error) {
      console.error(`Error en ConsultorioEmergenciaService.getConsultorioEmergenciaById(${id}):`, error);
      throw error;
    }
  }
}

// Instancia del servicio para usar en las APIs
export const consultorioEmergenciaService = new ConsultorioEmergenciaService();
