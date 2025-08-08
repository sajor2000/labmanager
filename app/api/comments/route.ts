import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CommentableType } from '@prisma/client';
import { logger } from '@/lib/utils/production-logger';

// GET /api/comments - List comments for an entity
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType') as CommentableType;
    const entityId = searchParams.get('entityId');
    const parentId = searchParams.get('parentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    // Validate entityType
    if (!Object.values(CommentableType).includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entityType' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      entityType,
      entityId,
      isDeleted: false,
    };

    // If parentId is explicitly null, get only root comments
    if (parentId === 'null') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    // Fetch comments with author and reply count
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
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
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      content,
      entityType,
      entityId,
      parentId,
      authorId,
      mentions = [],
    } = body;

    // Validate required fields
    if (!content || !entityType || !entityId || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate entityType
    if (!Object.values(CommentableType).includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entityType' },
        { status: 400 }
      );
    }

    // Parse mentions from content (@username pattern)
    const mentionMatches = content.match(/@(\w+)/g) || [];
    const mentionedUsernames = mentionMatches.map((m: string) => m.substring(1));

    // Find mentioned users
    const mentionedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: mentionedUsernames } },
          { firstName: { in: mentionedUsernames } },
          { lastName: { in: mentionedUsernames } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Create comment with mentions in a transaction
    const comment = await prisma.$transaction(async (tx) => {
      // Create the comment
      const newComment = await tx.comment.create({
        data: {
          content,
          entityType,
          entityId,
          parentId,
          authorId,
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
        },
      });

      // Create mentions
      if (mentionedUsers.length > 0) {
        await tx.mention.createMany({
          data: mentionedUsers.map((user) => ({
            commentId: newComment.id,
            userId: user.id,
          })),
        });

        // Create notifications for mentioned users
        await tx.enhancedNotification.createMany({
          data: mentionedUsers.map((user) => ({
            userId: user.id,
            type: 'COMMENT_MENTION',
            title: 'You were mentioned in a comment',
            message: `${newComment.author.name} mentioned you in a comment`,
            entityType: entityType.toLowerCase(),
            entityId,
            metadata: {
              commentId: newComment.id,
              authorId: newComment.authorId,
            },
          })),
        });
      }

      // If this is a reply, notify the parent comment author
      if (parentId) {
        const parentComment = await tx.comment.findUnique({
          where: { id: parentId },
          select: { authorId: true },
        });

        if (parentComment && parentComment.authorId !== authorId) {
          await tx.enhancedNotification.create({
            data: {
              userId: parentComment.authorId,
              type: 'COMMENT_REPLY',
              title: 'Someone replied to your comment',
              message: `${newComment.author.name} replied to your comment`,
              entityType: entityType.toLowerCase(),
              entityId,
              metadata: {
                commentId: newComment.id,
                parentCommentId: parentId,
                authorId: newComment.authorId,
              },
            },
          });
        }
      }

      // Fetch the complete comment with mentions
      return await tx.comment.findUnique({
        where: { id: newComment.id },
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
              replies: true,
            },
          },
        },
      });
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    logger.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}