import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma, ProjectStatus } from '@prisma/client';
import { handleApiError } from '@/lib/utils/api-error-handler';
import { projectToStudy, projectsToStudies } from '@/lib/mappers/project-mapper';
import { ProjectSchema, PaginationSchema, validateRequest } from '@/lib/validation/schemas';
import { sanitizeInput } from '@/lib/security/middleware';
import { logger } from '@/lib/utils/production-logger';
import { requireAuth, requireLabAdmin } from '@/lib/auth-helpers';
import { auditDelete, auditCreate, auditUpdate } from '@/lib/audit/logger';

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

// POST /api/projects - Create a new project (any lab member can create)
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateProjectSchema.parse(body);
    
    // Check if user is a member of the lab (any member can create projects)
    if (validatedData.labId) {
      const labMembership = await prisma.labMember.findFirst({
        where: {
          labId: validatedData.labId,
          userId: user.id,
          isActive: true
        }
      });
      
      if (!labMembership) {
        return NextResponse.json(
          { error: 'You must be a member of this lab to create projects' },
          { status: 403 }
        );
      }
    }
    
    // Set the creator
    if (!validatedData.createdById) {
      validatedData.createdById = user.id;
    }
    
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

// PUT /api/projects - Update a project (any lab member can update)
export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    
    const body = await request.json();
    const { id, memberIds, dueDate, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // Check if project exists and user has access
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { labId: true }
    });
    
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Verify user is a member of the lab
    const labMembership = await prisma.labMember.findFirst({
      where: {
        labId: existingProject.labId,
        userId: user.id,
        isActive: true
      }
    });
    
    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to update projects' },
        { status: 403 }
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
    
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    
    // Get project details for authorization and cascade check
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
            comments: true,
            members: true,
          }
        }
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if user is a member of the lab (any member can delete)
    const labMembership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId: project.labId,
        isActive: true
      }
    });
    
    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to delete projects' },
        { status: 403 }
      );
    }
    
    // Check for dependent data
    const dependentData = [];
    if (project._count.tasks > 0) {
      dependentData.push(`${project._count.tasks} task(s)`);
    }
    if (project._count.comments > 0) {
      dependentData.push(`${project._count.comments} comment(s)`);
    }
    if (project._count.members > 0) {
      dependentData.push(`${project._count.members} member(s)`);
    }
    
    if (dependentData.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete project with existing data: ${dependentData.join(', ')}. Please remove or reassign these items first.`,
          dependencies: {
            tasks: project._count.tasks,
            comments: project._count.comments,
            members: project._count.members,
          }
        },
        { status: 400 }
      );
    }

    // Delete the project
    await prisma.project.delete({
      where: { id },
    });
    
    // Create audit log
    await auditDelete(
      user.id,
      'project',
      id,
      project.name,
      project.labId,
      request,
      false // hard delete
    );

    return NextResponse.json({ 
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    return handleApiError(error);
  }
}