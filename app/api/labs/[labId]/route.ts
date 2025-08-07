import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating a lab
const UpdateLabSchema = z.object({
  name: z.string().min(1, 'Lab name is required'),
  shortName: z.string().min(1, 'Short name is required').max(10, 'Short name must be 10 characters or less'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { labId: string } }
) {
  try {
    const lab = await prisma.lab.findUnique({
      where: { id: params.labId },
      select: {
        id: true,
        name: true,
        shortName: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
  { params }: { params: { labId: string } }
) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = UpdateLabSchema.parse(body);
    
    // Check if the lab exists
    const existingLab = await prisma.lab.findUnique({
      where: { id: params.labId }
    });
    
    if (!existingLab) {
      return NextResponse.json(
        { error: 'Lab not found' },
        { status: 404 }
      );
    }
    
    // Check if shortName is being changed and if it's already taken
    if (validatedData.shortName !== existingLab.shortName) {
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
      where: { id: params.labId },
      data: {
        name: validatedData.name,
        shortName: validatedData.shortName,
        description: validatedData.description || null,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : existingLab.isActive,
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
  { params }: { params: { labId: string } }
) {
  try {
    // Check if the lab exists
    const existingLab = await prisma.lab.findUnique({
      where: { id: params.labId },
      include: {
        _count: {
          select: {
            projects: true,
            members: true,
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
    
    // Don't allow deletion if lab has projects or members
    if (existingLab._count.projects > 0 || existingLab._count.members > 0) {
      return NextResponse.json(
        { error: 'Cannot delete lab with existing projects or members' },
        { status: 400 }
      );
    }
    
    // Soft delete by setting isActive to false
    await prisma.lab.update({
      where: { id: params.labId },
      data: { isActive: false }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lab:', error);
    return NextResponse.json(
      { error: 'Failed to delete lab' },
      { status: 500 }
    );
  }
}