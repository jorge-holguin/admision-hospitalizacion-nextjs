import { NextRequest, NextResponse } from 'next/server'
import { seguroService } from '@/services/seguroService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    
    if (code) {
      // Si se proporciona un código, buscar un seguro específico
      const seguro = await seguroService.findByCode(code)
      
      if (!seguro) {
        return NextResponse.json({ error: 'Seguro no encontrado' }, { status: 404 })
      }
      
      return NextResponse.json(seguro)
    } else {
      // Si no se proporciona un código, devolver todos los seguros
      const seguros = await seguroService.findAll()
      return NextResponse.json(seguros)
    }
  } catch (error) {
    console.error('Error en la ruta de seguros:', error)
    return NextResponse.json(
      { error: `Error al obtener datos de seguros: ${error}` },
      { status: 500 }
    )
  }
}
