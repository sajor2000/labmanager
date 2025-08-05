import { EnhancedBaseService, ServiceContext } from './enhanced-base.service';
import { Prisma } from '@prisma/client';

export interface CreateBucketInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  labId?: string;
}

export interface UpdateBucketInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface BucketFilters {
  labId?: string;
  isActive?: boolean;
  search?: string;
}

export class EnhancedBucketService extends EnhancedBaseService {
  constructor(context: ServiceContext) {
    super(context);
  }
  
  /**
   * CREATE - New bucket with position-based ordering
   */
  async create(data: CreateBucketInput) {
    try {
      // Check permissions
      const canCreate = await this.checkPermission('create', 'bucket');
      if (!canCreate) {
        throw new Error('Insufficient permissions to create bucket');
      }
      
      // Get the next position
      const lastBucket = await this.prisma.bucket.findFirst({
        where: { 
          labId: data.labId || this.currentLabId,
          isActive: true
        },
        orderBy: { position: 'desc' }
      });
      
      const position = (lastBucket?.position ?? -1) + 1;
      
      return await this.prisma.$transaction(async (tx) => {
        const bucket = await tx.bucket.create({
          data: {
            name: data.name,
            description: data.description,
            color: data.color || '#8B5CF6', // Default purple theme
            icon: data.icon || 'folder',
            labId: data.labId || this.currentLabId,
            position
          },
          include: this.getDefaultIncludes('bucket')
        });
        
        // Log activity
        await this.logActivity(tx, 'bucket', bucket.id, 'created', {
          bucketName: bucket.name,
          position,
          color: bucket.color
        });
        
        return bucket;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedBucketService.create');
    }
  }
  
  /**
   * READ - Get all buckets with their projects for kanban view
   */
  async getBucketsWithProjects(labId?: string) {
    try {
      const targetLabId = labId || this.currentLabId;
      
      return this.prisma.bucket.findMany({
        where: { 
          labId: targetLabId,
          isActive: true 
        },
        include: {
          projects: {
            where: { isActive: true },
            include: {
              members: {
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
              _count: {
                select: {
                  tasks: {
                    where: { isActive: true }
                  },
                  members: {
                    where: { isActive: true }
                  }
                }
              },
              tasks: {
                where: { 
                  isActive: true,
                  parentTaskId: null // Only root tasks for progress calculation
                },
                select: {
                  id: true,
                  status: true
                }
              }
            },
            orderBy: { position: 'asc' }
          },
          _count: {
            select: {
              projects: {
                where: { isActive: true }
              }
            }
          }
        },
        orderBy: { position: 'asc' }
      });
    } catch (error) {
      this.handleError(error, 'EnhancedBucketService.getBucketsWithProjects');
    }
  }
  
  /**
   * READ - Get buckets with filtering
   */
  async findMany(filters: BucketFilters = {}) {
    try {
      const where: Prisma.BucketWhereInput = {
        labId: filters.labId || this.currentLabId,
        isActive: filters.isActive ?? true,
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      };
      
      return this.prisma.bucket.findMany({
        where,
        include: this.getDefaultIncludes('bucket'),
        orderBy: { position: 'asc' }
      });
    } catch (error) {
      this.handleError(error, 'EnhancedBucketService.findMany');
    }
  }
  
  /**
   * UPDATE - Update bucket details
   */
  async update(bucketId: string, data: UpdateBucketInput) {
    try {
      // Check permissions
      const canUpdate = await this.checkPermission('update', 'bucket', bucketId);
      if (!canUpdate) {
        throw new Error('Insufficient permissions to update bucket');
      }
      
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.bucket.update({
          where: { id: bucketId },
          data: {
            ...data,
            updatedAt: new Date()
          },
          include: this.getDefaultIncludes('bucket')
        });
        
        // Log activity
        await this.logActivity(tx, 'bucket', bucketId, 'updated', data);
        
        return updated;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedBucketService.update');
    }
  }
  
  /**
   * UPDATE - Reorder buckets with position-based system
   */
  async reorderBuckets(labId: string, bucketOrder: string[]) {
    try {
      // Check permissions
      const canUpdate = await this.checkPermission('update', 'bucket');
      if (!canUpdate) {
        throw new Error('Insufficient permissions to reorder buckets');
      }
      
      return await this.prisma.$transaction(async (tx) => {
        // Update positions
        const updates = bucketOrder.map((bucketId, index) => 
          tx.bucket.update({
            where: { id: bucketId },
            data: { position: index }
          })
        );
        
        const results = await Promise.all(updates);
        
        // Log activity
        await this.logActivity(tx, 'bucket', 'bulk', 'reordered', {
          labId,
          newOrder: bucketOrder,
          count: bucketOrder.length
        });
        
        return results;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedBucketService.reorderBuckets');
    }
  }
  
  /**
   * DELETE - Soft delete bucket (must be empty)
   */
  async delete(bucketId: string) {
    try {
      // Check permissions
      const canDelete = await this.checkPermission('delete', 'bucket', bucketId);
      if (!canDelete) {
        throw new Error('Insufficient permissions to delete bucket');
      }
      
      return await this.prisma.$transaction(async (tx) => {
        // Check if bucket has active projects
        const projectCount = await tx.project.count({
          where: { 
            bucketId,
            isActive: true 
          }
        });
        
        if (projectCount > 0) {
          throw new Error(`Cannot delete bucket with ${projectCount} active projects. Move or archive projects first.`);
        }
        
        // Soft delete the bucket
        const deleted = await tx.bucket.update({
          where: { id: bucketId },
          data: { isActive: false }
        });
        
        // Log activity
        await this.logActivity(tx, 'bucket', bucketId, 'deleted', {
          bucketName: deleted.name
        });
        
        return { success: true, message: 'Bucket successfully deleted' };
      });
    } catch (error) {
      this.handleError(error, 'EnhancedBucketService.delete');
    }
  }
  
  /**
   * UTILITY - Get bucket statistics
   */
  async getBucketStats(bucketId: string) {
    try {
      const bucket = await this.prisma.bucket.findUnique({
        where: { id: bucketId },
        include: {
          projects: {
            where: { isActive: true },
            include: {
              tasks: {
                where: { isActive: true },
                select: {
                  status: true
                }
              },
              members: {
                where: { isActive: true }
              }
            }
          }
        }
      });
      
      if (!bucket) {
        throw new Error('Bucket not found');
      }
      
      const totalProjects = bucket.projects.length;
      const totalTasks = bucket.projects.reduce((sum, project) => sum + project.tasks.length, 0);
      const completedTasks = bucket.projects.reduce((sum, project) => 
        sum + project.tasks.filter(task => task.status === 'COMPLETED').length, 0
      );
      const totalMembers = new Set(
        bucket.projects.flatMap(project => project.members.map(m => m.userId))
      ).size;
      
      const projectsByStatus = bucket.projects.reduce((acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        bucket: {
          id: bucket.id,
          name: bucket.name,
          color: bucket.color
        },
        stats: {
          totalProjects,
          totalTasks,
          completedTasks,
          totalMembers,
          taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          projectsByStatus
        }
      };
    } catch (error) {
      this.handleError(error, 'EnhancedBucketService.getBucketStats');
    }
  }
  
  /**
   * UTILITY - Duplicate bucket with all projects
   */
  async duplicate(bucketId: string, newName: string) {
    try {
      // Check permissions
      const canCreate = await this.checkPermission('create', 'bucket');
      if (!canCreate) {
        throw new Error('Insufficient permissions to duplicate bucket');
      }
      
      return await this.prisma.$transaction(async (tx) => {
        // Get original bucket with projects
        const originalBucket = await tx.bucket.findUnique({
          where: { id: bucketId },
          include: {
            projects: {
              where: { isActive: true },
              include: {
                members: true,
                tasks: {
                  where: { isActive: true }
                }
              }
            }
          }
        });
        
        if (!originalBucket) {
          throw new Error('Original bucket not found');
        }
        
        // Create new bucket
        const newBucket = await this.create({
          name: newName,
          description: originalBucket.description + ' (Copy)',
          color: originalBucket.color,
          icon: originalBucket.icon,
          labId: originalBucket.labId
        });
        
        // Log activity
        await this.logActivity(tx, 'bucket', newBucket.id, 'duplicated_from', {
          originalBucketId: bucketId,
          originalBucketName: originalBucket.name,
          projectCount: originalBucket.projects.length
        });
        
        return newBucket;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedBucketService.duplicate');
    }
  }
}