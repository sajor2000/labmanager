'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { ProjectService, CreateProjectInput } from '@/lib/services/project.service';
import { ProjectWithRelations, BucketWithProjects, TeamWorkload, DeadlineWithRelations, UserCapacity, TeamMemberResult, BulkOperationResult, DashboardStats } from '@/lib/types/dto';
import { DashboardService } from '@/lib/services/dashboard.service';
import { UserService, CreateTeamMemberInput } from '@/lib/services/user.service';
import { ServiceContext } from '@/lib/services/base.service';
// import { auth } from '@clerk/nextjs/server'; // TODO: Add Clerk auth
import { cookies } from 'next/headers';

// Type-safe response wrapper
type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Get the current context for service layer
async function getServiceContext(): Promise<ServiceContext> {
  // TODO: Get user from Clerk auth when implemented
  // const { userId: clerkUserId } = await auth();
  
  // Get current lab from cookies or default
  const cookieStore = await cookies();
  const currentLabId = cookieStore.get('currentLabId')?.value || 'default-lab';
  
  // For now, use a default user ID if no auth (you'll need to implement proper auth)
  const userId = 'system-user'; // clerkUserId || 'system-user';
  
  return {
    userId,
    currentLabId,
    userRole: 'RESEARCH_MEMBER',
  };
}

// Project/Study Actions
// ====================

/**
 * Get all projects with optional filters using service layer
 */
export async function getProjects(filters?: {
  labId?: string;
  bucketId?: string;
  status?: string;
  assignedToMe?: boolean;
  search?: string;
}): Promise<ActionResponse<ProjectWithRelations[]>> {
  try {
    const context = await getServiceContext();
    const projectService = new ProjectService(context);
    
    const projects = await projectService.findMany({
      labId: filters?.labId,
      bucketId: filters?.bucketId,
      status: filters?.status,
      assignedToMe: filters?.assignedToMe,
      search: filters?.search,
    });
    
    return { success: true, data: projects };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch projects' 
    };
  }
}

/**
 * Create a new project with auto-generated ORA number
 */
export async function createProject(input: CreateProjectInput): Promise<ActionResponse<ProjectWithRelations>> {
  try {
    const context = await getServiceContext();
    const projectService = new ProjectService(context);
    
    const project = await projectService.createProject(input);
    
    // Revalidate relevant pages
    revalidatePath('/studies');
    revalidatePath('/stacked');
    revalidatePath('/overview');
    revalidateTag('projects');
    
    return { success: true, data: project };
  } catch (error) {
    console.error('Error creating project:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create project' 
    };
  }
}

/**
 * Update project status with validation
 */
export async function updateProjectStatus(
  projectId: string,
  newStatus: string
): Promise<ActionResponse<ProjectWithRelations>> {
  try {
    const context = await getServiceContext();
    const projectService = new ProjectService(context);
    
    const project = await projectService.updateStatus(projectId, newStatus);
    
    // Revalidate relevant pages
    revalidatePath('/studies');
    revalidatePath('/stacked');
    revalidateTag('projects');
    
    return { success: true, data: project };
  } catch (error) {
    console.error('Error updating project status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update project status' 
    };
  }
}

/**
 * Bulk update projects
 */
export async function bulkUpdateProjects(
  projectIds: string[],
  updates: Partial<CreateProjectInput>
): Promise<ActionResponse<BulkOperationResult<ProjectWithRelations>>> {
  try {
    const context = await getServiceContext();
    const projectService = new ProjectService(context);
    
    const results = await projectService.bulkUpdate(projectIds, updates);
    
    // Revalidate relevant pages
    revalidatePath('/studies');
    revalidatePath('/stacked');
    revalidateTag('projects');
    
    return { 
      success: true, 
      data: {
        successful: results,
        failed: [],
        totalProcessed: results.length,
        successCount: results.length,
        failureCount: 0
      }
    };
  } catch (error) {
    console.error('Error bulk updating projects:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to bulk update projects' 
    };
  }
}

/**
 * Get Kanban view data
 */
export async function getKanbanView(labId?: string): Promise<ActionResponse<BucketWithProjects[]>> {
  try {
    const context = await getServiceContext();
    const projectService = new ProjectService(context);
    
    const buckets = await projectService.getKanbanView(labId);
    
    return { success: true, data: buckets };
  } catch (error) {
    console.error('Error fetching Kanban view:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch Kanban view' 
    };
  }
}

// Dashboard Actions
// ================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(labId?: string): Promise<ActionResponse<DashboardStats>> {
  try {
    const context = await getServiceContext();
    const dashboardService = new DashboardService(context);
    
    const stats = await dashboardService.getDashboardStats(labId);
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' 
    };
  }
}

/**
 * Get team workload statistics
 */
export async function getTeamWorkload(labId?: string): Promise<ActionResponse<TeamWorkload[]>> {
  try {
    const context = await getServiceContext();
    const dashboardService = new DashboardService(context);
    
    const workload = await dashboardService.getTeamWorkload(labId);
    
    return { success: true, data: workload };
  } catch (error) {
    console.error('Error fetching team workload:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch team workload' 
    };
  }
}

/**
 * Get upcoming deadlines
 */
export async function getUpcomingDeadlines(
  labId?: string,
  days: number = 30
): Promise<ActionResponse<DeadlineWithRelations[]>> {
  try {
    const context = await getServiceContext();
    const dashboardService = new DashboardService(context);
    
    const deadlines = await dashboardService.getUpcomingDeadlines(labId, days);
    
    return { success: true, data: deadlines };
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch deadlines' 
    };
  }
}

// Team/User Actions
// ================

/**
 * Create a new team member with auto-generated initials and avatar
 */
export async function createTeamMember(
  input: CreateTeamMemberInput
): Promise<ActionResponse<TeamMemberResult>> {
  try {
    const context = await getServiceContext();
    const userService = new UserService(context);
    
    const member = await userService.createTeamMember(input);
    
    // Revalidate team page
    revalidatePath('/team');
    revalidateTag('team');
    
    return { success: true, data: member };
  } catch (error) {
    console.error('Error creating team member:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create team member' 
    };
  }
}

/**
 * Get lab members with workload
 */
export async function getLabMembers(labId?: string): Promise<ActionResponse<TeamMemberResult[]>> {
  try {
    const context = await getServiceContext();
    const userService = new UserService(context);
    
    const members = await userService.getLabMembers(labId);
    
    return { success: true, data: members };
  } catch (error) {
    console.error('Error fetching lab members:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch lab members' 
    };
  }
}

/**
 * Get user capacity and allocation
 */
export async function getUserCapacity(
  userId: string,
  labId?: string
): Promise<ActionResponse<UserCapacity>> {
  try {
    const context = await getServiceContext();
    const userService = new UserService(context);
    
    const capacity = await userService.getUserCapacity(userId, labId);
    
    return { success: true, data: capacity };
  } catch (error) {
    console.error('Error fetching user capacity:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user capacity' 
    };
  }
}

/**
 * Bulk invite team members
 */
export async function bulkInviteMembers(
  members: CreateTeamMemberInput[]
): Promise<ActionResponse<BulkOperationResult<TeamMemberResult>>> {
  try {
    const context = await getServiceContext();
    const userService = new UserService(context);
    
    const results = await userService.bulkInviteMembers(members);
    
    // Revalidate team page
    revalidatePath('/team');
    revalidateTag('team');
    
    return { 
      success: true, 
      data: {
        successful: results.successful || [],
        failed: results.failed || [],
        totalProcessed: (results.successful?.length || 0) + (results.failed?.length || 0),
        successCount: results.successful?.length || 0,
        failureCount: results.failed?.length || 0
      }
    };
  } catch (error) {
    console.error('Error bulk inviting members:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to bulk invite members' 
    };
  }
}

/**
 * Remove team member from lab
 */
export async function removeFromLab(
  userId: string,
  labId?: string
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const context = await getServiceContext();
    const userService = new UserService(context);
    
    const result = await userService.removeFromLab(userId, labId);
    
    // Revalidate team page
    revalidatePath('/team');
    revalidateTag('team');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error removing from lab:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove from lab' 
    };
  }
}

// Helper Actions
// =============

/**
 * Generate a new ORA number
 */
export async function generateORANumber(): Promise<ActionResponse<string>> {
  try {
    const context = await getServiceContext();
    const projectService = new ProjectService(context);
    
    const oraNumber = await projectService.generateORANumber();
    
    return { success: true, data: oraNumber };
  } catch (error) {
    console.error('Error generating ORA number:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate ORA number' 
    };
  }
}

/**
 * Set current lab in context (stored in cookie)
 */
export async function setCurrentLab(labId: string): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const cookieStore = await cookies();
    cookieStore.set('currentLabId', labId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    // Revalidate all pages to reflect lab change
    revalidatePath('/');
    
    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Error setting current lab:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to set current lab' 
    };
  }
}