'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import type { Project, Prisma } from '@prisma/client';
import type { ProjectWithRelations } from '@/lib/types/dto';

// Validation schemas
const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  oraNumber: z.string().optional(),
  status: z.enum(['PLANNING', 'IRB_SUBMISSION', 'IRB_APPROVED', 'DATA_COLLECTION', 'ANALYSIS', 'MANUSCRIPT', 'UNDER_REVIEW', 'PUBLISHED', 'ON_HOLD', 'CANCELLED', 'ARCHIVED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  projectType: z.string().min(1, 'Project type is required'),
  studyType: z.string().optional(),
  bucketId: z.string().min(1, 'Bucket is required'),
  labId: z.string().min(1, 'Lab is required'),
  fundingSource: z.enum(['NIH', 'NSF', 'INDUSTRY_SPONSORED', 'INTERNAL', 'FOUNDATION', 'OTHER']).optional(),
  fundingDetails: z.string().optional(),
  externalCollaborators: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  createdById: z.string().min(1, 'Creator is required'),
  memberIds: z.array(z.string()).optional(),
});

const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  id: z.string().min(1, 'Project ID is required'),
});

// Type-safe response wrapper
type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get all projects with optional filters
 */
export async function getProjects(filters?: {
  labId?: string;
  bucketId?: string;
  status?: string;
}): Promise<ActionResponse<ProjectWithRelations[]>> {
  try {
    const where: Prisma.ProjectWhereInput = {};
    if (filters?.labId) where.labId = filters.labId;
    if (filters?.bucketId) where.bucketId = filters.bucketId;
    if (filters?.status) where.status = filters.status as Project['status'];

    const projects = await prisma.project.findMany({
      where,
      include: {
        lab: true,
        bucket: true,
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: projects as ProjectWithRelations[] };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch projects' 
    };
  }
}

/**
 * Create a new project
 */
export async function createProject(
  input: z.infer<typeof CreateProjectSchema>
): Promise<ActionResponse<ProjectWithRelations>> {
  try {
    // Validate input
    const validatedData = CreateProjectSchema.parse(input);
    
    const { memberIds, dueDate, ...projectData } = validatedData;
    
    // Create the project with members
    const project = await prisma.project.create({
      data: {
        ...projectData,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        members: memberIds ? {
          create: memberIds.map(userId => ({
            userId,
            role: 'CONTRIBUTOR',
          })),
        } : undefined,
      },
      include: {
        lab: true,
        bucket: true,
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Revalidate the projects pages
    revalidatePath('/projects');
    revalidatePath('/studies');
    revalidatePath('/stacked');
    revalidateTag('projects');
    
    return { success: true, data: project as ProjectWithRelations };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues.map(e => e.message).join(', ') 
      };
    }
    
    console.error('Error creating project:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create project' 
    };
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  input: z.infer<typeof UpdateProjectSchema>
): Promise<ActionResponse<ProjectWithRelations>> {
  try {
    // Validate input
    const validatedData = UpdateProjectSchema.parse(input);
    
    const { id, memberIds, dueDate, ...updateData } = validatedData;
    
    // Update the project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...updateData,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        // If memberIds is provided, update the members
        ...(memberIds !== undefined && {
          members: {
            deleteMany: {}, // Remove all existing members
            create: memberIds.map((userId: string) => ({
              userId,
              role: 'CONTRIBUTOR',
            })),
          },
        }),
      },
      include: {
        lab: true,
        bucket: true,
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Revalidate the projects pages
    revalidatePath('/projects');
    revalidatePath('/studies');
    revalidatePath('/stacked');
    revalidateTag('projects');
    
    return { success: true, data: project as ProjectWithRelations };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues.map(e => e.message).join(', ') 
      };
    }
    
    console.error('Error updating project:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update project' 
    };
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<ActionResponse<{ success: boolean }>> {
  try {
    if (!id) {
      return { success: false, error: 'Project ID is required' };
    }

    await prisma.project.delete({
      where: { id },
    });

    // Revalidate the projects pages
    revalidatePath('/projects');
    revalidatePath('/studies');
    revalidatePath('/stacked');
    revalidateTag('projects');

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete project' 
    };
  }
}

/**
 * Move a project to a different bucket
 */
export async function moveProjectToBucket(
  projectId: string,
  bucketId: string
): Promise<ActionResponse<ProjectWithRelations>> {
  try {
    if (!projectId || !bucketId) {
      return { success: false, error: 'Project ID and Bucket ID are required' };
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { bucketId },
      include: {
        lab: true,
        bucket: true,
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Revalidate the projects pages
    revalidatePath('/stacked');
    revalidateTag('projects');

    return { success: true, data: project as ProjectWithRelations };
  } catch (error) {
    console.error('Error moving project:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to move project' 
    };
  }
}

// Alias the old study functions to maintain backward compatibility
export const getStudies = getProjects;
export const createStudy = createProject;
export const updateStudy = updateProject;
export const deleteStudy = deleteProject;
export const moveStudyToBucket = moveProjectToBucket;