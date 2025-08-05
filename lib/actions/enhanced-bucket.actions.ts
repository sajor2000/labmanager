'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { EnhancedBucketService, CreateBucketInput, UpdateBucketInput } from '@/lib/services/enhanced-bucket.service';
import { getCurrentUser } from '@/lib/utils/get-current-user';

/**
 * Enhanced Bucket Actions for Kanban-Optimized CRUD Operations
 * Integrates seamlessly with the enhanced service layer
 */

// ==========================================
// BUCKET CRUD OPERATIONS
// ==========================================

export async function createBucket(data: CreateBucketInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedBucketService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const bucket = await service.create(data);
    
    // Revalidate relevant paths
    revalidatePath('/buckets');
    revalidatePath('/stacked');
    revalidatePath('/overview');
    
    return { success: true, data: bucket };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create bucket' 
    };
  }
}

export async function updateBucket(bucketId: string, data: UpdateBucketInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedBucketService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const bucket = await service.update(bucketId, data);
    
    // Revalidate relevant paths
    revalidatePath('/buckets');
    revalidatePath('/stacked');
    revalidatePath(`/buckets/${bucketId}`);
    
    return { success: true, data: bucket };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update bucket' 
    };
  }
}

export async function deleteBucket(bucketId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedBucketService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const result = await service.delete(bucketId);
    
    // Revalidate relevant paths
    revalidatePath('/buckets');
    revalidatePath('/stacked');
    revalidatePath('/overview');
    
    return { success: true, message: result.message };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete bucket' 
    };
  }
}

// ==========================================
// KANBAN-SPECIFIC OPERATIONS
// ==========================================

export async function getBucketsWithProjects(labId?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedBucketService({
      userId: user.id,
      currentLabId: labId || user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const buckets = await service.getBucketsWithProjects(labId);
    
    return { success: true, data: buckets };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load kanban data' 
    };
  }
}

export async function reorderBuckets(labId: string, bucketOrder: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedBucketService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const result = await service.reorderBuckets(labId, bucketOrder);
    
    // Revalidate kanban views
    revalidatePath('/stacked');
    revalidatePath('/buckets');
    
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reorder buckets' 
    };
  }
}

// ==========================================
// UTILITY OPERATIONS
// ==========================================

export async function getBucketStats(bucketId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedBucketService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const stats = await service.getBucketStats(bucketId);
    
    return { success: true, data: stats };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load bucket statistics' 
    };
  }
}

export async function duplicateBucket(bucketId: string, newName: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const service = new EnhancedBucketService({
      userId: user.id,
      currentLabId: user.labs?.[0]?.lab?.id || '',
      userRole: user.role
    });

    const newBucket = await service.duplicate(bucketId, newName);
    
    // Revalidate relevant paths
    revalidatePath('/buckets');
    revalidatePath('/stacked');
    
    return { success: true, data: newBucket };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to duplicate bucket' 
    };
  }
}

// ==========================================
// FORM HANDLERS WITH REDIRECT
// ==========================================

export async function createBucketWithRedirect(
  prevState: any,
  formData: FormData
) {
  const data: CreateBucketInput = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    color: formData.get('color') as string || undefined,
    icon: formData.get('icon') as string || undefined,
    labId: formData.get('labId') as string || undefined
  };

  const result = await createBucket(data);
  
  if (result.success) {
    redirect('/stacked');
  }
  
  return result;
}

export async function updateBucketWithRedirect(
  bucketId: string,
  prevState: any,
  formData: FormData
) {
  const data: UpdateBucketInput = {
    name: formData.get('name') as string || undefined,
    description: formData.get('description') as string || undefined,
    color: formData.get('color') as string || undefined,
    icon: formData.get('icon') as string || undefined
  };

  const result = await updateBucket(bucketId, data);
  
  if (result.success) {
    redirect('/stacked');
  }
  
  return result;
}