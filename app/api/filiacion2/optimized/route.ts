import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Función de log para debugging
const debugLog = (message: string) => {
  console.log(`[DEBUG] ${message}`);
};

/**
 * API optimizada para obtener datos de filiación de un paciente
 * Solo devuelve los campos realmente utilizados en los componentes PatientInfo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const patientId = params?.id;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const id = searchParams.get("id") || patientId;

  if (!id) {
    return NextResponse.json(
      { error: "Se requiere ID de paciente" },
      { status: 400 }
    );
  }

  try {
    debugLog(`Buscando registro de filiación con ID ${id}`);

    // Consulta SQL optimizada que solo selecciona los campos necesarios
    const result = await prisma.$queryRaw`
      SELECT TOP 1
        PACIENTE,
        HISTORIA,
        NOMBRES,
        SEXO,
        FECHA_NACIMIENTO,
        DOCUMENTO,
        TIPO_DOCUMENTO,
        DIRECCION,
        TELEFONO1,
        TELEFONO2,
        DISTRITO,
        PATERNO,
        MATERNO,
        NOMBRE,
        EDAD,
        ESTADO_CIVIL,
        RELIGION,
        DESRELIGION,
        LOCALIDAD,
        Nombre_Localidad,
        Distrito_Dir,
        SEGURO,
        STRING_FOTO,
        Expr2
      FROM V_FILIACION2
      WHERE PACIENTE = ${id}
    `;

    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json(
        { error: "No se encontró el registro de filiación" },
        { status: 404 }
      );
    }

    const filiacionData = result[0];
    debugLog("Registro de filiación encontrado con ID " + id);

    // Mapear los campos a un formato más amigable para el frontend
    const mappedData = {
      paciente: filiacionData.PACIENTE,
      historia: filiacionData.HISTORIA,
      nombres: filiacionData.NOMBRES,
      nombre: filiacionData.NOMBRE,
      apellidoPaterno: filiacionData.PATERNO,
      apellidoMaterno: filiacionData.MATERNO,
      documento: filiacionData.DOCUMENTO,
      tipoDocumento: filiacionData.TIPO_DOCUMENTO,
      fechaNacimiento: filiacionData.FECHA_NACIMIENTO,
      edad: filiacionData.EDAD?.toString(),
      sexo: filiacionData.SEXO,
      estadoCivil: filiacionData.ESTADO_CIVIL,
      direccion: filiacionData.DIRECCION,
      distrito: filiacionData.DISTRITO,
      distritoDir: filiacionData.Distrito_Dir,
      telefono1: filiacionData.TELEFONO1,
      telefono2: filiacionData.TELEFONO2,
      seguro: filiacionData.SEGURO,
      religion: filiacionData.RELIGION,
      descreligion: filiacionData.DESRELIGION,
      localidad: filiacionData.LOCALIDAD,
      nombreLocalidad: filiacionData.Nombre_Localidad,
      photo: filiacionData.STRING_FOTO,
      COD_DISTRITO: filiacionData.Expr2 ? filiacionData.Expr2.trim() : ''
    };

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Error al obtener datos de filiación:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de filiación" },
      { status: 500 }
    );
  }
}
