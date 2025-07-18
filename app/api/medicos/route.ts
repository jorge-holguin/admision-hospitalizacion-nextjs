import { NextRequest, NextResponse } from 'next/server';
import { medicoService } from '@/services/medicoService';

/**
 * GET /api/medicos
 * Obtiene la lista de médicos, opcionalmente filtrados por consultorio o término de búsqueda
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const consultorio = searchParams.get('consultorio');
    const search = searchParams.get('search');
    
    let medicos;
    
    // Si se proporciona un consultorio, buscar médicos de ese consultorio
    if (consultorio) {
      medicos = await medicoService.findByConsultorio(consultorio);
    } 
    // Si se proporciona un término de búsqueda, buscar médicos que coincidan
    else if (search) {
      medicos = await medicoService.search(search);
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
