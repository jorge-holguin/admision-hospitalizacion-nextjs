import { NextRequest, NextResponse } from 'next/server'
import { origenHospitalizacionService } from '@/services/origenHospitalizacionService'

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params
    console.log(`API: Buscando origen de hospitalización con ID: ${id}`)

    const origen = await origenHospitalizacionService.findOne(id)
    
    if (!origen) {
      return NextResponse.json(
        { error: 'Origen de hospitalización no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(origen)
  } catch (error) {
    console.error(`API Error en GET /api/origen-hospitalizacion/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Error al obtener el origen de hospitalización' },
      { status: 500 }
    )
  }
}
