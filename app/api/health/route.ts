import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = performance.now();
  
  try {
    // Check database connection with a simple query
    await prisma.$queryRaw`SELECT 1 as health_check`;
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    const healthData = {
      healthy: true,
      status: 'healthy',
      message: 'Service is healthy',
      responseTime,
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '0.1.0',
    };

    // Set appropriate headers for health checks
    const response = NextResponse.json(healthData);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('X-Health-Check', 'true');
    return response;
    
  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    console.error('Health check failed:', error);
    
    const healthData = {
      healthy: false,
      status: 'unhealthy',
      message: 'Database connection failed',
      responseTime,
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '0.1.0',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    const response = NextResponse.json(healthData, { status: 503 });
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('X-Health-Check', 'true');
    return response;
  }
}