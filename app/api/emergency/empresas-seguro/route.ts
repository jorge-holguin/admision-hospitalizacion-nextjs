import { NextRequest, NextResponse } from "next/server";
import { 
  getAllEmpresasSeguro, 
  searchEmpresasSeguro 
} from "@/services/emergencia/empresaSeguroService";

/**
 * GET /api/emergency/empresas-seguro
 * Obtiene todas las empresas de seguro o busca por criterio
 * Query params:
 *   - search: texto para buscar por nombre o código (opcional)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let empresas;
    
    if (search && search.trim() !== "") {
      empresas = await searchEmpresasSeguro(search.trim());
    } else {
      empresas = await getAllEmpresasSeguro();
    }

    return NextResponse.json({
      ok: true,
      data: empresas,
      total: empresas.length
    });
  } catch (error) {
    console.error("Error en GET /api/emergency/empresas-seguro:", error);
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Error al obtener empresas de seguro",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
