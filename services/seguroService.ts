import { prisma } from '@/lib/prisma/client'

export interface Seguro {
  Seguro: string
  Nombre: string
  CREA_CUENTA: string
}

export class SeguroService {
  async findAll() {
    try {
      console.log('Buscando seguros disponibles')
      
      // Ejecutar la consulta SQL para obtener los seguros
      const seguros = await prisma.$queryRaw<Seguro[]>`
        SELECT Seguro, Nombre, CASE WHEN seguro IN ('0','02') THEN 'SI' ELSE 'NO' END CREA_CUENTA 
        FROM SEGURO 
        WHERE flat_liq_web='1' 
        ORDER BY nombre
      `
      
      console.log(`Se encontraron ${seguros.length} seguros`)
      return seguros
    } catch (error) {
      console.error('Error al buscar seguros:', error)
      throw new Error(`Error al buscar seguros: ${error}`)
    }
  }

  async findByCode(code: string) {
    try {
      console.log(`Buscando seguro con código: ${code}`)
      
      // Ejecutar la consulta SQL para obtener un seguro específico
      const seguro = await prisma.$queryRaw<Seguro[]>`
        SELECT Seguro, Nombre, CASE WHEN seguro IN ('0','02') THEN 'SI' ELSE 'NO' END CREA_CUENTA 
        FROM SEGURO 
        WHERE flat_liq_web='1' AND Seguro = ${code}
        ORDER BY nombre
      `
      
      if (seguro.length === 0) {
        console.log(`No se encontró seguro con código: ${code}`)
        return null
      }
      
      console.log(`Seguro encontrado: ${seguro[0].Nombre}`)
      return seguro[0]
    } catch (error) {
      console.error(`Error al buscar seguro con código ${code}:`, error)
      throw new Error(`Error al buscar seguro con código ${code}: ${error}`)
    }
  }
}

export const seguroService = new SeguroService()
