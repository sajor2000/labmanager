import { EnhancedBaseService, ServiceContext } from './enhanced-base.service';
import { Prisma } from '@prisma/client';

export interface CreateProjectInput {
  name: string;
  bucketId: string;
  parentId?: string;
  oraNumber?: string;
  projectType?: string;
  studyType?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  fundingSource?: string;
  fundingDetails?: string;
  startDate?: Date | string;
  dueDate?: Date | string;
  externalCollaborators?: string;
  notes?: string;
  protocolLink?: string;
  dataLink?: string;
  createDefaultTasks?: boolean;
  memberIds?: string[];
  memberRoles?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  bucketId?: string;
  status?: string;
  projectType?: string;
  studyType?: string;
  priority?: string;
  fundingSource?: string;
  fundingDetails?: string;
  startDate?: Date | string;
  dueDate?: Date | string;
  completedDate?: Date | string;
  externalCollaborators?: string;
  notes?: string;
  protocolLink?: string;
  dataLink?: string;
  progress?: number;
}

export interface ProjectFilters {
  bucketId?: string;
  status?: string;
  priority?: string;
  assignedToMe?: boolean;
  labId?: string;
  search?: string;
  parentId?: string;
  isActive?: boolean;
}

export class EnhancedProjectService extends EnhancedBaseService {
  constructor(context: ServiceContext) {
    super(context);
  }
  
  /**
   * CREATE - New project with auto-generated ORA number and position
   */
  async create(data: CreateProjectInput) {
    try {
      // Check permissions
      const canCreate = await this.checkPermission('create', 'project');
      if (!canCreate) {
        throw new Error('Insufficient permissions to create project');
      }
      
      // Validate bucket exists and user has access
      const bucket = await this.prisma.bucket.findFirst({
        where: {
          id: data.bucketId,
          lab: {
            members: {
              some: {
                userId: this.userId,
                isActive: true
              }
            }
          },
          isActive: true
        }
      });
      
      if (!bucket) {
        throw new Error('Bucket not found or access denied');
      }
      
      return await this.prisma.$transaction(async (tx) => {
        // Get position for new project in bucket
        const lastProject = await tx.project.findFirst({
          where: { 
            bucketId: data.bucketId,
            parentId: data.parentId || null,
            isActive: true
          },
          orderBy: { position: 'desc' }
        });
        
        const position = (lastProject?.position ?? -1) + 1;
        
        // Generate ORA number if needed
        const oraNumber = data.oraNumber || await this.generateORANumber();
        
        // Create project
        const project = await tx.project.create({
          data: {
            name: data.name,
            labId: bucket.labId,
            bucketId: data.bucketId,
            parentId: data.parentId,
            oraNumber,
            status: 'PLANNING',
            projectType: data.projectType || 'Research Study',
            studyType: data.studyType,
            priority: data.priority || 'MEDIUM',
            fundingSource: data.fundingSource as any,
            fundingDetails: data.fundingDetails,
            startDate: data.startDate ? new Date(data.startDate) : null,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            externalCollaborators: data.externalCollaborators,
            notes: data.notes,
            protocolLink: data.protocolLink,
            dataLink: data.dataLink,
            position,
            createdById: this.userId,
            // Add initial members with roles
            members: {
              create: [
                // Creator as responsible
                {
                  userId: this.userId,
                  role: 'RESPONSIBLE',
                  allocation: 40
                },
                // Additional members if specified
                ...(data.memberIds?.map((userId, index) => ({
                  userId,
                  role: (data.memberRoles?.[index] || 'CONTRIBUTOR') as any,
                  allocation: 20
                })) || [])
              ]
            }
          },
          include: this.getDefaultIncludes('project')
        });
        
        // Create default tasks based on project type
        if (data.createDefaultTasks) {
          await this.createDefaultTasks(tx, project.id, data.projectType);
        }
        
        // Log activity
        await this.logActivity(tx, 'project', project.id, 'created', {
          projectName: project.name,
          oraNumber: project.oraNumber,
          bucketId: data.bucketId,
          position,
          memberCount: (data.memberIds?.length || 0) + 1
        });
        
        return project;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedProjectService.create');
    }
  }
  
  /**
   * READ - Get project with all related data
   */
  async getProjectWithTasks(projectId: string) {
    try {
      return this.prisma.project.findUnique({
        where: { 
          id: projectId,
          isActive: true 
        },
        include: {
          bucket: {
            include: { lab: true }
          },
          parent: {
            select: {
              id: true,
              name: true
            }
          },
          children: {
            where: { isActive: true },
            orderBy: { position: 'asc' }
          },
          members: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  initials: true,
                  avatar: true,
                  role: true,
                  capacity: true
                }
              }
            },
            orderBy: [
              { role: 'asc' }, // RESPONSIBLE first, then others
              { joinedAt: 'asc' }
            ]
          },
          tasks: {
            where: { 
              isActive: true,
              parentTaskId: null // Root tasks only
            },
            include: {
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
              },
              subtasks: {
                where: { isActive: true },
                include: {
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
                },
                orderBy: { position: 'asc' }
              },
              dependencies: {
                include: {
                  dependsOnTask: {
                    select: {
                      id: true,
                      title: true,
                      status: true
                    }
                  }
                }
              }
            },
            orderBy: { position: 'asc' }
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
        }
      });
    } catch (error) {
      this.handleError(error, 'EnhancedProjectService.getProjectWithTasks');
    }
  }
  
  /**
   * READ - Get projects with filters
   */
  async findMany(filters: ProjectFilters = {}) {
    try {
      const where: Prisma.ProjectWhereInput = {
        labId: filters.labId,
        bucketId: filters.bucketId,
        parentId: filters.parentId,
        isActive: filters.isActive ?? true,
        ...(filters.status && { status: filters.status as any }),
        ...(filters.priority && { priority: filters.priority as any }),
        ...(filters.assignedToMe && {
          members: {
            some: {
              userId: this.userId,
              isActive: true
            }
          }
        }),
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { oraNumber: { contains: filters.search, mode: 'insensitive' } },
            { notes: { contains: filters.search, mode: 'insensitive' } },
            { externalCollaborators: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      };
      
      return this.prisma.project.findMany({
        where,
        include: this.getDefaultIncludes('project'),
        orderBy: [
          { position: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    } catch (error) {
      this.handleError(error, 'EnhancedProjectService.findMany');
    }
  }
  
  /**
   * UPDATE - Move project between buckets with position management
   */
  async moveProject(projectId: string, toBucketId: string, newPosition: number) {
    try {
      // Check permissions
      const canUpdate = await this.checkPermission('update', 'project', projectId);
      if (!canUpdate) {
        throw new Error('Insufficient permissions to move project');
      }
      
      return await this.prisma.$transaction(async (tx) => {
        // Get current project
        const project = await tx.project.findUnique({
          where: { id: projectId },
          include: {
            bucket: true
          }
        });
        
        if (!project || !project.isActive) {
          throw new Error('Project not found or inactive');
        }
        
        // Update positions in source bucket (close the gap)
        await tx.project.updateMany({
          where: {
            bucketId: project.bucketId,
            position: { gt: project.position },
            isActive: true
          },
          data: {
            position: { decrement: 1 }
          }
        });
        
        // Update positions in destination bucket (make space)
        await tx.project.updateMany({
          where: {
            bucketId: toBucketId,
            position: { gte: newPosition },
            isActive: true
          },
          data: {
            position: { increment: 1 }
          }
        });
        
        // Move the project
        const movedProject = await tx.project.update({
          where: { id: projectId },
          data: {
            bucketId: toBucketId,
            position: newPosition
          },
          include: this.getDefaultIncludes('project')
        });
        
        // Log activity
        await this.logActivity(tx, 'project', projectId, 'moved', {
          fromBucket: project.bucket.name,
          toBucketId,
          oldPosition: project.position,
          newPosition
        });
        
        return movedProject;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedProjectService.moveProject');
    }
  }
  
  /**
   * UPDATE - Project status with validation and workflow rules
   */
  async updateStatus(projectId: string, newStatus: string) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId }
      });
      
      if (!project || !project.isActive) {
        throw new Error('Project not found or inactive');
      }
      
      // Validate status transition
      if (!this.isValidStatusTransition(project.status, newStatus)) {
        throw new Error(`Cannot transition from ${project.status} to ${newStatus}`);
      }
      
      return await this.prisma.$transaction(async (tx) => {
        const updateData: any = { 
          status: newStatus,
          updatedAt: new Date()
        };
        
        // Set completion date if moving to published
        if (newStatus === 'PUBLISHED') {
          updateData.completedDate = new Date();
          updateData.progress = 100;
        }
        
        // Update progress based on status
        if (!updateData.progress) {
          updateData.progress = this.getStatusProgress(newStatus);
        }
        
        const updated = await tx.project.update({
          where: { id: projectId },
          data: updateData,
          include: this.getDefaultIncludes('project')
        });
        
        // Log activity
        await this.logActivity(tx, 'project', projectId, 'status_changed', {
          fromStatus: project.status,
          toStatus: newStatus,
          progress: updateData.progress
        });
        
        return updated;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedProjectService.updateStatus');
    }
  }
  
  /**
   * UPDATE - Bulk update projects
   */
  async bulkUpdate(projectIds: string[], updates: Partial<UpdateProjectInput>) {
    try {
      // Check permissions for each project
      const canUpdate = await this.checkPermission('update', 'project');
      if (!canUpdate) {
        throw new Error('Insufficient permissions to bulk update projects');
      }
      
      return await this.prisma.$transaction(async (tx) => {
        const results = await this.batchOperation(
          projectIds,
          async (projectId) => {
            return tx.project.update({
              where: { id: projectId },
              data: {
                ...updates,
                ...(updates.startDate && { startDate: new Date(updates.startDate) }),
                ...(updates.dueDate && { dueDate: new Date(updates.dueDate) }),
                ...(updates.completedDate && { completedDate: new Date(updates.completedDate) }),
                updatedAt: new Date()
              } as any
            });
          }
        );
        
        // Log bulk activity
        await this.logActivity(tx, 'project', 'bulk', 'bulk_updated', {
          projectIds,
          updates,
          count: projectIds.length
        });
        
        return results;
      });
    } catch (error) {
      this.handleError(error, 'EnhancedProjectService.bulkUpdate');
    }
  }
  
  /**
   * DELETE - Soft delete project with cascade
   */
  async delete(projectId: string) {
    try {
      // Check permissions
      const canDelete = await this.checkPermission('delete', 'project', projectId);
      if (!canDelete) {
        throw new Error('Insufficient permissions to delete project');
      }
      
      return await this.prisma.$transaction(async (tx) => {
        // Get project details for logging
        const project = await tx.project.findUnique({
          where: { id: projectId },
          include: {
            _count: {
              select: {
                tasks: { where: { isActive: true } },
                members: { where: { isActive: true } }
              }
            }
          }
        });
        
        if (!project) {
          throw new Error('Project not found');
        }
        
        // Soft delete with cascade
        await this.softDelete(tx, 'project', projectId, [
          { model: 'task', field: 'projectId' },
          { model: 'projectMember', field: 'projectId' }
        ]);
        
        // Update positions in bucket to close gap
        await tx.project.updateMany({
          where: {
            bucketId: project.bucketId,
            position: { gt: project.position },
            isActive: true
          },
          data: {
            position: { decrement: 1 }
          }
        });
        
        // Log activity
        await this.logActivity(tx, 'project', projectId, 'deleted', {
          projectName: project.name,
          oraNumber: project.oraNumber,
          taskCount: project._count.tasks,
          memberCount: project._count.members
        });
        
        return { success: true, message: 'Project and related data successfully deleted' };
      });
    } catch (error) {
      this.handleError(error, 'EnhancedProjectService.delete');
    }
  }
  
  /**
   * UTILITY - Generate unique ORA number
   */
  async generateORANumber(): Promise<string> {
    return this.generateUniqueCode('ORA', 'project', 'oraNumber', true);
  }
  
  /**
   * UTILITY - Create default tasks based on project type
   */
  private async createDefaultTasks(tx: any, projectId: string, projectType?: string) {
    const taskTemplates = this.getTaskTemplates(projectType);
    
    for (const [index, template] of taskTemplates.entries()) {
      await tx.task.create({
        data: {
          title: template.title,
          description: template.description,
          status: 'TODO',
          priority: template.priority || 'MEDIUM',
          projectId,
          position: index,
          estimatedHours: template.estimatedHours,
          createdById: this.userId
        }
      });
    }
  }
  
  /**
   * UTILITY - Get task templates based on project type
   */
  private getTaskTemplates(projectType?: string) {
    const baseTemplate = [
      { 
        title: 'Draft study protocol', 
        description: 'Create comprehensive study protocol document',
        priority: 'HIGH',
        estimatedHours: 16
      },
      { 
        title: 'Prepare IRB submission', 
        description: 'Compile all required IRB documentation',
        priority: 'HIGH',
        estimatedHours: 8
      },
      { 
        title: 'Submit to IRB', 
        description: 'Submit complete package to IRB for review',
        priority: 'CRITICAL',
        estimatedHours: 2
      },
      { 
        title: 'Address IRB feedback', 
        description: 'Respond to any IRB comments or requests',
        priority: 'HIGH',
        estimatedHours: 4
      }
    ];
    
    // Add project-type specific tasks
    switch (projectType?.toLowerCase()) {
      case 'clinical study':
      case 'rct':
        return [
          ...baseTemplate,
          {
            title: 'Register on ClinicalTrials.gov',
            description: 'Complete clinical trial registration',
            priority: 'HIGH',
            estimatedHours: 3
          },
          {
            title: 'Site initiation visit',
            description: 'Conduct site initiation procedures',
            priority: 'MEDIUM',
            estimatedHours: 8
          },
          {
            title: 'Recruit participants',
            description: 'Execute participant recruitment strategy',
            priority: 'MEDIUM',
            estimatedHours: 40
          },
          {
            title: 'Conduct intervention',
            description: 'Execute study intervention protocol',
            priority: 'HIGH',
            estimatedHours: 80
          }
        ];
        
      case 'ehr study':
        return [
          ...baseTemplate,
          {
            title: 'Define cohort criteria',
            description: 'Establish inclusion/exclusion criteria',
            priority: 'HIGH',
            estimatedHours: 6
          },
          {
            title: 'Request data pull',
            description: 'Submit data request to IT/data team',
            priority: 'MEDIUM',
            estimatedHours: 4
          },
          {
            title: 'Clean and validate data',
            description: 'Data cleaning and quality assurance',
            priority: 'HIGH',
            estimatedHours: 20
          }
        ];
        
      case 'ai/llm':
        return [
          {
            title: 'Define research question',
            description: 'Clearly articulate AI/ML research objectives',
            priority: 'CRITICAL',
            estimatedHours: 8
          },
          {
            title: 'Prepare dataset',
            description: 'Collect, clean, and prepare training/test data',
            priority: 'HIGH',
            estimatedHours: 30
          },
          {
            title: 'Develop model architecture',
            description: 'Design and implement AI model',
            priority: 'HIGH',
            estimatedHours: 40
          },
          {
            title: 'Model training and validation',
            description: 'Train model and validate performance',
            priority: 'HIGH',
            estimatedHours: 24
          },
          {
            title: 'Test deployment',
            description: 'Deploy and test model in production environment',
            priority: 'MEDIUM',
            estimatedHours: 16
          }
        ];
        
      default:
        return [
          ...baseTemplate,
          {
            title: 'Collect data',
            description: 'Execute data collection protocol',
            priority: 'MEDIUM',
            estimatedHours: 32
          },
          {
            title: 'Analyze results',
            description: 'Perform statistical analysis on collected data',
            priority: 'HIGH',
            estimatedHours: 20
          },
          {
            title: 'Write manuscript',
            description: 'Draft manuscript for publication',
            priority: 'HIGH',
            estimatedHours: 24
          },
          {
            title: 'Submit for publication',
            description: 'Submit manuscript to target journal',
            priority: 'MEDIUM',
            estimatedHours: 4
          }
        ];
    }
  }
  
  /**
   * UTILITY - Validate status transitions
   */
  private isValidStatusTransition(from: string, to: string): boolean {
    const transitions: Record<string, string[]> = {
      'PLANNING': ['IRB_SUBMISSION', 'ON_HOLD', 'CANCELLED'],
      'IRB_SUBMISSION': ['IRB_APPROVED', 'PLANNING', 'ON_HOLD', 'CANCELLED'],
      'IRB_APPROVED': ['DATA_COLLECTION', 'ON_HOLD', 'CANCELLED'],
      'DATA_COLLECTION': ['ANALYSIS', 'ON_HOLD', 'CANCELLED'],
      'ANALYSIS': ['MANUSCRIPT', 'DATA_COLLECTION', 'ON_HOLD', 'CANCELLED'],
      'MANUSCRIPT': ['UNDER_REVIEW', 'ANALYSIS', 'ON_HOLD', 'CANCELLED'],
      'UNDER_REVIEW': ['PUBLISHED', 'MANUSCRIPT', 'CANCELLED'],
      'PUBLISHED': ['ARCHIVED'],
      'ON_HOLD': ['PLANNING', 'DATA_COLLECTION', 'ANALYSIS', 'MANUSCRIPT', 'CANCELLED'],
      'CANCELLED': ['ARCHIVED'],
      'ARCHIVED': []
    };
    
    return transitions[from]?.includes(to) || false;
  }
  
  /**
   * UTILITY - Get progress percentage based on status
   */
  private getStatusProgress(status: string): number {
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
      'CANCELLED': 0,
      'ARCHIVED': 100
    };
    
    return statusProgress[status] || 0;
  }
}