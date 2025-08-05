import { EnhancedBaseService, ServiceContext } from './enhanced-base.service';
import { Prisma } from '@prisma/client';

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  parentTaskId?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'BLOCKED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate?: Date | string;
  startDate?: Date | string;
  estimatedHours?: number;
  tags?: string[];
  assigneeIds?: string[];
  dependsOnTaskIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: Date | string;
  startDate?: Date | string;
  completedAt?: Date | string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

export interface TaskFilters {
  projectId?: string;
  parentTaskId?: string;
  status?: string;
  priority?: string;
  assignedToMe?: boolean;
  dueWithin?: number; // days
  overdue?: boolean;
  search?: string;
  tags?: string[];
  isActive?: boolean;
}

export class EnhancedTaskService extends EnhancedBaseService {
  constructor(context: ServiceContext) {
    super(context);
  }
  
  /**
   * CREATE - New task with position management and dependencies
   */
  async create(data: CreateTaskInput) {
    try {
      // Validate project access
      const project = await this.prisma.project.findFirst({
        where: {
          id: data.projectId,
          isActive: true,
          members: {
            some: {
              userId: this.userId,
              isActive: true
            }
          }
        }
      });
      
      if (!project) {
        throw new Error('Project not found or access denied');
      }
      
      // Validate parent task if specified
      if (data.parentTaskId) {
        const parentTask = await this.prisma.task.findFirst({
          where: {
            id: data.parentTaskId,
            projectId: data.projectId,
            isActive: true
          }
        });
        
        if (!parentTask) {
          throw new Error('Parent task not found or invalid');
        }
      }
      
      return await this.prisma.$transaction(async (tx) => {
        // Get position for new task
        const lastTask = await tx.task.findFirst({
          where: { 
            projectId: data.projectId,
            parentTaskId: data.parentTaskId || null,
            isActive: true
          },
          orderBy: { position: 'desc' }
        });
        
        const position = (lastTask?.position ?? -1) + 1;
        
        // Create task
        const task = await tx.task.create({
          data: {
            title: data.title,
            description: data.description,
            projectId: data.projectId,
            parentTaskId: data.parentTaskId,
            status: data.status || 'TODO',
            priority: data.priority || 'MEDIUM',
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            startDate: data.startDate ? new Date(data.startDate) : null,
            estimatedHours: data.estimatedHours,
            tags: data.tags || [],
            position,
            createdById: this.userId,
            // Create assignments
            assignees: data.assigneeIds ? {
              create: data.assigneeIds.map(userId => ({
                userId
              }))
            } : {
              create: {
                userId: this.userId // Auto-assign to creator
              }
            }
          },
          include: this.getDefaultIncludes('task')
        });
        
        // Create dependencies if specified
        if (data.dependsOnTaskIds && data.dependsOnTaskIds.length > 0) {
          await this.createTaskDependencies(tx, task.id, data.dependsOnTaskIds);
        }
        
        // Log activity
        await this.logActivity(tx, 'task', task.id, 'created', {
          taskTitle: task.title,
          projectId: data.projectId,
          parentTaskId: data.parentTaskId,
          assigneeCount: data.assigneeIds?.length || 1,
          dependencyCount: data.dependsOnTaskIds?.length || 0
        });
        
        return task;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedTaskService.create');
    }
  }
  
  /**
   * READ - Get tasks for a project with hierarchy
   */
  async getProjectTasks(projectId: string, includeCompleted: boolean = false) {
    try {
      const whereClause: Prisma.TaskWhereInput = {
        projectId,
        isActive: true,
        parentTaskId: null, // Root tasks only
        ...(includeCompleted ? {} : { status: { not: 'COMPLETED' } })
      };
      
      return this.prisma.task.findMany({
        where: whereClause,
        include: {
          assignees: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  initials: true,
                  avatar: true
                }
              }
            }
          },
          subtasks: {
            where: { 
              isActive: true,
              ...(includeCompleted ? {} : { status: { not: 'COMPLETED' } })
            },
            include: {
              assignees: {
                where: { isActive: true },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      initials: true,
                      avatar: true
                    }
                  }
                }
              }
            },
            orderBy: { position: 'asc' }
          },
          dependencies: {
            include: {
              dependsOnTask: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  completedAt: true
                }
              }
            }
          },
          dependents: {
            include: {
              dependentTask: {
                select: {
                  id: true,
                  title: true,
                  status: true
                }
              }
            }
          }
        },
        orderBy: { position: 'asc' }
      });
    } catch (error) {
      this.handleError(error, 'EnhancedTaskService.getProjectTasks');
    }
  }
  
  /**
   * READ - Get tasks with advanced filtering
   */
  async findMany(filters: TaskFilters = {}) {
    try {
      const where: Prisma.TaskWhereInput = {
        projectId: filters.projectId,
        parentTaskId: filters.parentTaskId,
        isActive: filters.isActive ?? true,
        ...(filters.status && { status: filters.status as any }),
        ...(filters.priority && { priority: filters.priority as any }),
        ...(filters.assignedToMe && {
          assignees: {
            some: {
              userId: this.userId,
              isActive: true
            }
          }
        }),
        ...(filters.dueWithin && {
          dueDate: {
            lte: new Date(Date.now() + filters.dueWithin * 24 * 60 * 60 * 1000)
          }
        }),
        ...(filters.overdue && {
          dueDate: {
            lt: new Date()
          },
          status: { not: 'COMPLETED' }
        }),
        ...(filters.tags && filters.tags.length > 0 && {
          tags: {
            hasSome: filters.tags
          }
        }),
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      };
      
      return this.prisma.task.findMany({
        where,
        include: this.getDefaultIncludes('task'),
        orderBy: [
          { priority: 'desc' },
          { position: 'asc' },
          { createdAt: 'desc' }
        ]
      });
    } catch (error) {
      this.handleError(error, 'EnhancedTaskService.findMany');
    }
  }
  
  /**
   * UPDATE - Update task status with smart completion logic
   */
  async updateStatus(taskId: string, newStatus: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const task = await tx.task.findUnique({
          where: { id: taskId },
          include: {
            subtasks: {
              where: { isActive: true }
            },
            dependents: {
              include: {
                dependentTask: true
              }
            }
          }
        });
        
        if (!task || !task.isActive) {
          throw new Error('Task not found or inactive');
        }
        
        const updateData: any = { 
          status: newStatus,
          updatedAt: new Date()
        };
        
        // Handle completion logic
        if (newStatus === 'COMPLETED') {
          updateData.completedAt = new Date();
          updateData.completedById = this.userId;
          
          // Auto-complete all subtasks
          if (task.subtasks.length > 0) {
            await tx.task.updateMany({
              where: {
                parentTaskId: taskId,
                isActive: true,
                status: { not: 'COMPLETED' }
              },
              data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                completedById: this.userId
              }
            });
          }
        } else if (newStatus !== 'COMPLETED' && task.completedAt) {
          // If uncompleting, clear completion data
          updateData.completedAt = null;
          updateData.completedById = null;
        }
        
        const updated = await tx.task.update({
          where: { id: taskId },
          data: updateData,
          include: this.getDefaultIncludes('task')
        });
        
        // Check if this completion unblocks dependent tasks
        if (newStatus === 'COMPLETED' && task.dependents.length > 0) {
          await this.checkAndUnblockDependentTasks(tx, taskId);
        }
        
        // Update project progress
        await this.updateProjectProgress(tx, task.projectId);
        
        // Log activity
        await this.logActivity(tx, 'task', taskId, 'status_changed', {
          fromStatus: task.status,
          toStatus: newStatus,
          subtaskCount: task.subtasks.length,
          dependentCount: task.dependents.length
        });
        
        return updated;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedTaskService.updateStatus');
    }
  }
  
  /**
   * UPDATE - Reorder tasks within project or parent task
   */
  async reorderTasks(containerFilters: { projectId: string; parentTaskId?: string }, taskOrder: string[]) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Validate all tasks belong to the same container
        const tasks = await tx.task.findMany({
          where: {
            id: { in: taskOrder },
            projectId: containerFilters.projectId,
            parentTaskId: containerFilters.parentTaskId || null,
            isActive: true
          }
        });
        
        if (tasks.length !== taskOrder.length) {
          throw new Error('Invalid task order: some tasks not found or do not belong to container');
        }
        
        // Update positions
        const updates = taskOrder.map((taskId, index) =>
          tx.task.update({
            where: { id: taskId },
            data: { position: index }
          })
        );
        
        const results = await Promise.all(updates);
        
        // Log activity
        await this.logActivity(tx, 'task', 'bulk', 'reordered', {
          projectId: containerFilters.projectId,
          parentTaskId: containerFilters.parentTaskId,
          taskCount: taskOrder.length,
          newOrder: taskOrder
        });
        
        return results;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedTaskService.reorderTasks');
    }
  }
  
  /**
   * CREATE - Add subtask to existing task
   */
  async createSubtask(parentTaskId: string, data: Omit<CreateTaskInput, 'projectId' | 'parentTaskId'>) {
    try {
      const parentTask = await this.prisma.task.findUnique({
        where: { id: parentTaskId },
        include: {
          project: true
        }
      });
      
      if (!parentTask || !parentTask.isActive) {
        throw new Error('Parent task not found or inactive');
      }
      
      return this.create({
        ...data,
        projectId: parentTask.projectId,
        parentTaskId
      });
    } catch (error) {
      this.handleError(error, 'EnhancedTaskService.createSubtask');
    }
  }
  
  /**
   * UPDATE - Add or remove task dependencies
   */
  async updateDependencies(taskId: string, dependsOnTaskIds: string[]) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Validate task exists
        const task = await tx.task.findUnique({
          where: { id: taskId }
        });
        
        if (!task || !task.isActive) {
          throw new Error('Task not found or inactive');
        }
        
        // Remove existing dependencies
        await tx.taskDependency.deleteMany({
          where: { dependentTaskId: taskId }
        });
        
        // Add new dependencies
        if (dependsOnTaskIds.length > 0) {
          await this.createTaskDependencies(tx, taskId, dependsOnTaskIds);
        }
        
        // Check if task should be blocked
        const shouldBlock = await this.shouldTaskBeBlocked(tx, taskId);
        if (shouldBlock && task.status !== 'BLOCKED') {
          await tx.task.update({
            where: { id: taskId },
            data: { status: 'BLOCKED' }
          });
        } else if (!shouldBlock && task.status === 'BLOCKED') {
          await tx.task.update({
            where: { id: taskId },
            data: { status: 'TODO' }
          });
        }
        
        // Log activity
        await this.logActivity(tx, 'task', taskId, 'dependencies_updated', {
          dependencyCount: dependsOnTaskIds.length,
          isBlocked: shouldBlock
        });
        
        return { success: true, isBlocked: shouldBlock };
      });
    } catch (error) {
      this.handleError(error, 'EnhancedTaskService.updateDependencies');
    }
  }
  
  /**
   * UPDATE - Assign/unassign users to task
   */
  async updateAssignees(taskId: string, assigneeIds: string[]) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Validate task exists and user has access
        const task = await tx.task.findFirst({
          where: {
            id: taskId,
            isActive: true,
            project: {
              members: {
                some: {
                  userId: this.userId,
                  isActive: true
                }
              }
            }
          }
        });
        
        if (!task) {
          throw new Error('Task not found or access denied');
        }
        
        // Remove existing assignments
        await tx.taskAssignee.updateMany({
          where: { taskId },
          data: { isActive: false }
        });
        
        // Add new assignments
        if (assigneeIds.length > 0) {
          await tx.taskAssignee.createMany({
            data: assigneeIds.map(userId => ({
              taskId,
              userId
            })),
            skipDuplicates: true
          });
        }
        
        // Get updated task with assignees
        const updated = await tx.task.findUnique({
          where: { id: taskId },
          include: this.getDefaultIncludes('task')
        });
        
        // Log activity
        await this.logActivity(tx, 'task', taskId, 'assignees_updated', {
          assigneeCount: assigneeIds.length,
          assigneeIds
        });
        
        return updated;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedTaskService.updateAssignees');
    }
  }
  
  /**
   * UPDATE - Log time spent on task
   */
  async logTimeSpent(taskId: string, actualHours: number, description?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const task = await tx.task.findUnique({
          where: { id: taskId }
        });
        
        if (!task || !task.isActive) {
          throw new Error('Task not found or inactive');
        }
        
        const currentActualHours = task.actualHours || 0;
        const updated = await tx.task.update({
          where: { id: taskId },
          data: {
            actualHours: currentActualHours + actualHours
          }
        });
        
        // Log activity
        await this.logActivity(tx, 'task', taskId, 'time_logged', {
          hoursLogged: actualHours,
          totalActualHours: updated.actualHours,
          estimatedHours: task.estimatedHours,
          description
        });
        
        return updated;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedTaskService.logTimeSpent');
    }
  }
  
  /**
   * DELETE - Soft delete task with cascade to subtasks
   */
  async delete(taskId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get task details for logging
        const task = await tx.task.findUnique({
          where: { id: taskId },
          include: {
            subtasks: {
              where: { isActive: true }
            },
            dependencies: true,
            dependents: true
          }
        });
        
        if (!task) {
          throw new Error('Task not found');
        }
        
        // Check if task has dependents that would be orphaned
        if (task.dependents.length > 0) {
          // Remove dependencies instead of blocking deletion
          await tx.taskDependency.deleteMany({
            where: { dependsOnTaskId: taskId }
          });
        }
        
        // Soft delete task and subtasks
        await this.softDelete(tx, 'task', taskId, [
          { model: 'task', field: 'parentTaskId' }, // Subtasks
          { model: 'taskAssignment', field: 'taskId' }
        ]);
        
        // Remove from dependencies
        await tx.taskDependency.deleteMany({
          where: {
            OR: [
              { dependentTaskId: taskId },
              { dependsOnTaskId: taskId }
            ]
          }
        });
        
        // Update positions to close gap
        await tx.task.updateMany({
          where: {
            projectId: task.projectId,
            parentTaskId: task.parentTaskId,
            position: { gt: task.position },
            isActive: true
          },
          data: {
            position: { decrement: 1 }
          }
        });
        
        // Update project progress
        await this.updateProjectProgress(tx, task.projectId);
        
        // Log activity
        await this.logActivity(tx, 'task', taskId, 'deleted', {
          taskTitle: task.title,
          subtaskCount: task.subtasks.length,
          dependencyCount: task.dependencies.length
        });
        
        return { success: true, message: 'Task and subtasks successfully deleted' };
      });
    } catch (error) {
      this.handleError(error, 'EnhancedTaskService.delete');
    }
  }
  
  /**
   * UTILITY - Get task statistics for a project
   */
  async getTaskStats(projectId: string) {
    try {
      const tasks = await this.prisma.task.findMany({
        where: {
          projectId,
          isActive: true
        },
        select: {
          status: true,
          priority: true,
          estimatedHours: true,
          actualHours: true,
          completedAt: true,
          dueDate: true
        }
      });
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED').length;
      const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
      const blockedTasks = tasks.filter((t: any) => t.status === 'BLOCKED').length;
      
      const overdueTasks = tasks.filter((t: any) => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
      ).length;
      
      const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
      
      const tasksByPriority = tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalEstimatedHours,
        totalActualHours,
        hoursVariance: totalActualHours - totalEstimatedHours,
        tasksByPriority
      };
    } catch (error) {
      this.handleError(error, 'EnhancedTaskService.getTaskStats');
    }
  }
  
  // PRIVATE UTILITY METHODS
  
  private async createTaskDependencies(tx: any, taskId: string, dependsOnTaskIds: string[]) {
    // Validate dependency tasks exist and are in same project
    const dependencyTasks = await tx.task.findMany({
      where: {
        id: { in: dependsOnTaskIds },
        isActive: true
      }
    });
    
    if (dependencyTasks.length !== dependsOnTaskIds.length) {
      throw new Error('Some dependency tasks not found');
    }
    
    // Create dependencies
    await tx.taskDependency.createMany({
      data: dependsOnTaskIds.map(dependsOnTaskId => ({
        dependentTaskId: taskId,
        dependsOnTaskId
      })),
      skipDuplicates: true
    });
  }
  
  private async shouldTaskBeBlocked(tx: any, taskId: string): Promise<boolean> {
    const dependencies = await tx.taskDependency.findMany({
      where: { dependentTaskId: taskId },
      include: {
        dependsOnTask: {
          select: {
            status: true
          }
        }
      }
    });
    
    // Task is blocked if any dependency is not completed
    return dependencies.some((dep: any) => dep.dependsOnTask.status !== 'COMPLETED');
  }
  
  private async checkAndUnblockDependentTasks(tx: any, completedTaskId: string) {
    const dependentTasks = await tx.taskDependency.findMany({
      where: { dependsOnTaskId: completedTaskId },
      include: {
        dependentTask: true
      }
    });
    
    for (const dep of dependentTasks) {
      if (dep.dependentTask.status === 'BLOCKED') {
        const stillBlocked = await this.shouldTaskBeBlocked(tx, dep.dependentTask.id);
        if (!stillBlocked) {
          await tx.task.update({
            where: { id: dep.dependentTask.id },
            data: { status: 'TODO' }
          });
        }
      }
    }
  }
  
  private async updateProjectProgress(tx: any, projectId: string) {
    const tasks = await tx.task.findMany({
      where: {
        projectId,
        isActive: true
      },
      select: {
        status: true
      }
    });
    
    if (tasks.length === 0) return;
    
    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED').length;
    const progress = Math.round((completedTasks / tasks.length) * 100);
    
    await tx.project.update({
      where: { id: projectId },
      data: { progress }
    });
  }
}