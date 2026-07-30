import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");

    if (!tipo) {
      return NextResponse.json(
        { error: "Parámetro 'tipo' requerido (documento o nombre)" },
        { status: 400 }
      );
    }

    const apiBase = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL;

    if (!apiBase) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_CITAS_MASTER_URL no está configurado" },
        { status: 500 }
      );
    }

    let externalUrl = "";

    if (tipo === "documento") {
      const tipoDocumento = searchParams.get("tipoDocumento");
      const documento = searchParams.get("documento");

      if (!tipoDocumento || !documento) {
        return NextResponse.json(
          { error: "tipoDocumento y documento son requeridos" },
          { status: 400 }
        );
      }

      externalUrl = `${apiBase}/busqueda/paciente-por-documento?tipoDocumento=${encodeURIComponent(
        tipoDocumento
      )}&documento=${encodeURIComponent(documento)}`;
    } else if (tipo === "nombre") {
      const nombres = searchParams.get("nombres");

      if (!nombres) {
        return NextResponse.json(
          { error: "nombres es requerido" },
          { status: 400 }
        );
      }

      externalUrl = `${apiBase}/busqueda/paciente-por-nombre?nombres=${encodeURIComponent(
        nombres
      )}`;
    } else {
      return NextResponse.json(
        { error: "Tipo no válido. Use 'documento' o 'nombre'" },
        { status: 400 }
      );
    }

    const response = await fetch(externalUrl, {
      headers: {
        accept: "*/*",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en búsqueda externa:", errorText);
      return NextResponse.json(
        { error: "Error al consultar el servicio externo" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "El servicio externo no devolvió JSON", raw: rawText.substring(0, 500) },
        { status: 502 }
      );
    }

    let rawData;
    try {
      rawData = JSON.parse(rawText);
    } catch (parseErr) {
      return NextResponse.json(
        { error: "No se pudo parsear la respuesta del servicio externo", raw: rawText.substring(0, 500) },
        { status: 502 }
      );
    }

    // Normalizar a array si el servicio devuelve un objeto directo
    let data = rawData;
    if (!Array.isArray(rawData) && rawData != null) {
      data = [rawData];
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en proxy de búsqueda:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
