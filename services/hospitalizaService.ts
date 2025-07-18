import { prisma } from '@/lib/prisma/client'

export interface Hospitaliza {
  IDHOSPITALIZACION: string
  PACIENTE: string
  NOMBRES: string
  CONSULTORIO1: string
  HORA1: string
  FECHA1: Date
  ORIGEN: string
  SEGURO: string
  MEDICO1: string
  ESTADO: string
  DIAGNOSTICO?: string
  USUARIO: string
  ORIGENID: string
  // Otros campos que puedan ser necesarios
  [key: string]: any
}

export interface HospitalizacionDetalle extends Hospitaliza {
  ORIGEN_NOMBRE?: string
  CONSULTORIO_NOMBRE?: string
  MEDICO_NOMBRE?: string
  SEGURO_NOMBRE?: string
  DIAGNOSTICO_NOMBRE?: string
}

export class HospitalizaService {
  async findByPacienteId(pacienteId: string) {
    try {
      // Intentar usar la consulta SQL directa
      const result = await prisma.$queryRaw<Hospitaliza[]>`
        SELECT * FROM HOSPITALIZA
        WHERE PACIENTE = ${pacienteId}
      `;
      
      return result;
    } catch (error) {
      console.error('Error al obtener datos de hospitalización:', error);
      return [];
    }
  }
  
  async checkEditableStatus(pacienteId: string) {
    try {
      // Verificar si existe un registro con ESTADO = '1' o ESTADO = '2' para este paciente
      const result = await prisma.$queryRaw<Hospitaliza[]>`
        SELECT * FROM HOSPITALIZA
        WHERE PACIENTE = ${pacienteId} AND (ESTADO = '1' OR ESTADO = '2')
      `;
      
      // Si hay al menos un registro con ESTADO = '1' o ESTADO = '2', se puede editar
      return result.length > 0;
    } catch (error) {
      console.error('Error al verificar estado editable:', error);
      return false; // Por defecto, no permitir edición si hay error
    }
  }
  
  async getHospitalizacionStatus(id: string): Promise<string | null> {
    try {
      const result = await prisma.$queryRaw<{ESTADO: string}[]>`
        SELECT ESTADO FROM HOSPITALIZA
        WHERE IDHOSPITALIZACION = ${id}
      `;
      
      if (result && result.length > 0) {
        return result[0].ESTADO;
      }
      
      return null;
    } catch (error) {
      console.error(`Error al obtener estado de hospitalización ${id}:`, error);
      return null;
    }
  }
  
  async isHospitalizacionEditable(id: string): Promise<boolean> {
    try {
      const estado = await this.getHospitalizacionStatus(id);
      // Solo es editable si el estado es '1' o '2'
      return estado === '1' || estado === '2';
    } catch (error) {
      console.error(`Error al verificar si hospitalización ${id} es editable:`, error);
      return false;
    }
  }

  async getHospitalizacionById(id: string): Promise<HospitalizacionDetalle | null> {
    try {
      // Obtener la hospitalización con todos los datos relacionados necesarios
      const result = await prisma.$queryRaw<HospitalizacionDetalle[]>`
        SELECT 
          h.IDHOSPITALIZACION,
          h.PACIENTE,
          h.NOMBRES,
          h.CONSULTORIO1,
          h.HORA1,
          h.FECHA1,
          h.ORIGEN,
          h.SEGURO,
          h.MEDICO1,
          h.ESTADO,
          h.DIAGNOSTICO,
          o.NOMBRE as ORIGEN_NOMBRE,
          c.NOMBRE as CONSULTORIO_NOMBRE,
          m.NOMBRES as MEDICO_NOMBRE,
          s.NOMBRE as SEGURO_NOMBRE,
          d.NOMBRE as DIAGNOSTICO_NOMBRE
        FROM HOSPITALIZA h
        LEFT JOIN ORIGEN_HOSPITALIZACION o ON h.ORIGEN = o.CODIGO
        LEFT JOIN CONSULTORIO c ON h.CONSULTORIO1 = c.CONSULTORIO
        LEFT JOIN MEDICOS m ON h.MEDICO1 = m.CODIGO
        LEFT JOIN SEGURO s ON h.SEGURO = s.SEGURO
        LEFT JOIN DIAGNOSTICO d ON h.DIAGNOSTICO = d.CODIGO
        WHERE h.IDHOSPITALIZACION = ${id}
      `;
      
      if (result && result.length > 0) {
        return result[0];
      }
      
      return null;
    } catch (error) {
      console.error(`Error al obtener hospitalización con ID ${id}:`, error);
      return null;
    }
  }
}

export const hospitalizaService = new HospitalizaService();
