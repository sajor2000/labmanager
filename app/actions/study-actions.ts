'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import type { ProjectWithRelations } from '@/lib/types/dto';

// Validation schemas
const CreateStudySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  oraNumber: z.string().optional(),
  status: z.enum(['PLANNING', 'IRB_SUBMISSION', 'IRB_APPROVED', 'DATA_COLLECTION', 'ANALYSIS', 'MANUSCRIPT', 'UNDER_REVIEW', 'PUBLISHED', 'ON_HOLD', 'CANCELLED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  studyType: z.string().min(1, 'Study type is required'),
  bucketId: z.string().min(1, 'Bucket is required'),
  labId: z.string().min(1, 'Lab is required'),
  fundingSource: z.enum(['NIH', 'NSF', 'INDUSTRY_SPONSORED', 'INTERNAL', 'FOUNDATION', 'OTHER']).optional(),
  fundingDetails: z.string().optional(),
  externalCollaborators: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  createdById: z.string().min(1, 'Creator is required'),
  assigneeIds: z.array(z.string()).optional(),
});

const UpdateStudySchema = CreateStudySchema.partial().extend({
  id: z.string().min(1, 'Study ID is required'),
});

// Type-safe response wrapper
type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get all studies with optional filters
 */
export async function getStudies(filters?: {
  labId?: string;
  bucketId?: string;
  status?: string;
}): Promise<ActionResponse<ProjectWithRelations[]>> {
  try {
    const where: Prisma.ProjectWhereInput = {};
    if (filters?.labId) where.labId = filters.labId;
    if (filters?.bucketId) where.bucketId = filters.bucketId;
    if (filters?.status) where.status = filters.status as Prisma.EnumProjectStatusFilter;

    const studies = await prisma.project.findMany({
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

    // Transform projects to studies format
    const transformedStudies = studies.map(project => ({
      ...project,
      title: project.name, // Map name -> title
      studyType: project.projectType, // Map projectType -> studyType
      assignees: project.members?.map(m => m.user.name).filter(Boolean) || [],
      funding: project.fundingSource || 'Unknown',
      collaborators: project.externalCollaborators || 'None',
      bucketColor: project.bucket?.color || '#8B5CF6',
    }));

    return { success: true, data: transformedStudies as ProjectWithRelations[] };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch studies' 
    };
  }
}

/**
 * Create a new study
 */
export async function createStudy(
  input: z.infer<typeof CreateStudySchema>
): Promise<ActionResponse<ProjectWithRelations>> {
  try {
    // Validate input
    const validatedData = CreateStudySchema.parse(input);
    
    const { assigneeIds, dueDate, title, studyType, ...rest } = validatedData;
    
    // Create the project with assignees (map title to name, studyType to projectType)
    const study = await prisma.project.create({
      data: {
        name: title,
        projectType: studyType,
        studyType: studyType, // Keep both for backward compatibility
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        members: assigneeIds ? {
          create: assigneeIds.map(userId => ({
            userId,
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

    // Revalidate the studies page
    revalidatePath('/studies');
    revalidatePath('/stacked');
    revalidateTag('studies');
    
    return { success: true, data: study as ProjectWithRelations };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues.map(e => e.message).join(', ') 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create study' 
    };
  }
}

/**
 * Update an existing study
 */
export async function updateStudy(
  input: z.infer<typeof UpdateStudySchema>
): Promise<ActionResponse<ProjectWithRelations>> {
  try {
    // Validate input
    const validatedData = UpdateStudySchema.parse(input);
    
    const { id, assigneeIds, dueDate, title, studyType, ...rest } = validatedData;
    
    // Update the project (map title to name if provided, studyType to projectType)
    const updateData: Record<string, any> = { ...rest };
    if (title !== undefined) updateData.name = title;
    if (studyType !== undefined) {
      updateData.projectType = studyType;
      updateData.studyType = studyType; // Keep both for backward compatibility
    }
    
    const study = await prisma.project.update({
      where: { id },
      data: {
        ...updateData,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        // If assigneeIds is provided, update the assignees
        ...(assigneeIds !== undefined && {
          members: {
            deleteMany: {}, // Remove all existing assignees
            create: assigneeIds.map((userId: string) => ({
              userId,
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

    // Revalidate the studies page
    revalidatePath('/studies');
    revalidatePath('/stacked');
    revalidateTag('studies');
    
    return { success: true, data: study as ProjectWithRelations };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues.map(e => e.message).join(', ') 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update study' 
    };
  }
}

/**
 * Delete a study
 */
export async function deleteStudy(id: string): Promise<ActionResponse<{ success: boolean }>> {
  try {
    if (!id) {
      return { success: false, error: 'Study ID is required' };
    }

    await prisma.project.delete({
      where: { id },
    });

    // Revalidate the studies page
    revalidatePath('/studies');
    revalidatePath('/stacked');
    revalidateTag('studies');

    return { success: true, data: { success: true } };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete study' 
    };
  }
}

/**
 * Move a study to a different bucket
 */
export async function moveStudyToBucket(
  input: { studyId: string; bucketId: string }
): Promise<ActionResponse<ProjectWithRelations>> {
  try {
    const { studyId, bucketId } = input;
    
    if (!studyId || !bucketId) {
      return { success: false, error: 'Study ID and Bucket ID are required' };
    }

    const study = await prisma.project.update({
      where: { id: studyId },
      data: { bucketId: bucketId },
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

    // Revalidate the studies page
    revalidatePath('/stacked');
    revalidateTag('studies');

    return { success: true, data: study as ProjectWithRelations };
  } catch (error) {
    console.error('Error moving study:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to move study' 
    };
  }
}