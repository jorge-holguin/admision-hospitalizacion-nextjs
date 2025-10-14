import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🏥 API: Obteniendo orígenes de hospitalización')

    // Aquí deberías hacer la llamada a tu base de datos
    // Por ahora, devolvemos datos de ejemplo
    const origenes = [
      { ORIGEN: 'EM', NOMBRE: 'Emergencia', ACTIVO: 1 },
      { ORIGEN: 'CE', NOMBRE: 'Consulta Externa', ACTIVO: 1 },
      { ORIGEN: 'RN', NOMBRE: 'Recién Nacido', ACTIVO: 1 },
      { ORIGEN: 'TR', NOMBRE: 'Transferencia', ACTIVO: 1 },
      { ORIGEN: 'RE', NOMBRE: 'Referencia', ACTIVO: 1 }
    ]

    console.log('✅ API: Orígenes de hospitalización obtenidos:', origenes.length)
    return NextResponse.json(origenes)

  } catch (error) {
    console.error('❌ API: Error al obtener orígenes de hospitalización:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
