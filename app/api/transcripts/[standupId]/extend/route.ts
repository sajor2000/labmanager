import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/utils/api-error-handler';
import TranscriptArchiveService from '@/lib/services/transcript-archive.service';

const ExtendRetentionSchema = z.object({
  days: z.number().min(1).max(365).default(30),
});

// POST /api/transcripts/[standupId]/extend - Extend transcript retention
export async function POST(
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

    const body = await request.json();
    const validationResult = ExtendRetentionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { days } = validationResult.data;
    const success = await TranscriptArchiveService.extendRetention(standupId, days);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to extend retention. Transcript may not exist.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: `Retention extended by ${days} days`
    });
  } catch (error) {
    return handleApiError(error);
  }
}