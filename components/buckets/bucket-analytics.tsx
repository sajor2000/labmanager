'use client';

import { BarChart3, TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Bucket } from './bucket-card';

interface BucketAnalyticsProps {
  buckets: Bucket[];
}

export function BucketAnalytics({ buckets }: BucketAnalyticsProps) {
  // Calculate analytics
  const totalProjects = buckets.reduce((sum, b) => sum + b.projectCount, 0);
  const completedProjects = buckets.reduce((sum, b) => sum + b.completedProjects, 0);
  const activeMembers = new Set(buckets.flatMap(b => Array(b.activeMembers).fill(0))).size;
  const averageProgress = buckets.length > 0 
    ? Math.round(buckets.reduce((sum, b) => sum + b.progress, 0) / buckets.length)
    : 0;
  
  // Sort buckets by different metrics
  const bucketsByProjects = [...buckets].sort((a, b) => b.projectCount - a.projectCount);
  const bucketsByProgress = [...buckets].sort((a, b) => b.progress - a.progress);
  const bucketsByCompletion = [...buckets].sort((a, b) => {
    const aRate = a.projectCount > 0 ? (a.completedProjects / a.projectCount) * 100 : 0;
    const bRate = b.projectCount > 0 ? (b.completedProjects / b.projectCount) * 100 : 0;
    return bRate - aRate;
  });
  
  return (
    <div className="p-6 space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {buckets.length}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Buckets</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalProjects}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Projects</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {averageProgress}%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Progress</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeMembers}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Members</p>
        </div>
      </div>
      
      {/* Buckets by Projects */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Buckets by Project Count
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {bucketsByProjects.slice(0, 5).map((bucket) => (
            <div key={bucket.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: bucket.color }}
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  {bucket.name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32">
                  <Progress 
                    value={(bucket.projectCount / totalProjects) * 100} 
                    className="h-2"
                  />
                </div>
                <Badge variant="outline">
                  {bucket.projectCount} projects
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Progress Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Buckets by Progress
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {bucketsByProgress.slice(0, 5).map((bucket) => (
              <div key={bucket.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {bucket.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {bucket.progress}%
                  </span>
                </div>
                <Progress value={bucket.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>
        
        {/* By Completion Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Buckets by Completion Rate
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {bucketsByCompletion.slice(0, 5).map((bucket) => {
              const completionRate = bucket.projectCount > 0 
                ? Math.round((bucket.completedProjects / bucket.projectCount) * 100)
                : 0;
              
              return (
                <div key={bucket.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {bucket.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {bucket.completedProjects}/{bucket.projectCount}
                    </span>
                    <Badge 
                      variant={completionRate >= 75 ? 'default' : 'outline'}
                      className={completionRate >= 75 ? 'bg-green-500' : ''}
                    >
                      {completionRate}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Timeline View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {buckets
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 5)
            .map((bucket) => (
              <div key={bucket.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: bucket.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {bucket.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Updated {new Date(bucket.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {bucket.projectCount} projects
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}