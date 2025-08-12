import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import DocumentService from '@/lib/services/document.service';
import { prisma } from '@/lib/prisma';

// GET /api/labs/[labId]/storage - Get lab storage statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    const { labId } = await params;

    if (!labId) {
      return NextResponse.json(
        { error: 'Lab ID is required' },
        { status: 400 }
      );
    }

    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if user is a member of the lab
    const labMembership = await prisma.labMember.findFirst({
      where: {
        userId: user.id,
        labId,
        isActive: true
      }
    });

    if (!labMembership) {
      return NextResponse.json(
        { error: 'You must be a member of this lab to view storage statistics' },
        { status: 403 }
      );
    }

    // Get storage statistics
    const stats = await DocumentService.getLabStorageStats(labId);

    if (!stats) {
      return NextResponse.json(
        { error: 'Lab not found' },
        { status: 404 }
      );
    }

    // Format response with human-readable sizes
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return NextResponse.json({
      used: stats.used,
      limit: stats.limit,
      percentage: stats.percentage.toFixed(2),
      documentCount: stats.documentCount,
      averageFileSize: stats.averageFileSize,
      breakdown: stats.breakdown,
      compressionSavings: stats.compressionSavings,
      formatted: {
        used: formatBytes(stats.used),
        limit: formatBytes(stats.limit),
        averageFileSize: formatBytes(stats.averageFileSize),
        compressionSavings: formatBytes(stats.compressionSavings),
        remaining: formatBytes(stats.limit - stats.used)
      }
    });

  } catch (error) {
    console.error('Storage stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage statistics' },
      { status: 500 }
    );
  }
}