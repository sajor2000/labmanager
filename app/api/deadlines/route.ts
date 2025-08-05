import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// Validation schema for creating a deadline
const CreateDeadlineSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  type: z.enum(['IRB_RENEWAL', 'GRANT_SUBMISSION', 'PAPER_DEADLINE', 'CONFERENCE_ABSTRACT', 'MILESTONE', 'MEETING', 'OTHER']).default('MILESTONE'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  status: z.enum(['UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED']).default('UPCOMING'),
  projectId: z.string().optional(),
  assigneeIds: z.array(z.string()).default([]),
  reminderDays: z.array(z.number()).default([7, 3, 1]), // Days before due date to send reminders
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  recurringEndDate: z.string().optional(),
  createdById: z.string().min(1),
  labId: z.string().optional(),
});

// Validation schema for updating a deadline
const UpdateDeadlineSchema = CreateDeadlineSchema.partial().extend({
  id: z.string().min(1),
});

// GET /api/deadlines - Get all deadlines with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const labId = searchParams.get('labId');
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const upcoming = searchParams.get('upcoming') === 'true';
    
    // Build where clause
    const where: Prisma.DeadlineWhereInput = {};
    
    if (labId) where.labId = labId;
    if (projectId) where.projectId = projectId;
    if (type) where.type = type as Prisma.EnumDeadlineTypeFilter;
    if (status) where.status = status as Prisma.EnumDeadlineStatusFilter;
    
    if (assigneeId) {
      where.assignees = {
        some: {
          userId: assigneeId,
        },
      };
    }
    
    // Date range filtering
    if (startDate || endDate || upcoming) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
      if (upcoming) {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);
        where.dueDate.gte = today;
        where.dueDate.lte = nextMonth;
      }
    }

    const deadlines = await prisma.deadline.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            initials: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        lab: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                initials: true,
                avatar: true,
              },
            },
          },
        },
        reminders: {
          orderBy: {
            scheduledDate: 'asc',
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Calculate additional metrics
    const deadlinesWithMetrics = deadlines.map(deadline => {
      const dueDate = new Date(deadline.dueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Auto-update status based on due date
      let currentStatus = deadline.status;
      if (currentStatus === 'UPCOMING' && daysUntilDue < 0) {
        currentStatus = 'OVERDUE';
      }
      
      return {
        ...deadline,
        daysUntilDue,
        isOverdue: daysUntilDue < 0 && currentStatus !== 'COMPLETED' && currentStatus !== 'CANCELLED',
        isUrgent: daysUntilDue <= 3 && daysUntilDue >= 0,
        currentStatus,
      };
    });

    return NextResponse.json(deadlinesWithMetrics);
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deadlines' },
      { status: 500 }
    );
  }
}

// POST /api/deadlines - Create a new deadline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateDeadlineSchema.parse(body);
    
    // Extract assigneeIds for separate processing
    const { assigneeIds, dueDate, reminderDays, ...deadlineData } = validatedData;
    
    // Create the deadline
    const deadline = await prisma.deadline.create({
      data: {
        ...deadlineData,
        dueDate: new Date(dueDate),
        reminderDays,
        assignees: assigneeIds.length > 0 ? {
          create: assigneeIds.map(userId => ({
            userId,
          })),
        } : undefined,
        // Create reminder entries based on reminderDays
        reminders: {
          create: reminderDays.map(days => {
            const reminderDate = new Date(dueDate);
            reminderDate.setDate(reminderDate.getDate() - days);
            return {
              scheduledDate: reminderDate,
              daysBefore: days,
              status: 'PENDING',
            };
          }),
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            initials: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        lab: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                initials: true,
                avatar: true,
              },
            },
          },
        },
        reminders: true,
      },
    });

    return NextResponse.json(deadline, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating deadline:', error);
    return NextResponse.json(
      { error: 'Failed to create deadline' },
      { status: 500 }
    );
  }
}

// PUT /api/deadlines - Update a deadline
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = UpdateDeadlineSchema.parse(body);
    const { id, assigneeIds, dueDate, reminderDays, ...updateData } = validatedData;
    
    // Prepare update data
    const updateFields: Record<string, any> = { ...updateData };
    if (dueDate) updateFields.dueDate = new Date(dueDate);
    if (reminderDays) updateFields.reminderDays = reminderDays;
    
    // Update the deadline
    const deadline = await prisma.deadline.update({
      where: { id },
      data: {
        ...updateFields,
        // If assigneeIds is provided, update the assignees
        ...(assigneeIds !== undefined && {
          assignees: {
            deleteMany: {}, // Remove all existing assignees
            create: assigneeIds.map((userId: string) => ({
              userId,
            })),
          },
        }),
        // If reminderDays is provided, update reminders
        ...(reminderDays && dueDate && {
          reminders: {
            deleteMany: {}, // Remove existing reminders
            create: reminderDays.map((days: number) => {
              const reminderDate = new Date(dueDate);
              reminderDate.setDate(reminderDate.getDate() - days);
              return {
                scheduledDate: reminderDate,
                daysBefore: days,
                status: 'PENDING',
              };
            }),
          },
        }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            initials: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                initials: true,
                avatar: true,
              },
            },
          },
        },
        reminders: true,
      },
    });

    return NextResponse.json(deadline);
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

// DELETE /api/deadlines - Delete a deadline
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Deadline ID is required' },
        { status: 400 }
      );
    }

    await prisma.deadline.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deadline:', error);
    return NextResponse.json(
      { error: 'Failed to delete deadline' },
      { status: 500 }
    );
  }
}