import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface ServiceContext {
  userId: string;
  currentLabId: string;
  userRole?: string;
}

export abstract class BaseService {
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
   * Log activity for audit trail
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
          metadata
        }
      });
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('[ActivityLog Error]', error);
    }
  }
  
  /**
   * Check if user has permission for an action
   */
  protected async checkPermission(
    action: string,
    resourceType: string,
    resourceId?: string
  ): Promise<boolean> {
    // Implement permission checking based on user role
    // For now, return true (we'll enhance this later)
    return true;
  }
  
  /**
   * Common error handler
   */
  protected handleError(error: any, context: string): never {
    console.error(`[${context}] Error:`, error);
    
    if (error.code === 'P2002') {
      throw new Error('A record with this unique value already exists');
    }
    
    if (error.code === 'P2025') {
      throw new Error('Record not found');
    }
    
    if (error.code === 'P2003') {
      throw new Error('Foreign key constraint failed');
    }
    
    throw error;
  }
  
  /**
   * Generate a unique code with prefix
   */
  protected async generateUniqueCode(
    prefix: string,
    model: string,
    field: string
  ): Promise<string> {
    const year = new Date().getFullYear();
    const modelAny = (this.prisma as any)[model];
    
    // Find the last record with this prefix
    const lastRecord = await modelAny.findFirst({
      where: {
        [field]: { startsWith: `${prefix}-${year}-` }
      },
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
   * Batch operations helper
   */
  protected async batchOperation<T>(
    items: T[],
    operation: (item: T) => Promise<any>,
    batchSize: number = 10
  ): Promise<any[]> {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => operation(item))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * Get default includes for queries
   */
  protected getDefaultIncludes(entity: string): any {
    const includes: Record<string, any> = {
      project: {
        lab: true,
        bucket: true,
        createdBy: true,
        _count: {
          select: {
            tasks: true,
            assignees: true
          }
        }
      },
      task: {
        study: true,
        createdBy: true,
        assignees: {
          include: {
            user: true
          }
        }
      },
      user: {
        labs: {
          include: {
            lab: true
          }
        }
      }
    };
    
    return includes[entity] || {};
  }
}