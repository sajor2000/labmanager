import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireLabAdmin } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/utils/api-error-handler';
import { auditDelete } from '@/lib/audit/logger';
import { checkRateLimit, getClientIp } from '@/lib/security/middleware';

// DELETE /api/archive/[type]/[id] - Permanently delete an archived item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    // Apply stricter rate limiting for permanent deletes
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
    const user = authResult;

    const { type, id } = params;

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      );
    }

    let deleted = false;
    let itemName = '';
    let labId: string | undefined;
    let requiresAdmin = false;

    switch (type) {
      case 'task':
        const task = await prisma.task.findUnique({
          where: { id },
          include: {
            project: {
              select: {
                labId: true,
              },
            },
          },
        });

        if (!task) {
          return NextResponse.json(
            { error: 'Task not found' },
            { status: 404 }
          );
        }

        if (task.isActive) {
          return NextResponse.json(
            { error: 'Cannot permanently delete an active task. Please soft-delete it first.' },
            { status: 400 }
          );
        }

        itemName = task.title;
        labId = task.project.labId;
        requiresAdmin = true;
        break;

      case 'idea':
        const idea = await prisma.idea.findUnique({
          where: { id },
        });

        if (!idea) {
          return NextResponse.json(
            { error: 'Idea not found' },
            { status: 404 }
          );
        }

        if (idea.isActive) {
          return NextResponse.json(
            { error: 'Cannot permanently delete an active idea. Please soft-delete it first.' },
            { status: 400 }
          );
        }

        itemName = idea.title;
        // Ideas don't require lab admin
        break;

      case 'comment':
        const comment = await prisma.comment.findUnique({
          where: { id },
          include: {
            project: {
              select: {
                labId: true,
                name: true,
              },
            },
            replies: true,
          },
        });

        if (!comment) {
          return NextResponse.json(
            { error: 'Comment not found' },
            { status: 404 }
          );
        }

        if (!comment.deletedAt) {
          return NextResponse.json(
            { error: 'Cannot permanently delete an active comment. Please soft-delete it first.' },
            { status: 400 }
          );
        }

        // Check for replies
        if (comment.replies.length > 0) {
          return NextResponse.json(
            { 
              error: 'Cannot permanently delete a comment with replies',
              details: {
                replyCount: comment.replies.length,
              }
            },
            { status: 400 }
          );
        }

        itemName = `Comment on ${comment.project?.name || 'Unknown Project'}`;
        labId = comment.project?.labId;
        requiresAdmin = true;
        break;

      case 'deadline':
        const deadline = await prisma.deadline.findUnique({
          where: { id },
          include: {
            project: {
              select: {
                labId: true,
              },
            },
          },
        });

        if (!deadline) {
          return NextResponse.json(
            { error: 'Deadline not found' },
            { status: 404 }
          );
        }

        if (deadline.isActive) {
          return NextResponse.json(
            { error: 'Cannot permanently delete an active deadline. Please soft-delete it first.' },
            { status: 400 }
          );
        }

        itemName = deadline.title;
        labId = deadline.project?.labId;
        requiresAdmin = true;
        break;

      case 'team_member':
        // For team members, we don't actually delete the user
        // We just ensure their lab membership stays inactive
        const member = await prisma.labMember.findFirst({
          where: {
            userId: id,
            isActive: false,
          },
          include: {
            user: true,
            lab: true,
          },
        });

        if (!member) {
          return NextResponse.json(
            { error: 'Inactive team member not found' },
            { status: 404 }
          );
        }

        itemName = member.user.name || member.user.email;
        labId = member.labId;
        requiresAdmin = true;
        
        // For team members, we just log the permanent removal
        // The membership is already inactive
        deleted = true;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid item type' },
          { status: 400 }
        );
    }

    // Check lab admin permission if required
    if (requiresAdmin && labId) {
      const adminCheck = await requireLabAdmin(request, labId);
      if (adminCheck instanceof NextResponse) {
        return adminCheck;
      }
    }

    // Perform the actual deletion (except for team members which are handled above)
    if (!deleted) {
      switch (type) {
        case 'task':
          // Delete all task assignments first
          await prisma.taskAssignment.deleteMany({
            where: { taskId: id },
          });
          
          // Then delete the task
          await prisma.task.delete({
            where: { id },
          });
          deleted = true;
          break;

        case 'idea':
          // Delete idea votes first
          await prisma.ideaVote.deleteMany({
            where: { ideaId: id },
          });
          
          // Then delete the idea
          await prisma.idea.delete({
            where: { id },
          });
          deleted = true;
          break;

        case 'comment':
          // Comments with replies are already blocked above
          await prisma.comment.delete({
            where: { id },
          });
          deleted = true;
          break;

        case 'deadline':
          await prisma.deadline.delete({
            where: { id },
          });
          deleted = true;
          break;
      }
    }

    if (deleted) {
      // Create audit log for permanent deletion
      await auditDelete(
        user.id,
        type,
        id,
        itemName,
        labId,
        request,
        false // This is a hard delete
      );

      return NextResponse.json({
        success: true,
        message: `${itemName} has been permanently deleted`,
      });
    }

    return NextResponse.json(
      { error: 'Failed to delete item permanently' },
      { status: 500 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}