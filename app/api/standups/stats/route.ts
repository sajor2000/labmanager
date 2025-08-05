import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-error-handler';
import StandupService from '@/lib/services/standup.service';

// GET /api/standups/stats - Get standup statistics for a lab
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const labId = searchParams.get('labId');

    if (!labId) {
      return NextResponse.json(
        { error: 'Lab ID is required' },
        { status: 400 }
      );
    }

    const stats = await StandupService.getStandupStats(labId);
    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}