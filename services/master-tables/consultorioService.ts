import { prisma } from '@/lib/prisma';

// Normalizador para filas de Consultorio
function normalizeConsultorio(row: any): Consultorio {
  const rawActivo = (row?.ACTIVO ?? '').toString();
  const activo = rawActivo === '1' || rawActivo.toUpperCase?.() === 'S' ? '1' : '0';
  return {
    CONSULTORIO: row.CONSULTORIO ? String(row.CONSULTORIO).trim() : row.CONSULTORIO,
    NOMBRE: row.NOMBRE?.toString?.() ?? row.NOMBRE,
    ABREVIATURA: row.ABREVIATURA?.toString?.() ?? row.ABREVIATURA,
    ESPECIALIDAD: row.ESPECIALIDAD?.toString?.() ?? row.ESPECIALIDAD,
    HIS_NOMSERVICIO: row.HIS_NOMSERVICIO?.toString?.() ?? row.HIS_NOMSERVICIO,
    // Campos adicionales requeridos por el frontend
    CODIGOHIS: row.CODIGOHIS?.toString?.() ?? row.CODIGOHIS ?? row.HIS_CODSERVICIO,
    TIPO: row.TIPO?.toString?.() ?? row.TIPO,
    NUMERO: row.NUMERO !== undefined && row.NUMERO !== null ? Number(row.NUMERO) : (row.NUMERO as any),
    NOMBRE_ESPECIALIDAD: row.NOMBRE_ESPECIALIDAD?.toString?.() ?? row.HIS_NOMSERVICIO?.toString?.() ?? row.NOMBRE_ESPECIALIDAD,
    ACTIVO: activo,
  } as Consultorio;
}

export interface Consultorio {
  CONSULTORIO: string;
  NOMBRE: string;
  ABREVIATURA?: string;
  ESPECIALIDAD?: string;
  HIS_NOMSERVICIO?: string;
  CODIGOHIS?: string;
  TIPO?: string;
  NUMERO?: number;
  NOMBRE_ESPECIALIDAD?: string;
  ACTIVO: string;
  [key: string]: any;
}

export interface ConsultorioFilters {
  nombre?: string;
  codigo?: string;
  servicio?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const consultorioServerService = {
  async getConsultorios(
    page: number = 1,
    pageSize: number = 10,
    filters: ConsultorioFilters = {}
  ): Promise<PaginatedResponse<Consultorio>> {
    const skip = (page - 1) * pageSize;
    const startRow = skip + 1;
    const endRow = page * pageSize;
    const { nombre, codigo, servicio } = filters;

    try {
      let totalResult: any;
      let consultorios: any;

      if (nombre && !codigo && !servicio) {
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM CONSULTORIO WHERE NOMBRE LIKE ${`%${nombre}%`}`;
        consultorios = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT CONSULTORIO, NOMBRE, ABREVIATURA, ESPECIALIDAD, HIS_NOMSERVICIO, ACTIVO,
                   HIS_CODSERVICIO AS CODIGOHIS, TIPO, NUMERO,
                   HIS_NOMSERVICIO AS NOMBRE_ESPECIALIDAD,
                   ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM CONSULTORIO
            WHERE NOMBRE LIKE ${`%${nombre}%`}
          )
          SELECT * FROM CTE WHERE RowNum BETWEEN ${startRow} AND ${endRow} ORDER BY RowNum
        `;
      } else if (!nombre && codigo && !servicio) {
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM CONSULTORIO WHERE CONSULTORIO LIKE ${`%${codigo}%`}`;
        consultorios = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT CONSULTORIO, NOMBRE, ABREVIATURA, ESPECIALIDAD, HIS_NOMSERVICIO, ACTIVO,
                   HIS_CODSERVICIO AS CODIGOHIS, TIPO, NUMERO,
                   HIS_NOMSERVICIO AS NOMBRE_ESPECIALIDAD,
                   ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM CONSULTORIO
            WHERE CONSULTORIO LIKE ${`%${codigo}%`}
          )
          SELECT * FROM CTE WHERE RowNum BETWEEN ${startRow} AND ${endRow} ORDER BY RowNum
        `;
      } else if (!nombre && !codigo && servicio) {
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM CONSULTORIO WHERE HIS_NOMSERVICIO LIKE ${`%${servicio}%`}`;
        consultorios = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT CONSULTORIO, NOMBRE, ABREVIATURA, ESPECIALIDAD, HIS_NOMSERVICIO, ACTIVO,
                   HIS_CODSERVICIO AS CODIGOHIS, TIPO, NUMERO,
                   HIS_NOMSERVICIO AS NOMBRE_ESPECIALIDAD,
                   ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM CONSULTORIO
            WHERE HIS_NOMSERVICIO LIKE ${`%${servicio}%`}
          )
          SELECT * FROM CTE WHERE RowNum BETWEEN ${startRow} AND ${endRow} ORDER BY RowNum
        `;
      } else {
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM CONSULTORIO`;
        consultorios = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT CONSULTORIO, NOMBRE, ABREVIATURA, ESPECIALIDAD, HIS_NOMSERVICIO, ACTIVO,
                   HIS_CODSERVICIO AS CODIGOHIS, TIPO, NUMERO,
                   HIS_NOMSERVICIO AS NOMBRE_ESPECIALIDAD,
                   ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM CONSULTORIO
          )
          SELECT * FROM CTE WHERE RowNum BETWEEN ${startRow} AND ${endRow} ORDER BY RowNum
        `;
      }

      const total = Number((totalResult as any)[0].total);
      const normalized = (consultorios as any[]).map(normalizeConsultorio);

      return {
        data: normalized as Consultorio[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('Error in consultorioServerService.getConsultorios:', error);
      throw error;
    }
  },

  async getConsultorioById(id: string): Promise<Consultorio | null> {
    try {
      const consultorio = await prisma.$queryRaw`
        SELECT CONSULTORIO, NOMBRE, ABREVIATURA, ESPECIALIDAD, HIS_NOMSERVICIO, ACTIVO,
               HIS_CODSERVICIO AS CODIGOHIS, TIPO, NUMERO,
               HIS_NOMSERVICIO AS NOMBRE_ESPECIALIDAD
        FROM CONSULTORIO
        WHERE CONSULTORIO = ${id}
      `;

      if (!consultorio || (Array.isArray(consultorio) && consultorio.length === 0)) {
        return null;
      }

      const item = Array.isArray(consultorio) ? consultorio[0] : consultorio;
      return normalizeConsultorio(item);
    } catch (error) {
      console.error(`Error in consultorioServerService.getConsultorioById(${id}):`, error);
      throw error;
    }
  },

  async createConsultorio(data: Partial<Consultorio>): Promise<Consultorio> {
    try {
      // Check if consultorio with same name already exists
      const existing = await prisma.$queryRaw`SELECT COUNT(*) as count FROM CONSULTORIO WHERE NOMBRE = ${data.NOMBRE}`;
      const exists = Number((existing as any)[0].count) > 0;

      if (exists) {
        throw new Error('Ya existe un consultorio con este nombre');
      }

      // Insert new consultorio
      await prisma.$executeRaw`
        INSERT INTO CONSULTORIO (NOMBRE, ABREVIATURA, HIS_NOMSERVICIO, ACTIVO) 
        VALUES (${data.NOMBRE}, ${data.ABREVIATURA || ""}, ${data.HIS_NOMSERVICIO || ""}, ${data.ACTIVO || "S"})
      `;

      // Return the created consultorio
      return {
        CONSULTORIO: '', // Will be auto-generated
        NOMBRE: data.NOMBRE!,
        ABREVIATURA: data.ABREVIATURA || "",
        HIS_NOMSERVICIO: data.HIS_NOMSERVICIO || "",
        ACTIVO: data.ACTIVO || "S"
      };
    } catch (error) {
      console.error('Error in consultorioServerService.createConsultorio:', error);
      throw error;
    }
  },

  async updateConsultorio(id: string, data: Partial<Consultorio>): Promise<Consultorio | null> {
    try {
      // Check if consultorio exists
      const existing = await this.getConsultorioById(id);
      if (!existing) {
        return null;
      }

      // Update consultorio
      await prisma.$executeRaw`
        UPDATE CONSULTORIO 
        SET NOMBRE = ${data.NOMBRE || existing.NOMBRE},
            ABREVIATURA = ${data.ABREVIATURA || existing.ABREVIATURA || ""},
            HIS_NOMSERVICIO = ${data.HIS_NOMSERVICIO || existing.HIS_NOMSERVICIO || ""},
            ACTIVO = ${data.ACTIVO || existing.ACTIVO}
        WHERE CONSULTORIO = ${id}
      `;

      // Return updated consultorio
      return await this.getConsultorioById(id);
    } catch (error) {
      console.error(`Error in consultorioServerService.updateConsultorio(${id}):`, error);
      throw error;
    }
  },

  async deleteConsultorio(id: string): Promise<boolean> {
    try {
      // Check if consultorio exists
      const existing = await this.getConsultorioById(id);
      if (!existing) {
        return false;
      }

      // Delete consultorio
      await prisma.$executeRaw`DELETE FROM CONSULTORIO WHERE CONSULTORIO = ${id}`;
      return true;
    } catch (error) {
      console.error(`Error in consultorioServerService.deleteConsultorio(${id}):`, error);
      throw error;
    }
  }
};
