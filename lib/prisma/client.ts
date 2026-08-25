import { PrismaClient } from '@prisma/client'

// Evitar múltiples instancias de Prisma Client en desarrollo
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prevent-multiple-instances-in-development

declare global {
  // eslint-disable-next-line no-var
  var prisma: any | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
