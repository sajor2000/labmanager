import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Validation schema for creating a study
const CreateStudySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  oraNumber: z.string().optional(),
  status: z.enum([
    'PLANNING',
    'IRB_SUBMISSION', 
    'IRB_APPROVED',
    'DATA_COLLECTION',
    'ANALYSIS',
    'MANUSCRIPT',
    'UNDER_REVIEW',
    'PUBLISHED',
    'ON_HOLD',
    'CANCELLED'
  ]).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  bucketId: z.string().optional(),
  fundingSource: z.string().optional(),
  studyType: z.string().optional(),
  dueDate: z.string().optional(),
  externalCollaborators: z.string().optional(),
  notes: z.string().optional(),
  labId: z.string().min(1, 'Lab ID is required'),
  assigneeIds: z.array(z.string()).optional(),
});

// GET /api/studies - Get all studies
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const labId = searchParams.get('labId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const bucketId = searchParams.get('bucketId');
    const assigneeId = searchParams.get('assigneeId');

    const where: any = {};

    if (labId) where.labId = labId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (bucketId) where.bucketId = bucketId;
    if (assigneeId) {
      where.assignees = {
        some: {
          id: assigneeId
        }
      };
    }

    const studies = await prisma.project.findMany({
      where,
      include: {
        bucket: true,
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
            initials: true,
            avatar: true,
          }
        },
        tasks: {
          select: {
            id: true,
            status: true,
          }
        },
        _count: {
          select: {
            tasks: true,
            comments: true,
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json(studies);
  } catch (error) {
    console.error('Failed to fetch studies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch studies' },
      { status: 500 }
    );
  }
}

// POST /api/studies - Create a new study
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateStudySchema.parse(body);
    
    // Check if user is a member of the lab (any member can create studies)
    const labMembership = await prisma.labMember.findFirst({
      where: {
        labId: validatedData.labId,
        userId: session.user.id,
        isActive: true
      }
    });

    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to create studies' },
        { status: 403 }
      );
    }

    // Create the study
    const study = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        oraNumber: validatedData.oraNumber,
        status: validatedData.status,
        priority: validatedData.priority,
        fundingSource: validatedData.fundingSource,
        studyType: validatedData.studyType,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        externalCollaborators: validatedData.externalCollaborators,
        notes: validatedData.notes,
        labId: validatedData.labId,
        bucketId: validatedData.bucketId,
        createdById: session.user.id,
        assignees: validatedData.assigneeIds ? {
          connect: validatedData.assigneeIds.map(id => ({ id }))
        } : undefined,
      },
      include: {
        bucket: true,
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
            initials: true,
            avatar: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            tasks: true,
            comments: true,
          }
        }
      }
    });

    return NextResponse.json(study, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Failed to create study:', error);
    return NextResponse.json(
      { error: 'Failed to create study' },
      { status: 500 }
    );
  }
}