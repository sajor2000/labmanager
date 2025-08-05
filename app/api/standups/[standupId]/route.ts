import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/utils/api-error-handler';
import StandupService from '@/lib/services/standup.service';

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

    const success = await StandupService.deleteStandup(standupId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete standup' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

