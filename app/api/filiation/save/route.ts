import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL

/**
 * POST /api/filiation/save
 * Crea una nueva historia clínica para un paciente
 */
export async function POST(req: NextRequest) {
  try {
    // Obtener el usuario del token JWT de las cookies o headers
    const token = req.cookies.get('authToken')?.value || req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado. Token no encontrado.' },
        { status: 401 }
      )
    }

    // Decodificar el token para obtener el DNI del usuario
    let usuario = ''
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        usuario = payload.sub || '' // El DNI está en el campo 'sub'
        console.log('👤 Usuario obtenido del JWT:', usuario)
      }
    } catch (error) {
      console.error('❌ Error al decodificar token:', error)
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    if (!usuario) {
      return NextResponse.json(
        { error: 'No se pudo obtener el DNI del usuario del token' },
        { status: 401 }
      )
    }

    // Obtener los datos del body
    const body = await req.json()
    console.log('📋 Datos recibidos para guardar historia clínica:', body)

    // Validaciones básicas
    if (!body.documento || !body.tipoDocumento) {
      return NextResponse.json(
        { error: 'Documento y tipo de documento son requeridos' },
        { status: 400 }
      )
    }

    // Construir el payload para la API externa
    // IMPORTANTE: NO hacer trim de los campos, enviar tal cual vienen
    const payload = {
      stringFoto: body.stringFoto || '',
      tipoDocumento: body.tipoDocumento,
      documento: body.documento,
      edad: body.edad || '',
      paterno: body.paterno || '',
      materno: body.materno || '',
      nombre: body.nombre || '',
      fechaNacimiento: body.fechaNacimiento, // Debe venir en formato ISO
      sexo: body.sexo || '',
      estadoCivil: body.estadoCivil || '',
      pais: body.pais || '',
      lugarNacimiento: body.lugarNacimiento || '',
      direccion: body.direccion || '',
      distrito: body.distrito || '',
      seguro: body.seguro || '',
      gradoInstruccion: body.gradoInstruccion || '',
      ocupacion: body.ocupacion || '',
      religion: body.religion || '',
      codEtnia: body.codEtnia || '',
      telefono1: body.telefono1 || '',
      telefono2: body.telefono2 || '',
      hijos: body.hijos || 0,
      email: body.email || '',
      padre: body.padre || '',
      madre: body.madre || '',
      conyugeNombre: body.conyugeNombre || '',
      conyugeOcupacion: body.conyugeOcupacion || '',
      correo: body.correo || '',
      direccionReniec: body.direccionReniec || '',
      distritoReniec: body.distritoReniec || '',
      validadoReniec: body.validadoReniec || false,
      localidad: body.localidad || '' // Mantener los 12 caracteres como vienen
    }

    console.log('🚀 Enviando datos a API externa:', `${API_BASE_URL}/historia-clinica/pacientes?usuario=${usuario}`)
    console.log('📦 Payload:', payload)
    console.log('📍 Localidad (12 chars):', `"${payload.localidad}" (length: ${payload.localidad.length})`)
    console.log('📍 Distrito (7 chars):', `"${payload.distrito}" (length: ${payload.distrito.length})`)
    console.log('📍 Lugar Nacimiento (7 chars):', `"${payload.lugarNacimiento}" (length: ${payload.lugarNacimiento.length})`)

    // Llamar a la API externa
    const response = await fetch(
      `${API_BASE_URL}/historia-clinica/pacientes?usuario=${usuario}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        body: JSON.stringify(payload)
      }
    )

    const responseData = await response.json()
    console.log('📨 Respuesta de API externa:', responseData)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al crear historia clínica', details: responseData },
        { status: response.status }
      )
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('❌ Error al crear historia clínica:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
