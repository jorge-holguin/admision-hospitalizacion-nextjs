import { NextRequest, NextResponse } from 'next/server'
import { diagnosticoService } from '@/services/diagnosticoService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const limitParam = searchParams.get('limit')
    const origen = searchParams.get('origen')
    const codigo = searchParams.get('codigo')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined
    
    // Caso 1: Si se especifica origen y código, buscar diagnóstico específico
    if (origen && codigo) {
      console.log(`Buscando diagnóstico específico para origen ${origen} con código ${codigo}`)
      
      // Redirigir a la ruta específica para buscar por ID
      return NextResponse.redirect(new URL(`${request.nextUrl.origin}/api/diagnosticos/${codigo}`))
    }
    
    // Caso 2: Para búsqueda general, redirigir a la ruta de emergencia con parámetros
    console.log(`Redirigiendo solicitud a /api/diagnosticos/emergencia con search: ${search || 'ninguno'}, limit: ${limit || 'ninguno'}`)
    
    const url = new URL(request.nextUrl.origin + '/api/diagnosticos/emergencia')
    if (search) url.searchParams.set('search', search)
    if (limitParam) url.searchParams.set('limit', limitParam)
    
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Error en la ruta de diagnósticos:', error)
    return NextResponse.json(
      { error: `Error al obtener datos de diagnósticos: ${error}` },
      { status: 500 }
    )
  }
}
