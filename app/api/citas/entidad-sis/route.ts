import { NextResponse } from 'next/server'
import { entidadSisService } from '@/services/citas/entidadSisService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const search = searchParams.get('search')
    
    console.log('API: Obteniendo entidades SIS', { limit, search })
    
    const entidades = await entidadSisService.getEntidadesSis(
      limit ? parseInt(limit) : undefined,
      search || undefined
    )
    
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
