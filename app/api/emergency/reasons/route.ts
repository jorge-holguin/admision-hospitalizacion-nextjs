import { NextRequest, NextResponse } from 'next/server'
import { motivoEmergenciaService } from '@/services/emergencia/motivoEmergenciaService'

export async function GET(_request: NextRequest) {
  try {
    const items = await motivoEmergenciaService.findAll()
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error en API motivo-emergencia:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos de MOTIVO_EMERGENCIA' },
      { status: 500 }
    )
  }
}
