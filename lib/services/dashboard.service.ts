import { BaseService, ServiceContext } from './base.service';

export interface DashboardStats {
  totalLabs: {
    count: number;
    names: string;
    label: string;
  };
  activeProjects: {
    active: number;
    total: number;
    label: string;
    progress: number;
  };
  projectBuckets: {
    count: number;
    label: string;
  };
  tasksProgress: {
    completed: number;
    total: number;
    label: string;
    progress: number;
  };
  recentProjects?: any[];
  recentActivities?: any[];
}

export class DashboardService extends BaseService {
  constructor(context: ServiceContext) {
    super(context);
  }
  
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(labId?: string): Promise<DashboardStats> {
    const targetLabId = labId || this.currentLabId;
    
    const [
      labs,
      projects,
      buckets,
      tasks,
      recentProjects,
      recentActivities
    ] = await Promise.all([
      this.getTotalLabs(),
      this.getStudyStats(targetLabId),
      this.getBucketCount(targetLabId),
      this.getTaskStats(targetLabId),
      this.getRecentStudies(targetLabId),
      this.getRecentActivities(targetLabId)
    ]);
    
    return {
      totalLabs: {
        count: labs.count,
        names: labs.names,
        label: 'Research laboratories'
      },
      activeProjects: {
        active: projects.active,
        total: projects.total,
        label: `${projects.active} out of ${projects.total} total`,
        progress: projects.total > 0 ? Math.round((projects.active / projects.total) * 100) : 0
      },
      projectBuckets: {
        count: buckets,
        label: 'Organized collections'
      },
      tasksProgress: {
        completed: tasks.completed,
        total: tasks.total,
        label: 'Completed tasks',
        progress: tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0
      },
      recentProjects,
      recentActivities
    };
  }
  
  /**
   * Get total labs count and names
   */
  private async getTotalLabs() {
    const labs = await this.prisma.lab.findMany({
      select: {
        name: true,
        shortName: true
      }
    });
    
    return {
      count: labs.length,
      names: labs.map(l => l.shortName).join(' & ')
    };
  }
  
  /**
   * Get study statistics
   */
  private async getStudyStats(labId: string) {
    const activeStatuses = [
      'IRB_SUBMISSION',
      'IRB_APPROVED',
      'DATA_COLLECTION',
      'ANALYSIS',
      'MANUSCRIPT',
      'UNDER_REVIEW'
    ];
    
    const [activeCount, totalCount] = await Promise.all([
      this.prisma.project.count({
        where: {
          labId,
          status: { in: activeStatuses as any }
        }
      }),
      this.prisma.project.count({
        where: { labId }
      })
    ]);
    
    return {
      active: activeCount,
      total: totalCount
    };
  }
  
  /**
   * Get bucket count for a lab
   */
  private async getBucketCount(labId: string) {
    return this.prisma.bucket.count({
      where: { labId }
    });
  }
  
  /**
   * Get task statistics
   */
  private async getTaskStats(labId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        project: { labId }
      },
      select: {
        status: true
      }
    });
    
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    
    return {
      completed,
      total: tasks.length
    };
  }
  
  /**
   * Get recent studies
   */
  private async getRecentStudies(labId: string, limit: number = 5) {
    const studies = await this.prisma.project.findMany({
      where: { labId },
      take: limit,
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
    });
    
    return studies.map(study => ({
      id: study.id,
      title: (study as any).name,
      status: study.status,
      studyType: (study as any).projectType,
      bucket: study.bucket ? {
        title: (study.bucket as any).name,
        color: study.bucket.color
      } : null,
      createdBy: study.createdBy ? {
        name: study.createdBy.name,
        initials: study.createdBy.initials
      } : null,
      _count: study._count,
      progress: this.calculateStudyProgress(study)
    }));
  }
  
  /**
   * Get recent activities
   */
  private async getRecentActivities(labId: string, limit: number = 10) {
    const studies = await this.prisma.project.findMany({
      where: { labId },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true
      }
    });
    
    return studies.map(study => ({
      id: study.id,
      title: (study as any).name,
      action: this.getActivityAction(study.status),
      time: this.getRelativeTime(study.updatedAt)
    }));
  }
  
  /**
   * Calculate study progress
   */
  private calculateStudyProgress(study: any): number {
    // If progress is explicitly set, use it
    if (study.progress !== undefined && study.progress !== null) {
      return study.progress;
    }
    
    // Otherwise calculate based on status
    const statusProgress: Record<string, number> = {
      'PLANNING': 10,
      'IRB_SUBMISSION': 20,
      'IRB_APPROVED': 30,
      'DATA_COLLECTION': 50,
      'ANALYSIS': 70,
      'MANUSCRIPT': 85,
      'UNDER_REVIEW': 95,
      'PUBLISHED': 100,
      'ON_HOLD': 0,
      'CANCELLED': 0
    };
    
    return statusProgress[study.status] || 0;
  }
  
  /**
   * Get activity action text based on status
   */
  private getActivityAction(status: string): string {
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
  
  /**
   * Get relative time string
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    
    return date.toLocaleDateString();
  }
  
  /**
   * Get team workload statistics
   */
  async getTeamWorkload(labId?: string) {
    const targetLabId = labId || this.currentLabId;
    
    const members = await this.prisma.user.findMany({
      where: {
        labs: {
          some: {
            labId: targetLabId
          }
        }
      },
      include: {
        projectMembers: {
          where: {
            project: {
              labId: targetLabId,
              status: {
                notIn: ['CANCELLED', 'PUBLISHED', 'ON_HOLD']
              }
            }
          },
          include: {
            project: true
          }
        },
        assignedTasks: {
          where: {
            task: {
              status: {
                notIn: ['COMPLETED', 'BLOCKED']
              },
              project: {
                labId: targetLabId
              }
            }
          },
          include: {
            task: true
          }
        }
      }
    });
    
    return members.map(member => ({
      id: member.id,
      name: member.name,
      initials: member.initials,
      role: member.role,
      activeStudies: member.projectMembers.length,
      activeTasks: member.assignedTasks.length,
      workloadScore: this.calculateWorkloadScore(
        member.projectMembers.length,
        member.assignedTasks.length
      )
    }));
  }
  
  /**
   * Calculate workload score for a team member
   */
  private calculateWorkloadScore(studies: number, tasks: number): number {
    // Simple scoring: each study = 10 points, each task = 2 points
    const score = (studies * 10) + (tasks * 2);
    
    // Cap at 100
    return Math.min(score, 100);
  }
  
  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(labId?: string, days: number = 30) {
    const targetLabId = labId || this.currentLabId;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const [studies, tasks] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          labId: targetLabId,
          dueDate: {
            gte: new Date(),
            lte: futureDate
          }
        },
        select: {
          id: true,
          name: true,
          dueDate: true,
          status: true,
          priority: true
        },
        orderBy: { dueDate: 'asc' }
      }),
      this.prisma.task.findMany({
        where: {
          project: {
            labId: targetLabId
          },
          dueDate: {
            gte: new Date(),
            lte: futureDate
          },
          status: {
            notIn: ['COMPLETED']
          }
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
          priority: true,
          project: {
            select: {
              name: true
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      })
    ]);
    
    // Combine and sort by date
    const deadlines = [
      ...studies.map(s => ({
        id: s.id,
        type: 'study' as const,
        title: (s as any).name,
        dueDate: s.dueDate,
        status: s.status,
        priority: s.priority,
        parentTitle: null
      })),
      ...tasks.map(t => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        dueDate: t.dueDate,
        status: t.status,
        priority: t.priority,
        parentTitle: (t.project as any).name
      }))
    ].sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
    
    return deadlines;
  }
}