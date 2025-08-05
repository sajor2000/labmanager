'use client';

import { BarChart3, Clock, TrendingUp, AlertCircle, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface TeamWorkloadViewProps {
  members: Array<User & {
    taskCount: number;
    completedTasks: number;
    activeProjects: number;
    workload: number;
    upcomingDeadlines: number;
  }>;
}

export function TeamWorkloadView({ members }: TeamWorkloadViewProps) {
  // Sort members by workload
  const sortedMembers = [...members].sort((a, b) => b.workload - a.workload);
  
  // Calculate team stats
  const averageWorkload = members.reduce((sum, m) => sum + m.workload, 0) / members.length;
  const overloadedCount = members.filter(m => m.workload > 80).length;
  const availableCount = members.filter(m => m.workload < 60).length;
  
  return (
    <div className="p-6">
      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {members.length}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Team Members</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(averageWorkload)}%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Workload</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {availableCount}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overloadedCount}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Overloaded</p>
        </div>
      </div>
      
      {/* Workload Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Team Capacity Distribution
          </h3>
        </div>
        
        <div className="p-4 space-y-4">
          {sortedMembers.map((member) => {
            const workloadColor = 
              member.workload > 80 ? 'bg-red-500' : 
              member.workload > 60 ? 'bg-yellow-500' : 
              'bg-green-500';
            
            const statusColor = 
              member.workload > 80 ? 'text-red-600 dark:text-red-400' : 
              member.workload > 60 ? 'text-yellow-600 dark:text-yellow-400' : 
              'text-green-600 dark:text-green-400';
            
            return (
              <div key={member.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-32 truncate">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.capacity} hrs/week
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {member.activeProjects} projects
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {member.taskCount} tasks
                      </Badge>
                      {member.upcomingDeadlines > 0 && (
                        <Badge variant="outline" className="text-xs text-orange-600 dark:text-orange-400">
                          {member.upcomingDeadlines} deadlines
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-sm font-medium', statusColor)}>
                      {member.workload}%
                    </span>
                    {member.workload > 80 && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Progress value={member.workload} className="h-2" />
                  <div className="absolute inset-0 flex">
                    <div className="w-[60%] border-r-2 border-yellow-500 dark:border-yellow-400" />
                    <div className="w-[20%] border-r-2 border-red-500 dark:border-red-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="p-4 border-t dark:border-gray-700">
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">Available (&lt;60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">Busy (60-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">Overloaded (&gt;80%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}