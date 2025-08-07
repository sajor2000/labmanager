import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// Validation schema for creating a task
const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  projectId: z.string().min(1), // Required - tasks must belong to a project
  createdById: z.string().optional(), // Make optional and provide default
  assigneeIds: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/tasks - Get all tasks with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    
    const where: Prisma.TaskWhereInput = {};
    if (projectId) where.projectId = projectId;
    if (status) {
      // Handle status filtering for PersonalizedDashboard's 'pending' status
      if (status === 'pending') {
        where.status = { in: ['TODO', 'IN_PROGRESS'] };
      } else {
        where.status = status as Prisma.TaskWhereInput['status'];
      }
    }
    if (assigneeId) {
      where.assignees = {
        some: {
          userId: assigneeId,
        },
      };
    }

    const tasks = await prisma.task.findMany({
      where: {
        ...where,
        isActive: true, // Only show active tasks
      },
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            initials: true,
            avatarUrl: true,
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
            },
          },
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateTaskSchema.parse(body);
    
    // Extract assigneeIds for separate processing
    const { assigneeIds, dueDate, startDate, estimatedHours, actualHours, tags, ...taskData } = validatedData;
    
    // Provide default values for required fields
    // TODO: Replace with actual user ID from auth context
    const defaultUserId = 'system'; // Temporary fallback
    
    // Find the first available user or create a system user
    let createdById = taskData.createdById || defaultUserId;
    
    // Try to find a real user to use as creator
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      createdById = firstUser.id;
    }
    
    // Create the task with assignees
    const task = await prisma.task.create({
      data: {
        ...taskData,
        createdById,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        estimatedHours,
        actualHours,
        tags: tags || [],
        assignees: assigneeIds ? {
          create: assigneeIds.map(userId => ({
            userId,
          })),
        } : undefined,
      },
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            initials: true,
            avatarUrl: true,
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
            },
          },
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
          }
        }
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks - Update a task
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, assigneeIds, dueDate, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    // Handle status changes to COMPLETED
    if (updateData.status === 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (updateData.status && updateData.status !== 'COMPLETED') {
      updateData.completedAt = null;
    }

    // Update the task
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        // If assigneeIds is provided, update the assignees
        ...(assigneeIds !== undefined && {
          assignees: {
            deleteMany: {}, // Remove all existing assignees
            create: assigneeIds.map((userId: string) => ({
              userId,
            })),
          },
        }),
      },
      include: {
        project: true,
        createdBy: true,
        assignees: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/:id/status - Quick status update
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Task ID and status are required' },
        { status: 400 }
      );
    }
    
    const updateData: Prisma.TaskUpdateInput = { 
      status: status as Prisma.TaskUpdateInput['status'],
      completedAt: status === 'COMPLETED' ? new Date() : null
    };

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        createdBy: true,
        assignees: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    );
  }
}