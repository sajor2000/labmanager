import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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

// DELETE /api/labs/[labId]/members/[userId] - Remove a member from the lab
export async function DELETE(
  request: NextRequest,
  { params }: { params: { labId: string } }
) {
  try {
    // TODO: Add auth when NextAuth is configured
    const mockUserId = 'default-user-id';

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user is admin of this lab
    const membership = await prisma.labMember.findUnique({
      where: {
        userId_labId: {
          userId: mockUserId,
          labId: params.labId,
        }
      }
    });

    if (!membership || !membership.isAdmin) {
      // TODO: Add permission check when auth is configured
    }

    // TODO: Add last admin check when auth is configured
    if (false) {
      const adminCount = await prisma.labMember.count({
        where: {
          labId: params.labId,
          isAdmin: true,
          isActive: true,
        }
      });

      if (adminCount === 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin from the lab' },
          { status: 400 }
        );
      }
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing lab member:', error);
    return NextResponse.json(
      { error: 'Failed to remove lab member' },
      { status: 500 }
    );
  }
}