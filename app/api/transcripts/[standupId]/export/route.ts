import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-error-handler';
import TranscriptArchiveService from '@/lib/services/transcript-archive.service';

// GET /api/transcripts/[standupId]/export - Export transcript
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

    const result = await TranscriptArchiveService.exportTranscript(standupId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    const { transcript, metadata } = result.data!;
    
    // Create filename with date
    const date = new Date(metadata.standupDate);
    const filename = `standup-transcript-${date.toISOString().split('T')[0]}.txt`;
    
    // Create the export content
    const exportContent = `Standup Transcript
==================
Lab: ${metadata.labName}
Date: ${date.toLocaleDateString()}
Words: ${metadata.wordCount}
Created: ${new Date(metadata.createdAt).toLocaleDateString()}
Expires: ${new Date(metadata.expiresAt).toLocaleDateString()}

==================
TRANSCRIPT
==================

${transcript}`;

    // Return as downloadable text file
    return new NextResponse(exportContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}