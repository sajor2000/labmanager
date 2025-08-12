import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { auditDelete, auditUpdate } from '@/lib/audit/logger';
import { checkRateLimit, getClientIp } from '@/lib/security/middleware';

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

// DELETE /api/users/[userId] - Soft delete a user (requires admin privileges)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Apply rate limiting for DELETE operations
    const ip = getClientIp(request);
    if (!checkRateLimit(ip, true)) {
      return NextResponse.json(
        { 
          error: 'Too many delete requests. Please try again later.',
          message: 'Rate limit: 5 delete requests per minute',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Window': '60s'
          }
        }
      );
    }

    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const currentUser = authResult;
    
    const { userId } = await params;
    
    // Check if user exists and has dependencies
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            createdProjects: true,
            projectMembers: true,
            assignedTasks: true,
            comments: true,
            ideas: true,
            labs: true,
          },
        },
        labs: {
          where: { isActive: true },
          include: {
            lab: true,
          },
        },
      },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions - only admin users or self can delete
    const isAdmin = currentUser.role === 'LAB_ADMINISTRATOR' || currentUser.role === 'PRINCIPAL_INVESTIGATOR';
    const isSelf = currentUser.id === userId;
    
    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this user' },
        { status: 403 }
      );
    }

    // Check for active dependencies
    const dependencies = [];
    if (userToDelete._count.assignedTasks > 0) {
      dependencies.push(`${userToDelete._count.assignedTasks} assigned task(s)`);
    }
    if (userToDelete._count.projectMembers > 0) {
      dependencies.push(`${userToDelete._count.projectMembers} project membership(s)`);
    }
    if (userToDelete.labs.length > 0) {
      const labNames = userToDelete.labs.map(l => l.lab.name).join(', ');
      dependencies.push(`Active member of: ${labNames}`);
    }

    if (dependencies.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete user with active assignments',
          details: `Please remove or reassign: ${dependencies.join(', ')}`,
          dependencies: {
            assignedTasks: userToDelete._count.assignedTasks,
            projectMemberships: userToDelete._count.projectMembers,
            activeLabs: userToDelete.labs.length,
          }
        },
        { status: 400 }
      );
    }
    
    // Soft delete by setting isActive to false
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
      },
    });

    // Create audit log
    await auditDelete(
      currentUser.id,
      'user',
      userId,
      userToDelete.name || userToDelete.email,
      undefined, // No specific lab context for user deletion
      request,
      true // soft delete
    );

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