import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAuth, requireLabAdmin } from '@/lib/auth-helpers';
import { auditDelete, auditCreate, auditUpdate } from '@/lib/audit/logger';
import { checkRateLimit, getClientIp } from '@/lib/security/middleware';

// Validation schema for adding a member
const AddMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  isAdmin: z.boolean().default(false),
});

// Validation schema for updating a member
const UpdateMemberSchema = z.object({
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/labs/[labId]/members - Get all lab members
export async function GET(
  request: NextRequest,
  { params }: { params: { labId: string } }
) {
  try {
    // TODO: Add auth when NextAuth is configured
    const mockUserId = 'default-user-id';

    // TODO: Add member check when auth is configured

    const members = await prisma.labMember.findMany({
      where: {
        labId: params.labId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            initials: true,
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching lab members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab members' },
      { status: 500 }
    );
  }
}

// POST /api/labs/[labId]/members - Add a new member to the lab
export async function POST(
  request: NextRequest,
  { params }: { params: { labId: string } }
) {
  try {
    // TODO: Add auth when NextAuth is configured
    const mockUserId = 'default-user-id';

    // TODO: Add admin check when auth is configured

    const body = await request.json();
    const validatedData = AddMemberSchema.parse(body);

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. They must sign up first.' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.labMember.findUnique({
      where: {
        userId_labId: {
          userId: user.id,
          labId: params.labId,
        }
      }
    });

    if (existingMember) {
      if (existingMember.isActive) {
        return NextResponse.json(
          { error: 'User is already a member of this lab' },
          { status: 400 }
        );
      } else {
        // Reactivate the member
        const reactivatedMember = await prisma.labMember.update({
          where: {
            userId_labId: {
              userId: user.id,
              labId: params.labId,
            }
          },
          data: {
            isActive: true,
            isAdmin: validatedData.isAdmin,
            joinedAt: new Date(),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                initials: true,
              }
            }
          }
        });
        return NextResponse.json(reactivatedMember);
      }
    }

    // Add the new member
    const newMember = await prisma.labMember.create({
      data: {
        userId: user.id,
        labId: params.labId,
        isAdmin: validatedData.isAdmin,
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            initials: true,
          }
        }
      }
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error adding lab member:', error);
    return NextResponse.json(
      { error: 'Failed to add lab member' },
      { status: 500 }
    );
  }
}

// PUT /api/labs/[labId]/members/[userId] - Update a lab member
export async function PUT(
  request: NextRequest,
  { params }: { params: { labId: string } }
) {
  try {
    // TODO: Add auth when NextAuth is configured
    const mockUserId = 'default-user-id';

    // TODO: Add admin check when auth is configured

    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const validatedData = UpdateMemberSchema.parse(updateData);

    // TODO: Add self-admin check when auth is configured
    if (false && validatedData.isAdmin === false) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin status' },
        { status: 400 }
      );
    }

    // Update the member
    const updatedMember = await prisma.labMember.update({
      where: {
        userId_labId: {
          userId: userId,
          labId: params.labId,
        }
      },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            initials: true,
          }
        }
      }
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating lab member:', error);
    return NextResponse.json(
      { error: 'Failed to update lab member' },
      { status: 500 }
    );
  }
}

// DELETE /api/labs/[labId]/members/[userId] - Remove a member from the lab (requires lab admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { labId: string } }
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

    // Check authentication and require lab admin
    const authResult = await requireLabAdmin(request, params.labId);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const currentUser = authResult;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the member to be removed
    const memberToRemove = await prisma.labMember.findUnique({
      where: {
        userId_labId: {
          userId: userId,
          labId: params.labId,
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found in this lab' },
        { status: 404 }
      );
    }

    if (!memberToRemove.isActive) {
      return NextResponse.json(
        { error: 'Member is already inactive' },
        { status: 400 }
      );
    }

    // Prevent removing yourself if you're the last admin
    if (userId === currentUser.id && memberToRemove.isAdmin) {
      const adminCount = await prisma.labMember.count({
        where: {
          labId: params.labId,
          isAdmin: true,
          isActive: true,
        }
      });

      if (adminCount === 1) {
        return NextResponse.json(
          { error: 'Cannot remove yourself as the last admin. Promote another member first.' },
          { status: 400 }
        );
      }
    }

    // Check if member has active assignments
    const activeAssignments = await prisma.projectMember.count({
      where: {
        userId: userId,
        project: {
          labId: params.labId,
          isActive: true,
        }
      }
    });

    const activeTasks = await prisma.taskAssignment.count({
      where: {
        userId: userId,
        task: {
          project: {
            labId: params.labId,
          },
          isActive: true,
        }
      }
    });

    if (activeAssignments > 0 || activeTasks > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot remove member with active assignments',
          details: {
            activeProjects: activeAssignments,
            activeTasks: activeTasks,
          },
          message: 'Please reassign or remove their tasks and project memberships first.'
        },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.labMember.update({
      where: {
        userId_labId: {
          userId: userId,
          labId: params.labId,
        }
      },
      data: {
        isActive: false,
      }
    });

    // Create audit log
    await auditDelete(
      currentUser.id,
      'lab_member',
      userId,
      memberToRemove.user.name || memberToRemove.user.email,
      params.labId,
      request,
      true // soft delete
    );

    return NextResponse.json({ 
      success: true,
      message: `${memberToRemove.user.name || memberToRemove.user.email} has been removed from the lab`
    });
  } catch (error) {
    console.error('Error removing lab member:', error);
    return NextResponse.json(
      { error: 'Failed to remove lab member' },
      { status: 500 }
    );
  }
}