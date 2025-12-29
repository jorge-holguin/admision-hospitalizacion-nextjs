import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface EmpresaSeguro {
  EMPRESA: string;
  NOMBRE: string;
  RUC?: string;
  DIRECCION?: string;
  TELEFONO?: string;
}

/**
 * Obtiene todas las empresas de seguro
 */
export async function getAllEmpresasSeguro(): Promise<EmpresaSeguro[]> {
  try {
    const empresas = await prisma.$queryRaw<EmpresaSeguro[]>`
      SELECT EMPRESASEGURO AS EMPRESA, NOMBRE, RUC, DIRECCION, TELEFONO
      FROM EMPRESASEGURO
      ORDER BY NOMBRE
    `;
    return empresas;
  } catch (error) {
    console.error("Error al obtener empresas de seguro:", error);
    throw error;
  }
}

/**
 * Busca empresas de seguro por nombre (búsqueda parcial)
 */
export async function searchEmpresasSeguroByNombre(nombre: string): Promise<EmpresaSeguro[]> {
  try {
    const searchTerm = `%${nombre}%`;
    const empresas = await prisma.$queryRaw<EmpresaSeguro[]>`
      SELECT EMPRESASEGURO AS EMPRESA, NOMBRE, RUC, DIRECCION, TELEFONO
      FROM EMPRESASEGURO
      WHERE NOMBRE LIKE ${searchTerm}
      ORDER BY NOMBRE
    `;
    return empresas;
  } catch (error) {
    console.error("Error al buscar empresas de seguro por nombre:", error);
    throw error;
  }
}

/**
 * Obtiene una empresa de seguro por su código
 */
export async function getEmpresaSeguroById(empresa: string): Promise<EmpresaSeguro | null> {
  try {
    const empresas = await prisma.$queryRaw<EmpresaSeguro[]>`
      SELECT EMPRESASEGURO AS EMPRESA, NOMBRE, RUC, DIRECCION, TELEFONO
      FROM EMPRESASEGURO
      WHERE EMPRESASEGURO = ${empresa}
    `;
    return empresas.length > 0 ? empresas[0] : null;
  } catch (error) {
    console.error("Error al obtener empresa de seguro por ID:", error);
    throw error;
  }
}

/**
 * Busca empresas de seguro por nombre o código
 */
export async function searchEmpresasSeguro(criterio: string): Promise<EmpresaSeguro[]> {
  try {
    const searchTerm = `%${criterio}%`;
    const empresas = await prisma.$queryRaw<EmpresaSeguro[]>`
      SELECT EMPRESASEGURO AS EMPRESA, NOMBRE, RUC, DIRECCION, TELEFONO
      FROM EMPRESASEGURO
      WHERE NOMBRE LIKE ${searchTerm} OR EMPRESASEGURO LIKE ${searchTerm}
      ORDER BY NOMBRE
    `;
    return empresas;
  } catch (error) {
    console.error("Error al buscar empresas de seguro:", error);
    throw error;
  }
}
