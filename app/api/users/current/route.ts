import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/get-current-user';
import type { Prisma } from '@prisma/client';

type UserWithLabs = Prisma.UserGetPayload<{
  include: {
    labs: {
      include: {
        lab: true;
      };
    };
  };
}>;

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data without sensitive information
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      initials: user.initials,
      avatar: user.avatar,
      avatarUrl: user.avatarUrl,
      labs: user.labs.map((labMember: UserWithLabs['labs'][0]) => ({
        labId: labMember.labId,
        role: labMember.isAdmin ? 'ADMIN' : 'MEMBER',
        lab: labMember.lab,
      })),
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}