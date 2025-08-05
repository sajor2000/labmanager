import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-error-handler';
import TranscriptArchiveService from '@/lib/services/transcript-archive.service';

// GET /api/transcripts/stats - Get transcript archive statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const labId = searchParams.get('labId');

    const stats = await TranscriptArchiveService.getArchiveStats(labId || undefined);

    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}