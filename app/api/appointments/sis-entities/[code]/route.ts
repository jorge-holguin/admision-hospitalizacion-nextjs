import { NextResponse } from 'next/server'
import { entidadSisService } from '@/services/citas/entidadSisService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    
    console.log('API: Obteniendo nombre de entidad SIS por código:', code)
    
    const entidad = await entidadSisService.getEntidadSisByCode(code)
    
    if (!entidad) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Entidad SIS no encontrada' 
        }, 
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: entidad
    })
  } catch (error) {
    console.error('Error en API entidad-sis by code:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor' 
      }, 
      { status: 500 }
    )
  }
}
