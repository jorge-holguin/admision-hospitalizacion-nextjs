import { NextRequest, NextResponse } from 'next/server';
import { tipoDocumentoService } from '@/services/hospitalizacion/tipoDocumentoService';

// Cache para almacenar resultados y reducir llamadas a la base de datos
let cachedTipoDocumentos: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hora en milisegundos

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const code = searchParams.get('code');
    
    // Usar cache si está disponible y no ha expirado
    const now = Date.now();
    if (!cachedTipoDocumentos || now - cacheTimestamp > CACHE_TTL) {
      cachedTipoDocumentos = await tipoDocumentoService.findTipoDocumentos();
      cacheTimestamp = now;
    }
    
    // Si se proporciona un código específico, buscar por código
    if (code) {
      const encontrado = cachedTipoDocumentos.find(td => td.TIPO_DOCUMENTO === code);

      if (!encontrado) {
        return NextResponse.json(
          { error: `Tipo de documento con código ${code} no encontrado` },
          { status: 404 }
        );
      }

      return NextResponse.json(encontrado);
    }

    // Si hay un texto de búsqueda (por nombre), filtrar
    const filtrados = search
      ? cachedTipoDocumentos.filter(td =>
          td.NOMBRE.toLowerCase().includes(search.toLowerCase())
        )
      : cachedTipoDocumentos;

    return NextResponse.json(filtrados);
  } catch (error: any) {
    console.error('Error en API de tipos de documento:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
