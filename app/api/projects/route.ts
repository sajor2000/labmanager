import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma, ProjectStatus } from '@prisma/client';
import { handleApiError } from '@/lib/utils/api-error-handler';
import { projectToStudy, projectsToStudies } from '@/lib/mappers/project-mapper';
import { ProjectSchema, PaginationSchema, validateRequest } from '@/lib/validation/schemas';
import { sanitizeInput } from '@/lib/security/middleware';
import { logger } from '@/lib/utils/production-logger';

// Cache configuration
const CACHE_TTL = 300; // 5 minutes cache for GET requests

// Optimized select for common queries to avoid N+1 problems
const projectSelectOptimized = {
  id: true,
  name: true,
  description: true,
  oraNumber: true,
  status: true,
  priority: true,
  projectType: true,
  studyType: true,
  bucketId: true,
  labId: true,
  dueDate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  lab: {
    select: {
      id: true,
      name: true,
    },
  },
  bucket: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      initials: true,
    },
  },
  members: {
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          initials: true,
        },
      },
    },
  },
  _count: {
    select: {
      tasks: true,
    },
  },
};

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
    const labIds = searchParams.getAll('labId[]'); // Support array of lab IDs
    const bucketId = searchParams.get('bucketId');
    const status = searchParams.get('status');
    const member = searchParams.get('member'); // For PersonalizedDashboard filtering
    const userLabs = searchParams.get('userLabs'); // Filter by all user's labs
    
    const where: Prisma.ProjectWhereInput = {};
    
    // Handle lab filtering - support single lab, multiple labs, or user's labs
    if (labIds.length > 0) {
      // Multiple lab IDs provided
      where.labId = { in: labIds };
    } else if (labId) {
      // Single lab ID provided
      where.labId = labId;
    } else if (userLabs) {
      // Get all labs for the specified user
      const userLabMemberships = await prisma.labMember.findMany({
        where: { 
          userId: userLabs,
          isActive: true 
        },
        select: { labId: true }
      });
      if (userLabMemberships.length > 0) {
        where.labId = { in: userLabMemberships.map(m => m.labId) };
      }
    }
    
    if (bucketId) where.bucketId = bucketId;
    if (status) where.status = status as ProjectStatus;
    
    // Filter by user membership for PersonalizedDashboard
    if (member) {
      where.OR = [
        { createdById: member },
        { members: { some: { userId: member } } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      select: projectSelectOptimized,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform projects to study format for frontend compatibility
    const studies = projectsToStudies(projects);

    // Set cache headers for performance
    const response = NextResponse.json(studies);
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=600`);
    response.headers.set('CDN-Cache-Control', `public, s-maxage=${CACHE_TTL}`);
    return response;
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
      select: projectSelectOptimized,
    });

    // Transform to study format for frontend compatibility
    const study = projectToStudy(project);
    return NextResponse.json(study, { status: 201 });
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
      select: projectSelectOptimized,
    });

    // Transform to study format for frontend compatibility
    const study = projectToStudy(project);
    return NextResponse.json(study);
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