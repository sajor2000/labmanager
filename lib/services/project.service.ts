import { BaseService, ServiceContext } from './base.service';
import { Prisma } from '@prisma/client';

export interface CreateProjectInput {
  name: string;
  oraNumber?: string;
  bucketId?: string;
  labId?: string;
  status?: string;
  projectType?: string;
  priority?: string;
  fundingSource?: string;
  fundingDetails?: string;
  externalCollaborators?: string;
  startDate?: Date | string;
  dueDate?: Date | string;
  notes?: string;
  autoCreateTasks?: boolean;
  memberIds?: string[];
  memberRoles?: string[];
}

export interface ProjectFilters {
  status?: string;
  priority?: string;
  bucketId?: string;
  assignedToMe?: boolean;
  labId?: string;
  search?: string;
}

export class ProjectService extends BaseService {
  constructor(context: ServiceContext) {
    super(context);
  }
  
  /**
   * Create a new project with auto-generated ORA number
   */
  async createProject(data: CreateProjectInput) {
    try {
      // Generate ORA number if not provided
      const oraNumber = data.oraNumber || await this.generateORANumber();
      
      return await this.prisma.$transaction(async (tx) => {
        // Create the project
        const project = await tx.project.create({
          data: {
            name: data.name,
            oraNumber,
            bucketId: data.bucketId!,
            labId: data.labId || this.currentLabId,
            status: data.status as any || 'PLANNING',
            projectType: data.projectType || 'Unspecified',
            priority: data.priority as any || 'MEDIUM',
            fundingSource: data.fundingSource as any,
            fundingDetails: data.fundingDetails,
            externalCollaborators: data.externalCollaborators,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            notes: data.notes,
            createdById: this.userId,
            progress: 0,
            // Add initial members with roles
            members: data.memberIds ? {
              create: data.memberIds.map((userId, index) => ({
                userId,
                role: (data.memberRoles?.[index] || 'CONTRIBUTOR') as any,
                allocation: 20,
                joinedAt: new Date()
              }))
            } : {
              create: {
                userId: this.userId,
                role: 'RESPONSIBLE' as any,
                allocation: 20,
                joinedAt: new Date()
              }
            }
          },
          include: {
            lab: true,
            bucket: true,
            createdBy: true,
            members: {
              include: {
                user: true
              }
            },
            _count: {
              select: {
                tasks: true
              }
            }
          }
        });
        
        // Create default tasks if requested
        if (data.autoCreateTasks) {
          await this.createDefaultTasks(tx, project.id, data.projectType);
        }
        
        // Log activity
        await this.logActivity(tx, 'project', project.id, 'created', {
          oraNumber,
          status: data.status || 'PLANNING',
          fundingSource: data.fundingSource
        });
        
        return project;
      });
    } catch (error) {
      this.handleError(error, 'ProjectService.createProject');
    }
  }
  
  /**
   * Generate unique ORA number
   */
  async generateORANumber(): Promise<string> {
    return this.generateUniqueCode('ORA', 'study', 'oraNumber');
  }
  
  /**
   * Create default tasks for a new study
   */
  private async createDefaultTasks(tx: any, studyId: string, studyType?: string) {
    const taskTemplates = this.getTaskTemplates(studyType);
    
    for (const [index, template] of taskTemplates.entries()) {
      await tx.task.create({
        data: {
          title: template.title,
          description: template.description,
          status: 'TODO',
          priority: 'MEDIUM',
          studyId,
          createdById: this.userId,
          // Tasks are created in order
          createdAt: new Date(Date.now() + index)
        }
      });
    }
  }
  
  /**
   * Get task templates based on study type
   */
  private getTaskTemplates(studyType?: string) {
    const baseTemplate = [
      { 
        title: 'Draft study protocol', 
        description: 'Create comprehensive study protocol document'
      },
      { 
        title: 'Prepare IRB submission', 
        description: 'Compile all required IRB documentation'
      },
      { 
        title: 'Submit to IRB', 
        description: 'Submit complete package to IRB for review'
      },
      { 
        title: 'Address IRB feedback', 
        description: 'Respond to any IRB comments or requests'
      },
      { 
        title: 'Recruit participants', 
        description: 'Begin participant recruitment process'
      },
      { 
        title: 'Collect data', 
        description: 'Execute data collection protocol'
      },
      { 
        title: 'Analyze results', 
        description: 'Perform statistical analysis on collected data'
      },
      { 
        title: 'Write manuscript', 
        description: 'Draft manuscript for publication'
      },
      { 
        title: 'Submit for publication', 
        description: 'Submit manuscript to target journal'
      }
    ];
    
    // Add study-type specific tasks
    if (studyType?.toLowerCase().includes('clinical')) {
      baseTemplate.splice(4, 0, {
        title: 'Register on ClinicalTrials.gov',
        description: 'Complete clinical trial registration'
      });
    }
    
    if (studyType?.toLowerCase().includes('retrospective')) {
      // Remove recruitment task for retrospective studies
      return baseTemplate.filter(t => !t.title.includes('Recruit'));
    }
    
    return baseTemplate;
  }
  
  /**
   * Get projects with filters
   */
  async findMany(filters: ProjectFilters = {}) {
    const where: Prisma.ProjectWhereInput = {
      labId: filters.labId || this.currentLabId,
      ...(filters.status && { status: filters.status as any }),
      ...(filters.priority && { priority: filters.priority as any }),
      ...(filters.bucketId && { bucketId: filters.bucketId }),
      ...(filters.assignedToMe && {
        members: {
          some: {
            userId: this.userId
          }
        }
      }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { oraNumber: { contains: filters.search, mode: 'insensitive' } },
          { notes: { contains: filters.search, mode: 'insensitive' } }
        ]
      })
    };
    
    return this.prisma.project.findMany({
      where,
      include: {
        lab: true,
        bucket: true,
        createdBy: true,
        members: {
          include: {
            user: true
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }
  
  /**
   * Get Kanban view data
   */
  async getKanbanView(labId?: string) {
    const buckets = await this.prisma.bucket.findMany({
      where: {
        labId: labId || this.currentLabId
      },
      orderBy: { position: 'asc' },
      include: {
        projects: {
          where: {
            status: {
              notIn: ['CANCELLED', 'PUBLISHED']
            }
          },
          include: {
            createdBy: true,
            members: {
              include: {
                user: true
              }
            },
            _count: {
              select: {
                tasks: {
                  where: { status: 'COMPLETED' }
                }
              }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ]
        },
        _count: {
          select: {
            projects: true
          }
        }
      }
    });
    
    // Transform data for Kanban view
    return buckets.map(bucket => ({
      ...bucket,
      projects: bucket.projects.map(project => ({
        ...project,
        progress: this.calculateProgress(project)
      }))
    }));
  }
  
  /**
   * Calculate study progress based on tasks
   */
  private calculateProgress(study: any): number {
    const totalTasks = study._count?.tasks || 0;
    const completedTasks = study.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
    
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  }
  
  /**
   * Update project status with validation
   */
  async updateStatus(projectId: string, newStatus: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Validate status transition
    if (!this.isValidStatusTransition(project.status, newStatus)) {
      throw new Error(`Cannot transition from ${project.status} to ${newStatus}`);
    }
    
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { 
        status: newStatus as any,
        updatedAt: new Date()
      }
    });
    
    await this.logActivity(
      this.prisma,
      'project',
      projectId,
      'status_changed',
      { from: project.status, to: newStatus }
    );
    
    return updated;
  }
  
  /**
   * Validate status transitions
   */
  private isValidStatusTransition(from: string, to: string): boolean {
    const transitions: Record<string, string[]> = {
      'PLANNING': ['IRB_SUBMISSION', 'CANCELLED'],
      'IRB_SUBMISSION': ['IRB_APPROVED', 'PLANNING', 'CANCELLED'],
      'IRB_APPROVED': ['DATA_COLLECTION', 'ON_HOLD', 'CANCELLED'],
      'DATA_COLLECTION': ['ANALYSIS', 'ON_HOLD', 'CANCELLED'],
      'ANALYSIS': ['MANUSCRIPT', 'DATA_COLLECTION', 'ON_HOLD', 'CANCELLED'],
      'MANUSCRIPT': ['UNDER_REVIEW', 'ANALYSIS', 'ON_HOLD', 'CANCELLED'],
      'UNDER_REVIEW': ['PUBLISHED', 'MANUSCRIPT', 'CANCELLED'],
      'PUBLISHED': [],
      'ON_HOLD': ['PLANNING', 'DATA_COLLECTION', 'ANALYSIS', 'CANCELLED'],
      'CANCELLED': []
    };
    
    return transitions[from]?.includes(to) || false;
  }
  
  /**
   * Bulk update projects
   */
  async bulkUpdate(projectIds: string[], updates: Partial<CreateProjectInput>) {
    const results = await this.batchOperation(
      projectIds,
      async (id) => {
        return this.prisma.project.update({
          where: { id },
          data: {
            ...(updates.status && { status: updates.status as any }),
            ...(updates.priority && { priority: updates.priority as any }),
            ...(updates.bucketId && { bucketId: updates.bucketId }),
            updatedAt: new Date()
          }
        });
      }
    );
    
    await this.logActivity(
      this.prisma,
      'project',
      'bulk',
      'bulk_updated',
      { count: projectIds.length, updates }
    );
    
    return results;
  }
}