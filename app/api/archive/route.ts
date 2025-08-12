import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/utils/api-error-handler';

// GET /api/archive - Get all soft-deleted items
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const labId = searchParams.get('labId');

    // Get user's labs for filtering
    const userLabs = await prisma.labMember.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: { labId: true },
    });

    const userLabIds = userLabs.map(l => l.labId);

    const items = [];

    // Fetch soft-deleted tasks
    if (!type || type === 'task') {
      const tasks = await prisma.task.findMany({
        where: {
          isActive: false,
          project: {
            labId: labId || { in: userLabIds },
          },
        },
        include: {
          project: {
            select: {
              name: true,
              labId: true,
            },
          },
          deletedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      items.push(...tasks.map(task => ({
        id: task.id,
        type: 'task' as const,
        name: task.title,
        description: task.description,
        deletedAt: task.deletedAt,
        deletedBy: task.deletedBy?.name || 'Unknown',
        labId: task.project.labId,
        projectId: task.projectId,
        metadata: {
          status: task.status,
          priority: task.priority,
          projectName: task.project.name,
        },
      })));
    }

    // Fetch soft-deleted ideas
    if (!type || type === 'idea') {
      const ideas = await prisma.idea.findMany({
        where: {
          isActive: false,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      items.push(...ideas.map(idea => ({
        id: idea.id,
        type: 'idea' as const,
        name: idea.title,
        description: idea.description,
        deletedAt: idea.updatedAt, // Using updatedAt as we don't have deletedAt
        deletedBy: 'System', // We don't track who deleted ideas yet
        labId: undefined,
        metadata: {
          stage: idea.stage,
          category: idea.category,
          createdBy: idea.user?.name,
        },
      })));
    }

    // Fetch soft-deleted comments
    if (!type || type === 'comment') {
      const comments = await prisma.comment.findMany({
        where: {
          deletedAt: { not: null },
        },
        include: {
          author: {
            select: {
              name: true,
            },
          },
          project: {
            select: {
              name: true,
              labId: true,
            },
          },
        },
      });

      items.push(...comments.map(comment => ({
        id: comment.id,
        type: 'comment' as const,
        name: `Comment on ${comment.project?.name || 'Unknown Project'}`,
        description: comment.deletedContent || comment.content?.slice(0, 100),
        deletedAt: comment.deletedAt,
        deletedBy: 'System', // We don't track who deleted comments yet
        labId: comment.project?.labId,
        projectId: comment.projectId,
        metadata: {
          authorName: comment.author?.name,
          hasReplies: comment.replyToId ? false : true,
        },
      })));
    }

    // Fetch soft-deleted deadlines
    if (!type || type === 'deadline') {
      const deadlines = await prisma.deadline.findMany({
        where: {
          isActive: false,
          project: {
            labId: labId || { in: userLabIds },
          },
        },
        include: {
          project: {
            select: {
              name: true,
              labId: true,
            },
          },
        },
      });

      items.push(...deadlines.map(deadline => ({
        id: deadline.id,
        type: 'deadline' as const,
        name: deadline.title,
        description: deadline.description,
        deletedAt: deadline.updatedAt, // Using updatedAt as we don't have deletedAt
        deletedBy: 'System', // We don't track who deleted deadlines yet
        labId: deadline.project?.labId,
        projectId: deadline.projectId,
        metadata: {
          dueDate: deadline.dueDate,
          type: deadline.type,
          projectName: deadline.project?.name,
        },
      })));
    }

    // Fetch inactive team members (soft-deleted from labs)
    if (!type || type === 'team_member') {
      const inactiveMembers = await prisma.labMember.findMany({
        where: {
          isActive: false,
          labId: labId || { in: userLabIds },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          lab: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      items.push(...inactiveMembers.map(member => ({
        id: member.user.id,
        type: 'team_member' as const,
        name: member.user.name || member.user.email,
        description: `${member.user.role} - Removed from ${member.lab.name}`,
        deletedAt: member.updatedAt,
        deletedBy: 'Lab Admin',
        labId: member.labId,
        metadata: {
          email: member.user.email,
          role: member.user.role,
          labName: member.lab.name,
        },
      })));
    }

    // Sort by deletion date (most recent first)
    items.sort((a, b) => {
      const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}