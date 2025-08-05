import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/utils/api-error-handler';
import EmailService from '@/lib/services/email.service';

// Input validation schema
const SendEmailSchema = z.object({
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).min(1, 'At least one recipient is required'),
  subject: z.string().optional(),
  senderName: z.string().min(1, 'Sender name is required'),
  senderEmail: z.string().email('Valid sender email is required'),
});

// POST /api/standups/[standupId]/send-email
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = SendEmailSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { recipients, subject, senderName, senderEmail } = validationResult.data;

    // Check if email was recently sent (prevent spam)
    const wasRecentlySent = await EmailService.wasRecentlySent(standupId, 1); // 1 hour
    if (wasRecentlySent) {
      return NextResponse.json(
        { error: 'Email was already sent recently. Please wait before sending again.' },
        { status: 429 } // Too Many Requests
      );
    }

    // Send the email
    const result = await EmailService.sendStandupNotes({
      standupId,
      recipients,
      subject,
      senderName,
      senderEmail,
      includedTranscriptLink: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Email sent successfully to ${recipients.length} recipient(s)`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/standups/[standupId]/send-email - Get email history and suggestions
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

    // Get email history
    const historyResult = await EmailService.getStandupEmailHistory(standupId);
    
    // Get suggested recipients
    const suggestedRecipients = await EmailService.getSuggestedRecipients(standupId);
    
    // Check if recently sent
    const wasRecentlySent = await EmailService.wasRecentlySent(standupId, 1);

    return NextResponse.json({
      success: true,
      data: {
        history: historyResult.success ? historyResult.data : [],
        suggestedRecipients,
        canSend: !wasRecentlySent,
        lastSentAt: historyResult.success && historyResult.data && historyResult.data.length > 0
          ? historyResult.data[0].sentAt
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}