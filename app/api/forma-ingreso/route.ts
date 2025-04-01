import { NextRequest, NextResponse } from 'next/server'
import { formaIngresoService } from '@/services/emergencia/formaIngresoService'

export async function GET(_request: NextRequest) {
  try {
    const items = await formaIngresoService.findAll()
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error en API forma-ingreso:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos de FORMA_INGRESO' },
      { status: 500 }
    )
  }
}
