import { prisma } from '@/lib/prisma';

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

// Client-side service for frontend components
export const medicoService = {
  async getMedicos(page: number = 1, pageSize: number = 10, filters: MedicoFilters = {}): Promise<PaginatedResponse<Medico>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...filters
    });

    const response = await fetch(`/api/master-tables/medicos?${params}`);
    if (!response.ok) {
      throw new Error('Error al obtener médicos');
    }
    return response.json();
  },

  async createMedico(data: Partial<Medico>): Promise<Medico> {
    const response = await fetch('/api/master-tables/medicos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear médico');
    }
    return response.json();
  },

  async updateMedico(id: string, data: Partial<Medico>): Promise<Medico> {
    const response = await fetch(`/api/master-tables/medicos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar médico');
    }
    return response.json();
  },

  async deleteMedico(id: string): Promise<void> {
    const response = await fetch(`/api/master-tables/medicos/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar médico');
    }
  }
};

// Server-side service for API routes
export const medicoServerService = {
  async getMedicos(
    page: number = 1,
    pageSize: number = 10,
    filters: MedicoFilters = {}
  ): Promise<PaginatedResponse<Medico>> {
    const skip = (page - 1) * pageSize;
    const { search, consultorio, nombre, dni } = filters;

    try {
      let totalResult;
      let medicos;

      // Build WHERE conditions
      if (search && !consultorio && !nombre && !dni) {
        // General search across multiple fields
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO 
          WHERE NOMBRE LIKE ${`%${search}%`} 
          OR MEDICO LIKE ${`%${search}%`}
          OR DNI LIKE ${`%${search}%`}
        `;
        medicos = await prisma.$queryRaw`
          SELECT ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI, TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO 
          FROM MEDICO 
          WHERE NOMBRE LIKE ${`%${search}%`} 
          OR MEDICO LIKE ${`%${search}%`}
          OR DNI LIKE ${`%${search}%`}
          ORDER BY NOMBRE 
          OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY
        `;
      } else if (!search && consultorio && !nombre && !dni) {
        // Filter by consultorio
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO 
          WHERE CONSULTORIO = ${consultorio}
        `;
        medicos = await prisma.$queryRaw`
          SELECT ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI, TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO 
          FROM MEDICO 
          WHERE CONSULTORIO = ${consultorio}
          ORDER BY NOMBRE 
          OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY
        `;
      } else if (!search && !consultorio && nombre && !dni) {
        // Filter by name
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO 
          WHERE NOMBRE LIKE ${`%${nombre}%`}
        `;
        medicos = await prisma.$queryRaw`
          SELECT ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI, TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO 
          FROM MEDICO 
          WHERE NOMBRE LIKE ${`%${nombre}%`}
          ORDER BY NOMBRE 
          OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY
        `;
      } else if (!search && !consultorio && !nombre && dni) {
        // Filter by DNI
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO 
          WHERE DNI LIKE ${`%${dni}%`}
        `;
        medicos = await prisma.$queryRaw`
          SELECT ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI, TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO 
          FROM MEDICO 
          WHERE DNI LIKE ${`%${dni}%`}
          ORDER BY NOMBRE 
          OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY
        `;
      } else {
        // No filters or multiple filters - return all
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM MEDICO`;
        medicos = await prisma.$queryRaw`
          SELECT ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI, TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO 
          FROM MEDICO 
          ORDER BY NOMBRE 
          OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY
        `;
      }

      const total = Number((totalResult as any)[0].total);

      return {
        data: medicos as Medico[],
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
        SELECT ID_MEDICO, MEDICO, NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI, TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO
        FROM MEDICO
        WHERE MEDICO = ${id}
      `;

      if (!medico || (Array.isArray(medico) && medico.length === 0)) {
        return null;
      }

      return Array.isArray(medico) ? medico[0] as Medico : medico as Medico;
    } catch (error) {
      console.error(`Error in medicoServerService.getMedicoById(${id}):`, error);
      throw error;
    }
  },

  async createMedico(data: Partial<Medico>): Promise<Medico> {
    try {
      // Check if medico with same DNI already exists
      if (data.DNI) {
        const existing = await prisma.$queryRaw`SELECT COUNT(*) as count FROM MEDICO WHERE DNI = ${data.DNI}`;
        const exists = Number((existing as any)[0].count) > 0;

        if (exists) {
          throw new Error('Ya existe un médico con este DNI');
        }
      }

      // Insert new medico
      await prisma.$executeRaw`
        INSERT INTO MEDICO (NOMBRE, NOMBRES, APATERNO, AMATERNO, DNI, TIPO_DOCUMENTO, ESPECIALIDAD, CONSULTORIO, ACTIVO) 
        VALUES (${data.NOMBRE}, ${data.NOMBRES || ""}, ${data.APATERNO || ""}, ${data.AMATERNO || ""}, ${data.DNI || ""}, ${data.TIPO_DOCUMENTO || "D"}, ${data.ESPECIALIDAD || ""}, ${data.CONSULTORIO || ""}, ${data.ACTIVO || "S"})
      `;

      // Return the created medico
      return {
        MEDICO: '', // Will be auto-generated
        NOMBRE: data.NOMBRE!,
        NOMBRES: data.NOMBRES || "",
        APATERNO: data.APATERNO || "",
        AMATERNO: data.AMATERNO || "",
        DNI: data.DNI || "",
        TIPO_DOCUMENTO: data.TIPO_DOCUMENTO || "D",
        ESPECIALIDAD: data.ESPECIALIDAD || "",
        CONSULTORIO: data.CONSULTORIO || "",
        ACTIVO: data.ACTIVO || "S"
      };
    } catch (error) {
      console.error('Error in medicoServerService.createMedico:', error);
      throw error;
    }
  },

  async updateMedico(id: string, data: Partial<Medico>): Promise<Medico | null> {
    try {
      // Check if medico exists
      const existing = await this.getMedicoById(id);
      if (!existing) {
        return null;
      }

      // Update medico
      await prisma.$executeRaw`
        UPDATE MEDICO 
        SET NOMBRE = ${data.NOMBRE || existing.NOMBRE},
            NOMBRES = ${data.NOMBRES || existing.NOMBRES || ""},
            APATERNO = ${data.APATERNO || existing.APATERNO || ""},
            AMATERNO = ${data.AMATERNO || existing.AMATERNO || ""},
            DNI = ${data.DNI || existing.DNI || ""},
            TIPO_DOCUMENTO = ${data.TIPO_DOCUMENTO || existing.TIPO_DOCUMENTO || "D"},
            ESPECIALIDAD = ${data.ESPECIALIDAD || existing.ESPECIALIDAD || ""},
            CONSULTORIO = ${data.CONSULTORIO || existing.CONSULTORIO || ""},
            ACTIVO = ${data.ACTIVO || existing.ACTIVO}
        WHERE MEDICO = ${id}
      `;

      // Return updated medico
      return await this.getMedicoById(id);
    } catch (error) {
      console.error(`Error in medicoServerService.updateMedico(${id}):`, error);
      throw error;
    }
  },

  async deleteMedico(id: string): Promise<boolean> {
    try {
      // Check if medico exists
      const existing = await this.getMedicoById(id);
      if (!existing) {
        return false;
      }

      // Delete medico
      await prisma.$executeRaw`DELETE FROM MEDICO WHERE MEDICO = ${id}`;
      return true;
    } catch (error) {
      console.error(`Error in medicoServerService.deleteMedico(${id}):`, error);
      throw error;
    }
  }
};
