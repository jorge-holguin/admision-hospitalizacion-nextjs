import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { emergenciaId: string } }
) {
  try {
    const emergencyId = params.emergenciaId;

    if (!emergencyId) {
      return NextResponse.json(
        { error: "ID de emergencia no proporcionado" },
        { status: 400 }
      );
    }

    // Actualizar el estado de la emergencia a 0 (eliminado lógicamente)
    const updatedEmergency = await prisma.emergencia.update({
      where: {
        EMERGENCIA: emergencyId,
      },
      data: {
        ESTADO: "0",
      },
    });

    return NextResponse.json(
      {
        message: "Emergencia eliminada lógicamente",
        data: updatedEmergency,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error al eliminar emergencia:", error);
    
    // Manejar error de registro no encontrado
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Emergencia no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar la emergencia" },
      { status: 500 }
    );
  }
}
