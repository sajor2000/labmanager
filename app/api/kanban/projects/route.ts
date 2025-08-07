import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/utils/get-current-user';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const bucketId = searchParams.get('bucketId');
    const assigneeId = searchParams.get('assigneeId');
    const priority = searchParams.get('priority');
    const labId = searchParams.get('labId') || user.labs?.[0]?.lab?.id;

    if (!labId) {
      return NextResponse.json({ error: 'No lab selected' }, { status: 400 });
    }

    const where: any = {
      labId,
      isActive: true
    };

    if (bucketId) {
      where.bucketId = bucketId;
    }

    if (assigneeId) {
      where.members = {
        some: {
          userId: assigneeId
        }
      };
    }

    if (priority) {
      where.priority = priority.toUpperCase();
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        bucket: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              }
            }
          }
        },
        tasks: {
          include: {
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                  }
                }
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: [
        { bucketId: 'asc' },
        { position: 'asc' }
      ]
    });

    // Transform the data to match the frontend expectations
    const transformedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      oraNumber: project.oraNumber,
      status: project.status,
      priority: project.priority?.toLowerCase(),
      dueDate: project.dueDate,
      bucket: project.bucket ? {
        id: project.bucket.id,
        name: project.bucket.name,
        color: project.bucket.color || '#3B82F6'
      } : null,
      assignees: project.members.map(m => m.user),
      tasks: project.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status?.toLowerCase() || 'pending',
        priority: task.priority?.toLowerCase(),
        projectId: project.id,
        assignee: task.assignees[0]?.user || null,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
      taskCount: project._count.tasks,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return NextResponse.json(transformedProjects);
  } catch (error) {
    console.error('Error fetching kanban projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}