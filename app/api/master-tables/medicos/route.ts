import { NextRequest, NextResponse } from "next/server";
import { medicoServerService } from "@/services/master-tables/medicoService";

// Helper para serializar correctamente valores BigInt en JSON
function toSerializable<T = any>(value: T): T {
  if (typeof value === "bigint") {
    // Convertir a string para evitar pérdida de precisión
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

// GET: Obtener médicos con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const filters = {
      search: searchParams.get("search") || undefined,
      consultorio: searchParams.get("consultorio") || undefined,
      nombre: searchParams.get("nombre") || undefined,
      dni: searchParams.get("dni") || undefined,
    };

    const result = await medicoServerService.getMedicos(page, pageSize, filters);
    // Asegurar que no haya BigInt en la respuesta
    const serializable = toSerializable(result);
    return NextResponse.json(serializable);
  } catch (error) {
    console.error("Error al obtener médicos:", error);
    return NextResponse.json(
      { error: "Error al obtener médicos" },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo médico
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('API POST /api/master-tables/medicos - Received body:', {
      PROFESION_COLEGIO: body.PROFESION_COLEGIO,
      MEDICO: body.MEDICO,
      NOMBRE: body.NOMBRE
    });

    if (!body.MEDICO || String(body.MEDICO).trim() === "") {
      return NextResponse.json(
        { error: "El código MEDICO es obligatorio" },
        { status: 400 }
      );
    }

    if (!body.NOMBRE) {
      return NextResponse.json(
        { error: "El nombre del médico es obligatorio" },
        { status: 400 }
      );
    }

    // Mapeo de campos provenientes del formulario/UI
    const payload: any = {
      MEDICO: String(body.MEDICO).trim(),
      NOMBRE: body.NOMBRE,
      NOMBRES: body.NOMBRES ?? "",
      APATERNO: body.APATERNO ?? body.APELLIDOS ?? "",
      AMATERNO: body.AMATERNO ?? "",
      DNI: body.DNI ?? body.DOCUMENTO ?? "",
      TIPO_DOCUMENTO: body.TIPO_DOCUMENTO ?? "D",
      PAIS: body.PAIS ?? "146",
      ESPECIALIDAD: body.ESPECIALIDAD ?? "",
      CONSULTORIO: body.CONSULTORIO ?? "",
      CODHIS: body.CODHIS ?? body.CODHIS?.toString?.() ?? "",
      EESS: body.EESS ?? body.EESS?.toString?.() ?? "",
      CONTRATO: body.CONTRATO ?? "",
      ACTIVO: body.ACTIVO ?? "1",
      ABREVIATURA: body.ABREVIATURA ?? "MED",
      COLEGIO: body.COLEGIO ?? "",
      COLESP: body.COLESP ?? "",
      IMPCITA: body.IMPCITA ?? "N",
      PROFESION_COLEGIO: body.PROFESION_COLEGIO ?? "",
      FECHNAC: body.FECHNAC ?? "",
      GENERO: body.GENERO ?? "",
      ESPECIALIDAD2: body.ESPECIALIDAD2 ?? "0",
      CONSULTORIO2: body.CONSULTORIO2 ?? "0",
      PROFESION_COLEGIO2: body.PROFESION_COLEGIO2 ?? "",
      USUARIO: body.USUARIO ?? "",
      CORREO: body.CORREO ?? "",
      TELEFONO: body.TELEFONO ?? "",
      COLESP2: body.COLESP2 ?? "",
      COLESP3: body.COLESP3 ?? "",
    };
    
    console.log('API POST - Payload to service:', {
      PROFESION_COLEGIO: payload.PROFESION_COLEGIO,
      MEDICO: payload.MEDICO,
      NOMBRE: payload.NOMBRE
    });

    const newMedico = await medicoServerService.createMedico(payload);
    return NextResponse.json(newMedico, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear médico:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear médico" },
      { status: 500 }
    );
  }
}
