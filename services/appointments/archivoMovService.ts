import { prisma } from '@/lib/prisma'

/**
 * Interface para crear un nuevo registro en ARCHIVO_MOV
 */
export interface CreateArchivoMovParams {
  ID_CITA: string        // '250197163'
  PACIENTE: string       // '2025352999'
  HISTORIA: string       // '73101361'
  NOMBRES: string        // 'HOLGUIN CUCALON JORGE ALBERTO'
  FECHA: string | Date   // new Date('2025-10-21') o '2025-10-21'
  HORA: string           // '02:52 PM'
  ORIGEN?: string        // 'CE'
  CONSULTORIO: string    // '6081  '
  TURNO: string          // 'M '
  MOTIVO: string         // '01'
  ESTADO: string         // '1'
  SEGURO: string         // '05'
  MEDICO?: string        // 'OSA'
  NUMERO?: string        // '01'
  FECHA_PAGO?: string | Date  // new Date('2025-10-21') o '2025-10-21'
  TIPO_CITA?: string     // 'C'
  EST_PAC?: string       // '1'
  TIPO_PACIENTE?: string // 'C'
}

/**
 * Interface para actualizar FECHA_PAGO y ESTADO
 */
export interface UpdateFechaPagoParams {
  ID_CITA: string
  FECHA_PAGO: string | Date
  ESTADO: string  // '3' = Pagado
}

/**
 * Servicio para manejar operaciones de ARCHIVO_MOV
 */
export const archivoMovService = {
  /**
   * Crea un nuevo registro en ARCHIVO_MOV
   */
  async create(params: CreateArchivoMovParams): Promise<any> {
    try {      // Convertir fechas si vienen como string
      let fecha = params.FECHA
      if (typeof fecha === 'string') {
        fecha = new Date(fecha)
      }

      let fechaPago = params.FECHA_PAGO
      if (fechaPago && typeof fechaPago === 'string') {
        fechaPago = new Date(fechaPago)
      }

      // Usar $executeRaw para evitar problemas con SQL Server 2008 R2
      await prisma.$executeRaw`
        INSERT INTO ARCHIVO_MOV (
          ID_CITA, PACIENTE, HISTORIA, NOMBRES, FECHA, HORA,
          ORIGEN, CONSULTORIO, TURNO, MOTIVO, ESTADO, SEGURO,
          MEDICO, NUMERO, FECHA_PAGO, TIPO_CITA, EST_PAC, TIPO_PACIENTE
        ) VALUES (
          ${params.ID_CITA},
          ${params.PACIENTE},
          ${params.HISTORIA},
          ${params.NOMBRES},
          ${fecha},
          ${params.HORA},
          ${params.ORIGEN || 'CE'},
          ${params.CONSULTORIO},
          ${params.TURNO},
          ${params.MOTIVO},
          ${params.ESTADO},
          ${params.SEGURO},
          ${params.MEDICO || ''},
          ${params.NUMERO || '01'},
          ${fechaPago},
          ${params.TIPO_CITA || 'C'},
          ${params.EST_PAC || '1'},
          ${params.TIPO_PACIENTE || 'C'}
        )
      `      return { ID_CITA: params.ID_CITA }
    } catch (error) {
      console.error('❌ Error al crear registro en ARCHIVO_MOV:', error)
      throw error
    }
  },

  /**
   * Actualiza la FECHA_PAGO y ESTADO de un registro existente
   */
  async updateFechaPago(params: UpdateFechaPagoParams): Promise<any> {
    try {      // Convertir fecha si viene como string
      let fechaPago = params.FECHA_PAGO
      if (typeof fechaPago === 'string') {
        fechaPago = new Date(fechaPago)
      }

      await prisma.$executeRaw`
        UPDATE ARCHIVO_MOV
        SET FECHA_PAGO = ${fechaPago}, ESTADO = ${params.ESTADO}
        WHERE ID_CITA = ${params.ID_CITA}
      `      return { ID_CITA: params.ID_CITA }
    } catch (error) {
      console.error('❌ Error al actualizar FECHA_PAGO y ESTADO:', error)
      throw error
    }
  },

  /**
   * Busca un registro por ID_CITA
   */
  async findById(idCita: string): Promise<any | null> {
    try {
      const archivoMov = await prisma.aRCHIVO_MOV.findUnique({
        where: {
          ID_CITA: idCita
        }
      })

      return archivoMov
    } catch (error) {
      console.error('❌ Error al buscar ARCHIVO_MOV:', error)
      throw error
    }
  },

  /**
   * Verifica si existe un registro para una cita
   */
  async exists(idCita: string): Promise<boolean> {
    try {
      const count = await prisma.aRCHIVO_MOV.count({
        where: {
          ID_CITA: idCita
        }
      })

      return count > 0
    } catch (error) {
      console.error('❌ Error al verificar existencia de ARCHIVO_MOV:', error)
      throw error
    }
  },

  /**
   * Busca registros por PACIENTE
   */
  async findByPaciente(pacienteId: string): Promise<any[]> {
    try {
      const registros = await prisma.aRCHIVO_MOV.findMany({
        where: {
          PACIENTE: pacienteId
        },
        orderBy: {
          FECHA: 'desc'
        }
      })

      return registros
    } catch (error) {
      console.error('❌ Error al buscar registros por paciente:', error)
      throw error
    }
  },

  /**
   * Actualiza el estado de un registro
   */
  async updateEstado(idCita: string, estado: string, usuarior?: string): Promise<any> {
    try {      const updated = await prisma.aRCHIVO_MOV.update({
        where: {
          ID_CITA: idCita
        },
        data: {
          ESTADO: estado,
          USUARIOR: usuarior
        }
      })      return updated
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error)
      throw error
    }
  },

  /**
   * Actualiza observaciones de salida
   */
  async updateSalida(
    idCita: string, 
    fechaSal: Date, 
    horaSal: string, 
    observa1?: string,
    usuarior?: string
  ): Promise<any> {
    try {      const updated = await prisma.aRCHIVO_MOV.update({
        where: {
          ID_CITA: idCita
        },
        data: {
          FECHA_SAL: fechaSal,
          HORA_SAL: horaSal,
          OBSERVA1: observa1,
          USUARIOR: usuarior
        }
      })      return updated
    } catch (error) {
      console.error('❌ Error al registrar salida:', error)
      throw error
    }
  },

  /**
   * Actualiza observaciones de ingreso
   */
  async updateIngreso(
    idCita: string,
    fechaIng: Date,
    horaIng: string,
    observa2?: string,
    usuarior?: string
  ): Promise<any> {
    try {      const updated = await prisma.aRCHIVO_MOV.update({
        where: {
          ID_CITA: idCita
        },
        data: {
          FECHA_ING: fechaIng,
          HORA_ING: horaIng,
          OBSERVA2: observa2,
          USUARIOR: usuarior
        }
      })      return updated
    } catch (error) {
      console.error('❌ Error al registrar ingreso:', error)
      throw error
    }
  }
}
