import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  checkRateLimit, 
  getClientIp, 
  validateRequestSize,
  securityMiddleware 
} from '@/lib/security/middleware';
import { logger } from '@/lib/utils/production-logger';

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Skip security checks for static assets
  if (path.startsWith('/_next/') || path.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // Apply security middleware for API routes
  if (path.startsWith('/api/')) {
    try {
      return await securityMiddleware(req);
    } catch (error) {
      logger.error('Middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  // For non-API routes, add security headers
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};