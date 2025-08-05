"use client";

import { memo } from "react";
import { FileText, CheckCircle, Users, AlertCircle, Clock, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  title: string;
  action: string;
  time: string;
}

interface Props {
  activities?: Activity[];
}

const getActivityIcon = (action: string): { icon: LucideIcon; color: string } => {
  if (action.includes('planning')) {
    return { icon: FileText, color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20" };
  }
  if (action.includes('approved')) {
    return { icon: CheckCircle, color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20" };
  }
  if (action.includes('submission')) {
    return { icon: AlertCircle, color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20" };
  }
  if (action.includes('collection')) {
    return { icon: FileText, color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20" };
  }
  if (action.includes('analysis')) {
    return { icon: CheckCircle, color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20" };
  }
  if (action.includes('manuscript') || action.includes('published')) {
    return { icon: FileText, color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20" };
  }
  if (action.includes('hold') || action.includes('cancelled')) {
    return { icon: AlertCircle, color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20" };
  }
  return { icon: Clock, color: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20" };
};

const ActivityItem = memo(function ActivityItem({ activity }: { activity: Activity }) {
  const { icon: Icon, color } = getActivityIcon(activity.action);
  const colors = color.split(" ");
  
  return (
    <div className="flex items-start space-x-3">
      <div className={cn("rounded-lg p-2", colors[1], colors[2])}>
        <Icon className={cn("h-4 w-4", colors[0], colors[3])} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {activity.title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {activity.action}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          {activity.time}
        </p>
      </div>
    </div>
  );
});

export function ActivityFeed({ activities = [] }: Props) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Recent Activity
      </h2>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No recent activity
          </div>
        ) : (
          activities.slice(0, 5).map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>

      <button className="mt-4 w-full rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
        View all activity
      </button>
    </div>
  );
}