import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { logger, logQuery } from '@/lib/monitoring/logger';
import { env } from '@/lib/env';

// Connection pool configuration
const CONNECTION_POOL = {
  max: 10,        // Maximum connections
  min: 2,         // Minimum connections
  idleTimeout: 60,  // Seconds before idle connection is closed
  acquireTimeout: 30, // Seconds to wait for connection
};

// Query timeout configuration
const QUERY_TIMEOUTS = {
  default: 5000,     // 5 seconds
  complex: 10000,    // 10 seconds
  report: 30000,     // 30 seconds
  migration: 60000,  // 60 seconds
};

// Enhanced Prisma client with monitoring and optimization
class OptimizedPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: env.NODE_ENV === 'development' 
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
      errorFormat: env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Query logging
    this.$on('query' as never, (e: any) => {
      logQuery(e.query, e.params, e.duration);
      
      // Alert on slow queries
      if (e.duration > 1000) {
        logger.warn('Slow query detected', {
          query: e.query.substring(0, 200),
          duration: e.duration,
        });
      }
    });

    // Error logging
    this.$on('error' as never, (e: any) => {
      logger.error('Database error', new Error(e.message), {
        target: e.target,
      });
    });

    // Warning logging
    this.$on('warn' as never, (e: any) => {
      logger.warn('Database warning', {
        message: e.message,
      });
    });
  }
}

// Create singleton instance with proper connection management
class DatabaseManager {
  private static instance: OptimizedPrismaClient | null = null;
  private static connectionCount = 0;
  private static lastHealthCheck: Date | null = null;
  private static healthCheckInterval: NodeJS.Timeout | null = null;

  // Get or create Prisma client instance
  static getClient(): OptimizedPrismaClient {
    // During build time, return a stub
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      logger.info('Build phase detected - using stub Prisma client');
      return new PrismaClient() as OptimizedPrismaClient;
    }

    if (!this.instance) {
      this.instance = this.createClient();
      this.startHealthCheck();
    }

    return this.instance;
  }

  // Create optimized Prisma client
  private static createClient(): OptimizedPrismaClient {
    const client = new OptimizedPrismaClient();
    
    // Apply Accelerate extension if using Prisma Accelerate
    if (env.DATABASE_URL.startsWith('prisma://')) {
      return client.$extends(withAccelerate()) as unknown as OptimizedPrismaClient;
    }

    return client;
  }

  // Start health check monitoring
  private static startHealthCheck() {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, 30000); // Check every 30 seconds
  }

  // Check database health
  static async checkHealth(): Promise<boolean> {
    try {
      const start = Date.now();
      await this.instance?.$queryRaw`SELECT 1`;
      const duration = Date.now() - start;

      this.lastHealthCheck = new Date();
      
      if (duration > 100) {
        logger.warn('Database response slow', { duration });
      }

      return true;
    } catch (error) {
      logger.error('Database health check failed', error as Error);
      
      // Attempt to reconnect
      await this.reconnect();
      return false;
    }
  }

  // Reconnect to database
  static async reconnect() {
    try {
      logger.info('Attempting database reconnection');
      
      // Disconnect existing client
      await this.instance?.$disconnect();
      
      // Create new client
      this.instance = this.createClient();
      await this.instance.$connect();
      
      logger.info('Database reconnected successfully');
    } catch (error) {
      logger.error('Database reconnection failed', error as Error);
      throw error;
    }
  }

  // Clean up connections
  static async cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = null;
    }
  }

  // Get connection statistics
  static getStats() {
    return {
      connectionCount: this.connectionCount,
      lastHealthCheck: this.lastHealthCheck,
      isConnected: !!this.instance,
    };
  }
}

// Export optimized Prisma client
export const prisma = DatabaseManager.getClient();

// Transaction helper with retry logic
export async function withRetryTransaction<T>(
  fn: (tx: any) => Promise<T>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = QUERY_TIMEOUTS.complex,
  } = options || {};

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        maxWait: timeout,
        timeout: timeout * 2,
        isolationLevel: 'ReadCommitted',
      });
    } catch (error) {
      lastError = error as Error;
      
      logger.warn(`Transaction attempt ${attempt} failed`, {
        error: (error as Error).message,
        attempt,
        maxRetries,
      });

      // Don't retry on certain errors
      if (this.shouldNotRetry(error)) {
        throw error;
      }

      // Wait before retrying (with exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  throw lastError;
}

// Check if error should not be retried
function shouldNotRetry(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Don't retry on validation errors, constraint violations, etc.
    const noRetryPatterns = [
      'validation',
      'constraint',
      'unique',
      'foreign key',
      'not found',
      'unauthorized',
    ];
    
    return noRetryPatterns.some(pattern => message.includes(pattern));
  }
  
  return false;
}

// Batch operation helper
export async function batchOperation<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      const result = await operation(batch);
      results.push(result);
      
      logger.debug('Batch operation completed', {
        batchNumber: Math.floor(i / batchSize) + 1,
        totalBatches: Math.ceil(items.length / batchSize),
        batchSize: batch.length,
      });
    } catch (error) {
      logger.error('Batch operation failed', error as Error, {
        batchNumber: Math.floor(i / batchSize) + 1,
        batchSize: batch.length,
      });
      throw error;
    }
  }
  
  return results;
}

// Query builder helpers for common patterns
export const QueryHelpers = {
  // Pagination helper
  paginate(page: number = 1, limit: number = 20) {
    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  },

  // Soft delete filter
  notDeleted() {
    return {
      OR: [
        { deletedAt: null },
        { deletedAt: { gt: new Date() } },
      ],
    };
  },

  // Date range filter
  dateRange(field: string, from?: Date, to?: Date) {
    const filter: any = {};
    
    if (from) {
      filter[field] = { ...filter[field], gte: from };
    }
    
    if (to) {
      filter[field] = { ...filter[field], lte: to };
    }
    
    return filter;
  },

  // Full text search
  searchText(fields: string[], query: string) {
    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
    
    return {
      AND: searchTerms.map(term => ({
        OR: fields.map(field => ({
          [field]: {
            contains: term,
            mode: 'insensitive',
          },
        })),
      })),
    };
  },

  // Order by multiple fields
  orderBy(fields: Record<string, 'asc' | 'desc'>) {
    return Object.entries(fields).map(([field, direction]) => ({
      [field]: direction,
    }));
  },
};

// Cleanup on app termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await DatabaseManager.cleanup();
  });

  process.on('SIGINT', async () => {
    await DatabaseManager.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await DatabaseManager.cleanup();
    process.exit(0);
  });
}

// Export utilities
export { DatabaseManager };
export default prisma;