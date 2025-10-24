import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ubigeo/by-reniec/[codigo]
 * Busca el UBIGEO correcto usando el código RENIEC
 * Ejemplo: RENIEC 140133 → UBIGEO 150113
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { codigo: string } }
) {
  try {
    const codigoReniec = params.codigo;

    if (!codigoReniec || codigoReniec.length !== 6) {
      return NextResponse.json(
        { error: 'Código RENIEC debe tener 6 dígitos' },
        { status: 400 }
      );
    }

    console.log(`🔍 Buscando UBIGEO para código RENIEC: ${codigoReniec}`);

    // Consultar tabla UBIGEO usando código RENIEC
    const result = await prisma.$queryRaw<Array<{ UBIGEO: string }>>`
      SELECT TOP 1 UBIGEO 
      FROM UBIGEO 
      WHERE UBIGEORENIEC = ${codigoReniec}
    `;

    if (!result || result.length === 0) {
      console.warn(`⚠️ No se encontró UBIGEO para código RENIEC: ${codigoReniec}`);
      return NextResponse.json(
        { error: 'No se encontró UBIGEO para el código RENIEC proporcionado' },
        { status: 404 }
      );
    }

    const ubigeo = result[0].UBIGEO?.trim();
    console.log(`✅ UBIGEO encontrado: ${ubigeo} para RENIEC: ${codigoReniec}`);

    return NextResponse.json({ 
      ubigeo,
      ubigeoReniec: codigoReniec 
    });
  } catch (error) {
    console.error('❌ Error al buscar UBIGEO por código RENIEC:', error);
    return NextResponse.json(
      { error: 'Error al buscar UBIGEO' },
      { status: 500 }
    );
  }
}
