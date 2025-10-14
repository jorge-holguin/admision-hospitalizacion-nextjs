import { NextRequest, NextResponse } from 'next/server';
import { medicoService } from '@/services/hospitalizacion/medicoService';

/**
 * GET /api/master-tables/medicos/search
 * Obtiene la lista de médicos, opcionalmente filtrados por consultorio o término de búsqueda
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const consultorio = searchParams.get('consultorio');
    const search = searchParams.get('search');
    const codigos = searchParams.get('codigos');
    const limit = searchParams.get('limit');
    
    let medicos;
    
    // Si se proporciona una lista de códigos, buscar médicos por esos códigos
    if (codigos) {
      const codigosList = codigos.split(',').map(c => c.trim()).filter(Boolean);
      medicos = await medicoService.findByCodigos(codigosList);
    }
    // Si se proporciona un consultorio, buscar médicos de ese consultorio
    else if (consultorio) {
      medicos = await medicoService.findByConsultorio(consultorio);
    } 
    // Si se proporciona un término de búsqueda, buscar médicos que coincidan
    else if (search) {
      medicos = await medicoService.search(search);
    } 
    // Si se especifica un límite, usar ese límite
    else if (limit) {
      const limitNum = parseInt(limit, 10) || 50;
      medicos = await medicoService.search('', limitNum);
    }
    // Si no se proporciona ningún filtro, devolver todos los médicos (limitado para rendimiento)
    else {
      medicos = await medicoService.search(''); // Usamos search con cadena vacía para limitar resultados
    }
    
    return NextResponse.json(medicos);
  } catch (error) {
    console.error('Error en API de médicos:', error);
    return NextResponse.json(
      { error: 'Error al obtener médicos' },
      { status: 500 }
    );
  }
}
