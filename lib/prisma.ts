import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  // During build time, return a stub client that won't attempt connections
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('Build phase detected - using stub Prisma client');
    return new PrismaClient();
  }

  // Get the database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn('No DATABASE_URL found - using default Prisma client');
    return new PrismaClient();
  }

  // Check if we're using Prisma Accelerate
  const isPrismaAccelerate = databaseUrl.startsWith('prisma://') || 
                            databaseUrl.startsWith('prisma+postgres://');

  // Log connection info in development only
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 Prisma connection:', isPrismaAccelerate ? 'Accelerate' : 'Direct');
    console.log('🔗 URL prefix:', databaseUrl.substring(0, 25) + '...');
  }
  
  // Configure client options
  const clientOptions = {
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] as const
      : ['error'] as const,
  };

  // For Prisma Accelerate URLs, don't override datasources
  if (isPrismaAccelerate) {
    const client = new PrismaClient(clientOptions);
    // Use Accelerate extension for connection pooling and edge caching
    return client.$extends(withAccelerate()) as unknown as PrismaClient;
  }
  
  // For direct PostgreSQL connections, override datasource
  return new PrismaClient({
    ...clientOptions,
    datasources: {
      db: {
        url: databaseUrl
      }
    },
  });
}

// Create singleton instance
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Store in global for development hot reloading
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Helper to check connection health
export const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, message: 'Database connection successful' };
  } catch (error) {
    return { 
      healthy: false, 
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}