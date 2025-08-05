'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import type { BucketWithRelations } from '@/lib/types/dto';

// Validation schemas
const CreateBucketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title too long'),
  description: z.string().max(200, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#00BCD4'),
  labId: z.string().min(1, 'Lab is required'),
  position: z.number().optional(),
});

const UpdateBucketSchema = CreateBucketSchema.partial().extend({
  id: z.string().min(1, 'Bucket ID is required'),
});

const ReorderBucketsSchema = z.array(z.object({
  id: z.string(),
  position: z.number(),
}));

// Type-safe response wrapper
type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get all buckets with optional filters
 */
export async function getBuckets(
  labId?: string
): Promise<ActionResponse<BucketWithRelations[]>> {
  try {
    const where: Prisma.BucketWhereInput = {};
    if (labId) where.labId = labId;

    const buckets = await prisma.bucket.findMany({
      where,
      include: {
        lab: true,
        projects: {
          include: {
            createdBy: true,
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    // Transform buckets to include title field
    const transformedBuckets = buckets.map(bucket => ({
      ...bucket,
      title: bucket.name, // Map name -> title for UI
      studyCount: bucket._count.projects,
      studies: bucket.projects?.map(project => ({
        ...project,
        title: project.name, // Map name -> title
        studyType: project.projectType,
        assignees: project.members?.map(m => m.user.name).filter(Boolean) || [],
        funding: project.fundingSource || 'Unknown',
        collaborators: project.externalCollaborators || 'None',
        bucketColor: bucket.color,
      })) || [],
    }));

    return { success: true, data: transformedBuckets as BucketWithRelations[] };
  } catch (error) {
    console.error('Error fetching buckets:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch buckets' 
    };
  }
}

/**
 * Create a new bucket
 */
export async function createBucket(
  input: z.infer<typeof CreateBucketSchema>
): Promise<ActionResponse<BucketWithRelations>> {
  try {
    // Validate input
    const validatedData = CreateBucketSchema.parse(input);
    
    // Get the max position for this lab to add new bucket at the end
    const maxPositionBucket = await prisma.bucket.findFirst({
      where: { labId: validatedData.labId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    
    const position = validatedData.position ?? ((maxPositionBucket?.position ?? -1) + 1);
    
    // Create the bucket (map title to name)
    const { title, ...rest } = validatedData;
    const bucket = await prisma.bucket.create({
      data: {
        name: title,
        ...rest,
        position,
      },
      include: {
        lab: true,
        projects: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    // Revalidate pages
    revalidatePath('/buckets');
    revalidatePath('/stacked');
    revalidateTag('buckets');
    
    return { success: true, data: bucket as BucketWithRelations };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues.map(e => e.message).join(', ') 
      };
    }
    
    console.error('Error creating bucket:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create bucket' 
    };
  }
}

/**
 * Update an existing bucket
 */
export async function updateBucket(
  input: z.infer<typeof UpdateBucketSchema>
): Promise<ActionResponse<BucketWithRelations>> {
  try {
    // Validate input
    const validatedData = UpdateBucketSchema.parse(input);
    
    const { id, title, ...rest } = validatedData;
    
    // Update the bucket (map title to name if provided)
    const updateData = title !== undefined 
      ? { name: title, ...rest }
      : rest;
    
    const bucket = await prisma.bucket.update({
      where: { id },
      data: updateData,
      include: {
        lab: true,
        projects: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    // Revalidate pages
    revalidatePath('/buckets');
    revalidatePath('/stacked');
    revalidateTag('buckets');
    
    return { success: true, data: bucket as BucketWithRelations };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues.map(e => e.message).join(', ') 
      };
    }
    
    console.error('Error updating bucket:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update bucket' 
    };
  }
}

/**
 * Delete a bucket (only if empty)
 */
export async function deleteBucket(id: string): Promise<ActionResponse<{ success: boolean }>> {
  try {
    if (!id) {
      return { success: false, error: 'Bucket ID is required' };
    }
    
    // Check if bucket has projects
    const bucket = await prisma.bucket.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });
    
    if (!bucket) {
      return { success: false, error: 'Bucket not found' };
    }
    
    if (bucket._count.projects > 0) {
      return { 
        success: false, 
        error: 'Cannot delete bucket with projects. Please move or delete projects first.' 
      };
    }

    await prisma.bucket.delete({
      where: { id },
    });

    // Revalidate pages
    revalidatePath('/buckets');
    revalidatePath('/stacked');
    revalidateTag('buckets');

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Error deleting bucket:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete bucket' 
    };
  }
}

/**
 * Reorder buckets
 */
export async function reorderBuckets(
  bucketOrders: z.infer<typeof ReorderBucketsSchema>
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    // Validate input
    const validatedData = ReorderBucketsSchema.parse(bucketOrders);
    
    // Update all bucket orders in a transaction
    await prisma.$transaction(
      validatedData.map(({ id, position }) =>
        prisma.bucket.update({
          where: { id },
          data: { position },
        })
      )
    );

    // Revalidate pages
    revalidatePath('/buckets');
    revalidatePath('/stacked');
    revalidateTag('buckets');

    return { success: true, data: { success: true } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues.map(e => e.message).join(', ') 
      };
    }
    
    console.error('Error reordering buckets:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reorder buckets' 
    };
  }
}