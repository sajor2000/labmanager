import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-error-handler';
import TranscriptArchiveService from '@/lib/services/transcript-archive.service';
import { requireAuth } from '@/lib/auth-helpers';
import { auditDelete } from '@/lib/audit/logger';
import { checkRateLimit, getClientIp } from '@/lib/security/middleware';
import { prisma } from '@/lib/prisma';

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

// DELETE /api/transcripts/[standupId] - Delete transcript (requires authentication)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ standupId: string }> }
) {
  try {
    // Apply rate limiting for DELETE operations
    const ip = getClientIp(request);
    if (!checkRateLimit(ip, true)) {
      return NextResponse.json(
        { 
          error: 'Too many delete requests. Please try again later.',
          message: 'Rate limit: 5 delete requests per minute',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Window': '60s'
          }
        }
      );
    }

    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { standupId } = await params;
    
    if (!standupId) {
      return NextResponse.json(
        { error: 'Standup ID is required' },
        { status: 400 }
      );
    }

    // Get standup details to check lab context
    const standup = await prisma.standup.findUnique({
      where: { id: standupId },
      select: {
        id: true,
        date: true,
        labId: true,
        lab: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!standup) {
      return NextResponse.json(
        { error: 'Standup not found' },
        { status: 404 }
      );
    }

    // Check if user is a member of the lab
    if (standup.labId) {
      const isMember = await prisma.labMember.findFirst({
        where: {
          userId: user.id,
          labId: standup.labId,
          isActive: true,
        }
      });

      if (!isMember) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this transcript' },
          { status: 403 }
        );
      }
    }

    const success = await TranscriptArchiveService.deleteTranscriptArchive(standupId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete transcript' },
        { status: 500 }
      );
    }

    // Create audit log
    await auditDelete(
      user.id,
      'transcript',
      standupId,
      `Transcript for ${standup.lab?.name || 'Unknown Lab'} - ${standup.date.toISOString()}`,
      standup.labId || undefined,
      request,
      false // hard delete
    );

    return NextResponse.json({ 
      success: true,
      message: 'Transcript deleted successfully'
    });
  } catch (error) {
    return handleApiError(error);
  }
}