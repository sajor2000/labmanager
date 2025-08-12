import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/utils/production-logger';

/**
 * Rate limiting configuration
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const deleteRateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60');
const DELETE_RATE_LIMIT = parseInt(process.env.DELETE_RATE_LIMIT_PER_MINUTE || '5'); // Strict limit for DELETE
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * Security headers configuration
 */
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Check rate limit for IP address
 */
export function checkRateLimit(ip: string, isDelete: boolean = false): boolean {
  const now = Date.now();
  
  // Use stricter limits for DELETE operations
  if (isDelete) {
    const deleteLimit = deleteRateLimitMap.get(ip);
    
    if (!deleteLimit || now - deleteLimit.lastReset > RATE_LIMIT_WINDOW) {
      deleteRateLimitMap.set(ip, { count: 1, lastReset: now });
      return true;
    }
    
    if (deleteLimit.count >= DELETE_RATE_LIMIT) {
      return false;
    }
    
    deleteLimit.count++;
    return true;
  }
  
  // Regular rate limiting for non-DELETE operations
  const limit = rateLimitMap.get(ip);

  if (!limit || now - limit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (limit.count >= RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Get client IP address
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

/**
 * Validate request body size
 */
export function validateRequestSize(request: NextRequest): boolean {
  const contentLength = request.headers.get('content-length');
  const maxSize = parseInt(process.env.MAX_REQUEST_SIZE_MB || '10') * 1024 * 1024;
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return false;
  }
  
  return true;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove script tags and dangerous HTML
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  } else if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  } else if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return uuidRegex.test(uuid) || cuidRegex.test(uuid);
}

/**
 * Validate and sanitize SQL input to prevent injection
 */
export function sanitizeSqlInput(input: string): string {
  // Remove SQL keywords and special characters
  return input
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE|OR|AND|NOT|NULL|LIKE|INTO|VALUES|TABLE|DATABASE|INDEX|VIEW|PROCEDURE|FUNCTION|TRIGGER|GRANT|REVOKE)\b)/gi, '')
    .replace(/[;'"\\]/g, '')
    .trim();
}

/**
 * Security middleware for API routes
 */
export async function securityMiddleware(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const path = request.nextUrl.pathname;

    // Skip rate limiting for health checks
    if (!path.includes('/health')) {
      // Check rate limit (stricter for DELETE operations)
      const isDeleteRequest = request.method === 'DELETE';
      if (!checkRateLimit(ip, isDeleteRequest)) {
        const limitType = isDeleteRequest ? 'DELETE' : 'general';
        const limit = isDeleteRequest ? DELETE_RATE_LIMIT : RATE_LIMIT;
        logger.warn(`${limitType} rate limit exceeded for IP: ${ip}`);
        return NextResponse.json(
          { 
            error: 'Too many requests. Please try again later.',
            message: `Rate limit: ${limit} ${isDeleteRequest ? 'delete' : ''} requests per minute`,
            retryAfter: 60 // seconds
          },
          { 
            status: 429,
            headers: {
              'Retry-After': '60',
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Window': '60s'
            }
          }
        );
      }
    }

    // Validate request size
    if (!validateRequestSize(request)) {
      logger.warn(`Request size exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: 'Request payload too large' },
        { status: 413 }
      );
    }

    // Log suspicious activity
    if (path.includes('..') || path.includes('//')) {
      logger.error(`Suspicious path detected from IP ${ip}: ${path}`);
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Continue with the request
    const response = NextResponse.next();

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    logger.error('Security middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * CSRF token generation and validation
 */
const csrfTokens = new Map<string, { token: string; expires: number }>();

export function generateCsrfToken(sessionId: string): string {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expires = Date.now() + 3600000; // 1 hour
  csrfTokens.set(sessionId, { token, expires });
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  
  if (!stored || stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  
  return stored.token === token;
}

/**
 * Clean up expired tokens and rate limits periodically
 */
if (typeof global !== 'undefined' && !global.__securityCleanupInterval) {
  global.__securityCleanupInterval = setInterval(() => {
    // Clean up rate limits older than 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [ip, limit] of rateLimitMap.entries()) {
      if (limit.lastReset < fiveMinutesAgo) {
        rateLimitMap.delete(ip);
      }
    }

    // Clean up expired CSRF tokens
    const now = Date.now();
    for (const [sessionId, data] of csrfTokens.entries()) {
      if (data.expires < now) {
        csrfTokens.delete(sessionId);
      }
    }
  }, 60000); // Run every minute
}