import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Sql } from "@prisma/client/runtime/library";

// Inicializar el cliente Prisma
const prisma = new PrismaClient();

/**
 * Endpoint para asegurar cuenta de hospitalización
 * Ejecuta SP_LIQUIDA_NUEVA_CUENTA solo cuando SEGURO es "0", "02" o "17"
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el ID de hospitalización de los parámetros de ruta
    const idHospitalizacion = params.id;
    console.log(`ID de hospitalización recibido: ${idHospitalizacion}`);
    
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
      // 1. Consultar la hospitalización para obtener el valor de SEGURO usando consulta SQL directa
      const hospitalizacionResult = await tx.$queryRaw`
        SELECT TOP 1 SEGURO, PACIENTE, CUENTAID 
        FROM HOSPITALIZA 
        WHERE IDHOSPITALIZACION = ${idHospitalizacion}
      ` as any[];
      
      const hospitalizacion = hospitalizacionResult && hospitalizacionResult.length > 0 ? hospitalizacionResult[0] : null;

      if (!hospitalizacion) {
        return NextResponse.json(
          { 
            ok: false, 
            mensaje: `No se encontró la hospitalización con ID ${idHospitalizacion}` 
          },
          { status: 404 }
        );
      }

      // 2. Verificar si el SEGURO está en los valores permitidos
      const segurosPermitidos = ["0", "00", "02", "17"];
      const seguroTrimmed = hospitalizacion.SEGURO?.trim();
      
      console.log(`Valor de SEGURO en hospitalización: '${seguroTrimmed}', tipo: ${typeof seguroTrimmed}`);
      console.log(`Valores permitidos: ${JSON.stringify(segurosPermitidos)}`);
      
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
      // Para hospitalizaciones usamos ORIGEN = 'HO' y verificamos que el SEGURO coincida
      const cuentaExistente = await tx.$queryRaw`
        SELECT TOP 1 CUENTAID 
        FROM CUENTA 
        WHERE PACIENTE = ${paciente} 
        AND ESTADO = '1' AND ORIGEN = 'HO' AND SEGURO = ${seguroTrimmed}
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
            @seguro = ${seguroTrimmed},
            @empresa = ${empresa || "0"},
            @consultorio = ${consultorio || "2090"},
            @observa = ${observa || "."},
            @fecha = ${fechaActual},
            @estado = ${estado},
            @hora = ${horaActual},
            @nombre = ${nombre || ""},
            @origen = ${origen || "HO"},
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

        // Capturar el CUENTAID retornado por el SP - el SP puede devolver CUENTA o CUENTAID
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

      // 5. Actualizar la hospitalización con el CUENTAID específico creado o encontrado
      console.log(`Actualizando hospitalización ${idHospitalizacion} con CUENTAID: ${cuentaId}, tipo: ${typeof cuentaId}`);
      
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
        UPDATE HOSPITALIZA 
        SET CUENTAID = ${cuentaId}, 
        USUARIO = ${usuario} 
        WHERE IDHOSPITALIZACION = ${idHospitalizacion}
      `;
      
      console.log(`Filas afectadas en la actualización: ${updateResult}`);
      
      // Verificar que la actualización se realizó correctamente
      const verificacion = await tx.$queryRaw`
        SELECT CUENTAID FROM HOSPITALIZA WHERE IDHOSPITALIZACION = ${idHospitalizacion}
      ` as any[];
      
      console.log(`Verificación post-actualización - CUENTAID en BD: ${verificacion[0]?.CUENTAID}`);

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
