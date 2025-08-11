'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  MoreHorizontal, Check, X, Edit2, Trash2, Copy, 
  Archive, Calendar, User, Tag, AlertCircle, CheckCircle,
  Clock, Link2, MessageSquare, Paperclip, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useViewContext } from '@/lib/contexts/view-context';
import type { Project } from '@/types';
import { format } from 'date-fns';

interface EnhancedKanbanCardProps {
  project: Project;
  isDragging?: boolean;
  isSelected?: boolean;
  onUpdate?: (updates: Partial<Project>) => void;
  onDelete?: () => void;
  bucketColor?: string;
}

const STATUS_COLORS = {
  'PLANNING': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'IRB_SUBMISSION': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  'IRB_APPROVED': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'DATA_COLLECTION': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'ANALYSIS': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'MANUSCRIPT': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  'UNDER_REVIEW': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'PUBLISHED': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'ON_HOLD': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'CANCELLED': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const PRIORITY_ICONS = {
  'LOW': null,
  'MEDIUM': <AlertCircle className="h-3 w-3 text-yellow-500" />,
  'HIGH': <AlertCircle className="h-3 w-3 text-orange-500" />,
  'CRITICAL': <AlertCircle className="h-3 w-3 text-red-500" />,
};

export function EnhancedKanbanCard({
  project,
  isDragging,
  isSelected,
  onUpdate,
  onDelete,
  bucketColor = '#3B82F6',
}: EnhancedKanbanCardProps) {
  const { selectRecord, deselectRecord, cardSize } = useViewContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(project.name);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Setup sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCardDragging,
  } = useSortable({
    id: project.id,
    data: {
      type: 'card',
      project,
    },
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // Auto-focus input when editing
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);
  
  // Handle selection
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      deselectRecord(project.id);
    } else {
      selectRecord(project.id);
    }
  };
  
  // Handle title save
  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== project.name) {
      onUpdate?.({ name: editedTitle });
    }
    setIsEditing(false);
  };
  
  // Calculate task completion
  const completedTasks = project.tasks?.filter(t => t.status === 'COMPLETED').length || 0;
  const totalTasks = project.tasks?.length || 0;
  
  // Determine card size styles
  const cardSizeStyles = {
    small: 'p-2',
    medium: 'p-3',
    large: 'p-4',
  };
  
  return (
    <HoverCard open={isHovered && !isDragging && !isEditing}>
      <HoverCardTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={cn(
            "group bg-white dark:bg-gray-800 rounded-lg border transition-all cursor-move",
            cardSizeStyles[cardSize],
            isSelected && "ring-2 ring-blue-500 border-blue-500",
            isDragging && "opacity-50",
            isCardDragging && "shadow-lg",
            !isSelected && "border-gray-200 dark:border-gray-700 hover:shadow-md"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Color Bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
            style={{ backgroundColor: bucketColor }}
          />
          
          {/* Selection Checkbox */}
          <div className="flex items-start gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelect}
              className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="flex-1 min-w-0">
              {/* Title */}
              {isEditing ? (
                <Input
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setEditedTitle(project.name);
                      setIsEditing(false);
                    }
                  }}
                  className="h-6 text-sm font-medium p-0 border-0 focus-visible:ring-1"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h4
                  className="font-medium text-sm text-gray-900 dark:text-white truncate cursor-text hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  {project.name}
                </h4>
              )}
              
              {/* Status & Priority */}
              {cardSize !== 'small' && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", STATUS_COLORS[project.status || 'PLANNING'])}
                  >
                    {project.status?.replace('_', ' ')}
                  </Badge>
                  
                  {project.priority && PRIORITY_ICONS[project.priority] && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{PRIORITY_ICONS[project.priority]}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{project.priority} priority</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
              
              {/* Metadata */}
              {cardSize === 'large' && (
                <div className="mt-3 space-y-2">
                  {/* Due Date */}
                  {project.dueDate && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(project.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  
                  {/* Assignees */}
                  {project.assignees && project.assignees.length > 0 && (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-gray-400" />
                      <div className="flex -space-x-2">
                        {project.assignees.slice(0, 3).map((assignee) => (
                          <Avatar key={assignee.id} className="h-6 w-6 border-2 border-white dark:border-gray-800">
                            <AvatarImage src={assignee.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {assignee.initials || assignee.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project.assignees.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                            +{project.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Tasks Progress */}
                  {totalTasks > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <CheckCircle className="h-3 w-3" />
                      <span>{completedTasks}/{totalTasks} tasks</span>
                      <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open comments
                      }}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open attachments
                      }}
                    >
                      <Paperclip className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle star
                      }}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Card Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </HoverCardTrigger>
      
      {/* Hover Card Preview */}
      <HoverCardContent side="right" className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold">{project.name}</h4>
            {project.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {project.description}
              </p>
            )}
          </div>
          
          {project.oraNumber && (
            <div className="text-sm">
              <span className="font-medium">ORA Number:</span> {project.oraNumber}
            </div>
          )}
          
          {project.notes && (
            <div className="text-sm">
              <span className="font-medium">Notes:</span>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{project.notes}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}