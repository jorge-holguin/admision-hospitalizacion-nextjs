import { NextRequest, NextResponse } from 'next/server'
import { archivoMovService } from '@/services/appointments/archivoMovService'

/**
 * GET /api/appointments/archivo-mov/[id]
 * Obtiene un registro específico por ID_CITA
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const registro = await archivoMovService.findById(id)

    if (!registro) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: registro
    })

  } catch (error: any) {
    console.error(`❌ Error en GET /api/appointments/archivo-mov/${params.id}:`, error)
    return NextResponse.json(
      { 
        error: error.message || 'Error al obtener registro',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/appointments/archivo-mov/[id]
 * Actualiza campos específicos de un registro
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Verificar que el registro existe
    const existe = await archivoMovService.exists(id)
    if (!existe) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      )
    }

    let resultado

    // Determinar qué tipo de actualización realizar
    if (body.FECHA_PAGO !== undefined) {
      // Actualizar fecha de pago
      const fechaPago = body.FECHA_PAGO ? new Date(body.FECHA_PAGO) : new Date()
      resultado = await archivoMovService.updateFechaPago({
        ID_CITA: id,
        FECHA_PAGO: fechaPago
      })
    } else if (body.ESTADO !== undefined) {
      // Actualizar estado
      resultado = await archivoMovService.updateEstado(
        id,
        body.ESTADO,
        body.USUARIOR
      )
    } else if (body.FECHA_SAL !== undefined) {
      // Actualizar salida
      resultado = await archivoMovService.updateSalida(
        id,
        new Date(body.FECHA_SAL),
        body.HORA_SAL,
        body.OBSERVA1,
        body.USUARIOR
      )
    } else if (body.FECHA_ING !== undefined) {
      // Actualizar ingreso
      resultado = await archivoMovService.updateIngreso(
        id,
        new Date(body.FECHA_ING),
        body.HORA_ING,
        body.OBSERVA2,
        body.USUARIOR
      )
    } else {
      return NextResponse.json(
        { error: 'No se especificó ningún campo válido para actualizar' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'Registro actualizado exitosamente'
    })

  } catch (error: any) {
    console.error(`❌ Error en PATCH /api/appointments/archivo-mov/${params.id}:`, error)
    return NextResponse.json(
      { 
        error: error.message || 'Error al actualizar registro',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/appointments/archivo-mov/[id]
 * Elimina un registro (si es necesario)
 * Nota: Considerar si realmente se debe permitir eliminar o solo cambiar estado
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Verificar que el registro existe
    const existe = await archivoMovService.exists(id)
    if (!existe) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      )
    }

    // En lugar de eliminar, cambiar estado a inactivo
    // Esto es más seguro que eliminar permanentemente
    const resultado = await archivoMovService.updateEstado(id, '0')

    return NextResponse.json({
      success: true,
      message: 'Registro marcado como inactivo',
      data: resultado
    })

  } catch (error: any) {
    console.error(`❌ Error en DELETE /api/appointments/archivo-mov/${params.id}:`, error)
    return NextResponse.json(
      { 
        error: error.message || 'Error al eliminar registro',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
