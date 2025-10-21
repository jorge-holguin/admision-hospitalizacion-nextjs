import { NextRequest, NextResponse } from 'next/server'
import { updateFechaPago } from '@/services/citas/citasService'

/**
 * PATCH /api/appointments/[id]
 * Actualiza la FECHA_PAGO de una cita
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log(`📅 Actualizando FECHA_PAGO para cita ${id}...`)

    // Validar que venga la fecha de pago
    if (!body.FECHA_PAGO && !body.fechaPago) {
      return NextResponse.json(
        { error: 'FECHA_PAGO es requerida' },
        { status: 400 }
      )
    }

    const fechaPago = new Date(body.FECHA_PAGO || body.fechaPago)

    await updateFechaPago(id, fechaPago)

    return NextResponse.json({
      success: true,
      message: 'FECHA_PAGO actualizada exitosamente'
    })

  } catch (error: any) {
    const { id } = await params
    console.error(`❌ Error en PATCH /api/appointments/${id}:`, error)
    return NextResponse.json(
      { 
        error: error.message || 'Error al actualizar FECHA_PAGO',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
