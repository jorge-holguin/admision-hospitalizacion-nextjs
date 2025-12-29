import { NextRequest, NextResponse } from 'next/server';
import { emergenciaService } from '@/services/emergencia/emergenciaService';
import { cuentaService } from '@/services/emergencia/cuentaService';
import { resolveStatus } from '@/utils/statusUtils';

/**
 * GET /api/emergencia/[emergenciaId]
 * Endpoint para obtener una emergencia específica por su ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // En Next.js 15, params debe ser awaited
    const { id: emergenciaId } = await params;
    
    // Validar que el ID de emergencia no esté vacío
    if (!emergenciaId || emergenciaId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'ID de emergencia no válido' },
        { status: 400 }
      );
    }
    
    // Obtener la emergencia por su ID
    const emergencia = await emergenciaService.getEmergenciaById(emergenciaId);
    
    if (!emergencia) {
      return NextResponse.json(
        { success: false, error: 'Emergencia no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: emergencia
    });
  } catch (error: any) {
    console.error(`Error al obtener emergencia:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al obtener emergencia' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/emergencia/[id]
 * Endpoint para actualizar una emergencia específica
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: emergenciaId } = await params;
    
    // Validar que el ID de emergencia no esté vacío
    if (!emergenciaId || emergenciaId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'ID de emergencia no válido' },
        { status: 400 }
      );
    }
    
    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Actualizar la emergencia
    const updatedEmergencia = await emergenciaService.updateEmergencia(emergenciaId, data);
    
    return NextResponse.json({
      success: true,
      data: updatedEmergencia
    });
  } catch (error: any) {
    console.error(`Error al actualizar emergencia:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al actualizar emergencia' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/emergencia/[id]
 * Endpoint para actualizar parcialmente una emergencia con validación de estado
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: emergenciaId } = await params;
    
    // Validar que el ID de emergencia no esté vacío
    if (!emergenciaId || emergenciaId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'ID de emergencia no válido' },
        { status: 400 }
      );
    }
    
    // Obtener la emergencia actual para verificar su estado
    const currentEmergencia = await emergenciaService.getEmergenciaById(emergenciaId);
    if (!currentEmergencia) {
      return NextResponse.json(
        { success: false, error: 'Emergencia no encontrada' },
        { status: 404 }
      );
    }
    
    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Verificar si es una solicitud de eliminación lógica
    if (data.ESTADO === "0") {
      // Permitir la eliminación lógica sin importar el estado actual
      console.log(`Eliminando lógicamente emergencia ${emergenciaId}`);
      // Usar el servicio específico para eliminación lógica
      const deletedEmergencia = await emergenciaService.deleteEmergencia(emergenciaId);
      
      return NextResponse.json({
        success: true,
        message: "Emergencia eliminada lógicamente",
        data: deletedEmergencia
      });
    } else {
      // Verificar si es PAGANTE o SOAT para bypass de validación de estado
      const paganteOrSoatInsuranceCodes = ['0', '00', '02'];
      const seguroLiq = data.SEGUROLIQ?.trim() || currentEmergencia.SEGUROLIQ?.trim();
      const isPayingOrSoat = Boolean(seguroLiq && paganteOrSoatInsuranceCodes.includes(seguroLiq));
      
      console.log('API - Validación de estado para emergencia:', {
        emergenciaId,
        estado: currentEmergencia.ESTADO,
        seguroLiq,
        isPayingOrSoat
      });
      
      // Para actualizaciones normales, verificar si la emergencia está en un estado que permite edición
      // O si es PAGANTE/SOAT, permitir la edición sin importar el estado
      const statusInfo = resolveStatus(currentEmergencia.ESTADO || '0');
      
      if (statusInfo.isReadOnly && !isPayingOrSoat) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No se puede editar esta emergencia porque está en estado ' + statusInfo.statusText,
            statusInfo
          },
          { status: 403 }
        );
      }
      
      // Actualizar la emergencia
      const updatedEmergencia = await emergenciaService.updateEmergencia(emergenciaId, data);
      
      // Si hay CUENTAID, también actualizar la cuenta con OBSERVACION y EMPRESASEGURO
      const cuentaId = data.CUENTAID || currentEmergencia.CUENTAID;
      if (cuentaId && cuentaId.trim() !== '') {
        console.log(`📝 Sincronizando datos con cuenta ${cuentaId}...`);
        
        // Obtener el código de seguro para verificar si es SOAT
        const seguroCode = data.SEGURO?.trim() || currentEmergencia.SEGURO?.trim();
        const isSOAT = seguroCode === '02';
        
        // Solo enviar empresaSeguro si es SOAT
        const empresaSeguroValue = isSOAT ? (data.EMPRESASEG || '') : '';
        
        const cuentaResult = await cuentaService.updateCuentaObservacionYEmpresa(
          cuentaId.trim(),
          data.OBSERVACION1,
          empresaSeguroValue
        );
        
        if (cuentaResult.success) {
          console.log(`✅ Cuenta ${cuentaId} actualizada correctamente`);
        } else {
          console.warn(`⚠️ No se pudo actualizar la cuenta: ${cuentaResult.message}`);
        }
      }
      
      return NextResponse.json({
        success: true,
        data: updatedEmergencia
      });
    }
  } catch (error: any) {
    // Evitar usar params.emergenciaId directamente ya que necesita ser awaited
    console.error(`Error al actualizar parcialmente emergencia:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al actualizar parcialmente emergencia' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/emergencia/[id]
 * Endpoint para eliminar lógicamente una emergencia (cambiar su estado a '0')
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: emergenciaId } = await params;
    
    // Validar que el ID de emergencia no esté vacío
    if (!emergenciaId || emergenciaId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'ID de emergencia no válido' },
        { status: 400 }
      );
    }
    
    // Eliminar lógicamente la emergencia
    const deletedEmergencia = await emergenciaService.deleteEmergencia(emergenciaId);
    
    return NextResponse.json({
      success: true,
      data: deletedEmergencia
    });
  } catch (error: any) {
    console.error(`Error al eliminar emergencia:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al eliminar emergencia' 
      },
      { status: 500 }
    );
  }
}
