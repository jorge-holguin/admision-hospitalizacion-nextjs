import { NextRequest, NextResponse } from 'next/server'
import { filiacionService } from '@/services/hospitalizacion/filiacionService'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`API: Buscando filiación con ID: ${params.id}`)
    
    const filiacion = await filiacionService.getFiliacionById(params.id)
    if (!filiacion) {
      return NextResponse.json({ 
        success: false, 
        message: 'Filiación no encontrada' 
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: filiacion
    })
  } catch (error) {
    console.error('Error fetching filiación:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ 
      success: false, 
      message: 'Internal Server Error' 
    }, { status: 500 })
  }
}
