import { NextRequest, NextResponse } from 'next/server'
import { archivoMovService } from '@/services/appointments/archivoMovService'

/**
 * POST /api/appointments/archivo-mov
 * Crea un nuevo registro en ARCHIVO_MOV
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar campos requeridos
    const requiredFields = ['ID_CITA', 'PACIENTE', 'HISTORIA', 'NOMBRES', 'FECHA', 'HORA', 'CONSULTORIO', 'TURNO', 'MOTIVO', 'ESTADO', 'SEGURO']
    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Campos requeridos faltantes: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Las fechas deben venir en formato DD/MM/YYYY desde el frontend
    // No hacemos conversiones aquí, solo validamos que existan
    const resultado = await archivoMovService.create(body)

    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'Registro ARCHIVO_MOV creado exitosamente'
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Error en POST /api/appointments/archivo-mov:', error)
    
    // Detectar error de duplicado (ID_CITA ya existe)
    if (error.code === 'P2002' || error.message?.includes('unique constraint')) {
      return NextResponse.json(
        { 
          error: 'Ya existe un registro con este ID_CITA',
          code: 'DUPLICATE_ID_CITA'
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        error: error.message || 'Error al crear registro ARCHIVO_MOV',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/appointments/archivo-mov?paciente=xxx
 * Busca registros por PACIENTE
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pacienteId = searchParams.get('paciente')

    if (!pacienteId) {
      return NextResponse.json(
        { error: 'Parámetro "paciente" es requerido' },
        { status: 400 }
      )
    }

    const registros = await archivoMovService.findByPaciente(pacienteId)

    return NextResponse.json({
      success: true,
      data: registros,
      count: registros.length
    })

  } catch (error: any) {
    console.error('❌ Error en GET /api/appointments/archivo-mov:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Error al buscar registros',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
