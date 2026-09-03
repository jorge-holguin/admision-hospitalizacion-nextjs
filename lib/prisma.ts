// Importar Prisma de manera compatible con Prisma 6.x
const { PrismaClient } = require('@prisma/client')

declare global {
  var prisma: any | undefined
}

// Forzar una nueva instancia con la configuración actualizada
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

export const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma