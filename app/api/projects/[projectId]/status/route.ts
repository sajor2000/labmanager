import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating project status
const UpdateStatusSchema = z.object({
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  reason: z.string().optional(),
  notifyMembers: z.boolean().optional(),
});

// PATCH /api/projects/[projectId]/status - Update project status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const userId = request.headers.get('x-selected-user-id');

    // Validate the request body
    const validatedData = UpdateStatusSchema.parse(body);

    // Check if the project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        bucket: {
          select: {
            lab: {
              select: {
                id: true,
                name: true,
                members: {
                  where: userId ? { userId } : undefined,
                  select: {
                    role: true,
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update status
    const userMember = existingProject.bucket?.lab?.members?.[0];
    const canUpdateStatus = userMember && (
      userMember.role === 'PI' || 
      userMember.role === 'LAB_MANAGER' ||
      userMember.role === 'POST_DOC'
    );

    if (!canUpdateStatus && userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update project status' },
        { status: 403 }
      );
    }

    // Update the project status
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: validatedData.status,
        updatedAt: new Date(),
      },
      include: {
        bucket: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    // Create an activity log entry (if we had an Activity model)
    // This would track the status change for audit purposes
    if (userId && validatedData.reason) {
      // In a real implementation, you'd create an activity log:
      // await prisma.activity.create({
      //   data: {
      //     type: 'PROJECT_STATUS_CHANGED',
      //     projectId: projectId,
      //     userId: userId,
      //     metadata: {
      //       oldStatus: existingProject.status,
      //       newStatus: validatedData.status,
      //       reason: validatedData.reason,
      //     },
      //   },
      // });
    }

    // If notifyMembers is true, you could trigger notifications here
    if (validatedData.notifyMembers) {
      // Trigger notification service
      // await notificationService.notifyProjectStatusChange(updatedProject, validatedData.status);
    }

    return NextResponse.json({
      message: 'Project status updated successfully',
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        status: updatedProject.status,
        previousStatus: existingProject.status,
        bucket: updatedProject.bucket,
        taskCount: updatedProject._count.tasks,
        updatedAt: updatedProject.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating project status:', error);
    return NextResponse.json(
      { error: 'Failed to update project status' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[projectId]/status - Get project status history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        bucket: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you'd fetch status history from an Activity/Audit log
    const statusHistory = [
      {
        status: project.status,
        timestamp: project.updatedAt,
        current: true,
      },
      {
        status: 'PLANNING',
        timestamp: project.createdAt,
        current: false,
      },
    ];

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        currentStatus: project.status,
        bucket: project.bucket,
      },
      statusHistory,
    });
  } catch (error) {
    console.error('Error fetching project status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project status' },
      { status: 500 }
    );
  }
}