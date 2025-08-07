'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, User, FolderOpen, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Study } from '@/types/study';
import { cn } from '@/lib/utils';

interface StudyCardProps {
  study: Study;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onClick: () => void;
}

const statusColors = {
  planning: 'bg-blue-500',
  active: 'bg-green-500',
  completed: 'bg-gray-500',
  'on-hold': 'bg-yellow-500',
};

const priorityColors = {
  low: 'border-gray-300',
  medium: 'border-yellow-300',
  high: 'border-orange-300',
  critical: 'border-red-300',
};

export function StudyCard({ study, isSelected, onSelect, onClick }: StudyCardProps) {
  return (
    <Card 
      className={cn(
        "relative cursor-pointer transition-all hover:shadow-lg",
        isSelected && "ring-2 ring-primary",
        priorityColors[study.priority || 'medium']
      )}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('[data-checkbox]')) {
          onClick();
        }
      }}
    >
      <div className="absolute top-3 right-3 z-10" data-checkbox>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      <CardHeader className="pb-3">
        <div className="pr-8">
          <CardTitle className="text-base line-clamp-2">{study.name}</CardTitle>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            <div className={cn("w-2 h-2 rounded-full mr-1", statusColors[study.status || 'planning'])} />
            {study.status}
          </Badge>
          {study.oraNumber && (
            <Badge variant="outline" className="text-xs">
              {study.oraNumber}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {study.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {study.description}
          </p>
        )}
        
        <div className="space-y-2 text-xs text-muted-foreground">
          {study.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Due {format(new Date(study.dueDate), 'MMM d, yyyy')}</span>
            </div>
          )}
          
          {study.bucketId && (
            <div className="flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              <span className="truncate">Bucket</span>
            </div>
          )}
          
          {study.assignees && study.assignees.length > 0 && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{study.assignees.length} assignee{study.assignees.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        
        {study.priority === 'critical' && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>Critical Priority</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}