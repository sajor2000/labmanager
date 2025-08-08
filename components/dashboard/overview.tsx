"use client";

import { useState, useEffect } from "react";
import { AnimatedMetricCard } from "./animated-metric-card";
import { RecentStudies } from "./recent-studies";
import { ActivityFeed } from "./activity-feed";
import { Building, Beaker, FolderOpen, CheckCircle, TrendingUp, Users, Calendar, Lightbulb, Loader2, RefreshCw } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function DashboardOverview() {
  const { user } = useCurrentUser();
  const { data: dashboardData, isLoading, error, refetch, isFetching } = useDashboardMetrics();

  // Log the data when it changes
  useEffect(() => {
    if (dashboardData?.metrics) {
      console.log('[Component] Dashboard data received:', {
        ideasThisMonth: dashboardData.metrics.ideasThisMonth,
        allMetrics: dashboardData.metrics
      });
    }
  }, [dashboardData]);

  // Transform API data into metric cards format
  const metrics = dashboardData?.metrics ? [
    {
      title: "Total Labs",
      value: dashboardData.metrics.totalLabs,
      subtitle: "Research laboratories",
      icon: Building,
      color: "green" as const,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Active Studies",
      value: dashboardData.metrics.activeProjects,
      subtitle: `out of ${dashboardData.metrics.totalProjects} total`,
      icon: Beaker,
      color: "gold" as const,
      progress: dashboardData.metrics.totalProjects > 0 
        ? Math.round((dashboardData.metrics.activeProjects / dashboardData.metrics.totalProjects) * 100) 
        : 0,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Project Buckets",
      value: dashboardData.metrics.bucketsCount,
      subtitle: "Organized collections",
      icon: FolderOpen,
      color: "blue" as const,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Tasks Progress",
      value: `${dashboardData.metrics.completedTasks}/${dashboardData.metrics.totalTasks}`,
      subtitle: "Completed tasks",
      icon: CheckCircle,
      color: "gold" as const,
      progress: dashboardData.metrics.totalTasks > 0 
        ? Math.round((dashboardData.metrics.completedTasks / dashboardData.metrics.totalTasks) * 100) 
        : 0,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Team Members",
      value: dashboardData.metrics.teamMembers,
      subtitle: "Active researchers",
      icon: Users,
      color: "blue" as const,
      trend: { value: 0, isPositive: true },
    },
    {
      title: "Ideas Submitted",
      value: dashboardData.metrics.ideasThisMonth,
      subtitle: "This month",
      icon: Lightbulb,
      color: "purple" as const,
      trend: { value: 0, isPositive: true },
    },
  ] : [];

  // Show loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 page-transition"
      >
        <div className="mb-8">
          <div className="h-12 bg-gray-200 rounded-lg w-1/2 animate-pulse mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Show error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 page-transition"
      >
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Loader2 className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">Unable to fetch dashboard metrics. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 page-transition"
    >
      {/* Welcome Section with Animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text heading-responsive">
              Welcome back{user?.firstName ? `, ${user.firstName}` : user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Here&apos;s an overview of your {dashboardData?.metrics?.labNames || 'lab'} activities
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Metrics Grid with Staggered Animation */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {metrics.map((metric, index) => (
          <AnimatedMetricCard 
            key={metric.title} 
            {...metric} 
            delay={index * 100}
          />
        ))}
      </div>

      {/* Recent Studies and Activity Feed with Animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <RecentStudies />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </motion.div>
    </motion.div>
  );
}