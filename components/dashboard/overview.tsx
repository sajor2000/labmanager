"use client";

import { useState, useEffect } from "react";
import { AnimatedMetricCard } from "./animated-metric-card";
import { RecentStudies } from "./recent-studies";
import { ActivityFeed } from "./activity-feed";
import { Building, Beaker, FolderOpen, CheckCircle, TrendingUp, Users, Calendar, Lightbulb } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { motion } from "framer-motion";

export function DashboardOverview() {
  const { user } = useCurrentUser();
  const [metrics, setMetrics] = useState([
    {
      title: "Total Labs",
      value: 3,
      subtitle: "Research laboratories",
      icon: Building,
      color: "green" as const,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Active Studies",
      value: 24,
      subtitle: "out of 42 total",
      icon: Beaker,
      color: "gold" as const,
      progress: 57,
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Project Buckets",
      value: 12,
      subtitle: "Organized collections",
      icon: FolderOpen,
      color: "blue" as const,
      trend: { value: 3, isPositive: true },
    },
    {
      title: "Tasks Progress",
      value: "186/245",
      subtitle: "Completed tasks",
      icon: CheckCircle,
      color: "gold" as const,
      progress: 76,
      trend: { value: 15, isPositive: true },
    },
    {
      title: "Team Members",
      value: 18,
      subtitle: "Active researchers",
      icon: Users,
      color: "blue" as const,
      trend: { value: 2, isPositive: false },
    },
    {
      title: "Ideas Submitted",
      value: 47,
      subtitle: "This month",
      icon: Lightbulb,
      color: "purple" as const,
      trend: { value: 23, isPositive: true },
    },
  ]);

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
          Welcome back{user?.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Here&apos;s an overview of your lab activities
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