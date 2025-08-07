'use client';

import { useEffect, useState } from 'react';
import { useLab } from '@/lib/contexts/lab-context';
import { DashboardOverviewClient } from '@/components/dashboard/overview-client';
import { showToast } from '@/components/ui/toast';

export default function OverviewPageClient() {
  const { currentLab, isLoading: labLoading } = useLab();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentLab || labLoading) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/dashboard?labId=${currentLab.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setMetrics(data.metrics);
        setRecentProjects(data.recentProjects || []);
        setRecentActivities(data.recentActivities || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showToast({
          type: 'error',
          title: 'Failed to load dashboard',
          message: 'Please try refreshing the page',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Listen for lab changes
    const handleLabChange = () => {
      fetchDashboardData();
    };

    window.addEventListener('labChanged', handleLabChange);
    return () => {
      window.removeEventListener('labChanged', handleLabChange);
    };
  }, [currentLab, labLoading]);

  if (labLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              Loading dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentLab) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            No lab selected
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please select a lab from the top navigation
          </p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Unable to load dashboard
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardOverviewClient
      metrics={metrics}
      recentStudies={recentProjects}
      recentActivities={recentActivities}
    />
  );
}