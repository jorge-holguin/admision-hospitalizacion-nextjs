import { NextRequest, NextResponse } from 'next/server'
import { hospitalizaService } from '@/services/hospitalizaService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pacienteId = searchParams.get('pacienteId')
    
    if (!pacienteId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del paciente' },
        { status: 400 }
      )
    }
    
    const isEditable = await hospitalizaService.checkEditableStatus(pacienteId)
    
    return NextResponse.json({ isEditable })
  } catch (error) {
    console.error('Error en API de hospitalización:', error)
    return NextResponse.json(
      { error: 'Error al verificar estado editable' },
      { status: 500 }
    )
  }
}
