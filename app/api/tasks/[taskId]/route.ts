import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { auditDelete, auditUpdate } from '@/lib/audit/logger';

// GET /api/tasks/[taskId] - Get a specific task with assignees
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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
              }
            }
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                initials: true,
                avatarUrl: true,
                role: true,
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            initials: true,
            avatarUrl: true,
          }
        },
        completedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        subtasks: {
          include: {
            assignees: {
              include: {
                user: true
              }
            }
          }
        },
        dependencies: {
          include: {
            dependsOnTask: {
              select: {
                id: true,
                title: true,
                status: true,
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                initials: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            assignees: true,
          }
        }
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[taskId] - Update a task (any lab member can update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    
    const { taskId } = await params;
    const body = await request.json();
    
    const {
      title,
      description,
      status,
      priority,
      estimatedHours,
      actualHours,
      dueDate,
      startDate,
      tags,
      assigneeIds,
      position,
    } = body;

    // Start a transaction to update task and assignees
    const updatedTask = await prisma.$transaction(async (tx) => {
      // Update the task
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(priority !== undefined && { priority }),
          ...(estimatedHours !== undefined && { estimatedHours }),
          ...(actualHours !== undefined && { actualHours }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
          ...(tags !== undefined && { tags }),
          ...(position !== undefined && { position }),
          ...(status === 'COMPLETED' && { completedAt: new Date() }),
        },
      });

      // Update assignees if provided
      if (assigneeIds !== undefined) {
        // Remove all existing assignees
        await tx.taskAssignee.deleteMany({
          where: { taskId },
        });

        // Add new assignees
        if (assigneeIds.length > 0) {
          await tx.taskAssignee.createMany({
            data: assigneeIds.map((userId: string) => ({
              taskId,
              userId,
            })),
          });
        }
      }

      // Fetch and return the updated task with all relations
      return await tx.task.findUnique({
        where: { id: taskId },
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
                }
              }
            }
          },
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  initials: true,
                  avatarUrl: true,
                  role: true,
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              initials: true,
              avatarUrl: true,
            }
          },
          _count: {
            select: {
              subtasks: true,
              comments: true,
              assignees: true,
            }
          }
        },
      });
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[taskId] - Partially update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  // PATCH uses the same logic as PUT for partial updates
  return PUT(request, { params });
}

// DELETE /api/tasks/[taskId] - Soft delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    
    // Get task details for authorization and audit
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            labId: true,
            name: true,
          }
        }
      }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Check if user is a member of the lab (any member can delete)
    const labMembership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId: task.project?.labId,
        isActive: true
      }
    });
    
    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to delete tasks' },
        { status: 403 }
      );
    }
    
    // Soft delete by setting isActive to false
    const deletedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        isActive: false,
      },
    });
    
    // Create audit log
    await auditDelete(
      user.id,
      'task',
      taskId,
      task.title,
      task.project?.labId,
      request,
      true // isSoftDelete
    );

    return NextResponse.json({
      success: true,
      message: 'Task archived successfully',
      task: deletedTask,
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}