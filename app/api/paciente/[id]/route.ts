import { NextRequest, NextResponse } from 'next/server'
import { pacienteService } from '@/services/pacienteService'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`API: Buscando paciente con ID: ${params.id}`)
    
    const paciente = await pacienteService.getPacienteById(params.id)
    if (!paciente) {
      return NextResponse.json({ 
        success: false, 
        message: 'Paciente no encontrado' 
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: paciente
    })
  } catch (error) {
    console.error('Error fetching paciente:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ 
      success: false, 
      message: 'Internal Server Error' 
    }, { status: 500 })
  }
}
