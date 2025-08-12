import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/utils/api-error-handler';
import StandupService from '@/lib/services/standup.service';
import { requireAuth, requireLabAdmin } from '@/lib/auth-helpers';
import { auditDelete, auditUpdate } from '@/lib/audit/logger';
import { prisma } from '@/lib/prisma';

// Validation schema for updating a standup
const UpdateStandupSchema = z.object({
  transcript: z.string().optional(),
  audioUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/standups/[standupId] - Get a specific standup
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ standupId: string }> }
) {
  try {
    const { standupId } = await params;
    
    if (!standupId) {
      return NextResponse.json(
        { error: 'Standup ID is required' },
        { status: 400 }
      );
    }

    const standup = await StandupService.getStandupById(standupId);
    
    if (!standup) {
      return NextResponse.json(
        { error: 'Standup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(standup);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/standups/[standupId] - Update a standup
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ standupId: string }> }
) {
  try {
    const { standupId } = await params;
    const body = await request.json();
    
    if (!standupId) {
      return NextResponse.json(
        { error: 'Standup ID is required' },
        { status: 400 }
      );
    }

    // Validate the request body
    const validatedData = UpdateStandupSchema.parse(body);
    
    const standup = await StandupService.updateStandup({
      id: standupId,
      ...validatedData,
    });

    return NextResponse.json(standup);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/standups/[standupId] - Delete a standup (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ standupId: string }> }
) {
  try {
    const { standupId } = await params;
    
    if (!standupId) {
      return NextResponse.json(
        { error: 'Standup ID is required' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    
    // Get standup details for authorization
    const standup = await prisma.standup.findUnique({
      where: { id: standupId },
      select: {
        id: true,
        labId: true,
        title: true,
        lab: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    if (!standup) {
      return NextResponse.json(
        { error: 'Standup not found' },
        { status: 404 }
      );
    }
    
    // Check if user is lab admin
    const authCheck = await requireLabAdmin(request, standup.labId);
    if (authCheck instanceof NextResponse) {
      return authCheck;
    }

    // Use the service to delete (which handles soft delete)
    const success = await StandupService.deleteStandup(standupId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete standup' },
        { status: 500 }
      );
    }
    
    // Create audit log
    await auditDelete(
      user.id,
      'standup',
      standupId,
      standup.title || 'Standup',
      standup.labId,
      request,
      true // soft delete
    );

    return NextResponse.json({ 
      success: true,
      message: 'Standup deleted successfully'
    });
  } catch (error) {
    return handleApiError(error);
  }
}

