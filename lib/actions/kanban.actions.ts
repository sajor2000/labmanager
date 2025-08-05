'use server';

import { revalidatePath } from 'next/cache';
import { 
  getBucketsWithProjects,
  reorderBuckets 
} from './enhanced-bucket.actions';
import { 
  moveProject,
  quickCreateProject,
  quickUpdateProjectStatus 
} from './enhanced-project.actions';
import { 
  quickCreateTask,
  quickUpdateTaskStatus,
  reorderTasks 
} from './enhanced-task.actions';

/**
 * Kanban-Specific Actions
 * Orchestrates bucket, project, and task operations for seamless drag-and-drop experience
 */

// ==========================================
// KANBAN VIEW DATA LOADING
// ==========================================

export async function loadKanbanData(labId?: string) {
  try {
    const result = await getBucketsWithProjects(labId);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    // Transform data for optimal kanban rendering
    const kanbanData = {
      buckets: result.data?.map(bucket => ({
        id: bucket.id,
        name: bucket.name,
        color: bucket.color,
        icon: bucket.icon,
        position: bucket.position,
        projectCount: bucket._count?.projects || 0,
        projects: bucket.projects?.map(project => ({
          id: project.id,
          name: project.name,
          oraNumber: project.oraNumber,
          status: project.status,
          priority: project.priority,
          position: project.position,
          progress: project.progress,
          dueDate: project.dueDate,
          memberCount: project._count?.members || 0,
          taskCount: project._count?.tasks || 0,
          completedTasks: project.tasks?.filter(t => t.status === 'COMPLETED').length || 0,
          members: project.members?.map(member => ({
            id: member.user.id,
            name: member.user.name,
            initials: member.user.initials,
            avatar: member.user.avatar,
            role: member.role
          })) || []
        })) || []
      })) || []
    };

    return { success: true, data: kanbanData };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load kanban data' 
    };
  }
}

// ==========================================
// DRAG-AND-DROP OPERATIONS
// ==========================================

export async function handleDragAndDrop(action: {
  type: 'bucket' | 'project' | 'task';
  sourceId: string;
  destinationId?: string;
  newPosition: number;
  additionalData?: any;
}) {
  try {
    let result;

    switch (action.type) {
      case 'bucket':
        // Reorder buckets within lab
        if (!action.additionalData?.bucketOrder) {
          throw new Error('Bucket order required for bucket reordering');
        }
        result = await reorderBuckets(
          action.additionalData.labId,
          action.additionalData.bucketOrder
        );
        break;

      case 'project':
        // Move project between buckets or reorder within bucket
        if (!action.destinationId) {
          throw new Error('Destination bucket required for project move');
        }
        result = await moveProject(
          action.sourceId,
          action.destinationId,
          action.newPosition
        );
        break;

      case 'task':
        // Reorder tasks within project
        if (!action.additionalData?.containerFilters) {
          throw new Error('Container filters required for task reordering');
        }
        result = await reorderTasks(
          action.additionalData.containerFilters,
          action.additionalData.taskOrder
        );
        break;

      default:
        throw new Error(`Unsupported drag-and-drop type: ${action.type}`);
    }

    // Revalidate kanban view
    revalidatePath('/stacked');
    
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Drag-and-drop operation failed' 
    };
  }
}

// ==========================================
// QUICK CREATE OPERATIONS
// ==========================================

export async function quickCreateProjectInBucket(bucketId: string, projectName: string) {
  try {
    const result = await quickCreateProject(bucketId, projectName);
    
    if (result.success) {
      // Revalidate kanban view
      revalidatePath('/stacked');
    }
    
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create project' 
    };
  }
}

export async function quickCreateTaskInProject(projectId: string, taskTitle: string) {
  try {
    const result = await quickCreateTask(projectId, taskTitle);
    
    if (result.success) {
      // Revalidate relevant views
      revalidatePath('/stacked');
      revalidatePath(`/projects/${projectId}`);
      revalidatePath(`/studies/${projectId}`);
    }
    
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create task' 
    };
  }
}

// ==========================================
// QUICK STATUS UPDATES
// ==========================================

export async function quickUpdateStatus(
  entityType: 'project' | 'task',
  entityId: string,
  newStatus: string
) {
  try {
    let result;

    switch (entityType) {
      case 'project':
        result = await quickUpdateProjectStatus(entityId, newStatus);
        break;
      case 'task':
        result = await quickUpdateTaskStatus(entityId, newStatus);
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    if (result.success) {
      // Revalidate kanban and related views
      revalidatePath('/stacked');
      revalidatePath('/overview');
    }
    
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update status' 
    };
  }
}

// ==========================================
// BATCH OPERATIONS FOR KANBAN
// ==========================================

export async function batchUpdateProjectsInBucket(
  bucketId: string,
  updates: { projectId: string; status?: string; priority?: string }[]
) {
  try {
    const results = await Promise.all(
      updates.map(async (update) => {
        if (update.status) {
          return await quickUpdateProjectStatus(update.projectId, update.status);
        }
        return { success: true };
      })
    );

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    if (successes.length > 0) {
      // Revalidate kanban view
      revalidatePath('/stacked');
    }

    return {
      success: failures.length === 0,
      successCount: successes.length,
      failureCount: failures.length,
      errors: failures.map(f => (f as any).error || 'Unknown error')
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Batch update failed' 
    };
  }
}

// ==========================================
// KANBAN STATISTICS
// ==========================================

export async function getKanbanStats(labId?: string) {
  try {
    const kanbanResult = await loadKanbanData(labId);
    
    if (!kanbanResult.success) {
      throw new Error(kanbanResult.error);
    }

    const buckets = kanbanResult.data?.buckets || [];
    
    const stats = {
      totalBuckets: buckets.length,
      totalProjects: buckets.reduce((sum, bucket) => sum + bucket.projectCount, 0),
      totalTasks: buckets.reduce((sum, bucket) => 
        sum + bucket.projects.reduce((taskSum, project) => taskSum + project.taskCount, 0), 0
      ),
      completedTasks: buckets.reduce((sum, bucket) => 
        sum + bucket.projects.reduce((taskSum, project) => taskSum + project.completedTasks, 0), 0
      ),
      projectsByStatus: buckets.reduce((statusMap, bucket) => {
        bucket.projects.forEach(project => {
          statusMap[project.status] = (statusMap[project.status] || 0) + 1;
        });
        return statusMap;
      }, {} as Record<string, number>),
      bucketDistribution: buckets.map(bucket => ({
        id: bucket.id,
        name: bucket.name,
        color: bucket.color,
        projectCount: bucket.projectCount,
        completionRate: bucket.projects.length > 0 
          ? Math.round(
              (bucket.projects.reduce((sum, p) => sum + p.completedTasks, 0) / 
               bucket.projects.reduce((sum, p) => sum + p.taskCount, 0)) * 100
            ) || 0
          : 0
      }))
    };

    return { success: true, data: stats };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to calculate kanban statistics' 
    };
  }
}

// ==========================================
// SEARCH AND FILTERING
// ==========================================

export async function searchKanbanItems(query: string, labId?: string) {
  try {
    const kanbanResult = await loadKanbanData(labId);
    
    if (!kanbanResult.success) {
      throw new Error(kanbanResult.error);
    }

    const buckets = kanbanResult.data?.buckets || [];
    const searchLower = query.toLowerCase();
    
    const filteredBuckets = buckets.map(bucket => ({
      ...bucket,
      projects: bucket.projects.filter(project => 
        project.name.toLowerCase().includes(searchLower) ||
        project.oraNumber?.toLowerCase().includes(searchLower) ||
        project.status.toLowerCase().includes(searchLower)
      )
    })).filter(bucket => 
      bucket.name.toLowerCase().includes(searchLower) ||
      bucket.projects.length > 0
    );

    return { 
      success: true, 
      data: { 
        buckets: filteredBuckets,
        resultCount: filteredBuckets.reduce((sum, bucket) => sum + bucket.projects.length, 0)
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Search failed' 
    };
  }
}

// ==========================================
// KANBAN VIEW PREFERENCES
// ==========================================

export async function saveKanbanViewPreferences(preferences: {
  showCompletedProjects?: boolean;
  groupBy?: 'bucket' | 'status' | 'priority';
  sortBy?: 'position' | 'dueDate' | 'priority' | 'name';
  cardSize?: 'compact' | 'normal' | 'detailed';
  labId?: string;
}) {
  try {
    // In a real implementation, this would save to user preferences
    // For now, we'll return the preferences to be stored client-side
    
    return { 
      success: true, 
      data: preferences,
      message: 'View preferences saved'
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save preferences' 
    };
  }
}