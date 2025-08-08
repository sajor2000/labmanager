import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock current user - In production, this would come from authentication
// For now, we'll use Juan Rojas as the default user since he's in both labs
const DEFAULT_USER_EMAIL = 'juan_rojas@rush.edu';

// GET /api/users/current - Get current logged-in user with their lab memberships
export async function GET(request: NextRequest) {
  try {
    // In production, get user from session/JWT
    // For now, check for a user email in headers or use default
    const userEmail = request.headers.get('x-user-email') || DEFAULT_USER_EMAIL;
    
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
      include: {
        labs: {
          where: {
            isActive: true, // Only include active lab memberships
          },
          include: {
            lab: {
              select: {
                id: true,
                name: true,
                shortName: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
        },
        _count: {
          select: {
            createdProjects: true,
            projectMembers: true,
            createdTasks: true,
            assignedTasks: true,
            createdIdeas: true,
            ideaVotes: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format the response with user's labs and roles
    const formattedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      initials: user.initials,
      avatar: user.avatar,
      avatarUrl: user.avatarUrl,
      capacity: user.capacity,
      expertise: user.expertise,
      isActive: user.isActive,
      labs: user.labs.map(membership => ({
        id: membership.lab.id,
        name: membership.lab.name,
        shortName: membership.lab.shortName,
        description: membership.lab.description,
        color: membership.lab.color,
        icon: membership.lab.icon,
        isAdmin: membership.isAdmin,
        joinedAt: membership.joinedAt,
        role: user.role, // User's global role
        memberRole: membership.isAdmin ? 'LAB_ADMIN' : 'MEMBER', // Role in this specific lab
      })),
      stats: {
        projectsCreated: user._count.createdProjects,
        projectMemberships: user._count.projectMembers,
        tasksCreated: user._count.createdTasks,
        tasksAssigned: user._count.assignedTasks,
        ideasCreated: user._count.createdIdeas,
        ideaVotes: user._count.ideaVotes,
      },
      // Convenience properties
      hasMultipleLabs: user.labs.length > 1,
      primaryLab: user.labs[0]?.lab || null,
      labIds: user.labs.map(l => l.lab.id),
    };

    // Add cache headers for performance
    const response = NextResponse.json(formattedUser);
    response.headers.set('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/current - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email') || DEFAULT_USER_EMAIL;
    const body = await request.json();
    
    // Only allow updating certain fields
    const allowedFields = ['firstName', 'lastName', 'avatarUrl', 'expertise', 'capacity'];
    const updateData: any = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    // Update name if firstName or lastName changed
    if (updateData.firstName || updateData.lastName) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { firstName: true, lastName: true },
      });
      
      if (user) {
        const firstName = updateData.firstName || user.firstName;
        const lastName = updateData.lastName || user.lastName;
        updateData.name = `${firstName} ${lastName}`.trim();
        updateData.initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: updateData,
      include: {
        labs: {
          include: {
            lab: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating current user:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}