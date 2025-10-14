import { NextRequest, NextResponse } from 'next/server'
import { diagnosticoService } from '@/services/hospitalizacion/diagnosticoService'

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
      console.log(`📋 Buscando diagnóstico específico para origen ${origen} con código ${codigo}`)
      
      // Si el origen es CE (Consulta Externa), no buscar diagnóstico
      // Las consultas externas no tienen diagnósticos asociados en ATENCIOND
      if (origen === 'CE') {
        console.log(`⚠️ Origen CE detectado - No se busca diagnóstico para consultas externas`)
        return NextResponse.json({
          success: true,
          data: null,
          message: 'Las consultas externas no requieren diagnóstico'
        })
      }
      
      // Para EM (Emergencia), buscar el diagnóstico
      const diagnostico = await diagnosticoService.findByEmergenciaId(codigo.trim())
      
      if (!diagnostico) {
        return NextResponse.json(
          { 
            success: false,
            message: 'No se encontró diagnóstico para este ID',
            data: null
          },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: diagnostico
      })
    }
    
    // Caso 2: Para búsqueda general de diagnósticos (selector)
    console.log(`📋 Búsqueda general de diagnósticos con search: ${search || 'ninguno'}, limit: ${limit || 'ninguno'}`)
    
    const diagnosticos = await diagnosticoService.findAllEmergencia(search || undefined, limit)
    
    return NextResponse.json({
      success: true,
      data: diagnosticos,
      total: diagnosticos.length
    })
  } catch (error) {
    console.error('❌ Error en la ruta de diagnósticos:', error)
    return NextResponse.json(
      { 
        success: false,
        error: `Error al obtener datos de diagnósticos: ${error}`,
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
