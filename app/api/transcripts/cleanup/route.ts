import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-error-handler';
import { transcriptCleanupJob } from '@/lib/jobs/transcript-cleanup.job';

// POST /api/transcripts/cleanup - Manually trigger transcript cleanup (admin only)
export async function POST() {
  try {
    // TODO: Add authentication check here
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.role || session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const result = await transcriptCleanupJob.runManualCleanup();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.result?.deletedCount || 0,
      errors: result.result?.errors || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/transcripts/cleanup - Get cleanup job status
export async function GET() {
  try {
    const status = transcriptCleanupJob.getStatus();
    
    return NextResponse.json(status);
  } catch (error) {
    return handleApiError(error);
  }
}