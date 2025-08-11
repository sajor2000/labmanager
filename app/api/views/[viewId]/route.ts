import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/views/[viewId] - Delete a view
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ viewId: string }> }
) {
  try {
    const { viewId } = await params;
    const userId = request.headers.get('x-selected-user-id');

    // Check if the view exists and user has permission to delete
    const view = await prisma.project.findUnique({
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

    if (!view) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    // Check permission - creator or lab admin can delete
    const isCreator = view.createdById === userId;
    const isAdmin = view.bucket?.lab?.members?.[0]?.role === 'PI' || 
                    view.bucket?.lab?.members?.[0]?.role === 'LAB_MANAGER';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this view' },
        { status: 403 }
      );
    }

    // Delete the view
    await prisma.project.delete({
      where: { id: viewId },
    });

    return NextResponse.json(
      { message: 'View deleted successfully' },
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