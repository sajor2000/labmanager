import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireLabMember, requireLabAdmin, getAuthUser } from '@/lib/auth-helpers';
import { auditDelete, auditUpdate } from '@/lib/audit/logger';
import { checkRateLimit, getClientIp } from '@/lib/security/middleware';

// Validation schema for updating a lab
const UpdateLabSchema = z.object({
  name: z.string().min(1, 'Lab name is required').optional(),
  shortName: z.string().min(1, 'Short name is required').max(10, 'Short name must be 10 characters or less').optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    const { labId } = await params;
    
    // Authentication is optional for GET - public labs can be viewed
    const user = await getAuthUser(request);

    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                initials: true,
              }
            }
          },
          where: {
            isActive: true
          },
          orderBy: {
            joinedAt: 'desc'
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            dueDate: true,
            _count: {
              select: {
                tasks: true,
              }
            }
          },
          where: {
            isActive: true
          },
          orderBy: {
            updatedAt: 'desc'
          }
        },
        buckets: {
          where: {
            isActive: true
          },
          orderBy: {
            name: 'asc'
          }
        },
        ideas: {
          select: {
            id: true,
            title: true,
            status: true,
            votes: true,
            createdAt: true,
          },
          where: {
            isActive: true
          },
          take: 10,
          orderBy: {
            createdAt: 'desc'
          }
        },
        standups: {
          select: {
            id: true,
            date: true,
            participants: true,
            actionItems: true,
          },
          take: 10,
          orderBy: {
            date: 'desc'
          }
        },
        _count: {
          select: {
            projects: true,
            members: true,
            buckets: true,
            ideas: true,
            standups: true,
          }
        }
      }
    });
    
    if (!lab) {
      return NextResponse.json(
        { error: 'Lab not found' },
        { status: 404 }
      );
    }
    
    // Check if user is a member for private data
    const isMember = user ? lab.members.some(member => member.userId === user.id) : false;
    // if (!isMember) {
    //   return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    // }
    
    return NextResponse.json(lab);
  } catch (error) {
    console.error('Error fetching lab:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    const { labId } = await params;
    
    // Require admin privileges to update lab
    const authResult = await requireLabAdmin(request, labId);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const body = await request.json();
    
    // Validate the request body
    const validatedData = UpdateLabSchema.parse(body);
    
    // Check if the lab exists
    const existingLab = await prisma.lab.findUnique({
      where: { id: labId }
    });
    
    if (!existingLab) {
      return NextResponse.json(
        { error: 'Lab not found' },
        { status: 404 }
      );
    }
    
    // Check if shortName is being changed and if it's already taken
    if (validatedData.shortName && validatedData.shortName !== existingLab.shortName) {
      const labWithSameShortName = await prisma.lab.findUnique({
        where: { shortName: validatedData.shortName }
      });
      
      if (labWithSameShortName) {
        return NextResponse.json(
          { error: 'A lab with this short name already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update the lab
    const updatedLab = await prisma.lab.update({
      where: { id: labId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.shortName && { shortName: validatedData.shortName }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.logo !== undefined && { logo: validatedData.logo }),
        ...(validatedData.icon !== undefined && { icon: validatedData.icon }),
        ...(validatedData.color !== undefined && { color: validatedData.color }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        description: true,
        logo: true,
        icon: true,
        color: true,
        isActive: true,
        _count: {
          select: {
            projects: true,
            members: true,
            buckets: true,
          }
        }
      }
    });
    
    return NextResponse.json(updatedLab);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Error updating lab:', error);
    return NextResponse.json(
      { error: 'Failed to update lab' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    // Apply rate limiting for DELETE operations
    const ip = getClientIp(request);
    if (!checkRateLimit(ip, true)) {
      return NextResponse.json(
        { 
          error: 'Too many delete requests. Please try again later.',
          message: 'Rate limit: 5 delete requests per minute',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Window': '60s'
          }
        }
      );
    }

    const { labId } = await params;
    
    // Require admin privileges to delete lab
    const authResult = await requireLabAdmin(request, labId);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;
    
    // Check if the lab exists and has dependencies
    const existingLab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        _count: {
          select: {
            projects: true,
            members: true,
            buckets: true,
            ideas: true,
            standups: true,
            auditLogs: true,
          }
        }
      }
    });
    
    if (!existingLab) {
      return NextResponse.json(
        { error: 'Lab not found' },
        { status: 404 }
      );
    }
    
    // Build list of dependencies
    const dependencies = [];
    if (existingLab._count.projects > 0) {
      dependencies.push(`${existingLab._count.projects} project(s)`);
    }
    if (existingLab._count.members > 0) {
      dependencies.push(`${existingLab._count.members} member(s)`);
    }
    if (existingLab._count.buckets > 0) {
      dependencies.push(`${existingLab._count.buckets} bucket(s)`);
    }
    if (existingLab._count.ideas > 0) {
      dependencies.push(`${existingLab._count.ideas} idea(s)`);
    }
    if (existingLab._count.standups > 0) {
      dependencies.push(`${existingLab._count.standups} standup(s)`);
    }
    
    // Don't allow deletion if lab has any dependencies
    if (dependencies.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete lab with existing data',
          details: `Please remove or migrate: ${dependencies.join(', ')}`,
          dependencies: {
            projects: existingLab._count.projects,
            members: existingLab._count.members,
            buckets: existingLab._count.buckets,
            ideas: existingLab._count.ideas,
            standups: existingLab._count.standups,
          }
        },
        { status: 400 }
      );
    }
    
    // Soft delete by setting isActive to false
    await prisma.lab.update({
      where: { id: labId },
      data: { isActive: false }
    });
    
    // Create audit log
    await auditDelete(
      user.id,
      'lab',
      labId,
      existingLab.name,
      labId,
      request,
      true // soft delete
    );
    
    return NextResponse.json({ 
      success: true,
      message: `Lab "${existingLab.name}" has been deactivated successfully`
    });
  } catch (error) {
    console.error('Error deleting lab:', error);
    return NextResponse.json(
      { error: 'Failed to delete lab' },
      { status: 500 }
    );
  }
}