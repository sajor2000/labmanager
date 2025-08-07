import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users - Get all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true, // Only return active users
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
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format users for the selector
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      labs: user.labs.map(membership => ({
        id: membership.lab.id,
        name: membership.lab.name,
        shortName: membership.lab.shortName,
        isAdmin: membership.isAdmin,
      })),
    }));

    // Add cache headers for better performance
    const response = NextResponse.json(formattedUsers);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      name, 
      firstName,
      lastName,
      role, 
      avatar, 
      avatarUrl,
      expertise,
      capacity,
    } = body;
    
    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Generate initials from firstName and lastName or from name
    let initials = body.initials;
    if (!initials) {
      if (firstName && lastName) {
        initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      } else {
        const nameParts = name.split(' ');
        initials = nameParts.map((part: string) => part.charAt(0)).join('').toUpperCase().slice(0, 2);
      }
    }

    // Extract first and last name from full name if not provided
    let finalFirstName = firstName || '';
    let finalLastName = lastName || '';
    if (!firstName && !lastName) {
      const nameParts = name.split(' ');
      finalFirstName = nameParts[0] || '';
      finalLastName = nameParts.slice(1).join(' ') || '';
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        firstName: finalFirstName,
        lastName: finalLastName,
        role: role || 'RESEARCH_MEMBER',
        avatar,
        avatarUrl,
        initials,
        expertise: expertise || [],
        capacity: capacity || 40,
      },
      include: {
        labs: {
          include: {
            lab: true,
          },
        },
        _count: {
          select: {
            createdProjects: true,
            projectMembers: true,
            createdTasks: true,
            assignedTasks: true,
          },
        },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle unique constraint violation
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

