import { NextRequest, NextResponse } from 'next/server'
import { seguroService } from '@/services/hospitalizacion/seguroService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const search = searchParams.get('search')
    
    console.log('API Seguros - Parámetros:', { code, search })
    
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
      
      // Si hay un término de búsqueda, filtrar los resultados
      if (search && search.trim() !== '') {
        const searchLower = search.toLowerCase()
        const filteredSeguros = seguros.filter(
          (s) => s.Nombre.toLowerCase().includes(searchLower)
        )
        console.log(`API Seguros - Filtrados: ${filteredSeguros.length} de ${seguros.length}`)
        return NextResponse.json(filteredSeguros)
      }
      
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
