import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDashboardMetrics } from '@/app/actions/dashboard-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // If userId provided, return personalized metrics for that user
    if (userId) {
      
      // Get completed tasks count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const completedTasks = await prisma.task?.count({
        where: {
          assigneeId: userId,
          status: 'COMPLETED',
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
      }) || 0;

      const metrics = {
        completedTasks,
        totalStudies: 0,
        activeProjects: 0,
        upcomingDeadlines: 0,
      };

      // Try to get study metrics if the models exist
      try {
        const studyCount = await prisma.study?.count({
          where: {
            OR: [
              { leadInvestigatorId: userId },
              { coInvestigatorIds: { has: userId } },
              { teamMemberIds: { has: userId } },
            ],
          },
        }) || 0;
        
        metrics.totalStudies = studyCount;
        metrics.activeProjects = studyCount;
      } catch (error) {
        // Study model might not exist yet
        console.warn('Study model not available for metrics');
      }

      console.log('Fetched personalized user metrics', { userId, metrics });
      
      return NextResponse.json(metrics);
    }

    // Fallback to legacy dashboard metrics for non-authenticated users
    const result = await getDashboardMetrics();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Failed to fetch dashboard metrics', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}