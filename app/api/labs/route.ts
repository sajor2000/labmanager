import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating/updating a lab
const LabSchema = z.object({
  name: z.string().min(1, 'Lab name is required'),
  shortName: z.string().min(1, 'Short name is required').max(10, 'Short name must be 10 characters or less'),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const labs = await prisma.lab.findMany({
      where: {
        isActive: true,
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
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
            isAdmin: true,
            joinedAt: true,
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
          },
          where: {
            isActive: true
          },
          take: 5,
          orderBy: {
            updatedAt: 'desc'
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
      },
      orderBy: {
        shortName: 'asc'
      }
    });
    
    return NextResponse.json(labs);
  } catch (error) {
    console.error('Error fetching labs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = LabSchema.parse(body);
    
    // Check if shortName already exists
    const existingLab = await prisma.lab.findUnique({
      where: { shortName: validatedData.shortName }
    });
    
    if (existingLab) {
      return NextResponse.json(
        { error: 'A lab with this short name already exists' },
        { status: 400 }
      );
    }
    
    // Create the new lab
    const lab = await prisma.lab.create({
      data: {
        name: validatedData.name,
        shortName: validatedData.shortName,
        description: validatedData.description || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        description: true,
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
    
    return NextResponse.json(lab, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Error creating lab:', error);
    return NextResponse.json(
      { error: 'Failed to create lab' },
      { status: 500 }
    );
  }
}
