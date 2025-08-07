'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardMetrics(labId?: string) {
  try {
    // Build optimized queries with single database calls using aggregations
    const whereConditions = labId ? { labId } : {};
    const taskWhereConditions = labId ? { project: { labId } } : {};

    // Single query to get all metrics and basic data
    const [metricsResult, recentProjects, labs] = await Promise.all([
      // Combined aggregation query for better performance
      prisma.$transaction(async (tx) => {
        const [
          labsCount,
          projectStats,
          bucketStats,
          taskStats,
          teamStats,
          ideaStats
        ] = await Promise.all([
          tx.lab.count(),
          
          tx.project.aggregate({
            where: whereConditions,
            _count: {
              id: true,
            },
          }).then(async (total) => {
            const active = await tx.project.count({
              where: {
                ...whereConditions,
                status: {
                  notIn: ['CANCELLED', 'ON_HOLD', 'PUBLISHED']
                }
              }
            });
            return { total: total._count.id, active };
          }),
          
          tx.bucket.count({
            where: whereConditions
          }),
          
          tx.task.aggregate({
            where: taskWhereConditions,
            _count: {
              id: true,
            },
          }).then(async (total) => {
            const completed = await tx.task.count({
              where: {
                ...taskWhereConditions,
                status: 'COMPLETED'
              }
            });
            return { total: total._count.id, completed };
          }),
          
          // Team members count
          labId ? 
            tx.labMember.count({
              where: {
                labId,
                isActive: true
              }
            }) :
            tx.user.count({
              where: {
                isActive: true
              }
            }),
          
          // Ideas count for current month
          tx.idea.aggregate({
            where: {
              ...whereConditions,
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // First day of current month
              }
            },
            _count: {
              id: true
            }
          })
        ]);

        return {
          labsCount,
          projectStats,
          bucketStats,
          taskStats,
          teamStats,
          ideaStats
        };
      }),
      
      // Get recent projects with optimized includes
      prisma.project.findMany({
        where: whereConditions,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          bucket: {
            select: {
              id: true,
              name: true,
              color: true,
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              initials: true,
            }
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            }
          }
        }
      }),
      
      // Get lab names in single query
      prisma.lab.findMany({
        select: {
          shortName: true
        },
        take: 10, // Limit to prevent excessive data
      })
    ]);

    const labNames = labs.map(l => l.shortName).join(' & ');

    // Transform recent projects for compatibility
    const transformedProjects = recentProjects.map(p => ({
      ...p,
      title: p.name,  // Map 'name' to 'title' for component compatibility
      bucket: p.bucket ? {
        ...p.bucket,
        title: p.bucket.name  // Map bucket 'name' to 'title'
      } : undefined
    }));

    // Generate recent activities from project updates (more efficient than separate query)
    const recentActivities = recentProjects
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 8)
      .map(project => ({
        id: project.id,
        title: project.name,
        name: project.name,
        time: getRelativeTime(project.updatedAt),
        action: getActivityAction(project.status)
      }));

    return {
      success: true,
      data: {
        metrics: {
          totalLabs: metricsResult.labsCount,
          labNames,
          totalProjects: metricsResult.projectStats.total,
          activeProjects: metricsResult.projectStats.active,
          bucketsCount: metricsResult.bucketStats,
          totalTasks: metricsResult.taskStats.total,
          completedTasks: metricsResult.taskStats.completed,
          teamMembers: metricsResult.teamStats,
          ideasThisMonth: metricsResult.ideaStats._count.id
        },
        recentProjects: transformedProjects,
        recentActivities
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