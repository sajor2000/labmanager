import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// Validation schema for creating a team member
const CreateTeamMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['PRINCIPAL_INVESTIGATOR', 'RESEARCH_MEMBER', 'LAB_ADMINISTRATOR', 'EXTERNAL_COLLABORATOR']),
  capacity: z.number().min(0).max(60).default(40),
  expertise: z.array(z.string()).default([]),
  labId: z.string().optional(),
});

// Validation schema for updating a team member
const UpdateTeamMemberSchema = CreateTeamMemberSchema.partial().extend({
  id: z.string().min(1),
});

// GET /api/team - Get all team members with workload stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const labId = searchParams.get('labId');
    
    // Build where clause
    const where: Prisma.UserWhereInput = {};
    if (labId) {
      where.labs = {
        some: {
          labId: labId,
        },
      };
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        labs: {
          include: {
            lab: true,
          },
        },
        projectMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        assignedTasks: {
          select: {
            task: {
              select: {
                id: true,
                status: true,
                dueDate: true,
              },
            },
          },
        },
        createdTasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate workload statistics for each user
    const membersWithStats = users.map(user => {
      const activeTasks = user.assignedTasks.filter(assignment => 
        assignment.task.status !== 'COMPLETED'
      );
      
      const completedTasks = user.assignedTasks.filter(assignment => 
        assignment.task.status === 'COMPLETED'
      );
      
      const activeProjects = user.projectMembers.filter(membership =>
        membership.project.status !== 'CANCELLED' && membership.project.status !== 'PUBLISHED' && membership.project.status !== 'ARCHIVED'
      );
      
      const upcomingDeadlines = user.assignedTasks.filter(assignment => {
        const task = assignment.task;
        if (!task.dueDate || task.status === 'COMPLETED') return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7 && daysDiff >= 0; // Due within next 7 days
      });

      // Calculate workload percentage based on active tasks and capacity
      const workloadPercentage = user.capacity > 0 
        ? Math.min(100, Math.round((activeTasks.length * 10 / user.capacity) * 100))
        : 0;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        initials: user.initials,
        capacity: user.capacity,
        expertise: user.expertise,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        taskCount: activeTasks.length,
        completedTasks: completedTasks.length,
        activeProjects: activeProjects.length,
        workload: workloadPercentage,
        upcomingDeadlines: upcomingDeadlines.length,
        labs: user.labs.map(membership => membership.lab),
      };
    });

    return NextResponse.json(membersWithStats);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/team - Create a new team member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateTeamMemberSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Generate initials
    const initials = `${validatedData.firstName.charAt(0)}${validatedData.lastName.charAt(0)}`.toUpperCase();
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        initials,
        avatar: `bg-${['blue', 'green', 'purple', 'orange', 'indigo', 'pink'][Math.floor(Math.random() * 6)]}-500`,
      },
      include: {
        labs: {
          include: {
            lab: true,
          },
        },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}

// PUT /api/team - Update a team member
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = UpdateTeamMemberSchema.parse(body);
    const { id, ...updateData } = validatedData;
    
    // Update the user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        labs: {
          include: {
            lab: true,
          },
        },
        projectMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        assignedTasks: {
          select: {
            task: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE /api/team - Delete a team member
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      );
    }

    // Check if user has any active assignments
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        assignedTasks: {
          where: {
            task: {
              status: {
                not: 'COMPLETED',
              },
            },
          },
        },
        projectMembers: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Check for active assignments
    if (user.assignedTasks.length > 0 || user.projectMembers.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete team member with active task or project assignments',
          details: {
            activeTasks: user.assignedTasks.length,
            activeProjects: user.projectMembers.length,
          },
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}