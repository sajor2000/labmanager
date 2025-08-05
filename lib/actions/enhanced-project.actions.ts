'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { EnhancedProjectService, CreateProjectInput, UpdateProjectInput } from '@/lib/services/enhanced-project.service';
import { getCurrentUser } from '@/lib/utils/get-current-user';

/**
 * Enhanced Project Actions for Kanban-Optimized CRUD Operations
 * Supports drag-and-drop, status workflows, and research-specific features
 */

// ==========================================
// PROJECT CRUD OPERATIONS
// ==========================================

export async function createProject(data: CreateProjectInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedProjectService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const project = await service.create(data);
    
    // Revalidate relevant paths
    revalidatePath('/stacked');
    revalidatePath('/studies');
    revalidatePath('/overview');
    revalidatePath(`/buckets/${data.bucketId}`);
    
    return { success: true, data: project };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create project' 
    };
  }
}

export async function updateProject(projectId: string, data: UpdateProjectInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedProjectService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    // Use bulkUpdate for single project update
    const results = await service.bulkUpdate([projectId], data);
    const project = results?.[0];
    
    // Revalidate relevant paths
    revalidatePath('/stacked');
    revalidatePath('/studies');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/studies/${projectId}`);
    
    return { success: true, data: project };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update project' 
    };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedProjectService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const result = await service.delete(projectId);
    
    // Revalidate relevant paths
    revalidatePath('/stacked');
    revalidatePath('/studies');
    revalidatePath('/overview');
    
    return { success: true, message: result.message };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete project' 
    };
  }
}

// ==========================================
// KANBAN DRAG-AND-DROP OPERATIONS
// ==========================================

export async function moveProject(
  projectId: string, 
  toBucketId: string, 
  newPosition: number
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedProjectService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const movedProject = await service.moveProject(projectId, toBucketId, newPosition);
    
    // Revalidate kanban view
    revalidatePath('/stacked');
    revalidatePath('/buckets');
    
    return { success: true, data: movedProject };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to move project' 
    };
  }
}

// ==========================================
// STATUS WORKFLOW OPERATIONS
// ==========================================

export async function updateProjectStatus(projectId: string, newStatus: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedProjectService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const updatedProject = await service.updateStatus(projectId, newStatus);
    
    // Revalidate relevant paths
    revalidatePath('/stacked');
    revalidatePath('/studies');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/studies/${projectId}`);
    
    return { success: true, data: updatedProject };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update project status' 
    };
  }
}

// ==========================================
// BULK OPERATIONS
// ==========================================

export async function bulkUpdateProjects(
  projectIds: string[], 
  updates: Partial<UpdateProjectInput>
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedProjectService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const results = await service.bulkUpdate(projectIds, updates);
    
    // Revalidate relevant paths
    revalidatePath('/stacked');
    revalidatePath('/studies');
    revalidatePath('/overview');
    
    return { success: true, data: results };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to bulk update projects' 
    };
  }
}

// ==========================================
// DATA RETRIEVAL OPERATIONS
// ==========================================

export async function getProjectWithTasks(projectId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedProjectService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const project = await service.getProjectWithTasks(projectId);
    
    return { success: true, data: project };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load project details' 
    };
  }
}

export async function getFilteredProjects(filters: any = {}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedProjectService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const projects = await service.findMany({
      ...filters,
      labId: filters.labId || user.labs?.[0]?.lab?.id || ''
    });
    
    return { success: true, data: projects };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load projects' 
    };
  }
}

// ==========================================
// UTILITY OPERATIONS
// ==========================================

export async function generateORANumber() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedProjectService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const oraNumber = await service.generateORANumber();
    
    return { success: true, data: oraNumber };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate ORA number' 
    };
  }
}

// ==========================================
// FORM HANDLERS WITH REDIRECT
// ==========================================

export async function createProjectWithRedirect(
  prevState: any,
  formData: FormData
) {
  const data: CreateProjectInput = {
    name: formData.get('name') as string,
    bucketId: formData.get('bucketId') as string,
    parentId: formData.get('parentId') as string || undefined,
    oraNumber: formData.get('oraNumber') as string || undefined,
    projectType: formData.get('projectType') as string || undefined,
    studyType: formData.get('studyType') as string || undefined,
    priority: formData.get('priority') as any || 'MEDIUM',
    fundingSource: formData.get('fundingSource') as string || undefined,
    fundingDetails: formData.get('fundingDetails') as string || undefined,
    startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
    dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
    externalCollaborators: formData.get('externalCollaborators') as string || undefined,
    notes: formData.get('notes') as string || undefined,
    protocolLink: formData.get('protocolLink') as string || undefined,
    dataLink: formData.get('dataLink') as string || undefined,
    createDefaultTasks: formData.get('createDefaultTasks') === 'on',
    memberIds: formData.getAll('memberIds') as string[] || undefined,
    memberRoles: formData.getAll('memberRoles') as string[] || undefined
  };

  const result = await createProject(data);
  
  if (result.success && result.data) {
    redirect(`/studies/${result.data.id}`);
  }
  
  return result;
}

export async function updateProjectWithRedirect(
  projectId: string,
  prevState: any,
  formData: FormData
) {
  const data: UpdateProjectInput = {
    name: formData.get('name') as string || undefined,
    bucketId: formData.get('bucketId') as string || undefined,
    status: formData.get('status') as string || undefined,
    projectType: formData.get('projectType') as string || undefined,
    studyType: formData.get('studyType') as string || undefined,
    priority: formData.get('priority') as any || undefined,
    fundingSource: formData.get('fundingSource') as string || undefined,
    fundingDetails: formData.get('fundingDetails') as string || undefined,
    startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
    dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
    externalCollaborators: formData.get('externalCollaborators') as string || undefined,
    notes: formData.get('notes') as string || undefined,
    protocolLink: formData.get('protocolLink') as string || undefined,
    dataLink: formData.get('dataLink') as string || undefined,
    progress: formData.get('progress') ? parseInt(formData.get('progress') as string) : undefined
  };

  const result = await updateProject(projectId, data);
  
  if (result.success) {
    redirect(`/studies/${projectId}`);
  }
  
  return result;
}

// ==========================================
// QUICK ACTION HANDLERS
// ==========================================

export async function quickCreateProject(bucketId: string, name: string) {
  try {
    const result = await createProject({
      name,
      bucketId,
      createDefaultTasks: false
    });
    
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create project' 
    };
  }
}

export async function quickUpdateProjectStatus(projectId: string, status: string) {
  return await updateProjectStatus(projectId, status);
}