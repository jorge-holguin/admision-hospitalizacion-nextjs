import { prisma } from '@/lib/prisma';

// Normalizador para filas de Médico provenientes de SQL Server/Prisma
function normalizeMedico(row: any): Medico {
  // ACTIVO puede venir como Decimal/BigInt/objeto; normalizar a '1' o '0'
  const rawActivo = (row?.ACTIVO ?? '').toString();
  const activo = rawActivo === '1' || rawActivo.toUpperCase?.() === 'S' ? '1' : '0';

  return {
    ID_MEDICO: typeof row.ID_MEDICO === 'bigint' ? Number(row.ID_MEDICO) : row.ID_MEDICO,
    MEDICO: row.MEDICO?.toString?.() ?? row.MEDICO,
    NOMBRE: row.NOMBRE?.toString?.() ?? row.NOMBRE,
    NOMBRES: row.NOMBRES?.toString?.() ?? row.NOMBRES,
    APATERNO: row.APATERNO?.toString?.() ?? row.APATERNO,
    AMATERNO: row.AMATERNO?.toString?.() ?? row.AMATERNO,
    DNI: row.DNI?.toString?.() ?? row.DNI,
    TIPO_DOCUMENTO: row.TIPO_DOCUMENTO?.toString?.() ?? row.TIPO_DOCUMENTO,
    ESPECIALIDAD: row.ESPECIALIDAD?.toString?.() ?? row.ESPECIALIDAD,
    CONSULTORIO: row.CONSULTORIO ? String(row.CONSULTORIO).trim() : row.CONSULTORIO,
    CODHIS: row.CODHIS?.toString?.() ?? row.CODHIS,
    EESS: row.EESS?.toString?.() ?? row.EESS,
    CONTRATO: row.CONTRATO?.toString?.() ?? row.CONTRATO,
    ACTIVO: activo,
  } as Medico;
}

export interface Medico {
  ID_MEDICO?: number;
  MEDICO: string;
  NOMBRE: string;
  NOMBRES?: string;
  APATERNO?: string;
  AMATERNO?: string;
  DNI?: string;
  TIPO_DOCUMENTO?: string;
  ESPECIALIDAD?: string;
  CONSULTORIO?: string;
  CODHIS?: string;
  EESS?: string;
  CONTRATO?: string;
  ACTIVO: string;
  [key: string]: any;
}

export interface MedicoFilters {
  search?: string;
  consultorio?: string;
  nombre?: string;
  dni?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Server-side service for API routes
export const medicoServerService = {
  async getMedicos(
    page: number = 1,
    pageSize: number = 10,
    filters: MedicoFilters = {}
  ): Promise<PaginatedResponse<Medico>> {
    const skip = (page - 1) * pageSize;
    const startRow = skip + 1;
    const endRow = page * pageSize;
    const { search, consultorio, nombre, dni } = filters;

    try {
      let totalResult: any;
      let medicos: any;

      if (search && !consultorio && !nombre && !dni) {
        // Búsqueda general
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO 
          WHERE NOMBRE LIKE ${`%${search}%`} 
          OR MEDICO LIKE ${`%${search}%`}
          OR DNI LIKE ${`%${search}%`}
        `;
        medicos = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT 
              ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI,
              TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO,
              ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM MEDICO
            WHERE NOMBRE LIKE ${`%${search}%`} 
              OR MEDICO LIKE ${`%${search}%`}
              OR DNI LIKE ${`%${search}%`}
          )
          SELECT * FROM CTE
          WHERE RowNum BETWEEN ${startRow} AND ${endRow}
          ORDER BY RowNum
        `;
      } else if (!search && consultorio && !nombre && !dni) {
        // Filtro por consultorio
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO WHERE CONSULTORIO = ${consultorio}
        `;
        medicos = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT 
              ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI,
              TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO,
              ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM MEDICO
            WHERE CONSULTORIO = ${consultorio}
          )
          SELECT * FROM CTE
          WHERE RowNum BETWEEN ${startRow} AND ${endRow}
          ORDER BY RowNum
        `;
      } else if (!search && !consultorio && nombre && !dni) {
        // Filtro por nombre
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO WHERE NOMBRE LIKE ${`%${nombre}%`}
        `;
        medicos = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT 
              ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI,
              TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO,
              ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM MEDICO
            WHERE NOMBRE LIKE ${`%${nombre}%`}
          )
          SELECT * FROM CTE
          WHERE RowNum BETWEEN ${startRow} AND ${endRow}
          ORDER BY RowNum
        `;
      } else if (!search && !consultorio && !nombre && dni) {
        // Filtro por DNI
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO WHERE DNI LIKE ${`%${dni}%`}
        `;
        medicos = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT 
              ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI,
              TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO,
              ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM MEDICO
            WHERE DNI LIKE ${`%${dni}%`}
          )
          SELECT * FROM CTE
          WHERE RowNum BETWEEN ${startRow} AND ${endRow}
          ORDER BY RowNum
        `;
      } else {
        // Sin filtros
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM MEDICO`;
        medicos = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT 
              ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI,
              TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO,
              ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM MEDICO
          )
          SELECT * FROM CTE
          WHERE RowNum BETWEEN ${startRow} AND ${endRow}
          ORDER BY RowNum
        `;
      }

      const total = Number((totalResult as any)[0].total);

      // Normalizar resultados para el frontend
      const normalized = (medicos as any[]).map(normalizeMedico);

      return {
        data: normalized as Medico[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('Error in medicoServerService.getMedicos:', error);
      throw error;
    }
  },

  async getMedicoById(id: string): Promise<Medico | null> {
    try {
      const medico = await prisma.$queryRaw`
        SELECT ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI, 
               TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO
        FROM MEDICO
        WHERE MEDICO = ${id}
      `;

      if (!medico || (Array.isArray(medico) && medico.length === 0)) {
        return null;
      }

      const item = Array.isArray(medico) ? medico[0] : medico;
      return normalizeMedico(item);
    } catch (error) {
      console.error(`Error in medicoServerService.getMedicoById(${id}):`, error);
      throw error;
    }
  },

  async createMedico(data: Partial<Medico>): Promise<Medico> {
    try {
      if (!data.MEDICO || String(data.MEDICO).trim() === "") {
        throw new Error('El campo MEDICO es requerido');
      }

      if (data.DNI) {
        const existing = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM MEDICO WHERE DNI = ${data.DNI}
        `;
        const exists = Number((existing as any)[0].count) > 0;

        if (exists) {
          throw new Error('Ya existe un médico con este DNI');
        }
      }

      // Sanitizar campos opcionales que pueden ser NUMERIC en la BD
      const especialidadVal = (data.ESPECIALIDAD && String(data.ESPECIALIDAD).trim() !== "")
        ? String(data.ESPECIALIDAD).trim()
        : null;
      const consultorioVal = (data.CONSULTORIO && String(data.CONSULTORIO).trim() !== "")
        ? String(data.CONSULTORIO).trim()
        : null;
      // ACTIVO es numeric(5) en la BD -> mapear a 1/0
      const parseActivo = (v: any): number => {
        const s = String(v ?? '').trim().toUpperCase();
        if (s === '1' || s === 'S' || s === 'TRUE') return 1;
        if (s === '0' || s === 'N' || s === 'FALSE') return 0;
        return 1; // por defecto activo
      };
      const activoVal = parseActivo(data.ACTIVO);

      await prisma.$executeRaw`
        INSERT INTO MEDICO (MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI, TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, CODHIS, EESS, CONTRATO, ACTIVO) 
        VALUES (${String(data.MEDICO).trim()}, ${data.NOMBRE}, ${data.NOMBRES || ""}, ${data.APATERNO || ""}, ${data.AMATERNO || ""}, ${data.DNI || ""}, ${data.TIPO_DOCUMENTO || "D"}, ${especialidadVal}, ${consultorioVal}, ${data.CODHIS || ""}, ${data.EESS || ""}, ${data.CONTRATO || ""}, ${activoVal})
      `;

      return {
        MEDICO: String(data.MEDICO).trim(),
        NOMBRE: data.NOMBRE!,
        NOMBRES: data.NOMBRES || "",
        APATERNO: data.APATERNO || "",
        AMATERNO: data.AMATERNO || "",
        DNI: data.DNI || "",
        TIPO_DOCUMENTO: data.TIPO_DOCUMENTO || "D",
        ESPECIALIDAD: (especialidadVal ?? "") as any,
        CONSULTORIO: (consultorioVal ?? "") as any,
        CODHIS: data.CODHIS || "",
        EESS: data.EESS || "",
        CONTRATO: data.CONTRATO || "",
        ACTIVO: activoVal === 1 ? "1" : "0"
      };
    } catch (error) {
      console.error('Error in medicoServerService.createMedico:', error);
      throw error;
    }
  },

  async updateMedico(id: string, data: Partial<Medico>): Promise<Medico | null> {
    try {
      const existing = await this.getMedicoById(id);
      if (!existing) {
        return null;
      }

      // Sanitizar campos opcionales (posibles NUMERIC) para evitar empty strings
      const especialidadVal = (data.ESPECIALIDAD !== undefined)
        ? (String(data.ESPECIALIDAD).trim() === "" ? null : String(data.ESPECIALIDAD).trim())
        : (existing.ESPECIALIDAD && String(existing.ESPECIALIDAD).trim() !== "" ? String(existing.ESPECIALIDAD).trim() : null);
      const consultorioVal = (data.CONSULTORIO !== undefined)
        ? (String(data.CONSULTORIO).trim() === "" ? null : String(data.CONSULTORIO).trim())
        : (existing.CONSULTORIO && String(existing.CONSULTORIO).trim() !== "" ? String(existing.CONSULTORIO).trim() : null);
      const parseActivo = (v: any): number => {
        const s = String(v ?? '').trim().toUpperCase();
        if (s === '1' || s === 'S' || s === 'TRUE') return 1;
        if (s === '0' || s === 'N' || s === 'FALSE') return 0;
        return 1;
      };
      const newActivoVal = data.ACTIVO !== undefined ? parseActivo(data.ACTIVO) : parseActivo(existing.ACTIVO);

      await prisma.$executeRaw`
        UPDATE MEDICO 
        SET NOMBRE = ${data.NOMBRE || existing.NOMBRE},
            NOMBRES = ${data.NOMBRES || existing.NOMBRES || ""},
            APATERNO = ${data.APATERNO || existing.APATERNO || ""},
            AMATERNO = ${data.AMATERNO || existing.AMATERNO || ""},
            DNI = ${data.DNI || existing.DNI || ""},
            TIPO_DOCUMENTO = ${data.TIPO_DOCUMENTO || existing.TIPO_DOCUMENTO || "D"},
            ESPECIALIDAD = ${especialidadVal},
            CONSULTORIO = ${consultorioVal},
            CODHIS = ${data.CODHIS ?? existing.CODHIS ?? ""},
            EESS = ${data.EESS ?? existing.EESS ?? ""},
            CONTRATO = ${data.CONTRATO ?? existing.CONTRATO ?? ""},
            ACTIVO = ${newActivoVal}
        WHERE MEDICO = ${id}
      `;

      return await this.getMedicoById(id);
    } catch (error) {
      console.error(`Error in medicoServerService.updateMedico(${id}):`, error);
      throw error;
    }
  },

  async deleteMedico(id: string): Promise<boolean> {
    try {
      const existing = await this.getMedicoById(id);
      if (!existing) {
        return false;
      }

      await prisma.$executeRaw`DELETE FROM MEDICO WHERE MEDICO = ${id}`;
      return true;
    } catch (error) {
      console.error(`Error in medicoServerService.deleteMedico(${id}):`, error);
      throw error;
    }
  }
};
