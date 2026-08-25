import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TIPO_CITA } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activoParam = searchParams.get('activo')

    // Por defecto devolvemos solo activos (ACTIVO = 1)
    const filtrarActivos = activoParam === null || activoParam === '1' || activoParam.toLowerCase() === 'true'

    const tipos: TIPO_CITA[] = await prisma.tIPO_CITA.findMany({
      where: filtrarActivos
        ? { ACTIVO: { equals: 1 } }
        : undefined,
      orderBy: { TIPO_CITA: 'asc' },
    })

    const response = tipos.map((t) => ({
      Tipo_cita: t.TIPO_CITA.trim(),
      Nombre: t.NOMBRE.trim(),
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error consultando TIPO_CITA:', error)
    return NextResponse.json(
      { error: 'Error al consultar los tipos de cita' },
      { status: 500 }
    )
  }
}
