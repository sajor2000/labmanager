import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-error-handler';
import TranscriptArchiveService from '@/lib/services/transcript-archive.service';

// GET /api/transcripts/[standupId] - Get transcript by standup ID
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

    const transcript = await TranscriptArchiveService.getByStandupId(standupId);
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transcript);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/transcripts/[standupId] - Delete transcript
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

    const success = await TranscriptArchiveService.deleteTranscriptArchive(standupId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete transcript' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}