import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/utils/api-error-handler';
import { auditUpdate } from '@/lib/audit/logger';

// POST /api/archive/restore - Restore a soft-deleted item
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      );
    }

    let restored = false;
    let itemName = '';
    let labId: string | undefined;

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
            { error: 'Task is already active' },
            { status: 400 }
          );
        }

        await prisma.task.update({
          where: { id },
          data: {
            isActive: true,
            deletedAt: null,
            deletedById: null,
          },
        });

        itemName = task.title;
        labId = task.project.labId;
        restored = true;
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
            { error: 'Idea is already active' },
            { status: 400 }
          );
        }

        await prisma.idea.update({
          where: { id },
          data: {
            isActive: true,
          },
        });

        itemName = idea.title;
        restored = true;
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
            { error: 'Comment is not deleted' },
            { status: 400 }
          );
        }

        // Restore the comment by removing deletion markers
        await prisma.comment.update({
          where: { id },
          data: {
            content: comment.deletedContent || comment.content || '[Restored comment]',
            deletedAt: null,
            deletedContent: null,
          },
        });

        itemName = `Comment on ${comment.project?.name || 'Unknown Project'}`;
        labId = comment.project?.labId;
        restored = true;
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
            { error: 'Deadline is already active' },
            { status: 400 }
          );
        }

        await prisma.deadline.update({
          where: { id },
          data: {
            isActive: true,
          },
        });

        itemName = deadline.title;
        labId = deadline.project?.labId;
        restored = true;
        break;

      case 'team_member':
        // For team members, we need to restore their lab membership
        const userToRestore = await prisma.user.findUnique({
          where: { id },
        });

        if (!userToRestore) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Find the most recently deactivated lab membership
        const inactiveMembership = await prisma.labMember.findFirst({
          where: {
            userId: id,
            isActive: false,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          include: {
            lab: true,
          },
        });

        if (!inactiveMembership) {
          return NextResponse.json(
            { error: 'No inactive lab membership found for this user' },
            { status: 404 }
          );
        }

        // Reactivate the lab membership
        await prisma.labMember.update({
          where: {
            id: inactiveMembership.id,
          },
          data: {
            isActive: true,
          },
        });

        itemName = userToRestore.name || userToRestore.email;
        labId = inactiveMembership.labId;
        restored = true;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid item type' },
          { status: 400 }
        );
    }

    if (restored) {
      // Create audit log for restoration
      await auditUpdate(
        user.id,
        type,
        id,
        itemName,
        { action: 'restore' },
        labId,
        request
      );

      return NextResponse.json({
        success: true,
        message: `${itemName} has been restored successfully`,
      });
    }

    return NextResponse.json(
      { error: 'Failed to restore item' },
      { status: 500 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}