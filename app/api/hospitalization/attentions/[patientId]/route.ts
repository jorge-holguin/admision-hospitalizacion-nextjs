import { NextRequest, NextResponse } from 'next/server'
import { origenHospitalizacionService } from '@/services/hospitalizacion/origenHospitalizacionService'

interface Params {
  params: {
    patientId: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { patientId } = params
    console.log(`API: Buscando orígenes de hospitalización para el paciente con ID: ${patientId}`)

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const skip = parseInt(searchParams.get('skip') || '0', 10)
    const take = parseInt(searchParams.get('take') || '10', 10)
    const onlyPending = searchParams.get('onlyPending') === 'true'
    const origen = searchParams.get('origen') || undefined

    console.log(`📋 Parámetros: pacienteId=${patientId}, origen=${origen}, onlyPending=${onlyPending}, skip=${skip}, take=${take}`)

    // Buscar orígenes de hospitalización para el paciente específico
    const origenes = await origenHospitalizacionService.findAll({
      skip,
      take,
      search,
      pacienteId: patientId,
      origen
    })
    
    // Obtener el conteo total para paginación
    const total = await origenHospitalizacionService.count({
      search,
      pacienteId: patientId,
      origen
    })
    
    if (!origenes || origenes.length === 0) {
      return NextResponse.json(
        { 
          data: [],
          total: 0,
          message: 'No se encontraron orígenes de hospitalización para este paciente' 
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      data: origenes,
      total,
      message: `Se encontraron ${origenes.length} orígenes de hospitalización`
    })
  } catch (error) {
    console.error(`API Error en GET /api/hospitalization/attentions/${params.patientId}:`, error)
    return NextResponse.json(
      { error: 'Error al obtener los orígenes de hospitalización del paciente' },
      { status: 500 }
    )
  }
}
