import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

export type RateLimitConfig = {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max number of unique tokens per interval
  maxRequests: number; // Max requests per interval per token
};

export type RateLimiter = {
  check: (request: NextRequest, limit?: number) => Promise<RateLimitResult>;
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
};

// Default rate limit configurations
export const RATE_LIMITS = {
  // Strict limits for DELETE operations
  DELETE: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
    maxRequests: 5, // Only 5 deletes per minute
  },
  // Standard limits for write operations
  WRITE: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
    maxRequests: 30, // 30 writes per minute
  },
  // Relaxed limits for read operations
  READ: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
    maxRequests: 100, // 100 reads per minute
  },
};

/**
 * Create a rate limiter with the specified configuration
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  const tokenCache = new LRUCache<string, number[]>({
    max: config.uniqueTokenPerInterval || 500,
    ttl: config.interval || 60000,
  });

  return {
    check: async (request: NextRequest, limit?: number) => {
      const maxRequests = limit ?? config.maxRequests;
      const token = getTokenFromRequest(request);
      const now = Date.now();
      const windowStart = now - config.interval;

      // Get or create request timestamps for this token
      let timestamps = tokenCache.get(token) || [];
      
      // Filter out timestamps outside the current window
      timestamps = timestamps.filter(timestamp => timestamp > windowStart);
      
      // Check if limit exceeded
      if (timestamps.length >= maxRequests) {
        const oldestTimestamp = timestamps[0];
        const resetTime = new Date(oldestTimestamp + config.interval);
        
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          reset: resetTime,
        };
      }
      
      // Add current timestamp and update cache
      timestamps.push(now);
      tokenCache.set(token, timestamps);
      
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - timestamps.length,
        reset: new Date(now + config.interval),
      };
    },
  };
}

/**
 * Extract a unique token from the request for rate limiting
 */
function getTokenFromRequest(request: NextRequest): string {
  // Try to get authenticated user ID first
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Middleware to apply rate limiting to DELETE operations
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  // Only apply to DELETE requests
  if (request.method !== 'DELETE') {
    return null;
  }
  
  const limiter = createRateLimiter(config || RATE_LIMITS.DELETE);
  const result = await limiter.check(request);
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many delete requests',
        message: `Rate limit exceeded. You can make ${result.limit} delete requests per minute.`,
        retryAfter: result.reset.toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toISOString(),
          'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  
  // Add rate limit headers to successful responses
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toISOString());
  
  return null; // Continue to the actual handler
}

/**
 * Helper to apply rate limiting in API routes
 */
export async function checkRateLimit(
  request: NextRequest,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  const limiter = createRateLimiter(config || RATE_LIMITS.DELETE);
  const result = await limiter.check(request);
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again after ${result.reset.toISOString()}`,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toISOString(),
          'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  
  return null;
}