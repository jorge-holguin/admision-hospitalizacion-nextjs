import { NextResponse } from 'next/server'
import { seguroService } from '@/services/citas/seguroService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const codCita = searchParams.get('codCita') || '1' // default to '1' if not provided
    
    console.log('API: Obteniendo seguros para citas', { codCita })
    
    const seguros = await seguroService.getSegurosByCodCita(codCita)
    
    return NextResponse.json({
      success: true,
      data: seguros
    })
  } catch (error) {
    console.error('Error en API seguros:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor' 
      }, 
      { status: 500 }
    )
  }
}
