import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Endpoint para verificar si existe una cuenta activa para un paciente con un tipo de seguro específico
 * GET /api/emergency/check-account?paciente={pacienteId}&seguro={seguroCode}
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paciente = searchParams.get('paciente');
    const seguro = searchParams.get('seguro');

    if (!paciente) {
      return NextResponse.json(
        { ok: false, mensaje: "Se requiere el ID del paciente" },
        { status: 400 }
      );
    }

    if (!seguro) {
      return NextResponse.json(
        { ok: false, mensaje: "Se requiere el código de seguro" },
        { status: 400 }
      );
    }

    // Limpiar el código de seguro
    const seguroTrimmed = seguro.trim();
    
    // Verificar si el seguro requiere cuenta (0, 02, 17)
    const segurosConCuenta = ["0", "00", "02", "17"];
    if (!segurosConCuenta.includes(seguroTrimmed)) {
      return NextResponse.json({
        ok: true,
        requiresCuenta: false,
        mensaje: "Este tipo de seguro no requiere cuenta"
      });
    }

    console.log(`🔍 Buscando cuenta activa para paciente ${paciente} con seguro ${seguroTrimmed}`);

    // Buscar cuenta activa para el paciente con el mismo tipo de seguro y origen EM (emergencia)
    const cuentaExistente = await prisma.$queryRaw`
      SELECT TOP 1 
        CUENTAID, 
        PACIENTE, 
        SEGURO, 
        EMPRESASEGURO,
        OBSERVACION,
        FECHA_APERTURA,
        HORA_APERTURA,
        ESTADO,
        ORIGEN
      FROM CUENTA 
      WHERE PACIENTE = ${paciente} 
        AND ESTADO = '1' 
        AND ORIGEN = 'EM' 
        AND SEGURO = ${seguroTrimmed}
      ORDER BY FECHA_APERTURA DESC
    ` as any[];

    if (cuentaExistente && cuentaExistente.length > 0) {
      const cuenta = cuentaExistente[0];
      
      // Formatear la fecha de apertura para mostrar al usuario
      // ✅ IMPORTANTE: Usar UTC para evitar problemas de timezone
      let fechaAperturaFormateada = '';
      if (cuenta.FECHA_APERTURA) {
        const fechaObj = cuenta.FECHA_APERTURA instanceof Date 
          ? cuenta.FECHA_APERTURA 
          : new Date(cuenta.FECHA_APERTURA);
        
        if (!isNaN(fechaObj.getTime())) {
          // Usar getUTCDate, getUTCMonth, getUTCFullYear para evitar conversión de timezone
          const dia = String(fechaObj.getUTCDate()).padStart(2, '0');
          const mes = String(fechaObj.getUTCMonth() + 1).padStart(2, '0');
          const anio = fechaObj.getUTCFullYear();
          fechaAperturaFormateada = `${dia}/${mes}/${anio}`;
        }
      }

      // Formatear la hora de apertura (HH:mm)
      let horaAperturaFormateada = '';
      if (cuenta.HORA_APERTURA) {
        if (cuenta.HORA_APERTURA instanceof Date) {
          const horas = String(cuenta.HORA_APERTURA.getUTCHours()).padStart(2, '0');
          const minutos = String(cuenta.HORA_APERTURA.getUTCMinutes()).padStart(2, '0');
          horaAperturaFormateada = `${horas}:${minutos}`;
        } else {
          const horaString = cuenta.HORA_APERTURA.toString().trim();
          // El formato esperado es HH:mm:ss, nos quedamos con HH:mm
          if (horaString.includes(':')) {
            horaAperturaFormateada = horaString.substring(0, 5);
          } else {
            horaAperturaFormateada = horaString;
          }
        }
      }

      console.log(`✅ Cuenta activa encontrada: ${cuenta.CUENTAID}, aperturada el ${fechaAperturaFormateada}`);

      return NextResponse.json({
        ok: true,
        requiresCuenta: true,
        existeCtaActiva: true,
        cuenta: {
          cuentaId: cuenta.CUENTAID,
          paciente: cuenta.PACIENTE,
          seguro: cuenta.SEGURO?.trim(),
          empresaSeguro: cuenta.EMPRESASEGURO?.trim(),
          observacion: cuenta.OBSERVACION?.trim(),
          fechaApertura: fechaAperturaFormateada,
          fechaAperturaRaw: cuenta.FECHA_APERTURA,
          horaApertura: horaAperturaFormateada,
          estado: cuenta.ESTADO,
          origen: cuenta.ORIGEN?.trim()
        },
        mensaje: `Se encontró una cuenta activa aperturada el ${fechaAperturaFormateada}`
      });
    }

    console.log(`ℹ️ No se encontró cuenta activa para paciente ${paciente} con seguro ${seguroTrimmed}`);

    return NextResponse.json({
      ok: true,
      requiresCuenta: true,
      existeCtaActiva: false,
      cuenta: null,
      mensaje: "No existe cuenta activa para este paciente con este tipo de seguro"
    });

  } catch (error) {
    console.error("Error al verificar cuenta:", error);
    return NextResponse.json(
      { 
        ok: false, 
        mensaje: "Error al verificar la cuenta", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
