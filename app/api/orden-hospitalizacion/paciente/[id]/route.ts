import { NextRequest, NextResponse } from 'next/server'
import { ordenHospitalizacionService } from '@/services/ordenHospitalizacionService'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pacienteId = params.id
    console.log(`API: Buscando órdenes de hospitalización para paciente: ${pacienteId}`)
    
    const result = await ordenHospitalizacionService.getOrdenHospitalizacionByPaciente(pacienteId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error fetching órdenes de hospitalización para paciente ${params.id}:`, error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
