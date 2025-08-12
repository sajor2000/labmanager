import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireLabAdmin } from '@/lib/auth-helpers';

// GET /api/audit-logs - Get audit logs (requires authentication)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const userId = searchParams.get('userId');
    const labId = searchParams.get('labId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build where clause
    const where: any = {};
    
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    
    // Only Lab Admins and PIs can see audit logs
    const isPI = user.role === 'PRINCIPAL_INVESTIGATOR' || user.role === 'CO_PRINCIPAL_INVESTIGATOR';
    const isSystemAdmin = user.role === 'LAB_ADMINISTRATOR';
    
    if (!isPI && !isSystemAdmin) {
      // Check if user is a lab admin for any lab
      const adminMemberships = await prisma.labMember.findMany({
        where: {
          userId: user.id,
          isAdmin: true,
          isActive: true,
        },
        select: {
          labId: true,
        },
      });
      
      if (adminMemberships.length === 0) {
        return NextResponse.json(
          { error: 'Access denied. Only Lab Admins and Principal Investigators can view audit logs.' },
          { status: 403 }
        );
      }
      
      // Lab admin can only see logs for their labs
      const adminLabIds = adminMemberships.map(m => m.labId);
      if (labId && !adminLabIds.includes(labId)) {
        return NextResponse.json(
          { error: 'You can only view audit logs for labs where you are an admin.' },
          { status: 403 }
        );
      }
      
      // Restrict to admin's labs
      where.labId = labId ? labId : { in: adminLabIds };
      if (userId) where.userId = userId;
    } else {
      // PIs and System Admins can see all logs
      if (userId) where.userId = userId;
      if (labId) where.labId = labId;
    }
    
    // Get audit logs with pagination
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              initials: true,
            },
          },
          lab: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);
    
    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// DELETE /api/audit-logs - Purge old audit logs (requires system admin)
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    
    // Only PIs and Lab Administrators can purge audit logs
    const isPI = user.role === 'PRINCIPAL_INVESTIGATOR';
    const isLabAdmin = user.role === 'LAB_ADMINISTRATOR';
    
    if (!isPI && !isLabAdmin) {
      return NextResponse.json(
        { error: 'Only Principal Investigators and Lab Administrators can purge audit logs' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { olderThanDays = 90 } = body;
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // Delete old audit logs
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    
    return NextResponse.json({
      message: `Deleted ${result.count} audit logs older than ${olderThanDays} days`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error purging audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to purge audit logs' },
      { status: 500 }
    );
  }
}