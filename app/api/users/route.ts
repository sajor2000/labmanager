import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users - Get all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
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
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);
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
    const { email, name, role, avatar, initials } = body;
    
    if (!email || !name || !initials) {
      return NextResponse.json(
        { error: 'Email, name, and initials are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role || 'RESEARCH_MEMBER',
        avatar,
        initials,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

