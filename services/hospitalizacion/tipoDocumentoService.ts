import { prisma } from '@/lib/prisma/client'

export interface TipoDocumento {
  TIPO_DOCUMENTO: string
  NOMBRE: string
  ACTIVO: number
}

export class TipoDocumentoService {
  async findTipoDocumentos() {
    try {
      // Intentar usar la consulta SQL directa
      const result = await prisma.$queryRaw<TipoDocumento[]>`
        SELECT TIPO_DOCUMENTO, NOMBRE FROM TIPO_DOCUMENTO 
        WHERE ACTIVO = '1' 
        ORDER BY NOMBRE
      `;
      
      return result;
    } catch (error) {
      console.error('Error al obtener tipos de documento:', error);
      
      // Fallback a una consulta más genérica si la anterior falla
      try {
        const result = await prisma.$queryRaw<TipoDocumento[]>`
          SELECT TIPO_DOCUMENTO, NOMBRE FROM TIPO_DOCUMENTO 
          WHERE ACTIVO = '1'
          ORDER BY NOMBRE
        `;
        
        return result;
      } catch (fallbackError) {
        console.error('Error en consulta fallback:', fallbackError);
        return [];
      }
    }
  }
}

export const tipoDocumentoService = new TipoDocumentoService();
