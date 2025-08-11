'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  MoreHorizontal, Plus, Edit2, Trash2, ChevronDown, 
  ChevronUp, Eye, EyeOff, Copy, Archive, Palette,
  Settings2, Filter, ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EnhancedKanbanCard } from './enhanced-kanban-card';
import type { Project, Bucket } from '@/types';
import { useViewContext } from '@/lib/contexts/view-context';

interface EnhancedKanbanColumnProps {
  bucket: Bucket;
  projects: Project[];
  isDropTarget?: boolean;
  onProjectCreate?: (project: Partial<Project>) => Promise<void>;
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => Promise<void>;
  onBucketUpdate?: (updates: Partial<Bucket>) => Promise<void>;
  onBucketDelete?: () => Promise<void>;
}

const BUCKET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
];

export function EnhancedKanbanColumn({
  bucket,
  projects,
  isDropTarget,
  onProjectCreate,
  onProjectUpdate,
  onBucketUpdate,
  onBucketDelete,
}: EnhancedKanbanColumnProps) {
  const { selectedRecordIds, cardSize } = useViewContext();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(bucket.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'priority'>('name');
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  
  // Setup sortable for the column (if implementing column reordering)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isColumnDragging,
  } = useSortable({
    id: bucket.id,
    data: {
      type: 'column',
      bucket,
    },
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // Auto-focus input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);
  
  // Handle title save
  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== bucket.title) {
      await onBucketUpdate?.({ title: editedTitle });
    }
    setIsEditingTitle(false);
  };
  
  // Handle card creation
  const handleCreateCard = async () => {
    if (!newCardTitle.trim()) return;
    
    await onProjectCreate?.({
      name: newCardTitle,
      bucketId: bucket.id,
      status: 'PLANNING',
      priority: 'MEDIUM',
    });
    
    setNewCardTitle('');
    setIsAddingCard(false);
  };
  
  // Filter and sort projects
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(filterText.toLowerCase())
  );
  
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'priority':
        const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        return (priorityOrder[a.priority || 'MEDIUM'] || 2) - (priorityOrder[b.priority || 'MEDIUM'] || 2);
      default:
        return 0;
    }
  });
  
  // Calculate stats
  const completedCount = projects.filter(p => p.status === 'PUBLISHED' || p.status === 'COMPLETED').length;
  const totalCount = projects.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-80 flex-shrink-0 flex flex-col bg-gray-50 dark:bg-gray-900 rounded-lg transition-all",
        isDropTarget && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950",
        isColumnDragging && "opacity-50"
      )}
    >
      {/* Column Header */}
      <div
        className="p-4 border-b border-gray-200 dark:border-gray-700"
        style={{ borderTopColor: bucket.color, borderTopWidth: '3px' }}
      >
        <div className="flex items-center justify-between mb-2">
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') {
                  setEditedTitle(bucket.title);
                  setIsEditingTitle(false);
                }
              }}
              className="h-7 font-semibold"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h3 
                className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setIsEditingTitle(true)}
              >
                {bucket.title}
              </h3>
              <Badge variant="secondary" className="h-5">
                {totalCount}
              </Badge>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Palette className="h-4 w-4 mr-2" />
                    Color
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {BUCKET_COLORS.map((color) => (
                      <DropdownMenuItem
                        key={color.value}
                        onClick={() => onBucketUpdate?.({ color: color.value })}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.name}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort by
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setSortBy('name')}>
                      Name {sortBy === 'name' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('date')}>
                      Date created {sortBy === 'date' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('priority')}>
                      Priority {sortBy === 'priority' && '✓'}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />
                
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
                  onClick={() => onBucketDelete?.()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{completedCount} of {totalCount} complete</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      <Collapsible open={!isCollapsed}>
        <CollapsibleContent>
          {/* Column Content */}
          <ScrollArea className="flex-1 p-2" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <SortableContext
              items={sortedProjects.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sortedProjects.map((project) => (
                  <EnhancedKanbanCard
                    key={project.id}
                    project={project}
                    isSelected={selectedRecordIds.includes(project.id)}
                    onUpdate={(updates) => onProjectUpdate?.(project.id, updates)}
                    bucketColor={bucket.color}
                  />
                ))}
                
                {/* Add Card Form */}
                {isAddingCard ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <Input
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Enter card title..."
                      className="mb-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateCard();
                        if (e.key === 'Escape') {
                          setIsAddingCard(false);
                          setNewCardTitle('');
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCreateCard}>
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingCard(false);
                          setNewCardTitle('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setIsAddingCard(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add a card
                  </Button>
                )}
              </div>
            </SortableContext>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}