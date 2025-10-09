import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'

// Configuración de la base de datos
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    console.log('🏥 API: Obteniendo hospitalización:', id)

    // Validar parámetros
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID de hospitalización requerido' },
        { status: 400 }
      )
    }

    // Conectar a la base de datos
    const pool = await sql.connect(dbConfig)
    
    // Consultar la hospitalización por ID
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query(`
        SELECT 
          IDHOSPITALIZACION,
          PACIENTE,
          NOMBRES,
          CONSULTORIO1,
          HORA1,
          FECHA1,
          ORIGEN,
          SEGURO,
          MEDICO1,
          ESTADO,
          FECHORA_LIQUIDACION,
          USUARIO_IMP,
          PLACA,
          POLIZA
        FROM HOSPITALIZACION 
        WHERE IDHOSPITALIZACION = @id
      `)

    await pool.close()

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Hospitalización no encontrada' },
        { status: 404 }
      )
    }

    const hospitalization = result.recordset[0]
    
    // Formatear los datos para que coincidan con la interfaz esperada
    const formattedData = {
      id: hospitalization.IDHOSPITALIZACION?.toString().trim(),
      pacienteId: hospitalization.PACIENTE?.toString().trim(),
      nombres: hospitalization.NOMBRES?.trim(),
      consultorio: hospitalization.CONSULTORIO1?.toString().trim(),
      hora: hospitalization.HORA1?.trim(),
      fecha: hospitalization.FECHA1,
      origen: hospitalization.ORIGEN?.trim(),
      seguro: hospitalization.SEGURO?.toString().trim(),
      medico: hospitalization.MEDICO1?.trim(),
      estado: hospitalization.ESTADO?.toString().trim(),
      fechaLiquidacion: hospitalization.FECHORA_LIQUIDACION,
      usuarioImp: hospitalization.USUARIO_IMP?.trim(),
      placa: hospitalization.PLACA?.trim(),
      poliza: hospitalization.POLIZA?.trim(),
      
      // Campos adicionales para compatibilidad con la interfaz
      fechaIngreso: hospitalization.FECHA1 ? new Date(hospitalization.FECHA1).toISOString().split('T')[0] : null,
      horaIngreso: hospitalization.HORA1?.trim(),
      fechaAlta: null, // Se puede agregar si existe en la tabla
      horaAlta: null,  // Se puede agregar si existe en la tabla
      
      // Mapear campos para compatibilidad
      IDHOSPITALIZACION: hospitalization.IDHOSPITALIZACION?.toString().trim(),
      PACIENTE: hospitalization.PACIENTE?.toString().trim(),
      NOMBRES: hospitalization.NOMBRES?.trim(),
      CONSULTORIO: hospitalization.CONSULTORIO1?.toString().trim(),
      HORA: hospitalization.HORA1?.trim(),
      FECHA: hospitalization.FECHA1,
      ORIGEN: hospitalization.ORIGEN?.trim(),
      SEGURO: hospitalization.SEGURO?.toString().trim(),
      MEDICO: hospitalization.MEDICO1?.trim(),
      ESTADO: hospitalization.ESTADO?.toString().trim()
    }

    const response = {
      success: true,
      data: formattedData
    }

    console.log('✅ API: Hospitalización obtenida exitosamente:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ API: Error al obtener hospitalización:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    console.log('🏥 API: Actualizando hospitalización:', id, body)

    // Validar parámetros
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID de hospitalización requerido' },
        { status: 400 }
      )
    }

    // Conectar a la base de datos
    const pool = await sql.connect(dbConfig)
    
    // Preparar los campos para actualizar
    const updateFields = []
    const dbRequest = pool.request().input('id', sql.VarChar, id)
    
    // Mapear los campos del body a los campos de la base de datos
    if (body.pacienteId) {
      updateFields.push('PACIENTE = @paciente')
      dbRequest.input('paciente', sql.VarChar, body.pacienteId)
    }
    
    if (body.nombres) {
      updateFields.push('NOMBRES = @nombres')
      dbRequest.input('nombres', sql.VarChar, body.nombres)
    }
    
    if (body.consultorio) {
      updateFields.push('CONSULTORIO1 = @consultorio')
      dbRequest.input('consultorio', sql.VarChar, body.consultorio)
    }
    
    if (body.hora) {
      updateFields.push('HORA1 = @hora')
      dbRequest.input('hora', sql.VarChar, body.hora)
    }
    
    if (body.fecha) {
      updateFields.push('FECHA1 = @fecha')
      dbRequest.input('fecha', sql.DateTime, new Date(body.fecha))
    }
    
    if (body.origen) {
      updateFields.push('ORIGEN = @origen')
      dbRequest.input('origen', sql.VarChar, body.origen)
    }
    
    if (body.seguro) {
      updateFields.push('SEGURO = @seguro')
      dbRequest.input('seguro', sql.VarChar, body.seguro)
    }
    
    if (body.medico) {
      updateFields.push('MEDICO1 = @medico')
      dbRequest.input('medico', sql.VarChar, body.medico)
    }
    
    if (body.estado) {
      updateFields.push('ESTADO = @estado')
      dbRequest.input('estado', sql.VarChar, body.estado)
    }

    // Solo ejecutar la actualización si hay campos para actualizar
    if (updateFields.length === 0) {
      await pool.close()
      return NextResponse.json(
        { success: false, message: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    // Ejecutar la actualización
    const updateQuery = `
      UPDATE HOSPITALIZACION 
      SET ${updateFields.join(', ')}
      WHERE IDHOSPITALIZACION = @id
    `
    
    const result = await dbRequest.query(updateQuery)
    
    // Obtener los datos actualizados
    const selectResult = await pool.request()
      .input('selectId', sql.VarChar, id)
      .query(`
        SELECT 
          IDHOSPITALIZACION,
          PACIENTE,
          NOMBRES,
          CONSULTORIO1,
          HORA1,
          FECHA1,
          ORIGEN,
          SEGURO,
          MEDICO1,
          ESTADO,
          FECHORA_LIQUIDACION,
          USUARIO_IMP,
          PLACA,
          POLIZA
        FROM HOSPITALIZACION 
        WHERE IDHOSPITALIZACION = @selectId
      `)

    await pool.close()

    if (selectResult.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Hospitalización no encontrada después de la actualización' },
        { status: 404 }
      )
    }

    const updatedHospitalization = selectResult.recordset[0]
    
    // Formatear los datos actualizados
    const formattedData = {
      id: updatedHospitalization.IDHOSPITALIZACION?.toString().trim(),
      pacienteId: updatedHospitalization.PACIENTE?.toString().trim(),
      nombres: updatedHospitalization.NOMBRES?.trim(),
      consultorio: updatedHospitalization.CONSULTORIO1?.toString().trim(),
      hora: updatedHospitalization.HORA1?.trim(),
      fecha: updatedHospitalization.FECHA1,
      origen: updatedHospitalization.ORIGEN?.trim(),
      seguro: updatedHospitalization.SEGURO?.toString().trim(),
      medico: updatedHospitalization.MEDICO1?.trim(),
      estado: updatedHospitalization.ESTADO?.toString().trim(),
      
      // Campos adicionales para compatibilidad
      IDHOSPITALIZACION: updatedHospitalization.IDHOSPITALIZACION?.toString().trim(),
      PACIENTE: updatedHospitalization.PACIENTE?.toString().trim(),
      NOMBRES: updatedHospitalization.NOMBRES?.trim(),
      CONSULTORIO: updatedHospitalization.CONSULTORIO1?.toString().trim(),
      HORA: updatedHospitalization.HORA1?.trim(),
      FECHA: updatedHospitalization.FECHA1,
      ORIGEN: updatedHospitalization.ORIGEN?.trim(),
      SEGURO: updatedHospitalization.SEGURO?.toString().trim(),
      MEDICO: updatedHospitalization.MEDICO1?.trim(),
      ESTADO: updatedHospitalization.ESTADO?.toString().trim()
    }

    const response = {
      success: true,
      data: formattedData,
      message: 'Hospitalización actualizada exitosamente'
    }

    console.log('✅ API: Hospitalización actualizada exitosamente:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ API: Error al actualizar hospitalización:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
