import { NextRequest, NextResponse } from 'next/server'
import { hospitalizaService } from '@/services/hospitalizaService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de hospitalización' },
        { status: 400 }
      )
    }
    
    // Verificar si la hospitalización es editable (estado 1 o 2)
    const isEditable = await hospitalizaService.isHospitalizacionEditable(id)
    
    // Obtener el estado actual
    const estado = await hospitalizaService.getHospitalizacionStatus(id)
    
    return NextResponse.json({ 
      isEditable,
      estado,
      canDelete: isEditable, // Solo se puede eliminar si es editable (estado 1 o 2)
      canEdit: isEditable    // Solo se puede editar si es editable (estado 1 o 2)
    })
  } catch (error) {
    console.error('Error al verificar estado editable:', error)
    return NextResponse.json(
      { error: 'Error al verificar estado editable' },
      { status: 500 }
    )
  }
}
