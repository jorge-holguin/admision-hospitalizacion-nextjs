import { prisma } from '@/lib/prisma/client'

export interface Diagnostico {
  Codigo: string
  Nombre: string
}

export interface DiagnosticoDetallado {
  DX: string
  DX_DES?: string
}

export class DiagnosticoService {
  /**
   * Busca diagnósticos de emergencia con opciones de búsqueda y límite
   * @param search Término de búsqueda opcional
   * @param limit Límite de resultados opcional
   * @returns Lista de diagnósticos filtrados
   */
  async findAllEmergencia(search?: string, limit?: number) {
    try {
      console.log(`Buscando diagnósticos de emergencia${search ? ` con búsqueda: ${search}` : ''}${limit ? ` (límite: ${limit})` : ''}`)
      
      // Construir la consulta SQL base
      let sqlQuery = ''
      
      // SQL Server 2008 compatible query con TOP para límite
      if (limit && limit > 0) {
        sqlQuery = `
          SELECT TOP ${limit} Codigo, Nombre 
          FROM CIEXHIS_V2 
          WHERE Codigo LIKE '[A-Z]%' AND Tipo = 'CX'
        `
      } else {
        sqlQuery = `
          SELECT Codigo, Nombre 
          FROM CIEXHIS_V2 
          WHERE Codigo LIKE '[A-Z]%' AND Tipo = 'CX'
        `
      }
      
      // Añadir filtro de búsqueda si se proporciona
      if (search && search.trim()) {
        // Escapar comillas simples para evitar inyección SQL
        const safeSearch = search.replace(/'/g, "''");
        sqlQuery += ` AND (Codigo LIKE '%${safeSearch}%' OR Nombre LIKE '%${safeSearch}%')`
      }
      
      // Añadir ordenamiento
      sqlQuery += ` ORDER BY Codigo`
      
      // Ejecutar la consulta SQL para obtener diagnósticos de emergencia
      const diagnosticos = await prisma.$queryRawUnsafe<Diagnostico[]>(sqlQuery)
      
      console.log(`Se encontraron ${diagnosticos.length} diagnósticos de emergencia`)
      return diagnosticos
    } catch (error) {
      console.error('Error al buscar diagnósticos de emergencia:', error)
      throw new Error(`Error al buscar diagnósticos de emergencia: ${error}`)
    }
  }
  
  async findByEmergenciaId(emergenciaId: string) {
    try {
      console.log(`Buscando diagnóstico para emergencia con ID: ${emergenciaId}`)
      
      // Ejecutar la consulta SQL para obtener diagnósticos de emergencia
      const diagnosticos = await prisma.$queryRaw<DiagnosticoDetallado[]>`
        SELECT STUFF((
          SELECT ', ' + RTRIM(DX) + ' ' + DX_DES
          FROM dbo.ATENCIOND WITH (NOLOCK) 
          WHERE ID_CITA = ${emergenciaId} AND DX LIKE '[A-Z]%'
          FOR XML PATH('')), 1, 2, '') AS DX
      `
      
      if (!diagnosticos.length || !diagnosticos[0].DX) {
        console.log(`No se encontró diagnóstico para la emergencia: ${emergenciaId}`)
        return null
      }
      
      // Extraer el primer código de diagnóstico
      const dxString = diagnosticos[0].DX;
      console.log(`Diagnósticos encontrados: ${dxString}`);
      
      // Extraer el primer código de diagnóstico (formato: "A00 Descripción")
      const match = dxString.match(/([A-Z][0-9]+(?:\.[0-9]+)?)/i);
      const codigo = match ? match[0] : null;
      
      if (!codigo) {
        console.log(`No se pudo extraer un código válido de diagnóstico de: ${dxString}`);
        return null;
      }
      
      // Buscar el nombre del diagnóstico en CIEXHIS_V2
      const diagnosticoCompleto = await prisma.$queryRaw<Diagnostico[]>`
        SELECT Codigo, Nombre 
        FROM CIEXHIS_V2 
        WHERE Codigo = ${codigo}
      `
      
      if (diagnosticoCompleto.length === 0) {
        console.log(`Código de diagnóstico encontrado (${codigo}) pero no existe en CIEXHIS_V2`)
        return { Codigo: codigo, Nombre: 'Diagnóstico no encontrado' }
      }
      
      console.log(`Diagnóstico encontrado: ${diagnosticoCompleto[0].Codigo} - ${diagnosticoCompleto[0].Nombre}`)
      return diagnosticoCompleto[0]
    } catch (error) {
      console.error(`Error al buscar diagnóstico para emergencia ${emergenciaId}:`, error)
      throw new Error(`Error al buscar diagnóstico para emergencia ${emergenciaId}: ${error}`)
    }
  }
  
  /**
   * Busca un diagnóstico por ID de consulta externa
   * @param citaId ID de la cita de consulta externa
   * @returns Diagnóstico encontrado o null
   */
  async findByConsultaExterna(citaId: string) {
    try {
      console.log(`Buscando diagnóstico para consulta externa con ID: ${citaId}`)
      
      // Ejecutar la consulta SQL para obtener diagnósticos de consulta externa
      const diagnosticos = await prisma.$queryRaw<DiagnosticoDetallado[]>`
        SELECT STUFF((
          SELECT ', ' + RTRIM(DX) + ' ' + DX_DES
          FROM dbo.ATENCIOND WITH (NOLOCK) 
          WHERE ID_CITA = ${citaId} AND DX LIKE '[A-Z]%'
          FOR XML PATH('')), 1, 2, '') AS DX
      `
      
      if (!diagnosticos.length || !diagnosticos[0].DX) {
        console.log(`No se encontró diagnóstico para la consulta externa: ${citaId}`)
        return null
      }
      
      // Extraer el primer código de diagnóstico
      const dxString = diagnosticos[0].DX;
      console.log(`Diagnósticos encontrados: ${dxString}`);
      
      // Extraer el primer código de diagnóstico (formato: "A00 Descripción")
      const match = dxString.match(/([A-Z][0-9]+(?:\.[0-9]+)?)/i);
      const codigo = match ? match[0] : null;
      
      if (!codigo) {
        console.log(`No se pudo extraer un código válido de diagnóstico de: ${dxString}`);
        return null;
      }
      
      // Buscar el nombre del diagnóstico en CIEXHIS_V2
      const diagnosticoCompleto = await prisma.$queryRaw<Diagnostico[]>`
        SELECT Codigo, Nombre 
        FROM CIEXHIS_V2 
        WHERE Codigo = ${codigo}
      `
      
      if (diagnosticoCompleto.length === 0) {
        console.log(`Código de diagnóstico encontrado (${codigo}) pero no existe en CIEXHIS_V2`)
        return { Codigo: codigo, Nombre: 'Diagnóstico no encontrado' }
      }
      
      console.log(`Diagnóstico encontrado: ${diagnosticoCompleto[0].Codigo} - ${diagnosticoCompleto[0].Nombre}`)
      return diagnosticoCompleto[0]
    } catch (error) {
      console.error(`Error al buscar diagnóstico para consulta externa ${citaId}:`, error)
      throw new Error(`Error al buscar diagnóstico para consulta externa ${citaId}: ${error}`)
    }
  }

  /**
   * Busca un diagnóstico por ID, determinando automáticamente si es emergencia o consulta externa
   * @param id ID de la cita o emergencia
   * @returns Diagnóstico encontrado o null
   */
  async findById(id: string) {
    try {
      console.log(`Buscando diagnóstico por ID: ${id}`)
      
      // Intentar primero con la consulta combinada para determinar el origen
      try {
        console.log('Intentando consulta combinada para determinar origen (CE o EM)...')
        const query = `
          SELECT ORIGEN, CODIGO, DX
          FROM (
            SELECT 
              'CE' AS ORIGEN, 
              A.ID_CITA AS CODIGO,
              (SELECT STUFF((
                SELECT ', ' + RTRIM(DX) + ' ' + DX_DES
                FROM dbo.ATENCIOND WITH (NOLOCK) 
                WHERE ID_CITA = A.ID_CITA AND DX LIKE '[A-Z]%'
                FOR XML PATH('')), 1, 2, '')) AS DX
            FROM dbo.ATENCIONC AS A WITH (NOLOCK)
            WHERE A.ID_CITA = '${id}'
            
            UNION ALL
            
            SELECT 
              'EM' AS ORIGEN, 
              RTRIM(A.EMERGENCIA_ID) AS CODIGO,
              (SELECT STUFF((
                SELECT ', ' + RTRIM(DX) + ' ' + DX_DES
                FROM dbo.ATENCIOND WITH (NOLOCK) 
                WHERE ID_CITA = A.EMERGENCIA_ID AND DX LIKE '[A-Z]%'
                FOR XML PATH('')), 1, 2, '')) AS DX
            FROM dbo.EMERGENCIA AS A WITH (NOLOCK)
            WHERE A.EMERGENCIA_ID = '${id}'
          ) AS CombinedResults
          WHERE DX IS NOT NULL AND DX <> ''
          OPTION (RECOMPILE)
        `;
        
        const result = await prisma.$queryRawUnsafe(query);
        const data = result as any[];
        
        if (data && data.length > 0) {
          const origen = data[0].ORIGEN;
          const codigo = data[0].CODIGO;
          const dxString = data[0].DX;
          
          if (!dxString) {
            console.log(`No se encontró diagnóstico para el ID: ${id}`);
            return null;
          }
          
          console.log(`Diagnósticos encontrados para ${origen} con ID ${id}: ${dxString}`);
          
          // Extraer el primer código de diagnóstico (formato: "A00 Descripción")
          const match = dxString.match(/([A-Z][0-9]+(?:\.[0-9]+)?)/i);
          const codigoDx = match ? match[0] : null;
          
          if (!codigoDx) {
            console.log(`No se pudo extraer un código válido de diagnóstico de: ${dxString}`);
            return null;
          }
          
          // Buscar el nombre del diagnóstico en CIEXHIS_V2
          const diagnosticoCompleto = await prisma.$queryRaw<Diagnostico[]>`
            SELECT Codigo, Nombre 
            FROM CIEXHIS_V2 
            WHERE Codigo = ${codigoDx}
          `;
          
          if (diagnosticoCompleto.length === 0) {
            console.log(`Código de diagnóstico encontrado (${codigoDx}) pero no existe en CIEXHIS_V2`);
            return { Codigo: codigoDx, Nombre: 'Diagnóstico no encontrado' };
          }
          
          console.log(`Diagnóstico encontrado: ${diagnosticoCompleto[0].Codigo} - ${diagnosticoCompleto[0].Nombre}`);
          return diagnosticoCompleto[0];
        }
      } catch (error) {
        console.error(`Error al buscar diagnóstico por ID ${id} con consulta combinada:`, error);
      }
      
      // Si no se encuentra con la consulta combinada, intentar con emergencia
      try {
        const resultEM = await this.findByEmergenciaId(id);
        if (resultEM) {
          return resultEM;
        }
      } catch (error) {
        console.error(`Error al buscar como emergencia: ${error}`);
      }
      
      // Si no se encuentra como emergencia, intentar como consulta externa
      try {
        const resultCE = await this.findByConsultaExterna(id);
        if (resultCE) {
          return resultCE;
        }
      } catch (error) {
        console.error(`Error al buscar como consulta externa: ${error}`);
      }
      
      console.log(`No se encontró diagnóstico para el ID: ${id}`);
      return null;
    } catch (error) {
      console.error(`Error al buscar diagnóstico por ID ${id}:`, error);
      throw new Error(`Error al buscar diagnóstico por ID ${id}: ${error}`);
    }
  }
}

export const diagnosticoService = new DiagnosticoService()
