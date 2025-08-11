import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/comments/[id] - Get a single comment with replies
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comment = await prisma.comment.findUnique({
      where: {
        id: params.id,
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
        replies: {
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
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    );
  }
}

// PUT /api/comments/[id] - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, userId } = body;

    if (!content || !userId) {
      return NextResponse.json(
        { error: 'Content and userId are required' },
        { status: 400 }
      );
    }

    // Check if comment exists and user is the author
    const existingComment = await prisma.comment.findUnique({
      where: { id: params.id },
      select: { authorId: true, isDeleted: true },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (existingComment.isDeleted) {
      return NextResponse.json(
        { error: 'Cannot edit deleted comment' },
        { status: 400 }
      );
    }

    if (existingComment.authorId !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Parse new mentions
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
      },
    });

    // Update comment and mentions in transaction
    const updatedComment = await prisma.$transaction(async (tx) => {
      // Update the comment
      const comment = await tx.comment.update({
        where: { id: params.id },
        data: {
          content,
          editedAt: new Date(),
        },
      });

      // Remove old mentions
      await tx.mention.deleteMany({
        where: { commentId: params.id },
      });

      // Create new mentions
      if (mentionedUsers.length > 0) {
        await tx.mention.createMany({
          data: mentionedUsers.map((user) => ({
            commentId: params.id,
            userId: user.id,
          })),
        });

        // Create notifications for newly mentioned users
        await tx.enhancedNotification.createMany({
          data: mentionedUsers.map((user) => ({
            userId: user.id,
            type: 'COMMENT_MENTION',
            title: 'You were mentioned in an edited comment',
            message: `A comment you were mentioned in was edited`,
            entityType: comment.entityType.toLowerCase(),
            entityId: comment.entityId,
            metadata: {
              commentId: comment.id,
              authorId: comment.authorId,
            },
          })),
        });
      }

      // Return updated comment with all relations
      return await tx.comment.findUnique({
        where: { id: params.id },
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
      });
    });

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Soft delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-selected-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Check if comment exists and user is the author
    const existingComment = await prisma.comment.findUnique({
      where: { id: params.id },
      select: { 
        authorId: true, 
        isDeleted: true,
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
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (existingComment.isDeleted) {
      return NextResponse.json(
        { error: 'Comment already deleted' },
        { status: 400 }
      );
    }

    if (existingComment.authorId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Soft delete the comment
    const deletedComment = await prisma.comment.update({
      where: { id: params.id },
      data: {
        isDeleted: true,
        // If there are active replies, keep content as "[deleted]"
        // Otherwise, actually remove the content
        content: existingComment._count.replies > 0 ? '[deleted]' : '',
      },
      select: {
        id: true,
        isDeleted: true,
      },
    });

    return NextResponse.json({
      message: 'Comment deleted successfully',
      comment: deletedComment,
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}