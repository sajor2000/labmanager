import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Determine which database URL to use based on environment
let connectionUrl = '';

// In production, prefer PRISMA_DATABASE_URL for Accelerate
if (process.env.NODE_ENV === 'production' && process.env.PRISMA_DATABASE_URL) {
  connectionUrl = process.env.PRISMA_DATABASE_URL;
} else if (process.env.DATABASE_URL) {
  // In development or if no Accelerate URL, use direct connection
  connectionUrl = process.env.DATABASE_URL;
} else if (process.env.POSTGRES_URL) {
  // Fallback to POSTGRES_URL if available
  connectionUrl = process.env.POSTGRES_URL;
} else {
  throw new Error('No database connection URL found. Please set DATABASE_URL or PRISMA_DATABASE_URL');
}

// Check if we're using Prisma Accelerate
const isPrismaAccelerate = connectionUrl.startsWith('prisma://') || 
                          connectionUrl.startsWith('prisma+postgres://');

const createPrismaClient = () => {
  // Log connection info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Prisma connection URL type:', isPrismaAccelerate ? 'Accelerate' : 'Direct');
    console.log('URL prefix:', connectionUrl.substring(0, 20) + '...');
  }
  
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