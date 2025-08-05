import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface ServiceContext {
  userId: string;
  currentLabId: string;
  userRole?: string;
}

export abstract class EnhancedBaseService {
  protected prisma: PrismaClient;
  protected userId: string;
  protected currentLabId: string;
  protected userRole?: string;
  
  constructor(context: ServiceContext) {
    this.prisma = prisma as PrismaClient;
    this.userId = context.userId;
    this.currentLabId = context.currentLabId;
    this.userRole = context.userRole;
  }
  
  /**
   * Activity logging with enhanced metadata
   */
  protected async logActivity(
    tx: any,
    entityType: string,
    entityId: string,
    action: string,
    metadata?: any
  ) {
    try {
      await tx.activityLog.create({
        data: {
          userId: this.userId,
          labId: this.currentLabId,
          entityType,
          entityId,
          action,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            userAgent: 'lab-management-system'
          }
        }
      });
    } catch (error) {
      console.error('[ActivityLog Error]', error);
    }
  }
  
  /**
   * Enhanced permission checking with role-based access
   */
  protected async checkPermission(
    action: string,
    resourceType: string,
    resourceId?: string
  ): Promise<boolean> {
    // Check lab membership
    const labMember = await this.prisma.labMember.findUnique({
      where: {
        userId_labId: {
          userId: this.userId,
          labId: this.currentLabId
        },
        isActive: true
      },
      include: {
        user: true
      }
    });
    
    if (!labMember) return false;
    
    // Admin users can do everything
    if (labMember.isAdmin) return true;
    
    // PI and Co-PI have full permissions
    if (['PRINCIPAL_INVESTIGATOR', 'CO_PRINCIPAL_INVESTIGATOR'].includes(labMember.user.role)) {
      return true;
    }
    
    // Resource-specific permissions
    switch (resourceType) {
      case 'bucket':
        return ['create', 'read', 'update'].includes(action);
      case 'project':
        if (action === 'delete') return labMember.isAdmin;
        return true;
      case 'task':
        return true; // All lab members can manage tasks
      default:
        return false;
    }
  }
  
  /**
   * Enhanced error handling with proper logging
   */
  protected handleError(error: any, context: string): never {
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.error(`[${context}] Error ${errorId}:`, {
      error: error.message,
      stack: error.stack,
      userId: this.userId,
      labId: this.currentLabId,
      timestamp: new Date().toISOString()
    });
    
    // Map Prisma errors to user-friendly messages
    if (error.code === 'P2002') {
      throw new Error('A record with this unique value already exists');
    }
    
    if (error.code === 'P2025') {
      throw new Error('Record not found or has been deleted');
    }
    
    if (error.code === 'P2003') {
      throw new Error('Cannot delete record due to related data');
    }
    
    if (error.code === 'P2014') {
      throw new Error('Invalid relationship - related record not found');
    }
    
    throw new Error(`Operation failed. Reference ID: ${errorId}`);
  }
  
  /**
   * Generate unique code with enhanced format
   */
  protected async generateUniqueCode(
    prefix: string,
    model: string,
    field: string,
    labSpecific: boolean = false
  ): Promise<string> {
    const year = new Date().getFullYear();
    const modelAny = (this.prisma as any)[model];
    
    // Build where clause
    const whereClause: any = {
      [field]: { startsWith: `${prefix}-${year}-` }
    };
    
    if (labSpecific && model !== 'lab') {
      whereClause.labId = this.currentLabId;
    }
    
    // Find the last record with this prefix
    const lastRecord = await modelAny.findFirst({
      where: whereClause,
      orderBy: { [field]: 'desc' }
    });
    
    let nextNumber = 1;
    if (lastRecord && lastRecord[field]) {
      const parts = lastRecord[field].split('-');
      if (parts.length >= 3) {
        nextNumber = parseInt(parts[2]) + 1;
      }
    }
    
    return `${prefix}-${year}-${nextNumber.toString().padStart(3, '0')}`;
  }
  
  /**
   * Enhanced batch operations with progress tracking
   */
  protected async batchOperation<T, R>(
    items: T[],
    operation: (item: T, index: number, total: number) => Promise<R>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    const total = items.length;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((item, batchIndex) => 
          operation(item, i + batchIndex, total)
        )
      );
      results.push(...batchResults);
      
      // Log progress for large operations
      if (total > 50) {
        const progress = Math.round(((i + batch.length) / total) * 100);
        console.log(`Batch operation progress: ${progress}% (${i + batch.length}/${total})`);
      }
    }
    
    return results;
  }
  
  /**
   * Position-based reordering utility
   */
  protected async updatePositions<T extends { id: string; position: number }>(
    tx: any,
    model: string,
    items: T[],
    whereClause: any = {}
  ): Promise<void> {
    const modelAny = (tx as any)[model];
    
    const updates = items.map((item, index) =>
      modelAny.update({
        where: { id: item.id },
        data: { position: index }
      })
    );
    
    await Promise.all(updates);
  }
  
  /**
   * Soft delete utility
   */
  protected async softDelete(
    tx: any,
    model: string,
    id: string,
    cascadeModels?: { model: string; field: string }[]
  ): Promise<void> {
    const modelAny = (tx as any)[model];
    
    // Soft delete the main record
    await modelAny.update({
      where: { id },
      data: { isActive: false }
    });
    
    // Cascade soft delete to related records
    if (cascadeModels) {
      for (const cascade of cascadeModels) {
        const cascadeModelAny = (tx as any)[cascade.model];
        await cascadeModelAny.updateMany({
          where: { [cascade.field]: id },
          data: { isActive: false }
        });
      }
    }
  }
  
  /**
   * Get default includes for efficient queries
   */
  protected getDefaultIncludes(entity: string): any {
    const includes: Record<string, any> = {
      bucket: {
        lab: true,
        _count: {
          select: {
            projects: {
              where: { isActive: true }
            }
          }
        }
      },
      project: {
        bucket: true,
        lab: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            initials: true,
            avatar: true
          }
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                initials: true,
                avatar: true,
                role: true
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
        }
      },
      task: {
        project: {
          select: {
            id: true,
            name: true,
            bucket: {
              select: {
                name: true,
                color: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            initials: true
          }
        },
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
      }
    };
    
    return includes[entity] || {};
  }
}