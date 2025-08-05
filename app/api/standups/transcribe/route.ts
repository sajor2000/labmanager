import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-error-handler';
import OpenAIService from '@/lib/services/openai.service';
import AudioUploadService from '@/lib/services/audio-upload.service';

// POST /api/standups/transcribe - Transcribe audio file
export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI is configured
    if (!OpenAIService.isConfigured()) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string | null;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate audio file
    const validation = AudioUploadService.validateAudioFile(audioFile);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Transcribe audio
    const result = await OpenAIService.transcribeAudioBuffer(
      audioBuffer,
      audioFile.name,
      {
        language: language || undefined,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transcript: result.transcript,
    });
  } catch (error) {
    return handleApiError(error);
  }
}