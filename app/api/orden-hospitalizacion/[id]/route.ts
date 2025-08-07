import { NextRequest, NextResponse } from 'next/server'
import { ordenHospitalizacionService } from '@/services/ordenHospitalizacionService'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar que el ID exista y sea válido
    if (!params || !params.id || params.id === 'undefined' || params.id.trim() === '') {
      console.error('API: ID de orden de hospitalización inválido o no proporcionado:', params?.id);
      return NextResponse.json({ error: 'ID de orden de hospitalización inválido o no proporcionado' }, { status: 400 });
    }
    
    const id = params.id;
    console.log(`API: Buscando orden de hospitalización con ID: ${id}`);
    
    const result = await ordenHospitalizacionService.getOrdenHospitalizacionById(id);
    
    if (!result) {
      return NextResponse.json({ error: 'Orden de hospitalización no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    const idValue = params?.id || 'desconocido';
    console.error(`Error fetching orden de hospitalización ${idValue}:`, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar que el ID exista y sea válido
    if (!params || !params.id || params.id === 'undefined' || params.id.trim() === '') {
      console.error('API: ID de orden de hospitalización inválido o no proporcionado para actualización:', params?.id);
      return NextResponse.json({ error: 'ID de orden de hospitalización inválido o no proporcionado' }, { status: 400 });
    }
    
    const id = params.id;
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
    const idValue = params?.id || 'desconocido';
    console.error(`Error actualizando orden de hospitalización ${idValue}:`, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
