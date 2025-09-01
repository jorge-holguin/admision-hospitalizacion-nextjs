import { NextRequest, NextResponse } from 'next/server'
import { origenHospitalizacionService } from '@/services/hospitalizacion/origenHospitalizacionService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const skip = parseInt(searchParams.get('skip') || '0')
    const take = parseInt(searchParams.get('take') || '10')
    const search = searchParams.get('search') || ''
    const pacienteId = searchParams.get('pacienteId') || ''

    console.log('API: Buscando orígenes de hospitalización con parámetros:', { skip, take, search, pacienteId })

    const items = await origenHospitalizacionService.findAll({ skip, take, search, pacienteId })
    const total = await origenHospitalizacionService.count({ search, pacienteId })

    return NextResponse.json({ items, total })
  } catch (error) {
    console.error('API Error en GET /api/origen-hospitalizacion:', error)
    return NextResponse.json(
      { error: 'Error al obtener orígenes de hospitalización' },
      { status: 500 }
    )
  }
}
