import { NextRequest, NextResponse } from 'next/server'
import { filiacionService } from '@/services/hospitalizacion/filiacionService'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`API: Buscando filiación con ID: ${params.id}`)
    
    // Verificar que el ID sea válido
    if (!params.id || params.id.trim() === '') {
      console.error('ID inválido o vacío:', params.id)
      return NextResponse.json({ 
        success: false, 
        message: 'ID de paciente inválido' 
      }, { status: 400 })
    }
    
    const filiacion = await filiacionService.getFiliacionById(params.id)
    if (!filiacion) {
      console.log(`No se encontró filiación con ID: ${params.id}`)
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
    // Log detallado del error
    console.error(`Error detallado al buscar filiación con ID ${params.id}:`, error)
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message)
      console.error('Stack trace:', error.stack)
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
