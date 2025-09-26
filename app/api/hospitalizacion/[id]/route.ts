import { NextRequest, NextResponse } from 'next/server'

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

    // Aquí deberías hacer la llamada a tu base de datos
    // Por ahora, devolvemos datos de ejemplo
    const mockHospitalization = {
      id: id,
      pacienteId: 'PAC001',
      fechaIngreso: '2024-01-15',
      horaIngreso: '14:30',
      fechaAlta: null,
      horaAlta: null,
      consultorio: 'MEDICINA INTERNA',
      consultorios: 'MED001',
      medico: 'Dr. García López',
      medicoId: 'MED001',
      diagnostico: 'Hipertensión arterial',
      diagnosticoId: 'I10',
      estado: 'activo',
      seguro: 'SIS',
      seguroId: 'SIS001',
      origen: 'EM',
      origenId: 'EM',
      procedencia: 'Emergencia',
      observaciones: 'Paciente estable, requiere monitoreo',
      // Datos del paciente
      pacienteNombre: 'Juan Pérez García',
      pacienteDocumento: '12345678',
      pacienteHistoria: 'HC001234'
    }

    const response = {
      success: true,
      data: mockHospitalization
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

    // Aquí deberías hacer la actualización en tu base de datos
    // Por ahora, simulamos una actualización exitosa
    const updatedHospitalization = {
      ...body,
      id: id,
      fechaModificacion: new Date().toISOString()
    }

    const response = {
      success: true,
      data: updatedHospitalization,
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
