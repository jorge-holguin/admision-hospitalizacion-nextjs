import { NextRequest, NextResponse } from 'next/server'
import { API_ENDPOINTS, fetchApi } from '@/lib/api-config'
import { getCivilStatusCode } from '@/utils/civilStatusUtils'

function isBlank(value: any): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

function parseNombres(fullName: string | null | undefined): { paterno: string; materno: string; nombre: string } | null {
  if (!fullName || typeof fullName !== 'string') return null
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 3) return null
  return {
    paterno: parts[0],
    materno: parts[1],
    nombre: parts.slice(2).join(' ')
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await fetchApi(API_ENDPOINTS.emergencia.byId(id))

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { success: false, error: `Error al obtener emergencia: ${response.status}`, detail: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Si la API Spring devuelve campos del paciente en null, enriquecemos con datos de filiación
    const pacienteId = data?.paciente ?? data?.PACIENTE
    if (pacienteId && (isBlank(data.nombre) || isBlank(data.paterno) || isBlank(data.materno) || isBlank(data.documento))) {
      try {
        const pacienteResp = await fetchApi(API_ENDPOINTS.filiation.byId(String(pacienteId)))
        if (pacienteResp.ok) {
          const paciente = await pacienteResp.json()
          const p = paciente?.data ?? paciente
          data.nombre     = data.nombre     ?? p?.nombre     ?? p?.NOMBRE     ?? p?.nombres   ?? p?.NOMBRES   ?? null
          data.paterno    = data.paterno    ?? p?.paterno    ?? p?.PATERNO    ?? p?.apellidoPaterno ?? null
          data.materno    = data.materno    ?? p?.materno    ?? p?.MATERNO    ?? p?.apellidoMaterno ?? null
          data.documento  = data.documento  ?? p?.documento  ?? p?.DOCUMENTO  ?? p?.dni ?? null
          data.tipoDocumento = data.tipoDocumento ?? p?.tipoDocumento ?? p?.TIPO_DOCUMENTO ?? null
          data.nombres    = data.nombres    ?? p?.nombres    ?? p?.NOMBRES    ?? null
          data.fechaNacimiento = data.fechaNacimiento ?? p?.fechaNacimiento ?? p?.FECHA_NAC ?? null
          data.edad       = data.edad       ?? p?.edad       ?? p?.EDAD       ?? null
          data.sexo       = data.sexo       ?? p?.sexo       ?? p?.SEXO       ?? null
          data.direccion  = data.direccion  ?? p?.direccion  ?? p?.DIRECCION  ?? null
          data.telefono1  = data.telefono1  ?? p?.telefono1  ?? p?.TELEFONO1  ?? null
          data.estadoCivil = data.estadoCivil ?? getCivilStatusCode(p?.estadoCivil ?? p?.ESTADO_CIVIL ?? p?.ESTADOCIVIL, p?.NOMBRE_ESTADO_CIVIL ?? p?.nombreEstadoCivil) ?? null
        }
      } catch (enrichErr) {
        console.warn('⚠️ No se pudieron enriquecer datos del paciente:', enrichErr)
      }
    }

    // Fallback: parsear el campo NOMBRES como "PATERNO MATERNO NOMBRE(S)"
    if (isBlank(data.nombre) || isBlank(data.paterno) || isBlank(data.materno)) {
      const parsed = parseNombres(data.nombres ?? data.NOMBRES)
      if (parsed) {
        data.paterno = data.paterno ?? parsed.paterno
        data.materno = data.materno ?? parsed.materno
        data.nombre  = data.nombre  ?? parsed.nombre
        data.nombres = data.nombres ?? `${parsed.paterno} ${parsed.materno} ${parsed.nombre}`
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en GET /api/emergency/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const response = await fetchApi(API_ENDPOINTS.emergencia.update(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { success: false, error: `Error al actualizar emergencia: ${response.status}`, detail: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error en PUT /api/emergency/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await fetchApi(API_ENDPOINTS.emergencia.delete(id), {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { success: false, error: `Error al eliminar emergencia: ${response.status}`, detail: errorText },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en DELETE /api/emergency/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
