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
    // Registrar tiempo de inicio para medir duración de la transacción
    const startTime = Date.now();
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

    console.log(`[${new Date().toISOString()}] Iniciando transacción con timeout extendido a 15 segundos...`);
    // Iniciar una transacción para garantizar consistencia con timeout extendido a 15 segundos
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

      // 3. Buscar si el paciente ya tiene una cuenta activa del mismo tipo de seguro
      // Para emergencias usamos ORIGEN = 'EM' y verificamos que el SEGURO coincida
      const seguroParaBuscar = seguro || "02";
      const cuentaExistente = await tx.$queryRaw`
        SELECT TOP 1 CUENTAID 
        FROM CUENTA 
        WHERE PACIENTE = ${paciente} 
        AND ESTADO = '1' AND ORIGEN = 'EM' AND SEGURO = ${seguroParaBuscar}
        ORDER BY FECHA_APERTURA DESC
      ` as any[];

      let cuentaId;

      // 4. Si no existe una cuenta activa del mismo tipo de seguro, llamar al procedimiento almacenado
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
        console.log('Resultado completo del SP:', JSON.stringify(resultado, null, 2));
        
        if (!resultado || resultado.length === 0) {
          return NextResponse.json(
            { 
              ok: false, 
              mensaje: "Error al ejecutar el procedimiento almacenado", 
              error: "No se recibió respuesta del SP" 
            },
            { status: 500 }
          );
        }

        // Verificar si el SP devolvió un error - comparar como string también
        const estadoSP = resultado[0].ESTADO;
        console.log(`Estado del SP: ${estadoSP}, tipo: ${typeof estadoSP}`);
        
        if (estadoSP !== 1 && estadoSP !== "1") {
          return NextResponse.json(
            { 
              ok: false, 
              mensaje: "Error al ejecutar el procedimiento almacenado", 
              error: resultado[0]?.MENSAJE || "Error desconocido del SP" 
            },
            { status: 500 }
          );
        }

        // Capturar el CUENTAID retornado por el SP - el SP devuelve CUENTA, no CUENTAID
        cuentaId = resultado[0].CUENTA || resultado[0].CUENTAID;
        console.log(`Nueva cuenta creada con ID: ${cuentaId}, tipo: ${typeof cuentaId}`);
        console.log('Resultado completo del primer elemento:', JSON.stringify(resultado[0], null, 2));
        
        // Verificar si el CUENTAID es válido
        if (!cuentaId || cuentaId === null || cuentaId === undefined || cuentaId === 0) {
          console.error('ERROR: El SP no devolvió un CUENTAID válido');
          console.error('Todas las propiedades del resultado[0]:', Object.keys(resultado[0]));
          console.error('Valores de todas las propiedades:', Object.values(resultado[0]));
          return NextResponse.json(
            { 
              ok: false, 
              mensaje: "Error: El procedimiento almacenado no devolvió un CUENTAID válido", 
              error: `CUENTAID recibido: ${cuentaId}`,
              resultadoCompleto: resultado[0]
            },
            { status: 500 }
          );
        }
      } else {
        // Usar la cuenta existente del mismo tipo de seguro
        cuentaId = cuentaExistente[0].CUENTAID;
        console.log(`Reutilizando cuenta existente del mismo tipo de seguro: ${cuentaId}`);
      }

      // 5. Actualizar la emergencia con el CUENTAID específico creado o encontrado
      console.log(`Actualizando emergencia ${idEmergencia} con CUENTAID: ${cuentaId}, tipo: ${typeof cuentaId}`);
      
      // Verificar nuevamente el valor antes de la actualización
      if (!cuentaId || cuentaId === null || cuentaId === undefined || cuentaId === 0) {
        console.error('ERROR CRÍTICO: cuentaId es inválido justo antes de la actualización');
        return NextResponse.json(
          { 
            ok: false, 
            mensaje: "Error crítico: cuentaId inválido antes de actualización", 
            error: `cuentaId: ${cuentaId}, tipo: ${typeof cuentaId}` 
          },
          { status: 500 }
        );
      }
      
      const updateResult = await tx.$executeRaw`
        UPDATE EMERGENCIA 
        SET CUENTAID = ${cuentaId}, 
        USUARIO = ${usuario} 
        WHERE EMERGENCIA_ID = ${idEmergencia}
      `;
      
      console.log(`Filas afectadas en la actualización: ${updateResult}`);
      
      // Verificar que la actualización se realizó correctamente
      const verificacion = await tx.$queryRaw`
        SELECT CUENTAID FROM EMERGENCIA WHERE EMERGENCIA_ID = ${idEmergencia}
      ` as any[];
      
      console.log(`Verificación post-actualización - CUENTAID en BD: ${verificacion[0]?.CUENTAID}`);

      // Calcular duración de la transacción
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`[${new Date().toISOString()}] Transacción completada en ${duration}ms (timeout configurado: 15000ms)`);
      
      // 6. Devolver respuesta exitosa
      return NextResponse.json(
        { 
          ok: true, 
          mensaje: "Cuenta asegurada correctamente", 
          cuentaId: cuentaId,
          duracionTransaccion: duration
        },
        { status: 200 }
      );
    }, {
      timeout: 15000 // Extender el timeout a 15 segundos (15000ms)
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
