import { NextRequest, NextResponse } from 'next/server'
import { ordenHospitalizacionService } from '@/services/hospitalizacion/ordenHospitalizacionService'
import hospitalizaService from '@/services/hospitalizacion/hospitalizaService'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validar que el ID exista y sea válido
    if (!id || id === 'undefined' || id.trim() === '') {
      console.error('API: ID de orden de hospitalización inválido o no proporcionado:', id);
      return NextResponse.json({ error: 'ID de orden de hospitalización inválido o no proporcionado' }, { status: 400 });
    }
    console.log(`API: Buscando orden de hospitalización con ID: ${id}`);
    
    const result = await ordenHospitalizacionService.getOrdenHospitalizacionById(id);
    
    if (!result) {
      return NextResponse.json({ error: 'Orden de hospitalización no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error fetching orden de hospitalización:`, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validar que el ID exista y sea válido
    if (!id || id === 'undefined' || id.trim() === '') {
      console.error('API: ID de orden de hospitalización inválido o no proporcionado para actualización:', id);
      return NextResponse.json({ error: 'ID de orden de hospitalización inválido o no proporcionado' }, { status: 400 });
    }
    
    console.log(`API: Actualizando orden de hospitalización con ID: ${id}`);
    
    // Obtener los datos del cuerpo de la solicitud
    const data = await req.json();
    console.log('Datos recibidos para actualización:', data);
    
    // Verificar si la orden existe antes de intentar actualizarla
    const ordenExistente = await ordenHospitalizacionService.getOrdenHospitalizacionById(id);
    if (!ordenExistente) {
      return NextResponse.json({ error: 'Orden de hospitalización no encontrada' }, { status: 404 });
    }
    
    // Extraer los valores SQL formateados si están disponibles
    const valoresSQL = data.valoresSQL || {};
    
    // Actualizar la orden de hospitalización en la base de datos
    try {
      // Construir la consulta SQL de actualización
      const updateQuery = `
        UPDATE HOSPITALIZA SET
          PACIENTE = '${valoresSQL.PACIENTE || data.patientId || ''}',
          CONSULTORIO1 = '${valoresSQL.CONSULTORIO1 || ''}',
          HORA1 = '${valoresSQL.HORA1 || data.hora || ''}',
          FECHA1 = '${valoresSQL.FECHA1 || ''}',
          ORIGEN = '${valoresSQL.ORIGEN || ''}',
          SEGURO = '${valoresSQL.SEGURO || ''}',
          MEDICO1 = '${valoresSQL.MEDICO1 || ''}',
          USUARIO = '${valoresSQL.USUARIO || ''}',
          USUARIO_IMP = '${valoresSQL.USUARIO_IMP || valoresSQL.USUARIO || ''}',
          DIAGNOSTICO = '${valoresSQL.DIAGNOSTICO || data.diagnostico || ''}',
          ACOMPANANTE_NOMBRE = '${valoresSQL.ACOMPANANTE_NOMBRE || data.acompanante_nombre || ''}',
          ACOMPANANTE_DIRECCION = '${valoresSQL.ACOMPANANTE_DIRECCION || data.acompanante_direccion || ''}',
          ACOMPANANTE_TELEFONO = '${valoresSQL.ACOMPANANTE_TELEFONO || data.acompanante_telefono || ''}'
        WHERE IDHOSPITALIZACION = '${id.trim()}'
      `;
      
      console.log('Ejecutando consulta de actualización:', updateQuery);
      
      // Ejecutar la consulta SQL
      await prisma.$executeRawUnsafe(updateQuery);
      
      console.log(`Orden de hospitalización actualizada con éxito: ${id}`);
      
      // Obtener la orden actualizada
      const ordenActualizada = await ordenHospitalizacionService.getOrdenHospitalizacionById(id);
      
      return NextResponse.json({
        success: true,
        message: 'Orden de hospitalización actualizada con éxito',
        data: ordenActualizada
      });
    } catch (dbError) {
      console.error('Error al actualizar la orden de hospitalización en la base de datos:', dbError);
      return NextResponse.json({ error: 'Error al actualizar la orden de hospitalización en la base de datos' }, { status: 500 });
    }
  } catch (error) {
    console.error(`Error actualizando orden de hospitalización:`, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la hospitalización' },
        { status: 400 }
      );
    }
    
    // Obtener los datos del cuerpo de la solicitud
    const body = await request.json();
    console.log(`Actualizando hospitalización ${id} con datos:`, body);
    
    // Verificar si se está actualizando el CUENTAID
    if (body.CUENTAID) {
      console.log(`Actualizando CUENTAID a ${body.CUENTAID} para hospitalización ${id}`);
      
      // Actualizar el registro usando SQL raw para evitar problemas con SQL Server 2008 R2
      await prisma.$executeRaw`
        UPDATE HOSPITALIZA 
        SET CUENTAID = ${body.CUENTAID}
        WHERE IDHOSPITALIZACION = ${id}
      `;
      
      // Revalidar la ruta para actualizar la UI
      revalidatePath('/hospitalization/orders');
      
      return NextResponse.json({ 
        success: true, 
        message: `CUENTAID actualizado correctamente para hospitalización ${id}` 
      });
    }
    
    return NextResponse.json(
      { error: 'No se especificaron campos para actualizar' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error al actualizar hospitalización:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la hospitalización' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Asegurar que params.id está disponible antes de usarlo
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la hospitalización' },
        { status: 400 }
      );
    }
    
    // Obtener el motivo de la eliminación del cuerpo de la solicitud (opcional)
    let motivo: string | undefined;
    let usuarioBaja: string = 'SISTEMA'; // Valor por defecto
    
    try {
      const body = await request.json();
      motivo = body.motivo;
      
      // Obtener el apellido del usuario desde el cuerpo de la solicitud
      if (body.usuario) {
        usuarioBaja = body.usuario;
      }
    } catch (e) {
      // Si no hay cuerpo o no se puede parsear, continuamos con los valores por defecto
      console.log('No se proporcionó cuerpo en la solicitud o no se pudo parsear');
    }
    
    console.log(`Intentando eliminar lógicamente hospitalización con ID: ${id}`);
    console.log(`Usuario que realiza la baja: ${usuarioBaja}`);
    
    // Realizar la eliminación lógica de la hospitalización
    const result = await hospitalizaService.logicalDeleteById(id, usuarioBaja, motivo);
    
    // Revalidar la ruta para actualizar la UI
    revalidatePath('/hospitalization/orders');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Hospitalización marcada como eliminada correctamente', 
      data: result 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error al eliminar hospitalización:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la hospitalización' },
      { status: 500 }
    );
  }
}