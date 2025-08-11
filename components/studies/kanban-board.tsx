'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Calendar, 
  Users, 
  Folder,
  GripVertical,
  Plus,
  Filter,
  Settings2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { getStatusColor, getBucketColor } from '@/lib/constants/colors';

interface Study {
  id: string;
  title: string;
  oraNumber?: string | null;
  status: string;
  priority: string;
  studyType: string;
  dueDate?: Date | null;
  bucket?: {
    id: string;
    title: string;
    color: string;
  };
  assignees?: {
    user: {
      id: string;
      name: string;
      initials: string;
      avatar?: string;
    };
  }[];
  progress?: number;
}

interface KanbanBoardProps {
  studies: Study[];
  onStudyUpdate?: (studyId: string, updates: Partial<Study>) => void;
  onStudyClick?: (study: Study) => void;
  onCreateStudy?: (status: string) => void;
  className?: string;
}

const KANBAN_COLUMNS = [
  { id: 'planning', title: 'Planning', limit: null },
  { id: 'irb-submission', title: 'IRB Submission', limit: 5 },
  { id: 'irb-approved', title: 'IRB Approved', limit: null },
  { id: 'data-collection', title: 'Data Collection', limit: 10 },
  { id: 'analysis', title: 'Analysis', limit: null },
  { id: 'manuscript', title: 'Manuscript', limit: null },
  { id: 'under-review', title: 'Under Review', limit: null },
  { id: 'published', title: 'Published', limit: null },
];

export function KanbanBoard({ 
  studies, 
  onStudyUpdate, 
  onStudyClick,
  onCreateStudy,
  className 
}: KanbanBoardProps) {
  const [draggedStudy, setDraggedStudy] = useState<Study | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [columnSettings, setColumnSettings] = useState<Record<string, { collapsed: boolean }>>({});
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Check theme on client side only
    setIsDark(document.documentElement.classList.contains('dark'));
    
    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Group studies by status
  const studiesByStatus = studies.reduce((acc, study) => {
    const status = study.status.toLowerCase().replace(/\s+/g, '-');
    if (!acc[status]) acc[status] = [];
    acc[status].push(study);
    return acc;
  }, {} as Record<string, Study[]>);

  const handleDragStart = (e: React.DragEvent, study: Study) => {
    setDraggedStudy(study);
    e.dataTransfer.effectAllowed = 'move';
    // Add dragging class to the element
    const element = e.currentTarget as HTMLElement;
    element.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.classList.remove('dragging');
    setDraggedStudy(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedStudy && onStudyUpdate) {
      onStudyUpdate(draggedStudy.id, { status: newStatus });
    }
  };

  const toggleColumnCollapse = (columnId: string) => {
    setColumnSettings(prev => ({
      ...prev,
      [columnId]: { collapsed: !prev[columnId]?.collapsed }
    }));
  };

  return (
    <div className={cn('flex gap-4 p-6 overflow-x-auto custom-scrollbar', className)}>
      {KANBAN_COLUMNS.map((column) => {
        const columnStudies = studiesByStatus[column.id] || [];
        const isCollapsed = columnSettings[column.id]?.collapsed;
        const colors = getStatusColor(column.id, isDark) || { bg: '#F5F5F5', text: '#616161', border: '#E0E0E0' };
        const isOverLimit = column.limit && columnStudies.length > column.limit;

        return (
          <div
            key={column.id}
            className={cn(
              'flex-shrink-0 transition-all duration-300',
              isCollapsed ? 'w-12' : 'w-80'
            )}
          >
            {/* Column Header */}
            <div 
              className={cn(
                'mb-4 p-3 rounded-lg transition-all duration-200',
                dragOverColumn === column.id && 'ring-2 ring-blue-400'
              )}
              style={{ backgroundColor: colors.bg }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleColumnCollapse(column.id)}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                  >
                    <GripVertical className="h-4 w-4" style={{ color: colors.text }} />
                  </button>
                  {!isCollapsed && (
                    <>
                      <h3 
                        className="font-semibold text-sm"
                        style={{ color: colors.text }}
                      >
                        {column.title}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          'text-xs',
                          isOverLimit && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        )}
                      >
                        {columnStudies.length}
                        {column.limit && ` / ${column.limit}`}
                      </Badge>
                    </>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onCreateStudy?.(column.title)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Set WIP Limit</DropdownMenuItem>
                        <DropdownMenuItem>Customize Color</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Clear Column</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>

            {/* Column Content */}
            <div
              className={cn(
                'space-y-3 min-h-[200px] p-2 rounded-lg transition-all duration-200',
                dragOverColumn === column.id && 'bg-blue-50 dark:bg-blue-900/20',
                isCollapsed && 'hidden'
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.title)}
            >
              {columnStudies.map((study, index) => (
                <StudyCard
                  key={study.id}
                  study={study}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onClick={() => onStudyClick?.(study)}
                  index={index}
                />
              ))}
              
              {columnStudies.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                  <p className="text-sm">No studies</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => onCreateStudy?.(column.title)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Study
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface StudyCardProps {
  study: Study;
  onDragStart: (e: React.DragEvent, study: Study) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onClick: () => void;
  index: number;
}

function StudyCard({ study, onDragStart, onDragEnd, onClick, index }: StudyCardProps) {
  const bucketColor = study.bucket ? study.bucket.color : getBucketColor(0);
  
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, study)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'p-4 cursor-pointer card-hover draggable',
        'border-l-4 animate-slide-in'
      )}
      style={{ 
        borderLeftColor: bucketColor,
        animationDelay: `${index * 50}ms`
      }}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
            {study.title}
          </h4>
          {study.oraNumber && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {study.oraNumber}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit Study</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Study Type & Priority */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-xs">
          {study.studyType}
        </Badge>
        <PriorityBadge priority={study.priority} size="sm" />
      </div>

      {/* Progress Bar */}
      {study.progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">Progress</span>
            <span className="font-medium">{study.progress}%</span>
          </div>
          <div className="progress-animated h-2">
            <div 
              className="progress-bar gradient-primary"
              style={{ width: `${study.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Card Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t dark:border-gray-700">
        <div className="flex items-center gap-2">
          {study.bucket && (
            <div className="flex items-center gap-1">
              <Folder className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {study.bucket.title}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {study.dueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              {format(new Date(study.dueDate), 'MMM d')}
            </div>
          )}
          
          {study.assignees && study.assignees.length > 0 && (
            <div className="flex -space-x-2">
              {study.assignees.slice(0, 3).map((assignee) => (
                <Avatar key={assignee.user.id} className="h-6 w-6 border-2 border-white dark:border-gray-800">
                  <AvatarImage src={assignee.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {assignee.user.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
              {study.assignees.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                  +{study.assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}