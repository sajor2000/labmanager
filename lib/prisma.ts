import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use Prisma Accelerate URL if available, fallback to direct connection
const connectionUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || '';

// Check if we're using Prisma Accelerate
const isPrismaAccelerate = connectionUrl.startsWith('prisma://') || 
                          connectionUrl.startsWith('prisma+postgres://');

const createPrismaClient = () => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
  
  if (isPrismaAccelerate) {
    // Use Prisma Accelerate extension for connection pooling
    return client.$extends(withAccelerate()) as unknown as PrismaClient
  }
  
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma