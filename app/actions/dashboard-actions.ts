'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardMetrics(labId?: string) {
  try {
    // Fetch all metrics in parallel
    const [
      labsCount,
      totalProjects,
      activeProjects,
      bucketsCount,
      totalTasks,
      completedTasks,
      recentProjects,
      recentActivities
    ] = await Promise.all([
      // Count total labs
      prisma.lab.count(),
      
      // Count total projects
      prisma.project.count({
        where: labId ? { labId } : undefined
      }),
      
      // Count active projects (not cancelled or on hold)
      prisma.project.count({
        where: {
          ...(labId ? { labId } : {}),
          status: {
            notIn: ['CANCELLED', 'ON_HOLD', 'PUBLISHED']
          }
        }
      }),
      
      // Count buckets
      prisma.bucket.count({
        where: labId ? { labId } : undefined
      }),
      
      // Count total tasks
      prisma.task.count({
        where: labId ? {
          project: { labId }
        } : undefined
      }),
      
      // Count completed tasks
      prisma.task.count({
        where: {
          ...(labId ? { project: { labId } } : {}),
          status: 'COMPLETED'
        }
      }),
      
      // Get recent projects
      prisma.project.findMany({
        where: labId ? { labId } : undefined,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          bucket: true,
          createdBy: true,
          _count: {
            select: {
              tasks: true
            }
          }
        }
      }),
      
      // Get recent activities (simplified - you could expand this)
      prisma.project.findMany({
        where: labId ? { labId } : undefined,
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          updatedAt: true,
          status: true
        }
      })
    ]);

    // Get lab names for display
    const labs = await prisma.lab.findMany({
      select: {
        shortName: true
      }
    });
    const labNames = labs.map(l => l.shortName).join(' & ');

    return {
      success: true,
      data: {
        metrics: {
          totalLabs: labsCount,
          labNames,
          totalProjects: totalProjects,
          activeProjects: activeProjects,
          bucketsCount,
          totalTasks,
          completedTasks
        },
        recentProjects,
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          title: activity.name,
          time: getRelativeTime(activity.updatedAt),
          action: getActivityAction(activity.status)
        }))
      }
    };
  } catch {
    return {
      success: false,
      error: 'Failed to fetch dashboard metrics'
    };
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function getActivityAction(status: string): string {
  const statusMap: Record<string, string> = {
    'PLANNING': 'started planning',
    'IRB_SUBMISSION': 'submitted to IRB',
    'IRB_APPROVED': 'received IRB approval',
    'DATA_COLLECTION': 'began data collection',
    'ANALYSIS': 'moved to analysis',
    'MANUSCRIPT': 'started manuscript',
    'UNDER_REVIEW': 'submitted for review',
    'PUBLISHED': 'was published',
    'ON_HOLD': 'was put on hold',
    'CANCELLED': 'was cancelled'
  };
  return statusMap[status] || 'was updated';
}