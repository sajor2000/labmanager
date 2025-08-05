"use client";

import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "amber";
  progress?: number;
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
};

export const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  progress,
}: MetricCardProps) {
  const variant = colorVariants[color];

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
        <div className={cn("rounded-lg p-3", variant.bg)}>
          <Icon className={cn("h-6 w-6", variant.icon)} />
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={cn("h-2 rounded-full transition-all", variant.progress)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});