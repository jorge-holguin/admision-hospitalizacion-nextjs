import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Sql } from "@prisma/client/runtime/library";

// Inicializar el cliente Prisma
const prisma = new PrismaClient();

/**
 * Endpoint para asegurar cuenta de emergencia
 * Ejecuta SP_LIQUIDA_NUEVA_CUENTA solo cuando SEGURO es "0", "02" o "17"
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el ID de emergencia de los parámetros de ruta
    const idEmergencia = params.id;
    console.log(`ID de emergencia recibido: ${idEmergencia}`);
    
    // Obtener los datos del cuerpo de la solicitud
    const body = await req.json();
    console.log('Datos recibidos en el cuerpo de la solicitud:', JSON.stringify(body, null, 2));
    
    const { 
      paciente, 
      seguro, 
      empresa, 
      consultorio, 
      observa, 
      fecha, 
      hora, 
      nombre, 
      origen, 
      usuario, 
      nrofua, 
      presta 
    } = body;
    
    console.log('Datos extraídos del cuerpo:');
    console.log(`- paciente: ${paciente}`);
    console.log(`- seguro: ${seguro}`);
    console.log(`- usuario: ${usuario}`);
    console.log(`- nombre: ${nombre}`);

    // Validar que todos los campos requeridos estén presentes
    if (!paciente || !usuario) {
      return NextResponse.json(
        { 
          ok: false, 
          mensaje: "Faltan datos requeridos. Se necesita al menos paciente y usuario." 
        },
        { status: 400 }
      );
    }

    // Iniciar una transacción para garantizar consistencia
    return await prisma.$transaction(async (tx) => {
      // 1. Consultar la emergencia para obtener el valor de SEGUROLIQ usando consulta SQL directa
      const emergenciaResult = await tx.$queryRaw`
        SELECT TOP 1 SEGUROLIQ, PACIENTE, CUENTAID 
        FROM EMERGENCIA 
        WHERE EMERGENCIA_ID = ${idEmergencia}
      ` as any[];
      
      const emergencia = emergenciaResult && emergenciaResult.length > 0 ? emergenciaResult[0] : null;

      if (!emergencia) {
        return NextResponse.json(
          { 
            ok: false, 
            mensaje: `No se encontró la emergencia con ID ${idEmergencia}` 
          },
          { status: 404 }
        );
      }

      // 2. Verificar si el SEGUROLIQ está en los valores permitidos
      const segurosPermitidos = ["0", "02", "17"];
      // Depurar el valor de SEGUROLIQ para entender por qué no coincide
      console.log(`Valor de SEGUROLIQ en la base de datos: '${emergencia.SEGUROLIQ}', tipo: ${typeof emergencia.SEGUROLIQ}, longitud: ${emergencia.SEGUROLIQ?.length}`);
      console.log(`Valores permitidos: ${JSON.stringify(segurosPermitidos)}`);
      
      // Intentar hacer trim() para eliminar espacios
      const seguroTrimmed = emergencia.SEGUROLIQ?.trim();
      console.log(`Valor de SEGUROLIQ después de trim(): '${seguroTrimmed}', longitud: ${seguroTrimmed?.length}`);
      
      if (!segurosPermitidos.includes(seguroTrimmed)) {
        return NextResponse.json(
          { 
            ok: true, 
            mensaje: "No aplica. El tipo de cuenta no requiere liquidación." 
          },
          { status: 200 }
        );
      }

      // 3. Buscar si el paciente ya tiene una cuenta activa mediante consulta directa a SQL
      // Para emergencias usamos ORIGEN = 'EM'
      const cuentaExistente = await tx.$queryRaw`
        SELECT TOP 1 CUENTAID 
        FROM CUENTA 
        WHERE PACIENTE = ${paciente} 
        AND ESTADO = '1' AND ORIGEN = 'EM'
        ORDER BY FECHA_APERTURA DESC
      ` as any[];

      let cuentaId;

      // 4. Si no existe una cuenta activa, llamar al procedimiento almacenado
      if (!cuentaExistente || cuentaExistente.length === 0) {
        // Preparar los parámetros para el SP
        const estado = "1"; // Estado activo
        
        // Ejecutar el procedimiento almacenado usando $queryRaw con parámetros nombrados
        const fechaActual = fecha || new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
        const horaActual = hora || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const resultado = await tx.$queryRaw`
          EXEC SP_LIQUIDA_NUEVA_CUENTA 
            @paciente = ${paciente},
            @seguro = ${seguro || "02"},
            @empresa = ${empresa || "0"},
            @consultorio = ${consultorio || "2090"},
            @observa = ${observa || "."},
            @fecha = ${fechaActual},
            @estado = ${estado},
            @hora = ${horaActual},
            @nombre = ${nombre || ""},
            @origen = ${origen || "EM"},
            @usuario = ${usuario},
            @nrofua = ${nrofua || "."},
            @presta = ${presta || "."}
        ` as any[];

        // Verificar el resultado del SP
        if (!resultado || resultado.length === 0 || resultado[0].ESTADO !== 1) {
          return NextResponse.json(
            { 
              ok: false, 
              mensaje: "Error al ejecutar el procedimiento almacenado", 
              error: resultado ? resultado[0]?.MENSAJE : "No se recibió respuesta del SP" 
            },
            { status: 500 }
          );
        }

        // Capturar el CUENTAID retornado por el SP
        cuentaId = resultado[0].CUENTAID;
      } else {
        // Usar la cuenta existente
        cuentaId = cuentaExistente[0].CUENTAID;
      }

      // 5. Actualizar la emergencia con el CUENTAID más reciente del paciente usando SQL directo con subconsulta
      await tx.$executeRaw`
        UPDATE EMERGENCIA 
        SET CUENTAID = (
          SELECT TOP 1 CUENTAID 
          FROM CUENTA 
          WHERE ESTADO = '1' AND ORIGEN ='EM' AND PACIENTE = ${paciente} 
          ORDER BY FECHA_APERTURA DESC
        ), 
        USUARIO = ${usuario} 
        WHERE EMERGENCIA_ID = ${idEmergencia}
      `;

      // 6. Devolver respuesta exitosa
      return NextResponse.json(
        { 
          ok: true, 
          mensaje: "Cuenta asegurada correctamente", 
          cuentaId: cuentaId 
        },
        { status: 200 }
      );
    });
  } catch (error) {
    console.error("Error al asegurar cuenta:", error);
    return NextResponse.json(
      { 
        ok: false, 
        mensaje: "Error al procesar la solicitud", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
