import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users/[userId] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[userId] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    
    // Extract fields that can be updated
    const {
      email,
      name,
      firstName,
      lastName,
      role,
      expertise,
      avatarUrl,
      isActive,
    } = body;

    // Generate initials from firstName and lastName if provided
    let initials = body.initials;
    if (firstName && lastName) {
      initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(email && { email }),
        ...(name && { name }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(role && { role }),
        ...(expertise && { expertise }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(initials && { initials }),
        ...(isActive !== undefined && { isActive }),
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle unique constraint violation
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[userId] - Partially update a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // PATCH uses the same logic as PUT but is more semantic for partial updates
  return PUT(request, { params });
}

// DELETE /api/users/[userId] - Soft delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Soft delete by setting isActive to false
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully',
      user: deletedUser,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}