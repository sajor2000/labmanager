import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { auditDelete, auditUpdate } from '@/lib/audit/logger';

// GET /api/deadlines/[deadlineId] - Get a single deadline
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deadlineId: string }> }
) {
  try {
    const { deadlineId } = await params;
    
    if (!deadlineId) {
      return NextResponse.json(
        { error: 'Deadline ID is required' },
        { status: 400 }
      );
    }
    
    const deadline = await prisma.deadline.findUnique({
      where: { id: deadlineId },
      include: {
        lab: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            initials: true,
            avatar: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            initials: true,
            avatar: true,
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
    
    return NextResponse.json(deadline);
  } catch (error) {
    console.error('Error fetching deadline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deadline' },
      { status: 500 }
    );
  }
}

// PATCH /api/deadlines/[deadlineId] - Update a deadline
const UpdateDeadlineSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['SUBMISSION', 'REVIEW', 'MEETING', 'MILESTONE', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED']).optional(),
  dueDate: z.string().optional(),
  reminderDate: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  assignedToId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ deadlineId: string }> }
) {
  try {
    const { deadlineId } = await params;
    
    if (!deadlineId) {
      return NextResponse.json(
        { error: 'Deadline ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const validatedData = UpdateDeadlineSchema.parse(body);
    
    // Check if deadline exists
    const existingDeadline = await prisma.deadline.findUnique({
      where: { id: deadlineId },
    });
    
    if (!existingDeadline) {
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      );
    }
    
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    
    // Check if user is a member of the lab
    const labId = existingDeadline.labId || (await prisma.project.findUnique({
      where: { id: existingDeadline.projectId! },
      select: { labId: true }
    }))?.labId;
    
    if (!labId) {
      return NextResponse.json(
        { error: 'Unable to determine lab for this deadline' },
        { status: 400 }
      );
    }
    
    const labMembership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId,
        isActive: true,
      },
    });
    
    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to update deadlines' },
        { status: 403 }
      );
    }
    
    // Process dates
    const { dueDate, reminderDate, ...otherData } = validatedData;
    
    // Update the deadline
    const updatedDeadline = await prisma.deadline.update({
      where: { id: deadlineId },
      data: {
        ...otherData,
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(reminderDate !== undefined && { 
          reminderDate: reminderDate ? new Date(reminderDate) : null 
        }),
        // Update status based on due date if provided
        ...(dueDate && {
          status: new Date(dueDate) < new Date() && 
                  existingDeadline.status !== 'COMPLETED' ? 
                  'OVERDUE' : existingDeadline.status
        }),
      },
      include: {
        lab: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            initials: true,
            avatar: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            initials: true,
            avatar: true,
          },
        },
      },
    });
    
    // Create audit log
    await auditUpdate(
      user.id,
      'deadline',
      deadlineId,
      existingDeadline,
      updatedDeadline,
      labId,
      request
    );
    
    return NextResponse.json(updatedDeadline);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating deadline:', error);
    return NextResponse.json(
      { error: 'Failed to update deadline' },
      { status: 500 }
    );
  }
}

// DELETE /api/deadlines/[deadlineId] - Delete a deadline
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ deadlineId: string }> }
) {
  try {
    const { deadlineId } = await params;
    
    if (!deadlineId) {
      return NextResponse.json(
        { error: 'Deadline ID is required' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    
    // Get deadline details for authorization and audit
    const deadline = await prisma.deadline.findUnique({
      where: { id: deadlineId },
      include: {
        lab: {
          select: {
            id: true,
            name: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            labId: true,
          }
        }
      }
    });
    
    if (!deadline) {
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      );
    }
    
    // Determine lab ID (either direct or through project)
    const labId = deadline.labId || deadline.project?.labId;
    
    if (!labId) {
      return NextResponse.json(
        { error: 'Unable to determine lab for this deadline' },
        { status: 400 }
      );
    }
    
    // Check if user is a member of the lab (any lab member can delete)
    const labMembership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId,
        isActive: true
      }
    });
    
    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to delete deadlines' },
        { status: 403 }
      );
    }
    
    // Delete the deadline
    await prisma.deadline.delete({
      where: { id: deadlineId },
    });
    
    // Create audit log for deletion
    await auditDelete(
      user.id,
      'deadline',
      deadlineId,
      deadline.title,
      labId,
      request,
      false // hard delete
    );
    
    return NextResponse.json(
      { 
        message: 'Deadline deleted successfully',
        deletedDeadline: {
          id: deadline.id,
          title: deadline.title,
          dueDate: deadline.dueDate,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting deadline:', error);
    return NextResponse.json(
      { error: 'Failed to delete deadline' },
      { status: 500 }
    );
  }
}