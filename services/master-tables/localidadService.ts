import { prisma } from '@/lib/prisma';

// Normalizador para filas de Localidad
function normalizeLocalidad(row: any): Localidad {
  const rawActivo = (row?.ACTIVO ?? row?.Activo ?? '').toString();
  const ACTIVO = rawActivo === '1' || rawActivo.toUpperCase?.() === 'S' ? '1' : '0';
  return {
    LOCALIDAD: (row.LOCALIDAD || row.Localidad) ? String(row.LOCALIDAD || row.Localidad).trim() : (row.LOCALIDAD || row.Localidad),
    NOMBRE: (row.NOMBRE || row.Nombre)?.toString?.() ?? (row.NOMBRE || row.Nombre),
    UBIGEO: (row.UBIGEO || row.Ubigeo)?.toString?.() ?? ((row.UBIGEO || row.Ubigeo) || ''),
    ACTIVO,
  } as Localidad;
}

export interface Localidad {
  LOCALIDAD: string;
  NOMBRE: string;
  UBIGEO?: string;
  ACTIVO: string;
  [key: string]: any;
}

export interface LocalidadFilters {
  nombre?: string;
  codigo?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const localidadServerService = {
  async getLocalidades(
    page: number = 1,
    pageSize: number = 10,
    filters: LocalidadFilters = {}
  ): Promise<PaginatedResponse<Localidad>> {
    const skip = (page - 1) * pageSize;
    const startRow = skip + 1;
    const endRow = page * pageSize;
    const { nombre, codigo } = filters;

    try {
      let totalResult: any;
      let localidades: any;

      // Build WHERE conditions using ROW_NUMBER CTE (compatible con más versiones)
      if (nombre && !codigo) {
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM LOCALIDAD WHERE NOMBRE LIKE ${`%${nombre}%`}`;
        localidades = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT LOCALIDAD, NOMBRE, UBIGEO, ACTIVO,
                   ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM LOCALIDAD
            WHERE NOMBRE LIKE ${`%${nombre}%`}
          )
          SELECT * FROM CTE WHERE RowNum BETWEEN ${startRow} AND ${endRow} ORDER BY RowNum
        `;
      } else if (!nombre && codigo) {
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM LOCALIDAD WHERE LOCALIDAD LIKE ${`%${codigo}%`}`;
        localidades = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT LOCALIDAD, NOMBRE, UBIGEO, ACTIVO,
                   ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM LOCALIDAD
            WHERE LOCALIDAD LIKE ${`%${codigo}%`}
          )
          SELECT * FROM CTE WHERE RowNum BETWEEN ${startRow} AND ${endRow} ORDER BY RowNum
        `;
      } else {
        // No filters or multiple filters
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM LOCALIDAD`;
        localidades = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT LOCALIDAD, NOMBRE, UBIGEO, ACTIVO,
                   ROW_NUMBER() OVER (ORDER BY NOMBRE) AS RowNum
            FROM LOCALIDAD
          )
          SELECT * FROM CTE WHERE RowNum BETWEEN ${startRow} AND ${endRow} ORDER BY RowNum
        `;
      }

      const total = Number((totalResult as any)[0].total);
      const normalized = (localidades as any[]).map(normalizeLocalidad);

      return {
        data: normalized as Localidad[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('Error in localidadServerService.getLocalidades:', error);
      throw error;
    }
  },

  async getLocalidadById(id: string): Promise<Localidad | null> {
    try {
      const localidad = await prisma.$queryRaw`
        SELECT LOCALIDAD, NOMBRE, UBIGEO, ACTIVO
        FROM LOCALIDAD
        WHERE LOCALIDAD = ${id}
      `;

      if (!localidad || (Array.isArray(localidad) && localidad.length === 0)) {
        return null;
      }

      const item = Array.isArray(localidad) ? localidad[0] : localidad;
      return normalizeLocalidad(item);
    } catch (error) {
      console.error(`Error in localidadServerService.getLocalidadById(${id}):`, error);
      throw error;
    }
  },

  async createLocalidad(data: Partial<Localidad>): Promise<Localidad> {
    try {
      // Check if codigo already exists
      const existingCodigo = await prisma.$queryRaw`
        SELECT COUNT(*) as Cantidad 
        FROM Localidad 
        WHERE Localidad = ${data.LOCALIDAD}
      ` as any[];
      
      if (existingCodigo[0]?.Cantidad > 0) {
        throw new Error('Ya existe una localidad con este código');
      }

      // Parse ACTIVO value
      const activoVal = data.ACTIVO === '1' || data.ACTIVO === '0' ? parseInt(data.ACTIVO) : 1;

      // Insert new localidad
      await prisma.$executeRaw`
        INSERT INTO Localidad(Localidad,Nombre,Activo) 
        VALUES(${data.LOCALIDAD}, ${data.NOMBRE}, ${activoVal})
      `;

      // Log to BITACORA
      const sqlStatement = `INSERT INTO Localidad(Localidad,Nombre,Activo) VALUES('${data.LOCALIDAD}','${data.NOMBRE}',${activoVal})`;
      await prisma.$executeRaw`
        INSERT INTO BITACORA (Transaccion,Fecha,Usuario,UsuarioRed,Pc,Modulo,SentenciaSql,Tabla) 
        VALUES ('INSERT',getdate(),'SUPERVISORP:ALQADUEI30148','desarrollo06','ALQADUEI30148','ADMISION',${sqlStatement},'Localidad')
      `;

      // Return the created localidad
      return {
        LOCALIDAD: data.LOCALIDAD!,
        NOMBRE: data.NOMBRE!,
        UBIGEO: data.UBIGEO || '',
        ACTIVO: data.ACTIVO || '1'
      };
    } catch (error) {
      console.error('Error in localidadServerService.createLocalidad:', error);
      throw error;
    }
  },

  async updateLocalidad(id: string, data: Partial<Localidad>): Promise<Localidad | null> {
    try {
      // Check if localidad exists
      const existing = await this.getLocalidadById(id);
      if (!existing) {
        return null;
      }

      // Parse ACTIVO value
      const activoVal = data.ACTIVO === '1' || data.ACTIVO === '0' ? parseInt(data.ACTIVO) : 
                       (existing.ACTIVO === '1' ? 1 : 0);

      // Update localidad
      await prisma.$executeRaw`
        UPDATE Localidad 
        SET Nombre = ${data.NOMBRE || existing.NOMBRE},
            Ubigeo = ${data.UBIGEO || existing.UBIGEO || ''},
            Activo = ${activoVal}
        WHERE Localidad = ${id}
      `;

      // Log to BITACORA
      const sqlStatement = `UPDATE Localidad SET Nombre='${data.NOMBRE || existing.NOMBRE}',Ubigeo='${data.UBIGEO || existing.UBIGEO || ''}',Activo=${activoVal} WHERE Localidad='${id}'`;
      await prisma.$executeRaw`
        INSERT INTO BITACORA (Transaccion,Fecha,Usuario,UsuarioRed,Pc,Modulo,SentenciaSql,Tabla) 
        VALUES ('UPDATE',getdate(),'SUPERVISORP:ALQADUEI30148','desarrollo06','ALQADUEI30148','ADMISION',${sqlStatement},'Localidad')
      `;

      // Return updated localidad
      return await this.getLocalidadById(id);
    } catch (error) {
      console.error(`Error in localidadServerService.updateLocalidad(${id}):`, error);
      throw error;
    }
  },

  async deleteLocalidad(id: string): Promise<boolean> {
    try {
      // Check if localidad exists
      const existing = await this.getLocalidadById(id);
      if (!existing) {
        return false;
      }

      // Delete localidad
      await prisma.$executeRaw`DELETE FROM LOCALIDAD WHERE LOCALIDAD = ${id}`;
      return true;
    } catch (error) {
      console.error(`Error in localidadServerService.deleteLocalidad(${id}):`, error);
      throw error;
    }
  }
};
