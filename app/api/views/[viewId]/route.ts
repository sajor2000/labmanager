import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { auditDelete } from '@/lib/audit/logger';
import { checkRateLimit, getClientIp } from '@/lib/security/middleware';

// DELETE /api/views/[viewId] - Delete a view (requires authentication)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ viewId: string }> }
) {
  try {
    // Apply rate limiting for DELETE operations
    const ip = getClientIp(request);
    if (!checkRateLimit(ip, true)) {
      return NextResponse.json(
        { 
          error: 'Too many delete requests. Please try again later.',
          message: 'Rate limit: 5 delete requests per minute',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Window': '60s'
          }
        }
      );
    }

    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { viewId } = await params;

    // Check if the view exists and user has permission to delete
    const view = await prisma.project.findUnique({
      where: { id: viewId },
      select: {
        id: true,
        name: true,
        createdById: true,
        bucketId: true,
        bucket: {
          select: {
            labId: true,
            lab: {
              select: {
                name: true,
                members: {
                  where: { 
                    userId: user.id,
                    isActive: true
                  },
                  select: { 
                    isAdmin: true 
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!view) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    // Check permission - creator or lab admin can delete
    const isCreator = view.createdById === user.id;
    const isLabAdmin = view.bucket?.lab?.members?.[0]?.isAdmin === true;

    if (!isCreator && !isLabAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this view' },
        { status: 403 }
      );
    }

    // Delete the view
    await prisma.project.delete({
      where: { id: viewId },
    });

    // Create audit log
    await auditDelete(
      user.id,
      'view',
      viewId,
      view.name,
      view.bucket?.labId || undefined,
      request,
      false // hard delete
    );

    return NextResponse.json(
      { 
        success: true,
        message: 'View deleted successfully' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting view:', error);
    return NextResponse.json(
      { error: 'Failed to delete view' },
      { status: 500 }
    );
  }
}

// GET /api/views/[viewId] - Get a specific view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ viewId: string }> }
) {
  try {
    const { viewId } = await params;

    const view = await prisma.project.findUnique({
      where: { id: viewId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bucket: {
          select: {
            id: true,
            labId: true,
          },
        },
      },
    });

    if (!view) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    // Transform to view format
    const transformedView = {
      id: view.id,
      name: view.name,
      type: 'TABLE',
      workspaceId: view.bucket?.labId,
      tableId: view.bucketId,
      configuration: view.description ? JSON.parse(view.description) : {},
      isDefault: view.status === 'ACTIVE',
      isShared: false,
      createdById: view.createdBy?.id,
      createdAt: view.createdAt,
      updatedAt: view.updatedAt,
    };

    return NextResponse.json(transformedView);
  } catch (error) {
    console.error('Error fetching view:', error);
    return NextResponse.json(
      { error: 'Failed to fetch view' },
      { status: 500 }
    );
  }
}

// PUT /api/views/[viewId] - Update a view
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ viewId: string }> }
) {
  try {
    const { viewId } = await params;
    const body = await request.json();
    const userId = request.headers.get('x-selected-user-id');

    // Check if the view exists and user has permission to update
    const existingView = await prisma.project.findUnique({
      where: { id: viewId },
      select: {
        id: true,
        createdById: true,
        bucket: {
          select: {
            lab: {
              select: {
                members: {
                  where: userId ? { userId } : undefined,
                  select: { role: true },
                },
              },
            },
          },
        },
      },
    });

    if (!existingView) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    // Update the view
    const updatedView = await prisma.project.update({
      where: { id: viewId },
      data: {
        name: body.name,
        description: body.configuration ? JSON.stringify(body.configuration) : undefined,
        status: body.isDefault ? 'ACTIVE' : undefined,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bucket: {
          select: {
            id: true,
            labId: true,
          },
        },
      },
    });

    // Transform to view format
    const transformedView = {
      id: updatedView.id,
      name: updatedView.name,
      type: body.type || 'TABLE',
      workspaceId: updatedView.bucket?.labId,
      tableId: updatedView.bucketId,
      configuration: body.configuration || {},
      isDefault: body.isDefault || false,
      isShared: body.isShared || false,
      createdById: updatedView.createdBy?.id,
      createdAt: updatedView.createdAt,
      updatedAt: updatedView.updatedAt,
    };

    return NextResponse.json(transformedView);
  } catch (error) {
    console.error('Error updating view:', error);
    return NextResponse.json(
      { error: 'Failed to update view' },
      { status: 500 }
    );
  }
}