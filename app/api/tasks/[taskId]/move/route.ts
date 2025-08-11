import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for moving a task
const MoveTaskSchema = z.object({
  newProjectId: z.string().optional(),
  newStatus: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED']).optional(),
  newPosition: z.number().optional(),
  newBucketId: z.string().optional(),
});

// POST /api/tasks/[taskId]/move - Move a task to a different project/status/position
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const userId = request.headers.get('x-selected-user-id');

    // Validate the request body
    const validatedData = MoveTaskSchema.parse(body);

    // Check if the task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            bucketId: true,
            bucket: {
              select: {
                id: true,
                labId: true,
                lab: {
                  select: {
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
        },
        assignees: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to move the task
    const userMember = existingTask.project?.bucket?.lab?.members?.[0];
    const isAssignee = existingTask.assignees.some(a => a.userId === userId);
    const canMoveTask = userMember || isAssignee;

    if (!canMoveTask && userId) {
      return NextResponse.json(
        { error: 'You do not have permission to move this task' },
        { status: 403 }
      );
    }

    // If moving to a new project, verify it exists and user has access
    if (validatedData.newProjectId && validatedData.newProjectId !== existingTask.projectId) {
      const newProject = await prisma.project.findUnique({
        where: { id: validatedData.newProjectId },
        select: {
          id: true,
          bucketId: true,
          bucket: {
            select: {
              labId: true,
              lab: {
                select: {
                  members: {
                    where: userId ? { userId } : undefined,
                    select: { userId: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!newProject) {
        return NextResponse.json(
          { error: 'Target project not found' },
          { status: 404 }
        );
      }

      // Check if user has access to the target project
      const hasAccessToNewProject = newProject.bucket?.lab?.members?.length > 0;
      if (!hasAccessToNewProject && userId) {
        return NextResponse.json(
          { error: 'You do not have access to the target project' },
          { status: 403 }
        );
      }
    }

    // If moving to a new bucket, update via project
    let updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.newStatus) {
      updateData.status = validatedData.newStatus;
    }

    if (validatedData.newProjectId) {
      updateData.projectId = validatedData.newProjectId;
    }

    // Handle bucket change if specified
    if (validatedData.newBucketId) {
      // First, find a project in the new bucket or create one
      const targetBucket = await prisma.bucket.findUnique({
        where: { id: validatedData.newBucketId },
        include: {
          projects: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!targetBucket) {
        return NextResponse.json(
          { error: 'Target bucket not found' },
          { status: 404 }
        );
      }

      // If there's a project in the bucket, use it; otherwise, create one
      if (targetBucket.projects.length > 0) {
        updateData.projectId = targetBucket.projects[0].id;
      } else {
        // Create a default project in the bucket
        const newProject = await prisma.project.create({
          data: {
            name: `${targetBucket.name} Tasks`,
            bucketId: targetBucket.id,
            labId: targetBucket.labId,
            status: 'ACTIVE',
            createdById: userId || undefined,
          },
        });
        updateData.projectId = newProject.id;
      }
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            bucket: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log the move action (in a real app, you'd have an activity log)
    const moveDetails = {
      taskId: updatedTask.id,
      taskTitle: updatedTask.title,
      changes: {
        ...(validatedData.newProjectId && {
          project: {
            from: existingTask.project?.id,
            to: updatedTask.project?.id,
          },
        }),
        ...(validatedData.newStatus && {
          status: {
            from: existingTask.status,
            to: updatedTask.status,
          },
        }),
        ...(validatedData.newBucketId && {
          bucket: {
            from: existingTask.project?.bucketId,
            to: updatedTask.project?.bucket?.id,
          },
        }),
      },
      movedBy: userId,
      movedAt: new Date(),
    };

    return NextResponse.json({
      message: 'Task moved successfully',
      task: updatedTask,
      moveDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error moving task:', error);
    return NextResponse.json(
      { error: 'Failed to move task' },
      { status: 500 }
    );
  }
}