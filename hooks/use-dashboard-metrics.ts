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
      console.log('[Hook] Fetching dashboard metrics...');
      const response = await fetch('/api/dashboard/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      const data = await response.json();
      console.log('[Hook] Dashboard metrics received:', {
        ideasThisMonth: data.metrics?.ideasThisMonth,
        allMetrics: data.metrics
      });
      return data as DashboardData;
    },
    staleTime: 30 * 1000, // Reduced to 30 seconds for testing
    refetchOnWindowFocus: true, // Enable refetch on focus
    refetchInterval: 60 * 1000, // Auto-refetch every minute
  });
}