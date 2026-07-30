import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface DiagnosticoAtencion {
  tipodx: string
  lab: string | null
  dx: string
  dxDes: string
  ord: string | null
  lab2: string | null
  lab3: string | null
}

/**
 * GET /api/appointments/[id]/diagnostics
 * Obtiene los diagnósticos de una cita desde ATENCIOND
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'El id de la cita es requerido' },
        { status: 400 }
      )
    }

    const diagnosticos = await prisma.$queryRaw<DiagnosticoAtencion[]>`
      SELECT
        TIPODX as tipodx,
        LAB as lab,
        DX as dx,
        DX_DES as dxDes,
        ORD as ord,
        LAB2 as lab2,
        LAB3 as lab3
      FROM dbo.ATENCIOND WITH (NOLOCK)
      WHERE ID_CITA = ${id}
      ORDER BY ORD ASC
    `

    return NextResponse.json({
      success: true,
      citaId: id,
      diagnosticos: diagnosticos.map((d: DiagnosticoAtencion) => ({
        tipodx: d.tipodx?.trim() || '',
        lab: d.lab?.toString()?.trim() || null,
        dx: d.dx?.trim() || '',
        dxDes: d.dxDes?.trim() || '',
        ord: d.ord?.toString()?.trim() || null,
        lab2: d.lab2?.toString()?.trim() || null,
        lab3: d.lab3?.toString()?.trim() || null
      }))
    })

  } catch (error) {
    const { id } = await params
    console.error(`❌ Error en GET /api/appointments/${id}/diagnostics:`, error)
    return NextResponse.json(
      { error: 'Error al obtener diagnósticos de la cita' },
      { status: 500 }
    )
  }
}
