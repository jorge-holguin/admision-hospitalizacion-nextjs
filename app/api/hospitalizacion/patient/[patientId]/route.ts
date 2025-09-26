import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    console.log('🏥 API: Obteniendo hospitalizaciones para paciente:', patientId)

    // Validar parámetros
    if (!patientId) {
      return NextResponse.json(
        { success: false, message: 'ID de paciente requerido' },
        { status: 400 }
      )
    }

    // Aquí deberías hacer la llamada a tu base de datos
    // Por ahora, devolvemos datos de ejemplo
    const mockHospitalizations = [
      {
        id: 'HOSP001',
        pacienteId: patientId,
        fechaIngreso: '2024-01-15',
        fechaAlta: null,
        consultorio: 'MEDICINA INTERNA',
        medico: 'Dr. García López',
        diagnostico: 'Hipertensión arterial',
        estado: 'activo',
        seguro: 'SIS',
        origen: 'EM'
      },
      {
        id: 'HOSP002',
        pacienteId: patientId,
        fechaIngreso: '2023-12-10',
        fechaAlta: '2023-12-15',
        consultorio: 'CARDIOLOGÍA',
        medico: 'Dr. Martínez Silva',
        diagnostico: 'Infarto agudo de miocardio',
        estado: 'alta',
        seguro: 'ESSALUD',
        origen: 'CE'
      }
    ]

    // Simular paginación
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedData = mockHospitalizations.slice(startIndex, endIndex)

    const response = {
      success: true,
      data: paginatedData,
      pagination: {
        page,
        pageSize,
        total: mockHospitalizations.length,
        totalPages: Math.ceil(mockHospitalizations.length / pageSize)
      }
    }

    console.log('✅ API: Hospitalizaciones obtenidas exitosamente:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ API: Error al obtener hospitalizaciones:', error)
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
