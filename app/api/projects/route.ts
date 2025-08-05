import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma, ProjectStatus } from '@prisma/client';
import { handleApiError } from '@/lib/utils/api-error-handler';

// Validation schema for creating a project
const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  oraNumber: z.string().optional(),
  status: z.enum(['PLANNING', 'IRB_SUBMISSION', 'IRB_APPROVED', 'DATA_COLLECTION', 'ANALYSIS', 'MANUSCRIPT', 'UNDER_REVIEW', 'PUBLISHED', 'ON_HOLD', 'CANCELLED', 'ARCHIVED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  projectType: z.string(),
  studyType: z.string().optional(),
  bucketId: z.string(),
  labId: z.string(),
  fundingSource: z.enum(['NIH', 'NSF', 'INDUSTRY_SPONSORED', 'INTERNAL', 'FOUNDATION', 'OTHER']).optional(),
  fundingDetails: z.string().optional(),
  externalCollaborators: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  createdById: z.string(),
  memberIds: z.array(z.string()).optional(),
});

// GET /api/projects - Get all projects with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const labId = searchParams.get('labId');
    const bucketId = searchParams.get('bucketId');
    const status = searchParams.get('status');
    
    const where: Prisma.ProjectWhereInput = {};
    if (labId) where.labId = labId;
    if (bucketId) where.bucketId = bucketId;
    if (status) where.status = status as ProjectStatus;

    const projects = await prisma.project.findMany({
      where,
      include: {
        lab: true,
        bucket: true,
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateProjectSchema.parse(body);
    
    // Extract memberIds for separate processing
    const { memberIds, dueDate, ...projectData } = validatedData;
    
    // Create the project with members
    const project = await prisma.project.create({
      data: {
        ...projectData,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        members: memberIds ? {
          create: memberIds.map((userId: string) => ({
            userId,
            role: 'CONTRIBUTOR',
          })),
        } : undefined,
      },
      include: {
        lab: true,
        bucket: true,
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/projects - Update a project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, memberIds, dueDate, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Update the project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...updateData,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        // If memberIds is provided, update the members
        ...(memberIds !== undefined && {
          members: {
            deleteMany: {}, // Remove all existing members
            create: memberIds.map((userId: string) => ({
              userId,
              role: 'CONTRIBUTOR',
            })),
          },
        }),
      },
      include: {
        lab: true,
        bucket: true,
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/projects - Delete a project
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}