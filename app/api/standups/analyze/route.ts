import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/utils/api-error-handler';
import OpenAIService from '@/lib/services/openai.service';

// Validation schema for analyzing transcript
const AnalyzeTranscriptSchema = z.object({
  transcript: z.string().min(1),
});

// POST /api/standups/analyze - Analyze transcript with AI
export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI is configured
    if (!OpenAIService.isConfigured()) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validatedData = AnalyzeTranscriptSchema.parse(body);
    
    // Analyze transcript
    const result = await OpenAIService.analyzeTranscript(validatedData.transcript);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      analysis: result.data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}