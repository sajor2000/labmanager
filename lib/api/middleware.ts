import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { AppError, ErrorCode, errorResponse } from './response';
import { getCurrentUser } from '@/lib/utils/get-current-user';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// API middleware configuration
export interface MiddlewareConfig {
  requireAuth?: boolean;
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
  cors?: {
    origins: string[];
    methods: string[];
  };
  validateMethod?: string[];
}

// Main middleware wrapper
export function withMiddleware(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config: MiddlewareConfig = {}
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // CORS handling
      if (config.cors) {
        const corsResponse = handleCors(req, config.cors);
        if (corsResponse) return corsResponse;
      }

      // Method validation
      if (config.validateMethod && !config.validateMethod.includes(req.method)) {
        return errorResponse(
          ErrorCode.BAD_REQUEST,
          `Method ${req.method} not allowed`
        );
      }

      // Rate limiting
      if (config.rateLimit) {
        const rateLimitResponse = await handleRateLimit(req, config.rateLimit);
        if (rateLimitResponse) return rateLimitResponse;
      }

      // Authentication
      if (config.requireAuth) {
        const authResponse = await handleAuth(req);
        if (authResponse) return authResponse;
      }

      // Execute the handler with error catching
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// CORS handler
function handleCors(
  req: NextRequest,
  corsConfig: { origins: string[]; methods: string[] }
): NextResponse | null {
  const origin = req.headers.get('origin');
  
  // Check if origin is allowed
  if (origin && !corsConfig.origins.includes('*') && !corsConfig.origins.includes(origin)) {
    return errorResponse(ErrorCode.FORBIDDEN, 'CORS: Origin not allowed');
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': corsConfig.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return null;
}

// Rate limiting handler
async function handleRateLimit(
  req: NextRequest,
  config: { requests: number; window: number }
): Promise<NextResponse | null> {
  const identifier = getClientIdentifier(req);
  const now = Date.now();
  const windowMs = config.window * 1000;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(identifier);
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  entry.count++;
  rateLimitStore.set(identifier, entry);

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    cleanupRateLimitStore();
  }

  // Check if rate limit exceeded
  if (entry.count > config.requests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Too many requests',
          retryAfter,
        },
      }),
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
        },
      }
    );
  }

  return null;
}

// Authentication handler
async function handleAuth(req: NextRequest): Promise<NextResponse | null> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, 'Authentication required');
    }

    // Add user to request context (in production, use proper context passing)
    (req as any).user = user;
    
    return null;
  } catch (error) {
    return errorResponse(ErrorCode.UNAUTHORIZED, 'Invalid authentication');
  }
}

// Get client identifier for rate limiting
function getClientIdentifier(req: NextRequest): string {
  // Try to get user ID from auth
  const userId = (req as any).user?.id;
  if (userId) return `user:${userId}`;

  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
}

// Clean up old rate limit entries
function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Request logger middleware
export function withLogging(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const start = Date.now();
    const requestId = generateRequestId();
    
    // Log request
    logRequest(req, requestId);
    
    try {
      const response = await handler(req, context);
      
      // Log response
      logResponse(req, response, start, requestId);
      
      // Add request ID to response headers
      response.headers.set('X-Request-Id', requestId);
      
      return response;
    } catch (error) {
      // Log error
      logError(req, error, start, requestId);
      throw error;
    }
  };
}

// Request logging
function logRequest(req: NextRequest, requestId: string): void {
  const log = {
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    url: req.url,
    headers: getSecureHeaders(req.headers),
    ip: req.headers.get('x-forwarded-for') || 'unknown',
    userAgent: req.headers.get('user-agent'),
  };
  
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(log));
  } else {
    console.log('📥 Request:', log);
  }
}

// Response logging
function logResponse(
  req: NextRequest,
  response: NextResponse,
  startTime: number,
  requestId: string
): void {
  const duration = Date.now() - startTime;
  
  const log = {
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    url: req.url,
    status: response.status,
    duration: `${duration}ms`,
  };
  
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(log));
  } else {
    console.log('📤 Response:', log);
  }
}

// Error logging
function logError(
  req: NextRequest,
  error: unknown,
  startTime: number,
  requestId: string
): void {
  const duration = Date.now() - startTime;
  
  const log = {
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    url: req.url,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    duration: `${duration}ms`,
  };
  
  console.error('❌ Error:', log);
}

// Get headers without sensitive information
function getSecureHeaders(headers: Headers): Record<string, string> {
  const secure: Record<string, string> = {};
  const sensitive = ['authorization', 'cookie', 'x-api-key'];
  
  headers.forEach((value, key) => {
    if (!sensitive.includes(key.toLowerCase())) {
      secure[key] = value;
    }
  });
  
  return secure;
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Handle API errors
function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.details, error.field);
  }
  
  if (error instanceof Error) {
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
      error.stack
    );
  }
  
  return errorResponse(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
}

// Database transaction wrapper
export async function withTransaction<T>(
  fn: (tx: any) => Promise<T>
): Promise<T> {
  const { prisma } = await import('@/lib/prisma');
  
  try {
    return await prisma.$transaction(async (tx) => {
      return await fn(tx);
    }, {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
      isolationLevel: 'ReadCommitted',
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

// Cache wrapper for expensive operations
const cache = new Map<string, { data: any; expiry: number }>();

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 60 // seconds
): Promise<T> {
  // Check cache
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  
  // Execute function
  const data = await fn();
  
  // Store in cache
  cache.set(key, {
    data,
    expiry: Date.now() + (ttl * 1000),
  });
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    cleanupCache();
  }
  
  return data;
}

// Clean up expired cache entries
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiry < now) {
      cache.delete(key);
    }
  }
}