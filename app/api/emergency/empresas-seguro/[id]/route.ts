import { NextRequest, NextResponse } from "next/server";
import { getEmpresaSeguroById } from "@/services/emergencia/empresaSeguroService";

/**
 * GET /api/emergency/empresas-seguro/[id]
 * Obtiene una empresa de seguro por su código
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: empresaId } = await params;

    if (!empresaId) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Se requiere el código de empresa"
        },
        { status: 400 }
      );
    }

    const empresa = await getEmpresaSeguroById(empresaId);

    if (!empresa) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: `No se encontró la empresa con código ${empresaId}`
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: empresa
    });
  } catch (error) {
    console.error("Error en GET /api/emergency/empresas-seguro/[id]:", error);
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Error al obtener empresa de seguro",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
