import { NextRequest, NextResponse } from 'next/server'
import { getMedicosByDate } from '@/services/citas/citasService'

/**
 * GET /api/appointments/doctor-by-date
 * Obtiene médicos únicos que tienen citas en una fecha específica
 * 
 * Query params:
 * - fecha: Fecha en formato DD/MM/YYYY (ej: "14/11/2025") - REQUERIDO
 * - consultorio: Código del consultorio (opcional)
 * 
 * Ejemplos:
 * - /api/appointments/doctor-by-date?fecha=14/11/2025
 * - /api/appointments/doctor-by-date?fecha=14/11/2025&consultorio=1022
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fecha = searchParams.get('fecha')
    const consultorio = searchParams.get('consultorio')

    // Validar que fecha sea requerida
    if (!fecha) {
      return NextResponse.json(
        { error: 'El parámetro "fecha" es requerido (formato: DD/MM/YYYY)' },
        { status: 400 }
      )
    }

    // Validar formato de fecha (DD/MM/YYYY)
    const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/
    if (!fechaRegex.test(fecha)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use DD/MM/YYYY (ej: 14/11/2025)' },
        { status: 400 }
      )
    }

    console.log(`🔍 Buscando médicos para fecha: ${fecha}${consultorio ? `, consultorio: ${consultorio}` : ''}`)

    // Llamar al servicio
    const medicos = await getMedicosByDate(fecha, consultorio || undefined)

    console.log(`✅ ${medicos.length} médicos encontrados`)

    return NextResponse.json(medicos, { status: 200 })
  } catch (error) {
    console.error('❌ Error en GET /api/appointments/doctor-by-date:', error)
    return NextResponse.json(
      { error: 'Error al obtener médicos por fecha' },
      { status: 500 }
    )
  }
}
