'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import type { Task, TaskStatus, Prisma } from '@prisma/client';
import type { TaskWithFullRelations } from '@/lib/types/dto';

// Validation schemas
const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  projectId: z.string().min(1, 'Project ID is required'),
  createdById: z.string().min(1, 'Creator is required'),
  assigneeIds: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  id: z.string().min(1, 'Task ID is required'),
});

const UpdateTaskStatusSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']),
});

// Type-safe response wrapper
type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get all tasks with optional filters
 */
export async function getTasks(filters?: {
  projectId?: string;
  status?: TaskStatus;
  assigneeId?: string;
}): Promise<ActionResponse<TaskWithFullRelations[]>> {
  try {
    const where: Prisma.TaskWhereInput = {};
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;
    if (filters?.assigneeId) {
      where.assignees = {
        some: {
          userId: filters.assigneeId,
        },
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        createdBy: true,
        assignees: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return { success: true, data: tasks as any[] };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch tasks' 
    };
  }
}

/**
 * Create a new task
 */
export async function createTask(
  input: z.infer<typeof CreateTaskSchema>
): Promise<ActionResponse<TaskWithFullRelations>> {
  try {
    // Validate input
    const validatedData = CreateTaskSchema.parse(input);
    
    const { assigneeIds, dueDate, ...taskData } = validatedData;
    
    // Create the task with assignees
    const task = await prisma.task.create({
      data: {
        ...taskData,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignees: assigneeIds ? {
          create: assigneeIds.map(userId => ({
            userId,
          })),
        } : undefined,
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

    // Revalidate pages
    revalidatePath('/tasks');
    revalidatePath('/studies');
    revalidateTag('tasks');
    
    return { success: true, data: task as TaskWithFullRelations };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues.map(e => e.message).join(', ') 
      };
    }
    
    console.error('Error creating task:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create task' 
    };
  }
}

/**
 * Update an existing task
 */
export async function updateTask(
  input: z.infer<typeof UpdateTaskSchema>
): Promise<ActionResponse<TaskWithFullRelations>> {
  try {
    // Validate input
    const validatedData = UpdateTaskSchema.parse(input);
    
    const { id, assigneeIds, dueDate, status, ...updateData } = validatedData;
    
    // Handle status changes to COMPLETED
    const additionalData: Record<string, any> = {};
    if (status === 'COMPLETED') {
      additionalData.completedAt = new Date();
    } else if (status) {
      additionalData.completedAt = null;
    }
    
    // Update the task
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        status,
        ...additionalData,
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

    // Revalidate pages
    revalidatePath('/tasks');
    revalidatePath('/studies');
    revalidateTag('tasks');
    
    return { success: true, data: task as TaskWithFullRelations };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues.map(e => e.message).join(', ') 
      };
    }
    
    console.error('Error updating task:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update task' 
    };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<ActionResponse<{ success: boolean }>> {
  try {
    if (!id) {
      return { success: false, error: 'Task ID is required' };
    }

    await prisma.task.delete({
      where: { id },
    });

    // Revalidate pages
    revalidatePath('/tasks');
    revalidatePath('/studies');
    revalidateTag('tasks');

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete task' 
    };
  }
}

/**
 * Quick update task status
 */
export async function updateTaskStatus(
  input: z.infer<typeof UpdateTaskStatusSchema>
): Promise<ActionResponse<TaskWithFullRelations>> {
  try {
    // Validate input
    const { id, status } = UpdateTaskStatusSchema.parse(input);
    
    const updateData: Record<string, any> = { status };
    
    // Handle completion
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

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

    // Revalidate pages
    revalidatePath('/tasks');
    revalidatePath('/studies');
    revalidateTag('tasks');

    return { success: true, data: task as TaskWithFullRelations };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues.map(e => e.message).join(', ') 
      };
    }
    
    console.error('Error updating task status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update task status' 
    };
  }
}

/**
 * Get tasks by project
 */
export async function getTasksByStudy(
  projectId: string
): Promise<ActionResponse<Task[]>> {
  try {
    if (!projectId) {
      return { success: false, error: 'Study ID is required' };
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        createdBy: true,
        assignees: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return { success: true, data: tasks as any[] };
  } catch (error) {
    console.error('Error fetching tasks by project:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch tasks' 
    };
  }
}

/**
 * Get overdue tasks
 */
export async function getOverdueTasks(): Promise<ActionResponse<Task[]>> {
  try {
    const now = new Date();
    
    const tasks = await prisma.task.findMany({
      where: {
        status: {
          not: 'COMPLETED',
        },
        dueDate: {
          lt: now,
        },
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
      orderBy: {
        dueDate: 'asc',
      },
    });

    return { success: true, data: tasks as any[] };
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch overdue tasks' 
    };
  }
}