import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface CitaSearchFilters {
  fechaDesde?: string
  fechaHasta?: string
  estado?: number
  consultorio?: string
  medico?: string
}

export interface CitaHistorial {
  id: string
  fecha: string
  hora: string
  estado: number
  consultorio: string
  consultorioNombre?: string
  medico: string
  medicoNombre?: string
  paciente: string
  documento?: string
  nombre: string
  numero?: string
  turno?: string
  observacion?: string
  seguro?: string
  seguroNombre?: string
  tipoConsulta?: string
  entidadSis?: string
  numRef?: string
}

export interface CitaSearchResult {
  content: CitaHistorial[]
  totalElements: number
  totalPages: number
  last: boolean
}

/**
 * Busca citas por documento o historia clínica del paciente
 */
export async function searchCitasByDocumento(
  documento: string,
  filters: CitaSearchFilters = {},
  page: number = 0,
  size: number = 10
): Promise<CitaSearchResult> {
  try {
    // Primero buscar el código de paciente por documento o historia
    const pacienteData = await prisma.$queryRaw<Array<{
      PACIENTE: string
      DOCUMENTO: string
      HISTORIA: string
    }>>`
      SELECT PACIENTE, DOCUMENTO, HISTORIA 
      FROM PACIENTE 
      WHERE DOCUMENTO = ${documento} OR HISTORIA = ${documento}
    `

    if (!pacienteData || pacienteData.length === 0) {
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        last: true
      }
    }

    const codigoPaciente = pacienteData[0].PACIENTE

    // Construir la consulta usando Prisma.sql
    const offset = page * size
    
    // Construir fragmentos de SQL dinámicamente
    const whereConditions: Prisma.Sql[] = [Prisma.sql`c.PACIENTE = ${codigoPaciente}`]
    
    if (filters.fechaDesde) {
      whereConditions.push(Prisma.sql`c.FECHA >= ${filters.fechaDesde}`)
    }
    
    if (filters.fechaHasta) {
      whereConditions.push(Prisma.sql`c.FECHA <= ${filters.fechaHasta}`)
    }
    
    if (filters.estado && filters.estado !== 0) {
      whereConditions.push(Prisma.sql`c.ESTADO = ${filters.estado}`)
    }
    
    if (filters.consultorio && filters.consultorio !== 'all') {
      whereConditions.push(Prisma.sql`c.CONSULTORIO = ${filters.consultorio}`)
    }
    
    if (filters.medico && filters.medico !== 'all') {
      whereConditions.push(Prisma.sql`c.MEDICO = ${filters.medico}`)
    }

    // Unir condiciones con AND
    const whereClause = Prisma.join(whereConditions, ' AND ')
    
    // Consulta principal con joins para obtener nombres
    const citas = await prisma.$queryRaw(Prisma.sql`
      SELECT * FROM (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY c.FECHA DESC, c.HORA DESC) as ROWNUM,
          c.CITA_ID,
          c.FECHA,
          c.HORA,
          c.ESTADO,
          c.CONSULTORIO,
          cons.NOMBRE as CONSULTORIO_NOMBRE,
          c.MEDICO,
          med.NOMBRE as MEDICO_NOMBRE,
          c.PACIENTE,
          p.DOCUMENTO,
          c.NOMBRE,
          c.NUMERO,
          c.ENTIDADSIS,
          c.NUMREF,
          c.TURNO_CONSULTA,
          c.OBSERVACION,
          c.SEGURO,
          s.NOMBRE as SEGURO_NOMBRE,
          c.TIPO_CITA
        FROM CITA c
        LEFT JOIN CONSULTORIO cons ON c.CONSULTORIO = cons.CONSULTORIO
        LEFT JOIN MEDICO med ON c.MEDICO = med.MEDICO
        LEFT JOIN PACIENTE p ON c.PACIENTE = p.PACIENTE
      LEFT JOIN SEGURO s ON c.SEGURO = s.SEGURO
        WHERE ${whereClause}
      ) subquery
      WHERE ROWNUM > ${offset} AND ROWNUM <= ${offset + size}
    `)

    // Contar total de registros
    const totalCount = await prisma.$queryRaw(Prisma.sql`
      SELECT COUNT(*) as TOTAL
      FROM CITA c
      LEFT JOIN PACIENTE p ON c.PACIENTE = p.PACIENTE
      WHERE ${whereClause}
    `)

    const total = totalCount[0]?.TOTAL || 0
    const totalPages = Math.ceil(total / size)

    // Mapear resultados
    const content: CitaHistorial[] = citas.map((cita: any) => ({
      id: cita.CITA_ID.toString(),
      fecha: cita.FECHA.toISOString().split('T')[0],
      hora: cita.HORA,
      estado: cita.ESTADO,
      consultorio: cita.CONSULTORIO,
      consultorioNombre: cita.CONSULTORIO_NOMBRE || undefined,
      medico: cita.MEDICO,
      medicoNombre: cita.MEDICO_NOMBRE || undefined,
      paciente: cita.PACIENTE,
      documento: cita.DOCUMENTO || undefined,
      nombre: cita.NOMBRE,
      numero: cita.NUMERO,
      entidadSis: cita.ENTIDADSIS,
      numRef: cita.NUMREF,
      turno: cita.TURNO_CONSULTA,
      observacion: cita.OBSERVACION || undefined,
      seguroNombre: cita.SEGURO_NOMBRE || undefined,
      seguro: cita.SEGURO || undefined,
      tipoConsulta: cita.TIPO_CITA || undefined
    }))

    return {
      content,
      totalElements: total,
      totalPages,
      last: page >= totalPages - 1
    }

  } catch (error) {
    console.error('Error searching citas by documento:', error)
    throw new Error('Error al buscar citas por documento')
  }
}

/**
 * Busca citas por apellidos y nombres del paciente
 */
export async function searchCitasByNombres(
  nombres: string,
  filters: CitaSearchFilters = {},
  page: number = 0,
  size: number = 10
): Promise<CitaSearchResult> {
  try {
    // Construir la consulta usando Prisma.sql
    const offset = page * size
    const nombrePattern = `%${nombres}%`
    
    // Construir fragmentos de SQL dinámicamente
    const whereConditions: Prisma.Sql[] = [Prisma.sql`UPPER(c.NOMBRE) LIKE UPPER(${nombrePattern})`]
    
    if (filters.fechaDesde) {
      whereConditions.push(Prisma.sql`c.FECHA >= ${filters.fechaDesde}`)
    }
    
    if (filters.fechaHasta) {
      whereConditions.push(Prisma.sql`c.FECHA <= ${filters.fechaHasta}`)
    }
    
    if (filters.estado && filters.estado !== 0) {
      whereConditions.push(Prisma.sql`c.ESTADO = ${filters.estado}`)
    }
    
    if (filters.consultorio && filters.consultorio !== 'all') {
      whereConditions.push(Prisma.sql`c.CONSULTORIO = ${filters.consultorio}`)
    }
    
    if (filters.medico && filters.medico !== 'all') {
      whereConditions.push(Prisma.sql`c.MEDICO = ${filters.medico}`)
    }

    // Unir condiciones con AND
    const whereClause = Prisma.join(whereConditions, ' AND ')

    // Consulta principal con joins para obtener nombres
    const citas = await prisma.$queryRaw(Prisma.sql`
      SELECT * FROM (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY c.FECHA DESC, c.HORA DESC) as ROWNUM,
          c.CITA_ID,
          c.FECHA,
          c.HORA,
          c.ESTADO,
          c.CONSULTORIO,
          cons.NOMBRE as CONSULTORIO_NOMBRE,
          c.MEDICO,
          med.NOMBRE as MEDICO_NOMBRE,
          c.PACIENTE,
          p.DOCUMENTO,
          c.NOMBRE,
          c.NUMERO,
          c.ENTIDADSIS,
          c.NUMREF,
          c.TURNO_CONSULTA,
          c.OBSERVACION,
          c.SEGURO, 
          c.TIPO_CITA,
          s.NOMBRE as SEGURO_NOMBRE
        FROM CITA c
        LEFT JOIN CONSULTORIO cons ON c.CONSULTORIO = cons.CONSULTORIO
        LEFT JOIN MEDICO med ON c.MEDICO = med.MEDICO
        LEFT JOIN PACIENTE p ON c.PACIENTE = p.PACIENTE
        LEFT JOIN SEGURO s ON c.SEGURO = s.SEGURO
        WHERE ${whereClause}
      ) subquery
      WHERE ROWNUM > ${offset} AND ROWNUM <= ${offset + size}
    `)

    // Contar total de registros
    const totalCount = await prisma.$queryRaw(Prisma.sql`
      SELECT COUNT(*) as TOTAL
      FROM CITA c
      LEFT JOIN PACIENTE p ON c.PACIENTE = p.PACIENTE
      WHERE ${whereClause}
    `)

    const total = totalCount[0]?.TOTAL || 0
    const totalPages = Math.ceil(total / size)

    // Mapear resultados
    const content: CitaHistorial[] = citas.map((cita: any) => ({
      id: cita.CITA_ID.toString(),
      fecha: cita.FECHA.toISOString().split('T')[0],
      hora: cita.HORA,
      estado: cita.ESTADO,
      consultorio: cita.CONSULTORIO,
      consultorioNombre: cita.CONSULTORIO_NOMBRE || undefined,
      medico: cita.MEDICO,
      medicoNombre: cita.MEDICO_NOMBRE || undefined,
      paciente: cita.PACIENTE,
      documento: cita.DOCUMENTO || undefined,
      nombre: cita.NOMBRE,
      numero: cita.NUMERO,
      entidadSis: cita.ENTIDADSIS,
      numRef: cita.NUMREF,
      turno: cita.TURNO_CONSULTA,
      observacion: cita.OBSERVACION || undefined,
      seguroNombre: cita.SEGURO_NOMBRE || undefined,
      seguro: cita.SEGURO || undefined,
      tipoConsulta: cita.TIPO_CITA || undefined
    }))

    return {
      content,
      totalElements: total,
      totalPages,
      last: page >= totalPages - 1
    }

  } catch (error) {
    console.error('Error searching citas by nombres:', error)
    throw new Error('Error al buscar citas por nombres')
  }
}

/**
 * Actualiza la FECHA_PAGO de una cita
 */
export async function updateFechaPago(
  citaId: string,
  fechaPago: Date
): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE CITA 
      SET FECHA_PAGO = ${fechaPago}
      WHERE CITA_ID = ${citaId}
    `

    console.log(`✅ FECHA_PAGO actualizada para cita ${citaId}`)
  } catch (error) {
    console.error('Error al actualizar FECHA_PAGO:', error)
    throw new Error('Error al actualizar fecha de pago de la cita')
  }
}
