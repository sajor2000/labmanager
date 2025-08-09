import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// Cache configuration
const CACHE_TTL = 180; // 3 minutes cache for team data (changes frequently)

// Optimized select for team members with metrics
const teamMemberSelectOptimized = {
  id: true,
  email: true,
  name: true,
  firstName: true,
  lastName: true,
  role: true,
  avatar: true,
  avatarUrl: true,
  initials: true,
  capacity: true,
  expertise: true,
  createdAt: true,
  updatedAt: true,
  labs: {
    select: {
      labId: true,
      isAdmin: true,
      lab: {
        select: {
          id: true,
          name: true,
          shortName: true,
        },
      },
    },
  },
  projectMembers: {
    select: {
      id: true,
      role: true,
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
      id: true,
      task: {
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },
    },
  },
};

// Validation schema for creating a team member
const CreateTeamMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum([
    'PRINCIPAL_INVESTIGATOR',
    'CO_PRINCIPAL_INVESTIGATOR',
    'DATA_SCIENTIST',
    'DATA_ANALYST',
    'CLINICAL_RESEARCH_COORDINATOR',
    'REGULATORY_COORDINATOR',
    'STAFF_COORDINATOR',
    'FELLOW',
    'MEDICAL_STUDENT',
    'VOLUNTEER_RESEARCH_ASSISTANT',
    'RESEARCH_ASSISTANT',
    'LAB_ADMINISTRATOR',
    'EXTERNAL_COLLABORATOR'
  ]),
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
    const labIds = searchParams.getAll('labId[]'); // Support multiple lab IDs
    const userLabs = searchParams.get('userLabs'); // Get all user's labs
    const allLabs = searchParams.get('allLabs'); // Show all labs mode
    
    // Build where clause
    const where: Prisma.UserWhereInput = { isActive: true };
    
    if (labIds.length > 0) {
      // Multiple specific lab IDs
      where.labs = {
        some: {
          labId: { in: labIds },
          isActive: true,
        },
      };
    } else if (labId) {
      // Single lab ID
      where.labs = {
        some: {
          labId: labId,
          isActive: true,
        },
      };
    } else if (userLabs) {
      // Get all labs for a specific user
      const userLabMemberships = await prisma.labMember.findMany({
        where: { 
          userId: userLabs,
          isActive: true 
        },
        select: { labId: true }
      });
      if (userLabMemberships.length > 0) {
        where.labs = {
          some: {
            labId: { in: userLabMemberships.map(m => m.labId) },
            isActive: true,
          },
        };
      }
    } else if (allLabs === 'true') {
      // Show all labs - only filter by active users
      // where clause already has isActive: true
    } else {
      // If no filter provided, return empty array
      return NextResponse.json([]);
    }

    // Use optimized select to reduce data transfer and improve performance
    const users = await prisma.user.findMany({
      where,
      select: teamMemberSelectOptimized,
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
        labs: user.labs.map(membership => ({
          id: membership.lab.id,
          name: membership.lab.name,
          shortName: (membership.lab as any).shortName || membership.lab.name.split(' ').map(w => w[0]).join(''),
          isAdmin: membership.isAdmin,
        })),
        hasMultipleLabs: user.labs.length > 1,
      };
    });

    // Set cache headers for performance
    const response = NextResponse.json(membersWithStats);
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=300`);
    response.headers.set('CDN-Cache-Control', `public, s-maxage=${CACHE_TTL}`);
    return response;
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