import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Endpoint para actualizar el CONSULTORIO en la tabla CUENTA
 * Se usa cuando se edita el consultorio de una emergencia
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const emergenciaId = params.id;
    const body = await req.json();
    const { consultorio, cuentaId, usuario } = body;

    console.log(`📋 Actualizando consultorio en CUENTA para emergencia ${emergenciaId}`);
    console.log(`   - Nuevo consultorio: ${consultorio}`);
    console.log(`   - CuentaId: ${cuentaId}`);

    if (!consultorio) {
      return NextResponse.json(
        { ok: false, mensaje: "El campo consultorio es requerido" },
        { status: 400 }
      );
    }

    if (!cuentaId) {
      return NextResponse.json(
        { ok: false, mensaje: "El campo cuentaId es requerido" },
        { status: 400 }
      );
    }

    // Actualizar el consultorio en la tabla CUENTA
    const updateResult = await prisma.$executeRaw`
      UPDATE CUENTA 
      SET CONSULTORIO = ${consultorio}
      WHERE CUENTAID = ${cuentaId}
    `;

    console.log(`✅ CUENTA actualizada - Filas afectadas: ${updateResult}`);

    // Verificar la actualización
    const verificacion = await prisma.$queryRaw`
      SELECT CUENTAID, CONSULTORIO FROM CUENTA WHERE CUENTAID = ${cuentaId}
    ` as any[];

    console.log(`📋 Verificación post-update:`, verificacion[0]);

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Consultorio actualizado correctamente en CUENTA",
        data: {
          cuentaId,
          nuevoConsultorio: consultorio,
          filasAfectadas: updateResult
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al actualizar consultorio en CUENTA:", error);
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Error al actualizar consultorio en CUENTA",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
