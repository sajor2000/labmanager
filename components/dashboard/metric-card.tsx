"use client";

import { memo } from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "amber" | "indigo" | "pink";
  progress?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorVariants = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    progress: "bg-blue-500",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/20",
    icon: "text-green-600 dark:text-green-400",
    progress: "bg-green-500",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    progress: "bg-purple-500",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/20",
    icon: "text-amber-600 dark:text-amber-400",
    progress: "bg-amber-500",
  },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-900/20",
    icon: "text-indigo-600 dark:text-indigo-400",
    progress: "bg-indigo-500",
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-900/20",
    icon: "text-pink-600 dark:text-pink-400",
    progress: "bg-pink-500",
  },
};

export const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  progress,
  trend,
}: MetricCardProps) {
  const variant = colorVariants[color];

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-start justify-between mb-2">
        <div className={cn("rounded-lg p-2", variant.bg)}>
          <Icon className={cn("h-5 w-5", variant.icon)} />
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}>
              {trend.value}%
            </span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      </div>
      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={cn("h-1.5 rounded-full transition-all", variant.progress)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});