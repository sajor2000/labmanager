import { getDashboardMetrics } from '@/app/actions/dashboard-actions';
import { DashboardOverviewClient } from '@/components/dashboard/overview-client';

export default async function OverviewPage() {
  const result = await getDashboardMetrics();

  if (!result.success) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Unable to load dashboard
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {result.error}
          </p>
        </div>
      </div>
    );
  }

  const { metrics, recentProjects, recentActivities } = result.data!;

  return (
    <DashboardOverviewClient
      metrics={metrics}
      recentStudies={recentProjects}
      recentActivities={recentActivities}
    />
  );
}