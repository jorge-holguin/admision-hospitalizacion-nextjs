import { prisma } from '@/lib/prisma';

// Normalizador para filas de Consultorio
function normalizeConsultorio(row: any): Consultorio {
  const rawActivo = (row?.ACTIVO ?? '').toString();
  const ACTIVO = rawActivo === '1' || rawActivo.toUpperCase?.() === 'S' ? '1' : '0';
  return {
    CONSULTORIO: row.CONSULTORIO ? String(row.CONSULTORIO).trim() : row.CONSULTORIO,
    NOMBRE: row.NOMBRE?.toString?.() ?? row.NOMBRE,
    ABREVIATURA: row.ABREVIATURA?.toString?.() ?? row.ABREVIATURA,
    ESPECIALIDAD: row.ESPECIALIDAD?.toString?.() ?? row.ESPECIALIDAD,
    TIPO: row.TIPO?.toString?.() ?? row.TIPO,
    ROL: row.ROL?.toString?.() ?? row.ROL,
    MUESTRAROL: row.MUESTRAROL?.toString?.() ?? row.MUESTRAROL,
    ACTIVO,
    ORDEN: row.ORDEN?.toString?.() ?? row.ORDEN,
    NUMERO: row.NUMERO?.toString?.() ?? row.NUMERO,
    HIS_CODSERVICIO: row.HIS_CODSERVICIO?.toString?.() ?? row.HIS_CODSERVICIO,
    UPSTRAMA: row.CODUPSSEEM?.toString?.() ?? row.CODUPSSEEM,
    // Legacy fields for backward compatibility
    HIS_NOMSERVICIO: row.HIS_NOMSERVICIO?.toString?.() ?? row.HIS_NOMSERVICIO,
    CODIGOHIS: row.CODIGOHIS?.toString?.() ?? row.CODIGOHIS ?? row.HIS_CODSERVICIO,
    NOMBRE_ESPECIALIDAD: row.NOMBRE_ESPECIALIDAD?.toString?.() ?? row.HIS_NOMSERVICIO?.toString?.() ?? row.NOMBRE_ESPECIALIDAD,
  } as Consultorio;
}

export interface Consultorio {
  CONSULTORIO: string;
  NOMBRE: string;
  ABREVIATURA?: string;
  ESPECIALIDAD?: string;
  TIPO?: string;
  ROL?: string;
  MUESTRAROL?: string;
  ACTIVO: string;
  ORDEN?: string;
  NUMERO?: string;
  UPSTRAMA?: string;
  HIS_CODSERVICIO?: string;
  // Legacy fields
  HIS_NOMSERVICIO?: string;
  CODIGOHIS?: string;
  NOMBRE_ESPECIALIDAD?: string;
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
        SELECT CONSULTORIO, NOMBRE, ABREVIATURA, ESPECIALIDAD, TIPO, ROL, MUESTRAROL, 
               ACTIVO, ORDEN, NUMERO, HIS_CODSERVICIO, CODUPSSEEM
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
      // Check if consultorio with same codigo already exists
      const existing = await prisma.$queryRaw`SELECT COUNT(*) as count FROM CONSULTORIO WHERE CONSULTORIO = ${data.CONSULTORIO}`;
      const exists = Number((existing as any)[0].count) > 0;

      if (exists) {
        throw new Error('Ya existe un consultorio con este código');
      }

      // Parse numeric values
      const parseActivo = (v: any): number => {
        const s = String(v ?? '').trim().toUpperCase();
        if (s === '1' || s === 'S' || s === 'TRUE') return 1;
        if (s === '0' || s === 'N' || s === 'FALSE') return 0;
        return 1;
      };
      
      const activoVal = parseActivo(data.ACTIVO);
      const rolVal = data.ROL === '1' ? 1 : 0;
      const muestraRolVal = data.MUESTRAROL === '1' ? 1 : 0;
      const ordenVal = data.ORDEN ? parseInt(data.ORDEN) : null;

      // Insert new consultorio with all fields
      await prisma.$executeRaw`
        INSERT INTO Consultorio(CONSULTORIO,NOMBRE,ABREVIATURA,ESPECIALIDAD,TIPO,ROL,MUESTRAROL,ACTIVO,ORDEN,NUMERO) 
        VALUES(${data.CONSULTORIO}, ${data.NOMBRE}, ${data.ABREVIATURA || ""}, ${data.ESPECIALIDAD || ""}, ${data.TIPO || ""}, ${rolVal}, ${muestraRolVal}, ${activoVal}, ${ordenVal}, ${data.NUMERO || ""})
      `;

      // Update additional fields if provided
      if (data.UPSTRAMA || data.HIS_CODSERVICIO) {
        await prisma.$executeRaw`
          UPDATE CONSULTORIO SET 
            upstrama = ${data.UPSTRAMA || ""}, 
            his_codservicio = ${data.HIS_CODSERVICIO || ""} 
          WHERE CONSULTORIO = ${data.CONSULTORIO}
        `;
      }

      // Insert BITACORA log
      const sqlStatement = `INSERT INTO Consultorio(CONSULTORIO,NOMBRE,ABREVIATURA,ESPECIALIDAD,TIPO,ROL,MUESTRAROL,ACTIVO,ORDEN,NUMERO) VALUES(!${data.CONSULTORIO}!,!${data.NOMBRE}!,!${data.ABREVIATURA || ""}!,!${data.ESPECIALIDAD || ""}!,!${data.TIPO || ""}!,${rolVal},${muestraRolVal},${activoVal},${ordenVal || 0},!${data.NUMERO || ""}!)`;
      
      await prisma.$executeRaw`
        INSERT INTO BITACORA (Transaccion,Fecha,Usuario,UsuarioRed,Pc,Modulo,SentenciaSql,Tabla) 
        VALUES ('INSERT',getdate(),'SYSTEM','SYSTEM','SYSTEM','ADMISION',${sqlStatement},'Consultorio')
      `;

      // Return the created consultorio
      return {
        CONSULTORIO: data.CONSULTORIO!,
        NOMBRE: data.NOMBRE!,
        ABREVIATURA: data.ABREVIATURA || "",
        ESPECIALIDAD: data.ESPECIALIDAD || "",
        TIPO: data.TIPO || "",
        ROL: data.ROL || "0",
        MUESTRAROL: data.MUESTRAROL || "0",
        ACTIVO: data.ACTIVO || "1",
        ORDEN: data.ORDEN || "",
        NUMERO: data.NUMERO || "",
        UPSTRAMA: data.UPSTRAMA || "",
        HIS_CODSERVICIO: data.HIS_CODSERVICIO || ""
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

      // Parse numeric values
      const parseActivo = (v: any): number => {
        const s = String(v ?? '').trim().toUpperCase();
        if (s === '1' || s === 'S' || s === 'TRUE') return 1;
        if (s === '0' || s === 'N' || s === 'FALSE') return 0;
        return 1;
      };
      
      const activoVal = data.ACTIVO !== undefined ? parseActivo(data.ACTIVO) : parseActivo(existing.ACTIVO);
      const rolVal = data.ROL !== undefined ? (data.ROL === '1' ? 1 : 0) : (existing.ROL === '1' ? 1 : 0);
      const muestraRolVal = data.MUESTRAROL !== undefined ? (data.MUESTRAROL === '1' ? 1 : 0) : (existing.MUESTRAROL === '1' ? 1 : 0);
      const ordenVal = data.ORDEN ? parseInt(data.ORDEN) : (existing.ORDEN ? parseInt(existing.ORDEN) : null);

      // Update consultorio with all fields
      await prisma.$executeRaw`
        UPDATE CONSULTORIO 
        SET NOMBRE = ${data.NOMBRE || existing.NOMBRE},
            ABREVIATURA = ${data.ABREVIATURA || existing.ABREVIATURA || ""},
            ESPECIALIDAD = ${data.ESPECIALIDAD || existing.ESPECIALIDAD || ""},
            TIPO = ${data.TIPO || existing.TIPO || ""},
            ROL = ${rolVal},
            MUESTRAROL = ${muestraRolVal},
            ACTIVO = ${activoVal},
            ORDEN = ${ordenVal},
            NUMERO = ${data.NUMERO || existing.NUMERO || ""}
        WHERE CONSULTORIO = ${id}
      `;

      // Update additional fields if provided
      if (data.UPSTRAMA !== undefined || data.HIS_CODSERVICIO !== undefined) {
        await prisma.$executeRaw`
          UPDATE CONSULTORIO SET 
            upstrama = ${data.UPSTRAMA || existing.UPSTRAMA || ""}, 
            his_codservicio = ${data.HIS_CODSERVICIO || existing.HIS_CODSERVICIO || ""} 
          WHERE CONSULTORIO = ${id}
        `;
      }

      // Insert BITACORA log for update
      const sqlStatement = `UPDATE CONSULTORIO SET NOMBRE=!${data.NOMBRE || existing.NOMBRE}!,ABREVIATURA=!${data.ABREVIATURA || existing.ABREVIATURA || ""}!,ESPECIALIDAD=!${data.ESPECIALIDAD || existing.ESPECIALIDAD || ""}!,TIPO=!${data.TIPO || existing.TIPO || ""}!,ROL=${rolVal},MUESTRAROL=${muestraRolVal},ACTIVO=${activoVal},ORDEN=${ordenVal || 0},NUMERO=!${data.NUMERO || existing.NUMERO || ""}! WHERE CONSULTORIO=!${id}!`;
      
      await prisma.$executeRaw`
        INSERT INTO BITACORA (Transaccion,Fecha,Usuario,UsuarioRed,Pc,Modulo,SentenciaSql,Tabla) 
        VALUES ('UPDATE',getdate(),'SYSTEM','SYSTEM','SYSTEM','ADMISION',${sqlStatement},'Consultorio')
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
