import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/utils/api-error-handler';
import StandupService from '@/lib/services/standup.service';

// Validation schema for creating a standup
const CreateStandupSchema = z.object({
  labId: z.string().min(1),
  date: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
});

// GET /api/standups - Get standups for a lab
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const labId = searchParams.get('labId');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!labId) {
      return NextResponse.json(
        { error: 'Lab ID is required' },
        { status: 400 }
      );
    }

    // If search term provided, search standups
    if (search) {
      const standups = await StandupService.searchStandups(labId, search);
      return NextResponse.json(standups);
    }

    // Otherwise, get all standups with pagination
    const standups = await StandupService.getStandupsByLab(labId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json(standups);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/standups - Create a new standup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateStandupSchema.parse(body);
    
    const standup = await StandupService.createStandup({
      labId: validatedData.labId,
      date: validatedData.date ? new Date(validatedData.date) : undefined,
      participantIds: validatedData.participantIds,
    });

    return NextResponse.json(standup, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

