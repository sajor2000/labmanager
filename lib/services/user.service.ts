import { BaseService, ServiceContext } from './base.service';
import { Prisma } from '@prisma/client';

export interface CreateTeamMemberInput {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  labId?: string;
  expertise?: string[];
  capacity?: number;
}

export interface UpdateTeamMemberInput {
  firstName?: string;
  lastName?: string;
  role?: string;
  expertise?: string[];
  capacity?: number;
  isActive?: boolean;
}

export class UserService extends BaseService {
  constructor(context: ServiceContext) {
    super(context);
  }
  
  /**
   * Create a new team member with auto-generated initials and avatar color
   */
  async createTeamMember(data: CreateTeamMemberInput) {
    try {
      // Generate initials from name
      const initials = this.generateInitials(data.firstName, data.lastName);
      
      // Generate random avatar color from palette
      const avatarColor = this.generateAvatarColor();
      
      // Create full name for display
      const fullName = `${data.firstName} ${data.lastName}`;
      
      return await this.prisma.$transaction(async (tx) => {
        // Check if user already exists
        const existingUser = await tx.user.findUnique({
          where: { email: data.email }
        });
        
        if (existingUser) {
          // If user exists, just add them to the lab
          await tx.labMember.create({
            data: {
              userId: existingUser.id,
              labId: data.labId || this.currentLabId,
              isAdmin: false
            }
          });
          
          return existingUser;
        }
        
        // Create new user
        const user = await tx.user.create({
          data: {
            email: data.email,
            name: fullName,
            initials,
            avatar: avatarColor,
            role: data.role as any || 'RESEARCH_MEMBER',
            labs: {
              create: {
                labId: data.labId || this.currentLabId,
                isAdmin: false
              }
            }
          },
          include: {
            labs: {
              include: {
                lab: true
              }
            }
          }
        });
        
        // Log activity
        await this.logActivity(tx, 'user', user.id, 'created', {
          addedToLab: data.labId || this.currentLabId,
          role: data.role
        });
        
        return user;
      });
    } catch (error) {
      this.handleError(error, 'UserService.createTeamMember');
    }
  }
  
  /**
   * Generate initials from first and last name
   */
  private generateInitials(firstName: string, lastName: string): string {
    const first = firstName.trim().charAt(0).toUpperCase();
    const last = lastName.trim().charAt(0).toUpperCase();
    return `${first}${last}`;
  }
  
  /**
   * Generate random avatar color from predefined palette
   */
  private generateAvatarColor(): string {
    const avatarColors = [
      '#8B5CF6', // Purple (default)
      '#EC4899', // Pink
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#3B82F6', // Blue
      '#06B6D4', // Cyan
      '#A855F7', // Violet
      '#14B8A6', // Teal
      '#F97316'  // Orange
    ];
    
    return avatarColors[Math.floor(Math.random() * avatarColors.length)];
  }
  
  /**
   * Get all team members for a lab
   */
  async getLabMembers(labId?: string) {
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
        labs: {
          where: {
            labId: targetLabId
          }
        },
        projectMembers: {
          where: {
            project: {
              labId: targetLabId,
              status: {
                notIn: ['CANCELLED', 'PUBLISHED']
              }
            }
          },
          select: {
            projectId: true
          }
        },
        assignedTasks: {
          where: {
            task: {
              status: {
                notIn: ['COMPLETED']
              },
              project: {
                labId: targetLabId
              }
            }
          },
          select: {
            taskId: true
          }
        },
        _count: {
          select: {
            createdProjects: true,
            createdTasks: true
          }
        }
      }
    });
    
    return members.map(member => ({
      id: member.id,
      email: member.email,
      name: member.name,
      initials: member.initials,
      avatarColor: member.avatar || '#8B5CF6',
      role: member.role,
      isAdmin: member.labs[0]?.isAdmin || false,
      activeStudies: member.projectMembers.length,
      activeTasks: member.assignedTasks.length,
      createdStudies: member._count.createdProjects,
      createdTasks: member._count.createdTasks,
      workload: this.calculateWorkload(
        member.projectMembers.length,
        member.assignedTasks.length
      )
    }));
  }
  
  /**
   * Calculate workload percentage
   */
  private calculateWorkload(studies: number, tasks: number): number {
    // Each study represents 20% workload, each task 5%
    const workload = (studies * 20) + (tasks * 5);
    return Math.min(workload, 100); // Cap at 100%
  }
  
  /**
   * Update team member information
   */
  async updateTeamMember(userId: string, data: UpdateTeamMemberInput) {
    try {
      const updateData: any = {};
      
      if (data.firstName && data.lastName) {
        updateData.name = `${data.firstName} ${data.lastName}`;
        updateData.initials = this.generateInitials(data.firstName, data.lastName);
      }
      
      if (data.role) {
        updateData.role = data.role;
      }
      
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          labs: {
            include: {
              lab: true
            }
          }
        }
      });
      
      await this.logActivity(
        this.prisma,
        'user',
        userId,
        'updated',
        data
      );
      
      return updated;
    } catch (error) {
      this.handleError(error, 'UserService.updateTeamMember');
    }
  }
  
  /**
   * Remove team member from lab
   */
  async removeFromLab(userId: string, labId?: string) {
    const targetLabId = labId || this.currentLabId;
    
    try {
      // Check if user has active assignments
      const activeAssignments = await this.prisma.projectMember.count({
        where: {
          userId,
          project: {
            labId: targetLabId,
            status: {
              notIn: ['CANCELLED', 'PUBLISHED']
            }
          }
        }
      });
      
      if (activeAssignments > 0) {
        throw new Error('Cannot remove team member with active study assignments');
      }
      
      await this.prisma.labMember.delete({
        where: {
          userId_labId: {
            userId,
            labId: targetLabId
          }
        }
      });
      
      await this.logActivity(
        this.prisma,
        'user',
        userId,
        'removed_from_lab',
        { labId: targetLabId }
      );
      
      return { success: true };
    } catch (error) {
      this.handleError(error, 'UserService.removeFromLab');
    }
  }
  
  /**
   * Get user's capacity and allocation
   */
  async getUserCapacity(userId: string, labId?: string) {
    const targetLabId = labId || this.currentLabId;
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
            project: {
              select: {
                id: true,
                name: true,
                status: true,
                priority: true
              }
            }
          }
        },
        assignedTasks: {
          where: {
            task: {
              status: {
                in: ['TODO', 'IN_PROGRESS']
              },
              project: {
                labId: targetLabId
              }
            }
          },
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Calculate allocation
    const totalCapacity = 40; // 40 hours per week default
    const studyHours = user.projectMembers.length * 10; // 10 hours per study
    const taskHours = user.assignedTasks.length * 2; // 2 hours per task
    const allocatedHours = studyHours + taskHours;
    const availableHours = Math.max(0, totalCapacity - allocatedHours);
    
    return {
      user: {
        id: user.id,
        name: user.name,
        initials: user.initials,
        role: user.role
      },
      capacity: {
        total: totalCapacity,
        allocated: allocatedHours,
        available: availableHours,
        utilizationPercentage: Math.min(100, Math.round((allocatedHours / totalCapacity) * 100))
      },
      assignments: {
        studies: user.projectMembers.map(a => a.project),
        tasks: user.assignedTasks.map(a => a.task)
      }
    };
  }
  
  /**
   * Bulk invite team members
   */
  async bulkInviteMembers(members: CreateTeamMemberInput[]) {
    const results = await this.batchOperation(
      members,
      async (member) => {
        try {
          return await this.createTeamMember(member);
        } catch (error) {
          return {
            error: true,
            email: member.email,
            message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      5 // Process 5 at a time
    );
    
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);
    
    await this.logActivity(
      this.prisma,
      'user',
      'bulk',
      'bulk_invited',
      {
        total: members.length,
        successful: successful.length,
        failed: failed.length
      }
    );
    
    return {
      successful,
      failed
    };
  }
}