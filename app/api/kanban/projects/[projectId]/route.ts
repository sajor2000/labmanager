import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/utils/get-current-user';

// PATCH /api/kanban/projects/[projectId] - Update project status or other fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { status, priority, bucketId, position, dueDate } = body;

    const updateData: any = {};
    
    if (status !== undefined) {
      updateData.status = status.toUpperCase();
    }
    
    if (priority !== undefined) {
      updateData.priority = priority.toUpperCase();
    }
    
    if (bucketId !== undefined) {
      updateData.bucketId = bucketId;
    }
    
    if (position !== undefined) {
      updateData.position = position;
    }
    
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
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
        }
      }
    });

    // Transform the response
    const transformedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      oraNumber: updatedProject.oraNumber,
      status: updatedProject.status,
      priority: updatedProject.priority?.toLowerCase(),
      dueDate: updatedProject.dueDate,
      bucket: updatedProject.bucket ? {
        id: updatedProject.bucket.id,
        name: updatedProject.bucket.name,
        color: updatedProject.bucket.color || '#3B82F6'
      } : null,
      assignees: updatedProject.members.map(m => m.user),
      tasks: updatedProject.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status?.toLowerCase() || 'pending',
        priority: task.priority?.toLowerCase(),
        projectId: updatedProject.id,
        assignee: task.assignees[0]?.user || null,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
      createdAt: updatedProject.createdAt,
      updatedAt: updatedProject.updatedAt,
    };

    return NextResponse.json(transformedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}