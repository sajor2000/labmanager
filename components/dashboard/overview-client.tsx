"use client";

import { MetricCard } from "./metric-card";
import { RecentStudies } from "./recent-studies";
import { ActivityFeed } from "./activity-feed";
import { Building, Beaker, FolderOpen, CheckCircle } from "lucide-react";

interface DashboardMetrics {
  totalLabs: number;
  labNames: string;
  totalProjects: number;
  activeProjects: number;
  bucketsCount: number;
  totalTasks: number;
  completedTasks: number;
}

interface Props {
  metrics: DashboardMetrics;
  recentStudies: any[];
  recentActivities: any[];
}

export function DashboardOverviewClient({ metrics, recentStudies, recentActivities }: Props) {
  const metricsData = [
    {
      title: "Total Labs",
      value: metrics.totalLabs.toString(),
      subtitle: metrics.labNames,
      icon: Building,
      color: "blue" as const,
    },
    {
      title: "Active Studies",
      value: metrics.activeProjects.toString(),
      subtitle: `${metrics.activeProjects} out of ${metrics.totalProjects} total`,
      icon: Beaker,
      color: "green" as const,
      progress: metrics.totalProjects > 0 ? (metrics.activeProjects / metrics.totalProjects) * 100 : 0,
    },
    {
      title: "Project Buckets",
      value: metrics.bucketsCount.toString(),
      subtitle: "Organized collections",
      icon: FolderOpen,
      color: "purple" as const,
    },
    {
      title: "Tasks Progress",
      value: `${metrics.completedTasks}/${metrics.totalTasks}`,
      subtitle: "Completed tasks",
      icon: CheckCircle,
      color: "amber" as const,
      progress: metrics.totalTasks > 0 ? (metrics.completedTasks / metrics.totalTasks) * 100 : 0,
    },
  ];

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here&apos;s an overview of your research activities
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {metricsData.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Recent Studies and Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentStudies studies={recentStudies} />
        </div>
        <div>
          <ActivityFeed activities={recentActivities} />
        </div>
      </div>
    </div>
  );
}