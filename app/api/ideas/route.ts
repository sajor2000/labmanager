import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { requireAuth, requireResourceOwnerOrAdmin } from '@/lib/auth-helpers';
import { auditDelete, auditCreate, auditUpdate } from '@/lib/audit/logger';

// Validation schema for creating an idea
const CreateIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['RESEARCH_QUESTION', 'METHOD_IMPROVEMENT', 'COLLABORATION', 'GRANT_OPPORTUNITY', 'TECHNOLOGY', 'OTHER']).default('RESEARCH_QUESTION'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  feasibilityScore: z.number().min(1).max(10).optional(),
  impactScore: z.number().min(1).max(10).optional(),
  resourceRequirement: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  estimatedDuration: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]),
  potentialCollaborators: z.array(z.string()).default([]),
  relatedStudyIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
  })).default([]),
  createdById: z.string().min(1),
  labId: z.string().min(1),
});

// Validation schema for updating an idea
const UpdateIdeaSchema = CreateIdeaSchema.partial().extend({
  id: z.string().min(1),
});

// Validation schema for voting on an idea (currently unused but may be needed for future vote endpoints)
// const VoteSchema = z.object({
//   ideaId: z.string().min(1),
//   userId: z.string().min(1),
//   voteType: z.enum(['UP', 'DOWN']),
// });

// GET /api/ideas - Get all ideas with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const labId = searchParams.get('labId');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status') || 'ACTIVE';
    const sortBy = searchParams.get('sortBy') || 'created';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build where clause
    const where: Prisma.IdeaWhereInput = {
      status: status as Prisma.EnumIdeaStatusFilter,
    };
    
    if (labId) where.labId = labId;
    if (category) where.category = category as Prisma.EnumIdeaCategoryFilter;
    if (priority) where.priority = priority as Prisma.EnumPriorityFilter;

    // Build order by clause
    let orderBy: Prisma.IdeaOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'votes':
        orderBy = { voteScore: sortOrder as Prisma.SortOrder };
        break;
      case 'feasibility':
        orderBy = { feasibilityScore: sortOrder as Prisma.SortOrder };
        break;
      case 'impact':
        orderBy = { impactScore: sortOrder as Prisma.SortOrder };
        break;
      case 'updated':
        orderBy = { updatedAt: sortOrder as Prisma.SortOrder };
        break;
      default:
        orderBy = { createdAt: sortOrder as Prisma.SortOrder };
    }

    const ideas = await prisma.idea.findMany({
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
        lab: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                initials: true,
              },
            },
          },
        },
        comments: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
        relatedStudies: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
      orderBy,
    });

    // Calculate vote scores and additional metrics
    const ideasWithMetrics = ideas.map(idea => ({
      ...idea,
      voteScore: idea.votes.reduce((sum, vote) => 
        sum + (vote.voteType === 'UP' ? 1 : -1), 0
      ),
      upvotes: idea.votes.filter(vote => vote.voteType === 'UP').length,
      downvotes: idea.votes.filter(vote => vote.voteType === 'DOWN').length,
      combinedScore: (idea.feasibilityScore || 5) + (idea.impactScore || 5),
    }));

    return NextResponse.json(ideasWithMetrics);
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

// POST /api/ideas - Create a new idea (any authenticated user can create)
export async function POST(request: NextRequest) {
  try {
    // Require authentication but allow any authenticated user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateIdeaSchema.parse(body);
    
    // If labId is provided, verify user is a member (optional check)
    if (validatedData.labId) {
      const labMembership = await prisma.labMember.findFirst({
        where: {
          userId: user.id,
          labId: validatedData.labId,
          isActive: true
        }
      });
      
      if (!labMembership) {
        return NextResponse.json(
          { error: 'You must be a member of this lab to create ideas for it' },
          { status: 403 }
        );
      }
    }
    
    // Extract related studies for separate processing
    const { relatedStudyIds, ...ideaData } = validatedData;
    
    // Create the idea
    const idea = await prisma.idea.create({
      data: {
        ...ideaData,
        status: 'ACTIVE',
        stage: 'CONCEPT',
        voteScore: 0,
        relatedStudies: relatedStudyIds.length > 0 ? {
          create: relatedStudyIds.map(studyId => ({
            projectId: studyId,
          })),
        } : undefined,
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
        lab: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        votes: true,
        comments: true,
        relatedStudies: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating idea:', error);
    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    );
  }
}

// PUT /api/ideas - Update an idea
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = UpdateIdeaSchema.parse(body);
    const { id, relatedStudyIds, ...updateData } = validatedData;
    
    // Update the idea
    const idea = await prisma.idea.update({
      where: { id },
      data: {
        ...updateData,
        // If relatedStudyIds is provided, update the relationships
        ...(relatedStudyIds !== undefined && {
          relatedStudies: {
            deleteMany: {}, // Remove all existing relationships
            create: relatedStudyIds.map((studyId: string) => ({
              projectId: studyId,
            })),
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
        lab: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        votes: true,
        comments: {
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
        relatedStudies: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json(idea);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating idea:', error);
    return NextResponse.json(
      { error: 'Failed to update idea' },
      { status: 500 }
    );
  }
}

// DELETE /api/ideas - Delete an idea
// DELETE method moved to /api/ideas/[ideaId]/route.ts for RESTful consistency