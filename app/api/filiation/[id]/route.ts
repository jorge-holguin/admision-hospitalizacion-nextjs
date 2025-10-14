import { NextRequest, NextResponse } from 'next/server'
import { filiacionService } from '@/services/emergencia/filiacion2Service'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`API: Buscando filiación con ID: ${id}`)
    
    // Verificar que el ID sea válido
    if (!id || id.trim() === '') {
      console.error('ID inválido o vacío:', id)
      return NextResponse.json({ 
        success: false, 
        message: 'ID de paciente inválido' 
      }, { status: 400 })
    }
    
    const filiacion = await filiacionService.getFiliacionById(id)
    if (!filiacion) {
      console.log(`No se encontró filiación con ID: ${id}`)
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
    const { id } = await params
    console.error(`Error detallado al buscar filiación con ID ${id}:`, error)
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
