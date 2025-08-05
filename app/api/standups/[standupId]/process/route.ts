import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-error-handler';
import StandupService from '@/lib/services/standup.service';

// POST /api/standups/[standupId]/process - Process audio for standup
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

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Process the audio
    const result = await StandupService.processStandupAudio(
      standupId,
      audioBuffer,
      audioFile.type
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.standup);
  } catch (error) {
    return handleApiError(error);
  }
}