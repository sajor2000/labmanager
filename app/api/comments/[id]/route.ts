import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { auditDelete, auditUpdate } from '@/lib/audit/logger';

// GET /api/comments/[id] - Get a single comment with replies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comment = await prisma.comment.findUnique({
      where: {
        id: id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      where: { id: id },
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
        where: { id: id },
        data: {
          content,
          editedAt: new Date(),
        },
      });

      // Remove old mentions
      await tx.mention.deleteMany({
        where: { commentId: id },
      });

      // Create new mentions
      if (mentionedUsers.length > 0) {
        await tx.mention.createMany({
          data: mentionedUsers.map((user) => ({
            commentId: id,
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
        where: { id: id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if comment exists and get details
    const existingComment = await prisma.comment.findUnique({
      where: { id: id },
      select: { 
        authorId: true, 
        isDeleted: true,
        content: true,
        commentableType: true,
        commentableId: true,
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

    // Check if user can delete this comment (author only for comments)
    if (existingComment.authorId !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Soft delete the comment
    const deletedComment = await prisma.comment.update({
      where: { id: id },
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
    
    // Create audit log
    await auditDelete(
      user.id,
      'comment',
      id,
      existingComment.content?.substring(0, 50), // First 50 chars as name
      undefined, // Comments don't have a direct lab association
      request,
      true // isSoftDelete
    );

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