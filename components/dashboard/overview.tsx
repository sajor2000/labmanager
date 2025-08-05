"use client";

import { MetricCard } from "./metric-card";
import { RecentStudies } from "./recent-studies";
import { ActivityFeed } from "./activity-feed";
import { Building, Beaker, FolderOpen, CheckCircle } from "lucide-react";

export function DashboardOverview() {
  // Mock data - would come from API/database
  const metrics = [
    {
      title: "Total Labs",
      value: "2",
      subtitle: "RHEDAS & RICCC",
      icon: Building,
      color: "blue" as const,
    },
    {
      title: "Active Studies",
      value: "12",
      subtitle: "8 out of 20 total",
      icon: Beaker,
      color: "green" as const,
      progress: 60,
    },
    {
      title: "Project Buckets",
      value: "7",
      subtitle: "Organized collections",
      icon: FolderOpen,
      color: "purple" as const,
    },
    {
      title: "Tasks Progress",
      value: "24/32",
      subtitle: "Completed tasks",
      icon: CheckCircle,
      color: "amber" as const,
      progress: 75,
    },
  ];

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, Dr. Johnson!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here&apos;s an overview of RHEDAS activities
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Recent Studies and Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentStudies />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}