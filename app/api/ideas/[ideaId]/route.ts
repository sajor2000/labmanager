import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { auditDelete, auditUpdate } from '@/lib/audit/logger';

// GET /api/ideas/[ideaId] - Get a single idea
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const { ideaId } = await params;
    
    if (!ideaId) {
      return NextResponse.json(
        { error: 'Idea ID is required' },
        { status: 400 }
      );
    }
    
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
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
            author: {
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
      },
    });
    
    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(idea);
  } catch (error) {
    console.error('Error fetching idea:', error);
    return NextResponse.json(
      { error: 'Failed to fetch idea' },
      { status: 500 }
    );
  }
}

// PATCH /api/ideas/[ideaId] - Update an idea
const UpdateIdeaSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['METHODOLOGY', 'RESEARCH_QUESTION', 'COLLABORATION', 'TOOL', 'PROCESS', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  stage: z.enum(['CONCEPT', 'EVALUATION', 'PLANNING', 'IN_PROGRESS', 'IMPLEMENTED', 'ARCHIVED']).optional(),
  impact: z.string().optional(),
  feasibility: z.string().optional(),
  resources: z.string().optional(),
  risks: z.string().optional(),
  nextSteps: z.string().optional(),
  tags: z.array(z.string()).optional(),
  relatedStudyIds: z.array(z.string()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const { ideaId } = await params;
    
    if (!ideaId) {
      return NextResponse.json(
        { error: 'Idea ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const validatedData = UpdateIdeaSchema.parse(body);
    
    // Check if idea exists
    const existingIdea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });
    
    if (!existingIdea) {
      return NextResponse.json(
        { error: 'Idea not found' },
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
    const labMembership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId: existingIdea.labId,
        isActive: true,
      },
    });
    
    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to update ideas' },
        { status: 403 }
      );
    }
    
    // Extract relatedStudyIds for separate processing
    const { relatedStudyIds, ...updateData } = validatedData;
    
    // Update the idea
    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        ...updateData,
        // Update related studies if provided
        ...(relatedStudyIds !== undefined && {
          relatedStudies: {
            deleteMany: {}, // Remove all existing relations
            create: relatedStudyIds.map(studyId => ({
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
      },
    });
    
    // Create audit log
    await auditUpdate(
      user.id,
      'idea',
      ideaId,
      existingIdea,
      updatedIdea,
      existingIdea.labId,
      request
    );
    
    return NextResponse.json(updatedIdea);
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

// DELETE /api/ideas/[ideaId] - Delete an idea
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const { ideaId } = await params;
    
    if (!ideaId) {
      return NextResponse.json(
        { error: 'Idea ID is required' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    
    // Get idea details for authorization and audit
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        lab: {
          select: {
            id: true,
            name: true,
          }
        },
        votes: true,
        comments: true,
        relatedStudies: true,
      }
    });
    
    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }
    
    // Check if user is a member of the lab (any lab member can delete)
    const labMembership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId: idea.labId,
        isActive: true
      }
    });
    
    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to delete ideas' },
        { status: 403 }
      );
    }
    
    // Check for dependent data
    const dependentData = [];
    if (idea.votes.length > 0) {
      dependentData.push(`${idea.votes.length} vote(s)`);
    }
    if (idea.comments.length > 0) {
      dependentData.push(`${idea.comments.length} comment(s)`);
    }
    if (idea.relatedStudies.length > 0) {
      dependentData.push(`${idea.relatedStudies.length} related study connection(s)`);
    }
    
    // Use transaction to delete idea and its relations
    await prisma.$transaction(async (tx) => {
      // Delete related data
      await tx.ideaVote.deleteMany({ where: { ideaId } });
      await tx.ideaStudy.deleteMany({ where: { ideaId } });
      await tx.comment.deleteMany({ 
        where: { 
          entityType: 'IDEA',
          entityId: ideaId 
        } 
      });
      
      // Delete the idea
      await tx.idea.delete({ where: { id: ideaId } });
    });
    
    // Create audit log for deletion
    await auditDelete(
      user.id,
      'idea',
      ideaId,
      idea.title,
      idea.labId,
      request,
      false // hard delete
    );
    
    return NextResponse.json(
      { 
        message: 'Idea deleted successfully',
        deletedIdea: {
          id: idea.id,
          title: idea.title,
          hadDependencies: dependentData.length > 0,
          dependencies: dependentData
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting idea:', error);
    return NextResponse.json(
      { error: 'Failed to delete idea' },
      { status: 500 }
    );
  }
}