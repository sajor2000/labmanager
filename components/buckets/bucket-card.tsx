'use client';

import { useState } from 'react';
import { MoreVertical, Folder, Archive, Edit3, Trash2, TrendingUp, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { showToast } from '@/components/ui/toast';

export interface Bucket {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  position: number;
  projectCount: number;
  completedProjects: number;
  activeMembers: number;
  progress: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Nested bucket support
  parentBucketId?: string;
  childBuckets?: Bucket[];
  depth?: number;
  isExpanded?: boolean;
  // Rules support
  hasActiveRules?: boolean;
  rulesCount?: number;
}

interface BucketCardProps {
  bucket: Bucket;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onViewProjects?: () => void;
  onConfigureRules?: () => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  selectionMode?: boolean;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  folder: Folder,
  archive: Archive,
  trending: TrendingUp,
  users: Users,
};

export function BucketCard({ 
  bucket, 
  onEdit, 
  onArchive, 
  onDelete, 
  onViewProjects,
  onConfigureRules,
  isDragging = false,
  isSelected = false,
  onSelectionChange,
  selectionMode = false
}: BucketCardProps) {
  const Icon = iconMap[bucket.icon] || Folder;
  
  const handleArchive = () => {
    if (onArchive) {
      onArchive();
      showToast({
        type: 'success',
        title: 'Bucket archived',
        message: `"${bucket.name}" has been archived`,
      });
    }
  };
  
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${bucket.name}"? This action cannot be undone.`)) {
      if (onDelete) {
        onDelete();
        showToast({
          type: 'success',
          title: 'Bucket deleted',
          message: `"${bucket.name}" has been deleted`,
        });
      }
    }
  };
  
  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode && onSelectionChange) {
      e.stopPropagation();
      onSelectionChange(!isSelected);
    } else if (onViewProjects) {
      onViewProjects();
    }
  };

  return (
    <div
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-2",
        isDragging && "opacity-50 rotate-2 scale-105",
        !bucket.isActive && "opacity-60",
        isSelected 
          ? "border-blue-500 dark:border-blue-400 shadow-lg" 
          : "border-gray-200 dark:border-gray-700"
      )}
      onClick={handleCardClick}
    >
      {/* Color bar at top */}
      <div 
        className="absolute inset-x-0 top-0 h-1 rounded-t-lg"
        style={{ backgroundColor: bucket.color }}
      />
      
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectionChange?.(!isSelected);
            }}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      
      {/* Card Content */}
      <div className={cn("p-6 pt-4", selectionMode && "pl-12")}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${bucket.color}20` }}
            >
              <Icon 
                className="h-5 w-5"
                style={{ color: bucket.color }}
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {bucket.name}
              </h3>
              {bucket.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                  {bucket.description}
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Bucket
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onViewProjects?.();
              }}>
                <Folder className="h-4 w-4 mr-2" />
                View Projects
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onConfigureRules?.();
              }}>
                <Zap className="h-4 w-4 mr-2" />
                Configure Rules
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleArchive();
              }}>
                <Archive className="h-4 w-4 mr-2" />
                Archive Bucket
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Bucket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Projects</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {bucket.projectCount}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Progress
              </span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {bucket.progress}%
              </span>
            </div>
            <Progress value={bucket.progress} className="h-2" />
          </div>
          
          {/* Bottom Stats */}
          <div className="flex items-center justify-between pt-2">
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {bucket.activeMembers} members
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                bucket.completedProjects > 0 ? "text-green-600 dark:text-green-400" : ""
              )}
            >
              {bucket.completedProjects}/{bucket.projectCount} completed
            </Badge>
          </div>
          
          {/* Rules Indicator */}
          {bucket.hasActiveRules && (
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {bucket.rulesCount || 0} active rule{(bucket.rulesCount || 0) !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Archived Badge */}
        {!bucket.isActive && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              <Archive className="h-3 w-3 mr-1" />
              Archived
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}