'use client';

import { useQuery } from '@tanstack/react-query';

interface DashboardMetrics {
  totalLabs: number;
  labNames: string;
  totalProjects: number;
  activeProjects: number;
  bucketsCount: number;
  totalTasks: number;
  completedTasks: number;
  teamMembers: number;
  ideasThisMonth: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  recentProjects: any[];
  recentActivities: any[];
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      const data = await response.json();
      return data as DashboardData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
    gcTime: 10 * 60 * 1000, // 10 minutes cache time (formerly cacheTime)
    refetchOnWindowFocus: false, // Disable auto-refetch on window focus to prevent flickering
    refetchInterval: false, // Disable auto-refetch interval
    refetchOnMount: 'always', // Only refetch when component mounts
  });
}