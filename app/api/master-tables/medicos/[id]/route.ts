import { NextRequest, NextResponse } from "next/server";
import { medicoServerService } from "@/services/master-tables/medicoService";

// Helper para serializar BigInt en JSON
function toSerializable<T = any>(value: T): T {
  if (typeof value === "bigint") {
    return (value.toString() as unknown) as T;
  }
  if (Array.isArray(value)) {
    return (value.map((v) => toSerializable(v)) as unknown) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      out[k] = toSerializable(v);
    }
    return (out as unknown) as T;
  }
  return value;
}

// GET: Obtener médico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const medico = await medicoServerService.getMedicoById(params.id);

    if (!medico) {
      return NextResponse.json({ error: "Médico no encontrado" }, { status: 404 });
    }

    return NextResponse.json(toSerializable(medico));
  } catch (error) {
    console.error(`Error al obtener médico ${params.id}:`, error);
    return NextResponse.json(
      { error: "Error al obtener médico" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar médico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updatedMedico = await medicoServerService.updateMedico(params.id, body);

    if (!updatedMedico) {
      return NextResponse.json({ error: "Médico no encontrado" }, { status: 404 });
    }

    return NextResponse.json(toSerializable(updatedMedico));
  } catch (error) {
    console.error(`Error al actualizar médico ${params.id}:`, error);
    return NextResponse.json(
      { error: "Error al actualizar médico" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar médico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await medicoServerService.deleteMedico(params.id);

    if (!deleted) {
      return NextResponse.json({ error: "Médico no encontrado" }, { status: 404 });
    }

    return NextResponse.json(toSerializable({ message: "Médico eliminado correctamente" }));
  } catch (error) {
    console.error(`Error al eliminar médico ${params.id}:`, error);
    return NextResponse.json(
      { error: "Error al eliminar médico" },
      { status: 500 }
    );
  }
}
