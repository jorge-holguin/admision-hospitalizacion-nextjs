import { NextResponse } from 'next/server'
import { entidadSisService } from '@/services/citas/entidadSisService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10) // default 10
    const search = searchParams.get('search') || undefined
    
    console.log('API: Obteniendo entidades SIS', { limit, search })
    
    const entidades = await entidadSisService.getEntidadesSis(limit, search)
    
    return NextResponse.json({
      success: true,
      data: entidades
    })
  } catch (error) {
    console.error('Error en API entidad-sis:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor' 
      }, 
      { status: 500 }
    )
  }
}
