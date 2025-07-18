import { prisma } from '@/lib/prisma/client'

export interface OrigenHospitalizacion {
  ORIGEN: string
  CODIGO: string
  CONSULTORIO: string
  NOM_CONSULTORIO: string
  PACIENTE: string
  FECHA: Date
  MEDICO: string
  NOM_MEDICO: string
  NOMBRES?: string
  DNI?: string
  DX?: string
  // Campos adicionales para debugging
  [key: string]: any
}

export class OrigenHospitalizacionService {
  async findAll(params: {
    skip?: number
    take?: number
    search?: string
    pacienteId?: string
  }) {
    try {
      const { skip = 0, take = 10, search = '', pacienteId = '' } = params
      console.log('Buscando orígenes de hospitalización con parámetros:', { skip, take, search })
      
      // Verificar primero si la vista existe
      try {
        const checkView = await prisma.$queryRaw`SELECT TOP 1 * FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME = 'V_ORIGEN_HOSPITALIZA'`
        console.log('Verificación de vista:', checkView)
      } catch (checkError) {
        console.error('Error al verificar la vista:', checkError)
      }
      
      // Construir la consulta SQL con búsqueda y filtro de paciente
      let whereClause = ''
      
      // Filtrar por paciente si se proporciona un ID
      if (pacienteId) {
        whereClause = `AND PACIENTE = '${pacienteId}'`
        console.log(`Filtrando por paciente ID: ${pacienteId}`)
      }
      
      // Añadir filtros de búsqueda si se proporciona
      if (search) {
        whereClause += ` AND (CODIGO LIKE '%${search}%' OR NOM_CONSULTORIO LIKE '%${search}%' OR NOM_MEDICO LIKE '%${search}%' OR 
          EXISTS (SELECT 1 FROM dbo.ATENCIONC WHERE ID_CITA = CODIGO AND ORIGEN = 'CE' AND (NOMBRES LIKE '%${search}%' OR DNI LIKE '%${search}%')) OR
          EXISTS (SELECT 1 FROM dbo.EMERGENCIA WHERE EMERGENCIA_ID = CODIGO  AND ORIGEN = 'EM' AND (NOMBRES LIKE '%${search}%' OR DOCUMENTO LIKE '%${search}%')))`
      }
      
      // Ejecutar la consulta SQL directamente usando la vista V_ORIGEN_HOSPITALIZA
      console.log('Ejecutando consulta SQL...')
      // Agregar OPTION (RECOMPILE) para forzar a SQL Server a recompilar el plan de ejecución
      const query = `
        SELECT TOP ${take} ORIGEN, CODIGO, CONSULTORIO, NOM_CONSULTORIO, PACIENTE, FECHA, MEDICO, NOM_MEDICO,
          CASE 
            WHEN ORIGEN = 'CE' THEN (SELECT NOMBRES FROM dbo.ATENCIONC WHERE ID_CITA = CODIGO)
            WHEN ORIGEN = 'EM' THEN (SELECT NOMBRES FROM dbo.EMERGENCIA WHERE EMERGENCIA_ID = CODIGO)
            ELSE NULL
          END AS NOMBRES,
          CASE 
            WHEN ORIGEN = 'CE' THEN (SELECT DNI FROM dbo.ATENCIONC WHERE ID_CITA = CODIGO)
            WHEN ORIGEN = 'EM' THEN (SELECT DOCUMENTO FROM dbo.EMERGENCIA WHERE EMERGENCIA_ID = CODIGO)
            ELSE NULL
          END AS DNI,
          CASE
            WHEN ORIGEN = 'CE' THEN (SELECT TOP 1 DX FROM dbo.ATENCIOND WITH (NOLOCK) WHERE ID_CITA = CODIGO AND DX LIKE '[A-Z]%' ORDER BY DX)
            WHEN ORIGEN = 'EM' THEN (SELECT TOP 1 DX FROM dbo.ATENCIOND WITH (NOLOCK) WHERE ID_CITA = CODIGO AND DX LIKE '[A-Z]%' ORDER BY DX)
            ELSE NULL
          END AS DX,
          CASE
            WHEN ORIGEN = 'CE' THEN (SELECT TOP 1 DX_DES FROM dbo.ATENCIOND WITH (NOLOCK) WHERE ID_CITA = CODIGO AND DX LIKE '[A-Z]%' ORDER BY DX)
            WHEN ORIGEN = 'EM' THEN (SELECT TOP 1 DX_DES FROM dbo.ATENCIOND WITH (NOLOCK) WHERE ID_CITA = CODIGO AND DX LIKE '[A-Z]%' ORDER BY DX)
            ELSE NULL
          END AS DX_DES
        FROM (
          SELECT ROW_NUMBER() OVER (ORDER BY FECHA DESC) AS RowNum, ORIGEN, CODIGO, CONSULTORIO, NOM_CONSULTORIO, PACIENTE, FECHA, MEDICO, NOM_MEDICO
          FROM V_ORIGEN_HOSPITALIZA WITH (NOLOCK)
          WHERE 1=1 ${whereClause}
        ) AS FilteredResults
        WHERE RowNum > ${skip}
        ORDER BY FECHA DESC
        OPTION (RECOMPILE)
      `
      console.log('Query a ejecutar:', query)
      
      const result = await prisma.$queryRawUnsafe<OrigenHospitalizacion[]>(query)
      
      console.log(`Encontrados ${result.length} orígenes de hospitalización`)
      if (result.length > 0) {
        console.log('Muestra del primer resultado:', result[0])
        // Revisar específicamente los registros de emergencia
        const emergenciaResults = result.filter((r: OrigenHospitalizacion) => r.ORIGEN === 'EM')
        if (emergenciaResults.length > 0) {
          console.log('DATOS DE EMERGENCIA:', JSON.stringify(emergenciaResults[0], null, 2))
        }
      }
      return result
    } catch (error) {
      console.error('Error en findAll:', error instanceof Error ? error.message : 'Error desconocido', error)
      // Intentar una consulta alternativa si la vista no existe
      try {
        console.log('Intentando consulta alternativa con UNION ALL para CE y EM...')
        const result = await prisma.$queryRaw<OrigenHospitalizacion[]>`
          SELECT TOP ${params.take || 10} ORIGEN, CODIGO, CONSULTORIO, NOM_CONSULTORIO, PACIENTE, FECHA, MEDICO, NOM_MEDICO, NOMBRES, DNI, DX
          FROM (
            SELECT 
              'CE' AS ORIGEN, 
              A.ID_CITA AS CODIGO, 
              B.CONSULTORIO, 
              B.NOMBRE AS NOM_CONSULTORIO, 
              A.PACIENTE, 
              A.FECHA + A.HORA_ATEN AS FECHA, 
              A.MEDICO, 
              C.NOMBRE AS NOM_MEDICO,
              RTRIM(ISNULL(D.NOMBRES, COALESCE(CONCAT(RTRIM(ISNULL(D.NOMBRE, '')), ' ', RTRIM(ISNULL(D.PATERNO, '')), ' ', RTRIM(ISNULL(D.MATERNO, ''))), A.NOMBRES))) AS NOMBRES,
              RTRIM(ISNULL(D.DOCUMENTO, A.DNI)) AS DNI,
              (SELECT TOP 1 DX FROM dbo.ATENCIOND WITH (NOLOCK) WHERE ID_CITA = A.ID_CITA AND DX LIKE '[A-Z]%' ORDER BY DX) AS DX,
              (SELECT TOP 1 DX_DES FROM dbo.ATENCIOND WITH (NOLOCK) WHERE ID_CITA = A.ID_CITA AND DX LIKE '[A-Z]%' ORDER BY DX) AS DX_DES,
              A.FECHA AS FECHA_ORDEN
            FROM dbo.ATENCIONC AS A WITH (NOLOCK)
            INNER JOIN dbo.CONSULTORIO AS B WITH (NOLOCK) ON A.CONSULTORIO = B.CONSULTORIO 
            INNER JOIN dbo.MEDICO AS C WITH (NOLOCK) ON A.MEDICO = C.MEDICO
            LEFT JOIN dbo.PACIENTE AS D WITH (NOLOCK) ON A.PACIENTE = D.PACIENTE
            WHERE DATEDIFF(DAY, A.FECHA, GETDATE()) < 90
            ${params.pacienteId ? `AND A.PACIENTE = '${params.pacienteId}'` : ''}
            ${params.search ? `AND (A.ID_CITA LIKE '%${params.search}%' OR B.NOMBRE LIKE '%${params.search}%' OR C.NOMBRE LIKE '%${params.search}%' OR D.NOMBRES LIKE '%${params.search}%' OR D.DOCUMENTO LIKE '%${params.search}%')` : ''}
            
            UNION ALL
            
            SELECT 
              'EM' AS ORIGEN, 
              RTRIM(A.EMERGENCIA_ID) AS CODIGO, 
              RTRIM(B.CONSULTORIO) AS CONSULTORIO, 
              RTRIM(B.NOMBRE) AS NOM_CONSULTORIO, 
              RTRIM(A.PACIENTE) AS PACIENTE, 
              A.FECHA + A.HORA AS FECHA, 
              RTRIM(C.MEDICO) AS MEDICO, 
              RTRIM(C.NOMBRE) AS NOM_MEDICO,
              RTRIM(ISNULL(D.NOMBRES, COALESCE(CONCAT(RTRIM(ISNULL(D.NOMBRE, '')), ' ', RTRIM(ISNULL(D.PATERNO, '')), ' ', RTRIM(ISNULL(D.MATERNO, ''))), RTRIM(ISNULL(A.NOMBRES, CONCAT(RTRIM(ISNULL(A.NOMBRE, '')), ' ', RTRIM(ISNULL(A.PATERNO, '')), ' ', RTRIM(ISNULL(A.MATERNO, '')))))))) AS NOMBRES,
              RTRIM(ISNULL(D.DOCUMENTO, RTRIM(ISNULL(A.DOCUMENTO, '')))) AS DNI,
              (SELECT TOP 1 DX FROM dbo.ATENCIOND WITH (NOLOCK) WHERE ID_CITA = A.EMERGENCIA_ID AND DX LIKE '[A-Z]%' ORDER BY DX) AS DX,
              (SELECT TOP 1 DX_DES FROM dbo.ATENCIOND WITH (NOLOCK) WHERE ID_CITA = A.EMERGENCIA_ID AND DX LIKE '[A-Z]%' ORDER BY DX) AS DX_DES,
              A.FECHA AS FECHA_ORDEN
            FROM dbo.EMERGENCIA AS A WITH (NOLOCK)
            INNER JOIN dbo.CONSULTORIO AS B WITH (NOLOCK) ON A.CONSULTORIO = B.CONSULTORIO 
            INNER JOIN dbo.MEDICO AS C WITH (NOLOCK) ON A.MEDICO = C.MEDICO
            LEFT JOIN dbo.PACIENTE AS D WITH (NOLOCK) ON A.PACIENTE = D.PACIENTE
            WHERE DATEDIFF(DAY, A.FECHA, GETDATE()) < 90
            ${params.pacienteId ? `AND A.PACIENTE = '${params.pacienteId}'` : ''}
            ${params.search ? `AND (A.EMERGENCIA_ID LIKE '%${params.search}%' OR B.NOMBRE LIKE '%${params.search}%' OR C.NOMBRE LIKE '%${params.search}%' OR D.NOMBRES LIKE '%${params.search}%' OR D.DOCUMENTO LIKE '%${params.search}%')` : ''}
          ) AS CombinedResults
          ORDER BY FECHA_ORDEN DESC
          OPTION (RECOMPILE)
        `
        console.log(`Encontrados ${result.length} orígenes de hospitalización (alternativa)`)
        return result
      } catch (altError) {
        console.error('Error en consulta alternativa:', altError)
        throw error // Lanzar el error original
      }
    }
  }

  async findOne(id: string) {
    try {
      console.log(`Buscando origen de hospitalización con ID: ${id}`)
      
      // Usar la vista V_ORIGEN_HOSPITALIZA para obtener un registro específico
      const query = `
        SELECT V.ORIGEN, V.CODIGO, V.CONSULTORIO, V.NOM_CONSULTORIO, V.PACIENTE, V.FECHA, V.MEDICO, V.NOM_MEDICO,
          CASE 
            WHEN V.ORIGEN = 'CE' THEN A.NOMBRES
            WHEN V.ORIGEN = 'EM' THEN E.NOMBRES
            ELSE NULL
          END AS NOMBRES,
          CASE 
            WHEN V.ORIGEN = 'CE' THEN A.DNI
            WHEN V.ORIGEN = 'EM' THEN E.DOCUMENTO
            ELSE NULL
          END AS DNI,
          CASE 
            WHEN V.ORIGEN = 'CE' THEN (
              SELECT STRING_AGG(CONCAT(RTRIM(AD.DX), ' ', AD.DX_DES), ' , ') 
              FROM dbo.ATENCIOND AD WITH (NOLOCK) 
              WHERE AD.ID_CITA = V.CODIGO AND AD.DX LIKE '[A-Z]%'
            )
            WHEN V.ORIGEN = 'EM' THEN (
              SELECT STRING_AGG(CONCAT(RTRIM(AD.DX), ' ', AD.DX_DES), ' , ') 
              FROM dbo.ATENCIOND AD WITH (NOLOCK) 
              WHERE AD.ID_CITA = V.CODIGO AND AD.DX LIKE '[A-Z]%'
            )
            ELSE NULL
          END AS DX
        FROM V_ORIGEN_HOSPITALIZA V WITH (NOLOCK)
        LEFT JOIN dbo.ATENCIONC A WITH (NOLOCK) ON V.ORIGEN = 'CE' AND V.CODIGO = A.ID_CITA
        LEFT JOIN dbo.EMERGENCIA E WITH (NOLOCK) ON V.ORIGEN = 'EM' AND V.CODIGO = E.EMERGENCIA_ID
        WHERE V.CODIGO = '${id}'
        OPTION (RECOMPILE)
      `
      console.log('Query findOne a ejecutar:', query)
      
      const result = await prisma.$queryRawUnsafe<OrigenHospitalizacion[]>(query)
      
      console.log(`Origen de hospitalización encontrado:`, result[0])
      return result[0] || null
    } catch (error) {
      console.error(`Error en findOne(${id}):`, error instanceof Error ? error.message : 'Error desconocido')
      // Intentar una consulta alternativa si la vista no existe
      try {
        console.log('Intentando consulta alternativa para findOne con CE y EM...')
        const query = `
          SELECT ORIGEN, CODIGO, CONSULTORIO, NOM_CONSULTORIO, PACIENTE, FECHA, MEDICO, NOM_MEDICO, NOMBRES, DNI, DX
          FROM (
            SELECT 
              'CE' AS ORIGEN, 
              A.ID_CITA AS CODIGO, 
              B.CONSULTORIO, 
              B.NOMBRE AS NOM_CONSULTORIO, 
              A.PACIENTE, 
              A.FECHA + A.HORA_ATEN AS FECHA, 
              A.MEDICO, 
              C.NOMBRE AS NOM_MEDICO,
              RTRIM(ISNULL(D.NOMBRES, COALESCE(CONCAT(RTRIM(ISNULL(D.NOMBRE, '')), ' ', RTRIM(ISNULL(D.PATERNO, '')), ' ', RTRIM(ISNULL(D.MATERNO, ''))), A.NOMBRES))) AS NOMBRES,
              RTRIM(ISNULL(D.DOCUMENTO, A.DNI)) AS DNI,
              (
                SELECT STRING_AGG(CONCAT(RTRIM(DX), ' ', DX_DES), ' , ') 
                FROM dbo.ATENCIOND WITH (NOLOCK) 
                WHERE ID_CITA = A.ID_CITA AND DX LIKE '[A-Z]%'
              ) AS DX
            FROM dbo.ATENCIONC AS A WITH (NOLOCK)
            INNER JOIN dbo.CONSULTORIO AS B WITH (NOLOCK) ON A.CONSULTORIO = B.CONSULTORIO 
            INNER JOIN dbo.MEDICO AS C WITH (NOLOCK) ON A.MEDICO = C.MEDICO  
            LEFT JOIN dbo.PACIENTE AS D WITH (NOLOCK) ON A.PACIENTE = D.PACIENTE
            WHERE A.ID_CITA = '${id}'
            
            UNION ALL
            
            SELECT 
              'EM' AS ORIGEN, 
              RTRIM(A.EMERGENCIA_ID) AS CODIGO, 
              RTRIM(B.CONSULTORIO) AS CONSULTORIO, 
              RTRIM(B.NOMBRE) AS NOM_CONSULTORIO, 
              RTRIM(A.PACIENTE) AS PACIENTE, 
              A.FECHA + A.HORA AS FECHA, 
              RTRIM(C.MEDICO) AS MEDICO, 
              RTRIM(C.NOMBRE) AS NOM_MEDICO,
              RTRIM(ISNULL(D.NOMBRES, COALESCE(CONCAT(RTRIM(ISNULL(D.NOMBRE, '')), ' ', RTRIM(ISNULL(D.PATERNO, '')), ' ', RTRIM(ISNULL(D.MATERNO, ''))), RTRIM(ISNULL(A.NOMBRES, CONCAT(RTRIM(ISNULL(A.NOMBRE, '')), ' ', RTRIM(ISNULL(A.PATERNO, '')), ' ', RTRIM(ISNULL(A.MATERNO, '')))))))) AS NOMBRES,
              RTRIM(ISNULL(D.DOCUMENTO, RTRIM(ISNULL(A.DOCUMENTO, '')))) AS DNI,
              (
                SELECT STRING_AGG(CONCAT(RTRIM(DX), ' ', DX_DES), ' , ') 
                FROM dbo.ATENCIOND WITH (NOLOCK) 
                WHERE ID_CITA = A.EMERGENCIA_ID AND DX LIKE '[A-Z]%'
              ) AS DX
            FROM dbo.EMERGENCIA AS A WITH (NOLOCK)
            INNER JOIN dbo.CONSULTORIO AS B WITH (NOLOCK) ON A.CONSULTORIO = B.CONSULTORIO 
            INNER JOIN dbo.MEDICO AS C WITH (NOLOCK) ON A.MEDICO = C.MEDICO
            LEFT JOIN dbo.PACIENTE AS D WITH (NOLOCK) ON A.PACIENTE = D.PACIENTE
            WHERE A.EMERGENCIA_ID = '${id}'
          ) AS CombinedResults
          OPTION (RECOMPILE)
        `
        console.log('Query findOne alternativa a ejecutar:', query)
        
        const result = await prisma.$queryRawUnsafe<OrigenHospitalizacion[]>(query)
        console.log(`Origen de hospitalización encontrado (alternativa):`, result[0])
        return result[0] || null
      } catch (altError) {
        console.error('Error en consulta alternativa findOne:', altError)
        throw error // Lanzar el error original
      }
    }
  }

  async count(params: {
    search?: string
    pacienteId?: string
  }) {
    try {
      console.log('Contando orígenes de hospitalización con parámetros:', params)
      const { search = '', pacienteId = '' } = params
      
      // Construir la consulta SQL con búsqueda y filtro de paciente
      let whereClause = ''
      
      // Filtrar por paciente si se proporciona un ID
      if (pacienteId) {
        whereClause = `AND PACIENTE = '${pacienteId}'`
        console.log(`Filtrando conteo por paciente ID: ${pacienteId}`)
      }
      
      // Añadir filtros de búsqueda si se proporciona
      if (search) {
        whereClause += ` AND (CODIGO LIKE '%${search}%' OR NOM_CONSULTORIO LIKE '%${search}%' OR NOM_MEDICO LIKE '%${search}%')`
      }
      
      // Ejecutar la consulta SQL directamente para contar usando la vista V_ORIGEN_HOSPITALIZA
      const query = `
        SELECT COUNT(*) as count
        FROM V_ORIGEN_HOSPITALIZA WITH (NOLOCK)
        WHERE 1=1 ${whereClause}
        OPTION (RECOMPILE)
      `
      console.log('Query count a ejecutar:', query)
      
      const result = await prisma.$queryRawUnsafe<{count: number}[]>(query)
      
      const count = result[0]?.count || 0
      console.log(`Total de orígenes de hospitalización: ${count}`)
      return count
    } catch (error) {
      console.error('Error en count:', error instanceof Error ? error.message : 'Error desconocido')
      // Intentar una consulta alternativa si la vista no existe
      try {
        console.log('Intentando consulta alternativa para count con CE y EM...')
        // Importante: volver a obtener search del parámetro para evitar errores de scope
        const { search = '' } = params
        
        const query = `
          SELECT COUNT(*) as count
          FROM (
            SELECT A.ID_CITA AS CODIGO
            FROM dbo.ATENCIONC AS A WITH (NOLOCK)
            INNER JOIN dbo.CONSULTORIO AS B WITH (NOLOCK) ON A.CONSULTORIO = B.CONSULTORIO 
            INNER JOIN dbo.MEDICO AS C WITH (NOLOCK) ON A.MEDICO = C.MEDICO
            LEFT JOIN dbo.PACIENTE AS D WITH (NOLOCK) ON A.PACIENTE = D.PACIENTE
            WHERE DATEDIFF(DAY, A.FECHA, GETDATE()) < 90
            ${params.pacienteId ? `AND A.PACIENTE = '${params.pacienteId}'` : ''}
            ${search ? `AND (A.ID_CITA LIKE '%${search}%' OR B.NOMBRE LIKE '%${search}%' OR C.NOMBRE LIKE '%${search}%' OR D.NOMBRES LIKE '%${search}%' OR D.DOCUMENTO LIKE '%${search}%')` : ''}
            
            UNION ALL
            
            SELECT A.EMERGENCIA_ID AS CODIGO
            FROM dbo.EMERGENCIA AS A WITH (NOLOCK)
            INNER JOIN dbo.CONSULTORIO AS B WITH (NOLOCK) ON A.CONSULTORIO = B.CONSULTORIO 
            INNER JOIN dbo.MEDICO AS C WITH (NOLOCK) ON A.MEDICO = C.MEDICO
            LEFT JOIN dbo.PACIENTE AS D WITH (NOLOCK) ON A.PACIENTE = D.PACIENTE
            WHERE DATEDIFF(DAY, A.FECHA, GETDATE()) < 90
            ${params.pacienteId ? `AND A.PACIENTE = '${params.pacienteId}'` : ''}
            ${search ? `AND (A.EMERGENCIA_ID LIKE '%${search}%' OR B.NOMBRE LIKE '%${search}%' OR C.NOMBRE LIKE '%${search}%' OR D.NOMBRES LIKE '%${search}%' OR D.DOCUMENTO LIKE '%${search}%')` : ''}
          ) AS CombinedResults
          OPTION (RECOMPILE)
        `
        console.log('Query count alternativa a ejecutar:', query)
        
        const result = await prisma.$queryRawUnsafe<{count: number}[]>(query)
        const count = result[0]?.count || 0
        console.log(`Total de orígenes de hospitalización (alternativa): ${count}`)
        return count
      } catch (altError) {
        console.error('Error en consulta alternativa count:', altError)
        return 0 // Devolver 0 en caso de error
      }
    }
  }
}

export const origenHospitalizacionService = new OrigenHospitalizacionService()
