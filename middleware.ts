import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  checkRateLimit, 
  getClientIp, 
  validateRequestSize,
  securityMiddleware 
} from '@/lib/security/middleware';
import { logger } from '@/lib/utils/production-logger';

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Skip security checks for static assets
  if (path.startsWith('/_next/') || path.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  if (!isPublicRoute && !path.startsWith('/api/')) {
    // Check for session cookie instead of invoking auth in middleware
    const sessionCookie = req.cookies.get('authjs.session-token') || req.cookies.get('__Secure-authjs.session-token');
    
    if (!sessionCookie) {
      // Redirect to login page
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Apply security middleware for API routes
  if (path.startsWith('/api/')) {
    // Skip auth check for auth-related API routes
    if (!path.startsWith('/api/auth')) {
      const sessionCookie = req.cookies.get('authjs.session-token') || req.cookies.get('__Secure-authjs.session-token');
      if (!sessionCookie) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
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