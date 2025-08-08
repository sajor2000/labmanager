import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/comments/[id]/replies - Get all replies for a comment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeNested = searchParams.get('includeNested') === 'true';

    const skip = (page - 1) * limit;

    // Check if parent comment exists
    const parentComment = await prisma.comment.findUnique({
      where: { 
        id: params.id,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!parentComment) {
      return NextResponse.json(
        { error: 'Parent comment not found' },
        { status: 404 }
      );
    }

    // Build include object based on whether we want nested replies
    const includeObject: any = {
      author: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          avatarUrl: true,
          initials: true,
        },
      },
      mentions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: {
          replies: {
            where: {
              isDeleted: false,
            },
          },
        },
      },
    };

    // Add nested replies if requested
    if (includeNested) {
      includeObject.replies = {
        where: {
          isDeleted: false,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              avatarUrl: true,
              initials: true,
            },
          },
          mentions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: {
                where: {
                  isDeleted: false,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      };
    }

    // Fetch replies
    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          parentId: params.id,
          isDeleted: false,
        },
        include: includeObject,
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: {
          parentId: params.id,
          isDeleted: false,
        },
      }),
    ]);

    return NextResponse.json({
      replies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
}