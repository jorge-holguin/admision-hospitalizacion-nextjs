import { NextRequest, NextResponse } from 'next/server'
import { ordenHospitalizacionService } from '@/services/ordenHospitalizacionService'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log(`API: Buscando orden de hospitalización con ID: ${id}`)
    
    const result = await ordenHospitalizacionService.getOrdenHospitalizacionById(id)
    
    if (!result) {
      return NextResponse.json({ error: 'Orden de hospitalización no encontrada' }, { status: 404 })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error fetching orden de hospitalización ${params.id}:`, error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
