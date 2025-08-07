import OpenAI from 'openai';
import { Readable } from 'stream';
import fs from 'fs';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required but not set');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export interface TranscriptionResult {
  success: boolean;
  transcript?: string;
  error?: string;
}

export interface AnalysisResult {
  success: boolean;
  data?: {
    summary: string;
    actionItems: Array<{
      description: string;
      assignee?: string;
      dueDate?: string;
    }>;
    blockers: Array<{
      description: string;
      resolved: boolean;
    }>;
    decisions: Array<{
      description: string;
    }>;
    participants: string[];
  };
  error?: string;
}

export class OpenAIService {
  /**
   * Transcribe audio using OpenAI Whisper
   */
  static async transcribeAudio(
    audioPath: string,
    options?: {
      language?: string;
      prompt?: string;
    }
  ): Promise<TranscriptionResult> {
    try {
      // Validate file exists
      if (!fs.existsSync(audioPath)) {
        return {
          success: false,
          error: 'Audio file not found',
        };
      }

      // Create a ReadStream from the file
      const audioStream = fs.createReadStream(audioPath);

      // Transcribe with Whisper
      const transcription = await getOpenAIClient().audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        language: options?.language,
        prompt: options?.prompt,
        response_format: 'text',
      });

      return {
        success: true,
        transcript: transcription,
      };
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transcribe audio',
      };
    }
  }

  /**
   * Transcribe audio from buffer
   */
  static async transcribeAudioBuffer(
    buffer: Buffer,
    filename: string,
    options?: {
      language?: string;
      prompt?: string;
    }
  ): Promise<TranscriptionResult> {
    try {
      // Convert buffer to a Readable stream
      const audioStream = Readable.from(buffer);
      
      // Add required properties for OpenAI
      (audioStream as any).name = filename;
      (audioStream as any).path = filename;

      // Transcribe with Whisper
      const transcription = await getOpenAIClient().audio.transcriptions.create({
        file: audioStream as any,
        model: 'whisper-1',
        language: options?.language,
        prompt: options?.prompt,
        response_format: 'text',
      });

      return {
        success: true,
        transcript: transcription,
      };
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transcribe audio',
      };
    }
  }

  /**
   * Analyze standup transcript using GPT
   */
  static async analyzeTranscript(transcript: string): Promise<AnalysisResult> {
    try {
      const systemPrompt = `You are an AI assistant specialized in analyzing standup meeting transcripts.
Your task is to extract key information from the transcript and structure it in a specific format.

Guidelines:
1. Identify action items with clear descriptions and assignees (if mentioned)
2. Extract blockers or impediments mentioned
3. Note any important decisions made
4. List participants if their names are mentioned
5. Provide a brief summary of the meeting
6. If a due date is mentioned for an action item, include it

Return the analysis in the following JSON format:
{
  "summary": "Brief 2-3 sentence summary of the standup",
  "actionItems": [
    {
      "description": "Clear description of the action item",
      "assignee": "Person's name if mentioned, otherwise null",
      "dueDate": "ISO date string if mentioned, otherwise null"
    }
  ],
  "blockers": [
    {
      "description": "Description of the blocker",
      "resolved": false
    }
  ],
  "decisions": [
    {
      "description": "Description of the decision"
    }
  ],
  "participants": ["Name1", "Name2"]
}`;

      const completion = await getOpenAIClient().chat.completions.create({
        model: process.env.OPENAI_API_MODEL_2 || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Please analyze this standup transcript:\n\n${transcript}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from GPT');
      }

      const analysisData = JSON.parse(content);

      return {
        success: true,
        data: analysisData,
      };
    } catch (error) {
      console.error('Analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze transcript',
      };
    }
  }

  /**
   * Generate meeting summary
   */
  static async generateSummary(transcript: string): Promise<string> {
    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: process.env.OPENAI_API_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Summarize this standup meeting in 2-3 concise sentences, focusing on key updates and outcomes.',
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content || 'No summary generated';
    } catch (error) {
      console.error('Summary generation error:', error);
      return 'Failed to generate summary';
    }
  }

  /**
   * Extract speaker names from transcript
   */
  static async extractSpeakers(transcript: string): Promise<string[]> {
    try {
      const completion = await getOpenAIClient().chat.completions.create({
        model: process.env.OPENAI_API_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extract all unique speaker names mentioned in this transcript. Return as a JSON array of strings. If no names are clearly mentioned, return an empty array.',
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
        max_tokens: 100,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) return [];

      const data = JSON.parse(content);
      return Array.isArray(data.speakers) ? data.speakers : [];
    } catch (error) {
      console.error('Speaker extraction error:', error);
      return [];
    }
  }

  /**
   * Check if OpenAI API key is configured
   */
  static isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}

export default OpenAIService;