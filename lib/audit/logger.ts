import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { AuditAction } from '@prisma/client';

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  changes?: Record<string, any>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  };
  labId?: string;
}

/**
 * Extract metadata from request
 */
function extractMetadata(request: NextRequest) {
  const headers = request.headers;
  
  return {
    ipAddress: headers.get('x-forwarded-for') || 
               headers.get('x-real-ip') || 
               'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  entry: AuditLogEntry,
  request?: NextRequest
) {
  try {
    const metadata = request ? {
      ...extractMetadata(request),
      ...entry.metadata,
    } : entry.metadata;

    const auditLog = await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityName: entry.entityName,
        changes: entry.changes || undefined,
        metadata: metadata || undefined,
        labId: entry.labId,
      },
    });

    return auditLog;
  } catch (error) {
    // Log to console but don't fail the main operation
    console.error('Failed to create audit log:', error);
    return null;
  }
}

/**
 * Audit a DELETE operation
 */
export async function auditDelete(
  userId: string,
  entityType: string,
  entityId: string,
  entityName?: string,
  labId?: string,
  request?: NextRequest,
  isSoftDelete: boolean = false
) {
  return createAuditLog({
    userId,
    action: isSoftDelete ? 'SOFT_DELETE' : 'DELETE',
    entityType,
    entityId,
    entityName,
    labId,
  }, request);
}

/**
 * Audit a CREATE operation
 */
export async function auditCreate(
  userId: string,
  entityType: string,
  entityId: string,
  entityName?: string,
  labId?: string,
  request?: NextRequest
) {
  return createAuditLog({
    userId,
    action: 'CREATE',
    entityType,
    entityId,
    entityName,
    labId,
  }, request);
}

/**
 * Audit an UPDATE operation
 */
export async function auditUpdate(
  userId: string,
  entityType: string,
  entityId: string,
  changes: Record<string, any>,
  entityName?: string,
  labId?: string,
  request?: NextRequest
) {
  return createAuditLog({
    userId,
    action: 'UPDATE',
    entityType,
    entityId,
    entityName,
    changes,
    labId,
  }, request);
}

/**
 * Get audit logs for an entity
 */
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  limit: number = 50
) {
  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
) {
  return prisma.auditLog.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get audit logs for a lab
 */
export async function getLabAuditLogs(
  labId: string,
  limit: number = 50
) {
  return prisma.auditLog.findMany({
    where: {
      labId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}