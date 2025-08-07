'use client';

import { useState } from 'react';
import { MoreVertical, Mail, Award, Clock, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/components/ui/user-avatar';

interface TeamMemberCardProps {
  member: User & {
    taskCount?: number;
    completedTasks?: number;
    activeProjects?: number;
    workload?: number; // percentage
  };
  onEdit?: () => void;
  onViewDetails?: () => void;
}

const roleColors: Record<string, string> = {
  'Principal Investigator': 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  'Co-Principal Investigator': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
  'Research Member': 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  'Lab Administrator': 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  'External Collaborator': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function TeamMemberCard({ member, onEdit, onViewDetails }: TeamMemberCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const roleLabel = member.role; // Role is already properly formatted
  
  const workloadColor = member.workload 
    ? member.workload > 80 
      ? 'text-red-600 dark:text-red-400' 
      : member.workload > 60 
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-green-600 dark:text-green-400'
    : 'text-gray-600 dark:text-gray-400';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              userId={member.id}
              name={member.name}
              initials={member.initials}
              avatarUrl={member.avatarUrl}
              size="lg"
            />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {member.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {member.email}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger>
              <MoreVertical className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                Edit Member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Role Badge */}
        <div className="mb-4">
          <Badge className={cn('text-xs', roleColors[member.role])}>
            {roleLabel}
          </Badge>
        </div>
        
        {/* Expertise Tags */}
        {member.expertise && member.expertise.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Expertise</p>
            <div className="flex flex-wrap gap-1">
              {member.expertise.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {member.expertise.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{member.expertise.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Workload Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Capacity Utilization
            </span>
            <span className={cn('text-xs font-medium', workloadColor)}>
              {member.workload || 0}%
            </span>
          </div>
          <Progress value={member.workload || 0} className="h-2" />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Projects</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {member.activeProjects || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tasks</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {member.taskCount || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {member.completedTasks || 0}
            </p>
          </div>
        </div>
        
        {/* Availability Status */}
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {member.capacity} hrs/week
              </span>
            </div>
            {member.workload && member.workload > 80 && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Over capacity</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}