import { NextRequest, NextResponse } from 'next/server'
import { diagnosticoService } from '@/services/diagnosticoService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined
    
    console.log(`Recibida solicitud para obtener diagnósticos con ID: ${id}, search: ${search || 'ninguno'}, limit: ${limit || 'ninguno'}`)
    
    // Caso 1: Si el ID es 'emergencia', devolver la lista de diagnósticos de emergencia con búsqueda y límite
    if (id === 'emergencia') {
      console.log(`Obteniendo lista de diagnósticos de emergencia con búsqueda: ${search || 'ninguno'} y límite: ${limit || 'ninguno'}`)
      const diagnosticos = await diagnosticoService.findAllEmergencia(search || undefined, limit)
      return NextResponse.json(diagnosticos)
    }
    
    // Caso 2: Si no es 'emergencia', buscar diagnóstico específico por ID (puede ser EM o CE)
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere ID de diagnóstico' },
        { status: 400 }
      )
    }
    
    console.log(`Buscando diagnóstico específico por ID: ${id} (puede ser EM o CE)`)
    const diagnostico = await diagnosticoService.findById(id)
    
    if (!diagnostico) {
      // Si no se encuentra un diagnóstico específico, devolvemos un 404
      // El frontend habilitará la búsqueda general cuando reciba este 404
      console.log(`No se encontró diagnóstico con ID: ${id}. El frontend habilitará la búsqueda general.`)
      return NextResponse.json(
        { error: `No se encontró diagnóstico con ID: ${id}` },
        { status: 404 }
      )
    }
    
    console.log(`Diagnóstico encontrado: ${diagnostico.Codigo} - ${diagnostico.Nombre}`)
    return NextResponse.json(diagnostico)
  } catch (error) {
    console.error(`Error al obtener diagnóstico por ID:`, error)
    return NextResponse.json(
      { error: `Error al obtener diagnóstico: ${error}` },
      { status: 500 }
    )
  }
}
