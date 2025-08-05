'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { EnhancedTaskService, CreateTaskInput, UpdateTaskInput } from '@/lib/services/enhanced-task.service';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/utils/get-current-user';

/**
 * Enhanced Task Actions for Comprehensive Task Management
 * Supports subtasks, dependencies, time tracking, and smart completion logic
 */

// ==========================================
// TASK CRUD OPERATIONS
// ==========================================

export async function createTask(data: CreateTaskInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const task = await service.create(data);
    
    // Revalidate relevant paths
    revalidatePath('/tasks');
    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath(`/studies/${data.projectId}`);
    if (data.parentTaskId) {
      revalidatePath(`/tasks/${data.parentTaskId}`);
    }
    
    return { success: true, data: task };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create task' 
    };
  }
}

export async function updateTask(taskId: string, data: UpdateTaskInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    // Update task directly using Prisma
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        ...(data.status && { status: data.status as any }),
        ...(data.priority && { priority: data.priority as any }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.completedAt && { completedAt: new Date(data.completedAt) }),
        updatedAt: new Date()
      } as any,
      include: {
        assignees: true,
        project: true,
        parent: true,
        subtasks: true
      }
    });
    
    // Revalidate relevant paths
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);
    
    return { success: true, data: task };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update task' 
    };
  }
}

export async function deleteTask(taskId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const result = await service.delete(taskId);
    
    // Revalidate relevant paths
    revalidatePath('/tasks');
    revalidatePath('/projects');
    revalidatePath('/studies');
    
    return { success: true, message: result.message };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete task' 
    };
  }
}

// ==========================================
// TASK STATUS AND WORKFLOW
// ==========================================

export async function updateTaskStatus(taskId: string, newStatus: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const updatedTask = await service.updateStatus(taskId, newStatus);
    
    // Revalidate relevant paths
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath('/projects');
    revalidatePath('/studies');
    
    return { success: true, data: updatedTask };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update task status' 
    };
  }
}

// ==========================================
// TASK ORDERING AND POSITIONING
// ==========================================

export async function reorderTasks(
  containerFilters: { projectId: string; parentTaskId?: string },
  taskOrder: string[]
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const results = await service.reorderTasks(containerFilters, taskOrder);
    
    // Revalidate relevant paths
    revalidatePath('/tasks');
    revalidatePath(`/projects/${containerFilters.projectId}`);
    revalidatePath(`/studies/${containerFilters.projectId}`);
    if (containerFilters.parentTaskId) {
      revalidatePath(`/tasks/${containerFilters.parentTaskId}`);
    }
    
    return { success: true, data: results };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reorder tasks' 
    };
  }
}

// ==========================================
// SUBTASK OPERATIONS
// ==========================================

export async function createSubtask(
  parentTaskId: string, 
  data: Omit<CreateTaskInput, 'projectId' | 'parentTaskId'>
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const subtask = await service.createSubtask(parentTaskId, data);
    
    // Revalidate relevant paths
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${parentTaskId}`);
    
    return { success: true, data: subtask };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create subtask' 
    };
  }
}

// ==========================================
// TASK DEPENDENCIES
// ==========================================

export async function updateTaskDependencies(taskId: string, dependsOnTaskIds: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const result = await service.updateDependencies(taskId, dependsOnTaskIds);
    
    // Revalidate relevant paths
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);
    
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update task dependencies' 
    };
  }
}

// ==========================================
// TASK ASSIGNMENTS
// ==========================================

export async function updateTaskAssignees(taskId: string, assigneeIds: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const updatedTask = await service.updateAssignees(taskId, assigneeIds);
    
    // Revalidate relevant paths
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);
    
    return { success: true, data: updatedTask };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update task assignees' 
    };
  }
}

// ==========================================
// TIME TRACKING
// ==========================================

export async function logTimeSpent(
  taskId: string, 
  actualHours: number, 
  description?: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const updatedTask = await service.logTimeSpent(taskId, actualHours, description);
    
    // Revalidate relevant paths
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);
    
    return { success: true, data: updatedTask };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to log time' 
    };
  }
}

// ==========================================
// DATA RETRIEVAL OPERATIONS
// ==========================================

export async function getProjectTasks(projectId: string, includeCompleted: boolean = false) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const tasks = await service.getProjectTasks(projectId, includeCompleted);
    
    return { success: true, data: tasks };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load project tasks' 
    };
  }
}

export async function getFilteredTasks(filters: any = {}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const tasks = await service.findMany(filters);
    
    return { success: true, data: tasks };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load tasks' 
    };
  }
}

export async function getTaskStats(projectId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const stats = await service.getTaskStats(projectId);
    
    return { success: true, data: stats };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load task statistics' 
    };
  }
}

// ==========================================
// FORM HANDLERS WITH REDIRECT
// ==========================================

export async function createTaskWithRedirect(
  prevState: any,
  formData: FormData
) {
  const data: CreateTaskInput = {
    title: formData.get('title') as string,
    description: formData.get('description') as string || undefined,
    projectId: formData.get('projectId') as string,
    parentTaskId: formData.get('parentTaskId') as string || undefined,
    status: formData.get('status') as any || 'TODO',
    priority: formData.get('priority') as any || 'MEDIUM',
    dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
    startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
    estimatedHours: formData.get('estimatedHours') ? parseFloat(formData.get('estimatedHours') as string) : undefined,
    tags: formData.getAll('tags') as string[] || undefined,
    assigneeIds: formData.getAll('assigneeIds') as string[] || undefined,
    dependsOnTaskIds: formData.getAll('dependsOnTaskIds') as string[] || undefined
  };

  const result = await createTask(data);
  
  if (result.success) {
    const redirectPath = data.parentTaskId 
      ? `/tasks/${data.parentTaskId}` 
      : `/projects/${data.projectId}`;
    redirect(redirectPath);
  }
  
  return result;
}

export async function updateTaskWithRedirect(
  taskId: string,
  prevState: any,
  formData: FormData
) {
  const data: UpdateTaskInput = {
    title: formData.get('title') as string || undefined,
    description: formData.get('description') as string || undefined,
    status: formData.get('status') as string || undefined,
    priority: formData.get('priority') as string || undefined,
    dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
    startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
    estimatedHours: formData.get('estimatedHours') ? parseFloat(formData.get('estimatedHours') as string) : undefined,
    actualHours: formData.get('actualHours') ? parseFloat(formData.get('actualHours') as string) : undefined,
    tags: formData.getAll('tags') as string[] || undefined
  };

  const result = await updateTask(taskId, data);
  
  if (result.success) {
    redirect(`/tasks/${taskId}`);
  }
  
  return result;
}

// ==========================================
// QUICK ACTION HANDLERS
// ==========================================

export async function quickCreateTask(projectId: string, title: string) {
  try {
    const result = await createTask({
      title,
      projectId
    });
    
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create task' 
    };
  }
}

export async function quickUpdateTaskStatus(taskId: string, status: string) {
  return await updateTaskStatus(taskId, status);
}

export async function quickToggleTaskCompletion(taskId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedTaskService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    // Get current task to check status
    const tasks = await service.findMany({ 
      search: taskId // This might need adjustment based on actual implementation
    });
    
    const currentTask = tasks?.find(t => t.id === taskId);
    if (!currentTask) {
      throw new Error('Task not found');
    }

    const newStatus = currentTask.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    return await updateTaskStatus(taskId, newStatus);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to toggle task completion' 
    };
  }
}

// ==========================================
// BATCH OPERATIONS
// ==========================================

export async function bulkUpdateTaskStatus(taskIds: string[], status: string) {
  try {
    const results = await Promise.all(
      taskIds.map(taskId => updateTaskStatus(taskId, status))
    );
    
    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);
    
    return {
      success: failures.length === 0,
      successCount: successes.length,
      failureCount: failures.length,
      errors: failures.map(f => f.error)
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to bulk update tasks' 
    };
  }
}

export async function bulkAssignTasks(taskIds: string[], assigneeIds: string[]) {
  try {  
    const results = await Promise.all(
      taskIds.map(taskId => updateTaskAssignees(taskId, assigneeIds))
    );
    
    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);
    
    return {
      success: failures.length === 0,
      successCount: successes.length,
      failureCount: failures.length,
      errors: failures.map(f => f.error)
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to bulk assign tasks' 
    };
  }
}