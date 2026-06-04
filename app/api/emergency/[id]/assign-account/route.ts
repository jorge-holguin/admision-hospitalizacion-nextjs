import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Inicializar el cliente Prisma
const prisma = new PrismaClient();

/**
 * Endpoint para asegurar cuenta de emergencia
 * Ejecuta SP_LIQUIDA_NUEVA_CUENTA solo cuando SEGURO es "0", "02" o "17"
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Registrar tiempo de inicio para medir duración de la transacción
    const startTime = Date.now();
    // Obtener el ID de emergencia de los parámetros de ruta
    const { id: idEmergencia } = await params;
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
      hora, 
      nombre, 
      origen, 
      usuario, 
      nrofua, 
      presta,
      empresaSeguro,
      reuseAccountId, // ID de cuenta existente para reutilizar (opcional)
      forceCreateNew  // Forzar creación de nueva cuenta (opcional)
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
      // 1. Consultar la emergencia para obtener el valor de SEGUROLIQ y otros campos relevantes
      const emergenciaResult = await tx.$queryRaw`
        SELECT TOP 1 
          SEGUROLIQ, 
          PACIENTE, 
          CUENTAID,
          CONSULTORIO,
          NOMBRES,
          FECHA,
          HORA,
          OBSERVACION1
        FROM EMERGENCIA 
        WHERE EMERGENCIA_ID = ${idEmergencia}
      ` as any[];
      
      console.log('Datos de emergencia obtenidos:', JSON.stringify(emergenciaResult[0], null, 2));
      
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

      // Extraer datos de la emergencia para usar en el SP (prioridad: BD > body > default)
      // Truncar a tamaños máximos de columnas en tabla CUENTA para evitar error 8152
      const consultorioEmergencia = (emergencia.CONSULTORIO?.trim() || consultorio || "2090").slice(0, 6);   // varchar(6)
      const empresaEmergencia = (empresa || "0").slice(0, 4);                                                // char(4)
      const nombreEmergencia = (emergencia.NOMBRES?.trim() || nombre || "").slice(0, 90);                    // varchar(90)
      const observacionEmergencia = (emergencia.OBSERVACION1?.trim() || observa || ".").slice(0, 50);        // varchar(50)
      
      // ✅ CORRECCIÓN: Usar la fecha ACTUAL del servidor para FECHA_APERTURA de la cuenta
      // La cuenta se apertura en el momento actual, no en la fecha de la emergencia
      const now = new Date();
      const fechaFormateada = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      
      console.log(`📅 Fecha de apertura de cuenta (fecha actual): ${fechaFormateada}`);
      
      // Formatear hora correctamente para SQL Server (HH:MM)
      let horaFormateada: string;
      if (emergencia.HORA) {
        // Si es un string, usarlo directamente y asegurar formato HH:MM
        const horaStr = String(emergencia.HORA).trim();
        // Extraer solo HH:MM (primeros 5 caracteres)
        if (horaStr.length >= 5) {
          horaFormateada = horaStr.substring(0, 5);
        } else {
          horaFormateada = horaStr;
        }
      } else if (hora) {
        // Si viene del body, asegurar formato HH:MM
        const horaStr = String(hora).trim();
        horaFormateada = horaStr.length >= 5 ? horaStr.substring(0, 5) : horaStr;
      } else {
        const now = new Date();
        horaFormateada = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      }
      
      console.log(`📋 Datos extraídos de la emergencia:`);
      console.log(`   - Consultorio: '${consultorioEmergencia}' (BD: '${emergencia.CONSULTORIO}', body: '${consultorio}')`);
      console.log(`   - Empresa: '${empresaEmergencia}'`);
      console.log(`   - Nombre: '${nombreEmergencia}'`);
      console.log(`   - Observacion: '${observacionEmergencia}' (BD: '${emergencia.OBSERVACION1}')`);
      console.log(`   - Fecha formateada: '${fechaFormateada}' (BD: '${emergencia.FECHA}')`);
      console.log(`   - Hora formateada: '${horaFormateada}' (BD: '${emergencia.HORA}')`)

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

      // 3. Si se proporciona reuseAccountId, usar esa cuenta directamente
      if (reuseAccountId) {
        console.log(`♻️ Reutilizando cuenta existente: ${reuseAccountId}`);
        
        // Verificar que la cuenta existe y está activa
        const cuentaVerificada = await tx.$queryRaw`
          SELECT TOP 1 CUENTAID, ESTADO 
          FROM CUENTA 
          WHERE CUENTAID = ${reuseAccountId} AND ESTADO = '1'
        ` as any[];
        
        if (!cuentaVerificada || cuentaVerificada.length === 0) {
          return NextResponse.json(
            { 
              ok: false, 
              mensaje: `La cuenta ${reuseAccountId} no existe o no está activa` 
            },
            { status: 400 }
          );
        }
        
        // Actualizar la emergencia con el CUENTAID existente
        await tx.$executeRaw`
          UPDATE EMERGENCIA 
          SET CUENTAID = ${reuseAccountId}, 
          USUARIO = ${usuario} 
          WHERE EMERGENCIA_ID = ${idEmergencia}
        `;
        
        // Si hay empresaSeguro, actualizar en emergencia
        if (empresaSeguro) {
          await tx.$executeRaw`
            UPDATE EMERGENCIA 
            SET EMPRESASEGURO = ${empresaSeguro}
            WHERE EMERGENCIA_ID = ${idEmergencia}
          `;
        }
        
        console.log(`✅ Emergencia ${idEmergencia} actualizada con cuenta reutilizada ${reuseAccountId}`);
        
        return NextResponse.json(
          { 
            ok: true, 
            mensaje: "Cuenta reutilizada correctamente", 
            cuentaId: reuseAccountId,
            reutilizada: true
          },
          { status: 200 }
        );
      }

      // 4. Buscar si el paciente ya tiene una cuenta activa del mismo tipo de seguro
      // SOLO si NO se está forzando la creación de una nueva cuenta
      let cuentaId;
      let cuentaExistente: any[] = [];
      
      if (!forceCreateNew) {
        // Para emergencias usamos ORIGEN = 'EM' y verificamos que el SEGURO coincida
        const seguroParaBuscar = seguro || "02";
        cuentaExistente = await tx.$queryRaw`
          SELECT TOP 1 CUENTAID 
          FROM CUENTA 
          WHERE PACIENTE = ${paciente} 
          AND ESTADO = '1' AND ORIGEN = 'EM' AND SEGURO = ${seguroParaBuscar}
          ORDER BY FECHA_APERTURA DESC
        ` as any[];
      } else {
        console.log('🆕 forceCreateNew=true: Se creará una nueva cuenta sin verificar existentes');
      }

      // 5. Si no existe una cuenta activa O se fuerza la creación, llamar al procedimiento almacenado
      if (forceCreateNew || !cuentaExistente || cuentaExistente.length === 0) {
        // Preparar los parámetros para el SP
        const estado = "1"; // Estado activo
        
        // Ejecutar el procedimiento almacenado usando $queryRaw con parámetros nombrados
        // Las fechas y horas ya están formateadas arriba
        
        console.log(`🔧 Parámetros para SP_LIQUIDA_NUEVA_CUENTA:`);
        console.log(`   - paciente: ${paciente}`);
        console.log(`   - seguro: ${seguro || "02"}`);
        console.log(`   - empresa: ${empresaEmergencia}`);
        console.log(`   - consultorio: ${consultorioEmergencia}`);
        console.log(`   - origen: ${origen || "EM"}`);
        console.log(`   - fecha: ${fechaFormateada}`);
        console.log(`   - hora: ${horaFormateada}`);
        
        // Truncar parámetros del SP a tamaños de columna CUENTA
        const spPaciente = (paciente || "").slice(0, 10);               // char(10)
        const spSeguro = (seguro || "02").slice(0, 3);                  // char(3)
        const spOrigen = (origen || "EM").slice(0, 2);                  // char(2)
        const spUsuario = (usuario || "SISTEMA").slice(0, 20);          // varchar(20)
        const spNrofua = (nrofua || ".").slice(0, 18);                  // varchar(18)
        const spPresta = (presta || ".").slice(0, 3);                   // varchar(3)
        const spHora = horaFormateada.slice(0, 8);                      // char(8)

        const resultado = await tx.$queryRaw`
          EXEC SP_LIQUIDA_NUEVA_CUENTA 
            @paciente = ${spPaciente},
            @seguro = ${spSeguro},
            @empresa = ${empresaEmergencia},
            @consultorio = ${consultorioEmergencia},
            @observa = ${observacionEmergencia},
            @fecha = ${fechaFormateada},
            @estado = ${estado},
            @hora = ${spHora},
            @nombre = ${nombreEmergencia},
            @origen = ${spOrigen},
            @usuario = ${spUsuario},
            @nrofua = ${spNrofua},
            @presta = ${spPresta}
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
      
      // 5.1 Si hay empresaSeguro, actualizar tanto en emergencia como en cuenta
      if (empresaSeguro) {
        const empresaSegEmergencia = (empresaSeguro || "").slice(0, 2);  // EMERGENCIA.EMPRESASEGURO char(2)
        const empresaSegCuenta = (empresaSeguro || "").slice(0, 4);     // CUENTA.EMPRESASEGURO char(4)
        console.log(`📋 Actualizando EMPRESASEGURO en emergencia (${empresaSegEmergencia}) y cuenta (${empresaSegCuenta})`);
        
        // Actualizar EMPRESASEGURO en la emergencia
        await tx.$executeRaw`
          UPDATE EMERGENCIA 
          SET EMPRESASEGURO = ${empresaSegEmergencia}
          WHERE EMERGENCIA_ID = ${idEmergencia}
        `;
        
        // Actualizar EMPRESASEGURO en la cuenta
        await tx.$executeRaw`
          UPDATE CUENTA 
          SET EMPRESASEGURO = ${empresaSegCuenta}
          WHERE CUENTAID = ${cuentaId}
        `;
        
        console.log(`✅ EMPRESASEGURO actualizada correctamente en emergencia y cuenta`);
      }
      
      // 5.2 Actualizar observaciones en la cuenta si vienen en el body
      if (observa && observa.trim() !== '' && observa !== '.') {
        const observaTruncada = observa.slice(0, 50); // CUENTA.OBSERVACION varchar(50)
        console.log(`📋 Actualizando OBSERVACION en cuenta: ${observaTruncada}`);
        await tx.$executeRaw`
          UPDATE CUENTA 
          SET OBSERVACION = ${observaTruncada}
          WHERE CUENTAID = ${cuentaId}
        `;
      }
      
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
  } catch (error: any) {
    console.error("Error al asegurar cuenta:", error);
    
    const errorMsg = error?.message || '';
    const metaMessage = error?.meta?.message || '';
    
    // Error 8152: truncamiento de datos
    if (metaMessage.includes('truncar') || metaMessage.includes('truncate') || 
        metaMessage.includes('8152') || errorMsg.includes('8152')) {
      return NextResponse.json(
        { 
          ok: false, 
          mensaje: "Los datos ingresados exceden el tamaño permitido. Verifique observaciones, nombres y dirección.",
          error: "FIELD_TOO_LONG",
          detalle: "Los datos de cadena o binarios se truncarían en la base de datos."
        },
        { status: 400 }
      );
    }
    
    // Timeout de transacción
    if (errorMsg.includes('timeout') || errorMsg.includes('Transaction')) {
      return NextResponse.json(
        { 
          ok: false, 
          mensaje: "La operación tardó demasiado. Intente nuevamente en unos segundos.",
          error: "TIMEOUT"
        },
        { status: 504 }
      );
    }

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
