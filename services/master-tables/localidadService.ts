import { prisma } from '@/lib/prisma';

export interface Localidad {
  LOCALIDAD: string;
  NOMBRE: string;
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
    const { nombre, codigo } = filters;

    try {
      let totalResult;
      let localidades;

      // Build WHERE conditions using raw SQL since LOCALIDAD has @@ignore directive
      if (nombre && !codigo) {
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM LOCALIDAD WHERE NOMBRE LIKE ${`%${nombre}%`}`;
        localidades = await prisma.$queryRaw`SELECT LOCALIDAD, NOMBRE, ACTIVO FROM LOCALIDAD WHERE NOMBRE LIKE ${`%${nombre}%`} ORDER BY NOMBRE OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
      } else if (!nombre && codigo) {
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM LOCALIDAD WHERE LOCALIDAD LIKE ${`%${codigo}%`}`;
        localidades = await prisma.$queryRaw`SELECT LOCALIDAD, NOMBRE, ACTIVO FROM LOCALIDAD WHERE LOCALIDAD LIKE ${`%${codigo}%`} ORDER BY NOMBRE OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
      } else {
        // No filters or multiple filters
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM LOCALIDAD`;
        localidades = await prisma.$queryRaw`SELECT LOCALIDAD, NOMBRE, ACTIVO FROM LOCALIDAD ORDER BY NOMBRE OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
      }

      const total = Number((totalResult as any)[0].total);

      return {
        data: localidades as Localidad[],
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
        SELECT LOCALIDAD, NOMBRE, ACTIVO
        FROM LOCALIDAD
        WHERE LOCALIDAD = ${id}
      `;

      if (!localidad || (Array.isArray(localidad) && localidad.length === 0)) {
        return null;
      }

      return Array.isArray(localidad) ? localidad[0] as Localidad : localidad as Localidad;
    } catch (error) {
      console.error(`Error in localidadServerService.getLocalidadById(${id}):`, error);
      throw error;
    }
  },

  async createLocalidad(data: Partial<Localidad>): Promise<Localidad> {
    try {
      // Check if localidad with same name already exists
      const existing = await prisma.$queryRaw`SELECT COUNT(*) as count FROM LOCALIDAD WHERE NOMBRE = ${data.NOMBRE}`;
      const exists = Number((existing as any)[0].count) > 0;

      if (exists) {
        throw new Error('Ya existe una localidad con este nombre');
      }

      // Insert new localidad
      await prisma.$executeRaw`
        INSERT INTO LOCALIDAD (NOMBRE, ACTIVO) 
        VALUES (${data.NOMBRE}, ${data.ACTIVO || "S"})
      `;

      // Return the created localidad
      return {
        LOCALIDAD: '', // Will be auto-generated
        NOMBRE: data.NOMBRE!,
        ACTIVO: data.ACTIVO || "S"
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

      // Update localidad
      await prisma.$executeRaw`
        UPDATE LOCALIDAD 
        SET NOMBRE = ${data.NOMBRE || existing.NOMBRE},
            ACTIVO = ${data.ACTIVO || existing.ACTIVO}
        WHERE LOCALIDAD = ${id}
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
