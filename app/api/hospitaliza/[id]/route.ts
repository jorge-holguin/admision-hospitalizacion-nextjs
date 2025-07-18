import { NextRequest, NextResponse } from 'next/server'
import { hospitalizaService } from '@/services/hospitalizaService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de hospitalización' },
        { status: 400 }
      )
    }
    
    const hospitalizacion = await hospitalizaService.getHospitalizacionById(id)
    
    if (!hospitalizacion) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: hospitalizacion })
  } catch (error) {
    console.error('Error en API de hospitalización:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos de hospitalización' },
      { status: 500 }
    )
  }
}
