import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-error-handler';
import TranscriptArchiveService from '@/lib/services/transcript-archive.service';

// GET /api/transcripts - Search transcripts or get expiring soon
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const labId = searchParams.get('labId');
    const expiringSoon = searchParams.get('expiringSoon');

    // If searching for expiring soon transcripts
    if (expiringSoon === 'true') {
      const daysThreshold = searchParams.get('days') 
        ? parseInt(searchParams.get('days')!) 
        : 7;
        
      const transcripts = await TranscriptArchiveService.getExpiringSoonTranscripts(
        labId || undefined,
        daysThreshold
      );
      
      return NextResponse.json(transcripts);
    }

    // If searching by content
    if (search) {
      const limit = searchParams.get('limit') 
        ? parseInt(searchParams.get('limit')!) 
        : undefined;
      const offset = searchParams.get('offset') 
        ? parseInt(searchParams.get('offset')!) 
        : undefined;
      const includeExpired = searchParams.get('includeExpired') === 'true';

      const transcripts = await TranscriptArchiveService.searchTranscripts(
        search,
        {
          labId: labId || undefined,
          limit,
          offset,
          includeExpired,
        }
      );

      return NextResponse.json(transcripts);
    }

    // Return bad request if no valid query parameters
    return NextResponse.json(
      { error: 'Please provide search term or expiringSoon parameter' },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}