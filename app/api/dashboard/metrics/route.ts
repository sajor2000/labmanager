import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/app/actions/dashboard-actions';

export async function GET() {
  try {
    const result = await getDashboardMetrics();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}