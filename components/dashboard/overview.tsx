"use client";

import { useState, useEffect } from "react";
import { AnimatedMetricCard } from "./animated-metric-card";
import { RecentStudies } from "./recent-studies";
import { ActivityFeed } from "./activity-feed";
import { Building, Beaker, FolderOpen, CheckCircle, TrendingUp, Users, Calendar, Lightbulb, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { motion } from "framer-motion";

export function DashboardOverview() {
  const { user } = useCurrentUser();
  const { data: dashboardData, isLoading, error } = useDashboardMetrics();

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
        <h1 className="text-4xl font-bold gradient-text heading-responsive">
          Welcome back{user?.firstName ? `, ${user.firstName}` : user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Here&apos;s an overview of your {user?.labs?.[0]?.name || 'lab'} activities
        </p>
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