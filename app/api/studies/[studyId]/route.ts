import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { auditDelete, auditUpdate } from '@/lib/audit/logger';

// DELETE /api/studies/[studyId] - Delete a study (any lab member can delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;
    
    if (!studyId) {
      return NextResponse.json(
        { error: 'Study ID is required' },
        { status: 400 }
      );
    }
    
    // Check if study exists and get full details
    const study = await prisma.project.findUnique({
      where: { id: studyId },
      include: {
        tasks: true,
        comments: true,
        members: true,
        _count: {
          select: {
            tasks: true,
            comments: true,
            members: true,
          }
        }
      }
    });
    
    if (!study) {
      return NextResponse.json(
        { error: 'Study not found' },
        { status: 404 }
      );
    }
    
    // Check authentication and authorization (any lab member can delete)
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    
    // Check if user is a member of the lab
    const labMembership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId: study.labId,
        isActive: true
      }
    });
    
    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to delete studies' },
        { status: 403 }
      );
    }
    
    // Check for dependent data
    const dependentData = [];
    if (study._count.tasks > 0) {
      dependentData.push(`${study._count.tasks} task(s)`);
    }
    if (study._count.comments > 0) {
      dependentData.push(`${study._count.comments} comment(s)`);
    }
    if (study._count.members > 0) {
      dependentData.push(`${study._count.members} team member(s)`);
    }
    
    if (dependentData.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete study with existing data: ${dependentData.join(', ')}. Please remove or reassign these items first.`,
          dependencies: {
            tasks: study._count.tasks,
            comments: study._count.comments,
            members: study._count.members,
          }
        },
        { status: 400 }
      );
    }
    
    // Delete the study
    await prisma.project.delete({
      where: { id: studyId },
    });
    
    // Create audit log
    await auditDelete(
      user.id,
      'study',
      studyId,
      study.name,
      study.labId,
      request,
      false // hard delete
    );
    
    return NextResponse.json(
      { 
        message: 'Study deleted successfully',
        deletedStudy: {
          id: study.id,
          name: study.name,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting study:', error);
    return NextResponse.json(
      { error: 'Failed to delete study' },
      { status: 500 }
    );
  }
}

// GET /api/studies/[studyId] - Get a single study
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;
    
    if (!studyId) {
      return NextResponse.json(
        { error: 'Study ID is required' },
        { status: 400 }
      );
    }
    
    const study = await prisma.project.findUnique({
      where: { id: studyId },
      include: {
        lab: true,
        bucket: true,
        createdBy: true,
        members: {
          include: {
            user: true,
          }
        },
        tasks: {
          include: {
            assignees: {
              include: {
                user: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          }
        }
      }
    });
    
    if (!study) {
      return NextResponse.json(
        { error: 'Study not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(study);
  } catch (error) {
    console.error('Error fetching study:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study' },
      { status: 500 }
    );
  }
}

// PATCH /api/studies/[studyId] - Update a study
const UpdateStudySchema = z.object({
  name: z.string().min(1).optional(),
  oraNumber: z.string().optional(),
  status: z.enum(['PLANNING', 'IRB_SUBMISSION', 'IRB_APPROVED', 'DATA_COLLECTION', 'ANALYSIS', 'MANUSCRIPT', 'UNDER_REVIEW', 'PUBLISHED', 'ON_HOLD', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  projectType: z.string().optional(),
  studyType: z.string().optional(),
  bucketId: z.string().optional(),
  fundingSource: z.enum(['NIH', 'NSF', 'INDUSTRY_SPONSORED', 'INTERNAL', 'FOUNDATION', 'OTHER']).optional().nullable(),
  fundingDetails: z.string().optional().nullable(),
  externalCollaborators: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;
    
    if (!studyId) {
      return NextResponse.json(
        { error: 'Study ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const validatedData = UpdateStudySchema.parse(body);
    
    // Check if study exists
    const existingStudy = await prisma.project.findUnique({
      where: { id: studyId },
    });
    
    if (!existingStudy) {
      return NextResponse.json(
        { error: 'Study not found' },
        { status: 404 }
      );
    }
    
    // Extract assigneeIds for separate processing
    const { assigneeIds, dueDate, ...updateData } = validatedData;
    
    // Update the study
    const updatedStudy = await prisma.project.update({
      where: { id: studyId },
      data: {
        ...updateData,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        // If assigneeIds is provided, update the assignees
        ...(assigneeIds !== undefined && {
          members: {
            deleteMany: {}, // Remove all existing assignees
            create: assigneeIds.map(userId => ({
              userId,
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
          }
        },
        tasks: {
          include: {
            assignees: {
              include: {
                user: true,
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json(updatedStudy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating study:', error);
    return NextResponse.json(
      { error: 'Failed to update study' },
      { status: 500 }
    );
  }
}