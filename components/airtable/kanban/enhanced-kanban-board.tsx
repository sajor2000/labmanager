'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  MeasuringStrategy,
  defaultDropAnimationSideEffects,
  DragMoveEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useViewContext } from '@/lib/contexts/view-context';
import { EnhancedKanbanColumn } from './enhanced-kanban-column';
import { EnhancedKanbanCard } from './enhanced-kanban-card';
import type { Project, Bucket } from '@/types';

interface EnhancedKanbanBoardProps {
  buckets: Bucket[];
  projects: Project[];
  onProjectMove?: (projectId: string, newBucketId: string, newPosition?: number) => Promise<void>;
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => Promise<void>;
  onBucketCreate?: (bucket: Partial<Bucket>) => Promise<void>;
  onBucketUpdate?: (bucketId: string, updates: Partial<Bucket>) => Promise<void>;
  onBucketDelete?: (bucketId: string) => Promise<void>;
  className?: string;
}

export function EnhancedKanbanBoard({
  buckets: initialBuckets,
  projects: initialProjects,
  onProjectMove,
  onProjectUpdate,
  onBucketCreate,
  onBucketUpdate,
  onBucketDelete,
  className,
}: EnhancedKanbanBoardProps) {
  const { selectedRecordIds, selectRecord, deselectRecord, clearSelection } = useViewContext();
  
  // State
  const [buckets, setBuckets] = useState(initialBuckets);
  const [projects, setProjects] = useState(initialProjects);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [isDraggingMultiple, setIsDraggingMultiple] = useState(false);
  const [isAddingBucket, setIsAddingBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  
  // Refs for auto-scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState({ x: 0, y: 0 });
  
  // Enhanced drag sensors with better touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Auto-scroll logic
  useEffect(() => {
    if (!scrollContainerRef.current || (autoScrollSpeed.x === 0 && autoScrollSpeed.y === 0)) {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }
    
    autoScrollIntervalRef.current = setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += autoScrollSpeed.x;
        scrollContainerRef.current.scrollTop += autoScrollSpeed.y;
      }
    }, 16); // ~60fps
    
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [autoScrollSpeed]);
  
  // Calculate auto-scroll speed based on cursor position
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const { x, y } = event.delta;
    
    const SCROLL_THRESHOLD = 100;
    const MAX_SCROLL_SPEED = 15;
    
    let scrollX = 0;
    let scrollY = 0;
    
    // Horizontal scrolling
    const mouseX = event.activatorEvent.clientX;
    if (mouseX < rect.left + SCROLL_THRESHOLD) {
      const distance = rect.left + SCROLL_THRESHOLD - mouseX;
      scrollX = -Math.min(MAX_SCROLL_SPEED, distance / 10);
    } else if (mouseX > rect.right - SCROLL_THRESHOLD) {
      const distance = mouseX - (rect.right - SCROLL_THRESHOLD);
      scrollX = Math.min(MAX_SCROLL_SPEED, distance / 10);
    }
    
    // Vertical scrolling
    const mouseY = event.activatorEvent.clientY;
    if (mouseY < rect.top + SCROLL_THRESHOLD) {
      const distance = rect.top + SCROLL_THRESHOLD - mouseY;
      scrollY = -Math.min(MAX_SCROLL_SPEED, distance / 10);
    } else if (mouseY > rect.bottom - SCROLL_THRESHOLD) {
      const distance = mouseY - (rect.bottom - SCROLL_THRESHOLD);
      scrollY = Math.min(MAX_SCROLL_SPEED, distance / 10);
    }
    
    setAutoScrollSpeed({ x: scrollX, y: scrollY });
  }, []);
  
  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Check if dragging a selected card
    if (selectedRecordIds.includes(active.id as string)) {
      setIsDraggingMultiple(true);
    } else {
      // Clear selection and select only the dragged item
      clearSelection();
      selectRecord(active.id as string);
      setIsDraggingMultiple(false);
    }
  }, [selectedRecordIds, clearSelection, selectRecord]);
  
  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
  }, []);
  
  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);
    setAutoScrollSpeed({ x: 0, y: 0 });
    setIsDraggingMultiple(false);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the source and destination
    const activeProject = projects.find(p => p.id === activeId);
    if (!activeProject) return;
    
    // Determine destination bucket
    let destBucketId: string;
    let destPosition: number | undefined;
    
    if (buckets.find(b => b.id === overId)) {
      // Dropped on a bucket
      destBucketId = overId;
    } else {
      // Dropped on a card - find its bucket
      const overProject = projects.find(p => p.id === overId);
      if (!overProject) return;
      destBucketId = overProject.bucketId!;
      
      // Calculate position
      const bucketProjects = projects
        .filter(p => p.bucketId === destBucketId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      const overIndex = bucketProjects.findIndex(p => p.id === overId);
      destPosition = overIndex;
    }
    
    // Move single or multiple cards
    if (isDraggingMultiple) {
      // Move all selected cards
      const selectedProjects = projects.filter(p => selectedRecordIds.includes(p.id));
      
      for (const project of selectedProjects) {
        if (project.bucketId !== destBucketId) {
          await onProjectMove?.(project.id, destBucketId, destPosition);
          
          // Update local state optimistically
          setProjects(prev => prev.map(p =>
            p.id === project.id
              ? { ...p, bucketId: destBucketId, position: destPosition }
              : p
          ));
        }
      }
    } else {
      // Move single card
      if (activeProject.bucketId !== destBucketId) {
        await onProjectMove?.(activeId, destBucketId, destPosition);
        
        // Update local state optimistically
        setProjects(prev => prev.map(p =>
          p.id === activeId
            ? { ...p, bucketId: destBucketId, position: destPosition }
            : p
        ));
      }
    }
  }, [projects, buckets, isDraggingMultiple, selectedRecordIds, onProjectMove]);
  
  // Handle creating a new bucket
  const handleCreateBucket = useCallback(async () => {
    if (!newBucketName.trim()) return;
    
    const newBucket: Partial<Bucket> = {
      title: newBucketName,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      order: buckets.length,
    };
    
    await onBucketCreate?.(newBucket);
    
    // Optimistically add to state
    setBuckets(prev => [...prev, { 
      ...newBucket, 
      id: `temp-${Date.now()}`,
      studyIds: [],
      labId: 'current-lab',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Bucket]);
    
    setNewBucketName('');
    setIsAddingBucket(false);
  }, [newBucketName, buckets.length, onBucketCreate]);
  
  // Group projects by bucket
  const projectsByBucket = buckets.reduce((acc, bucket) => {
    acc[bucket.id] = projects
      .filter(p => p.bucketId === bucket.id)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    return acc;
  }, {} as Record<string, Project[]>);
  
  // Get active item for drag overlay
  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;
  
  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Board Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden"
        onDragMove={handleDragMove}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          <div className="flex gap-4 p-6 min-w-fit h-full">
            <SortableContext
              items={buckets.map(b => b.id)}
              strategy={horizontalListSortingStrategy}
            >
              {/* Bucket Columns */}
              {buckets.map((bucket) => (
                <EnhancedKanbanColumn
                  key={bucket.id}
                  bucket={bucket}
                  projects={projectsByBucket[bucket.id] || []}
                  isDropTarget={overId === bucket.id}
                  onProjectUpdate={onProjectUpdate}
                  onBucketUpdate={(updates) => onBucketUpdate?.(bucket.id, updates)}
                  onBucketDelete={() => onBucketDelete?.(bucket.id)}
                />
              ))}
            </SortableContext>
            
            {/* Add Bucket Button/Form */}
            <div className="w-80 flex-shrink-0">
              {isAddingBucket ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-4">
                  <Input
                    value={newBucketName}
                    onChange={(e) => setNewBucketName(e.target.value)}
                    placeholder="Bucket name..."
                    className="mb-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateBucket();
                      if (e.key === 'Escape') {
                        setIsAddingBucket(false);
                        setNewBucketName('');
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateBucket}
                      disabled={!newBucketName.trim()}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingBucket(false);
                        setNewBucketName('');
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full h-full min-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  onClick={() => setIsAddingBucket(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Bucket
                </Button>
              )}
            </div>
          </div>
          
          {/* Drag Overlay */}
          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}
          >
            {activeProject && (
              <div className={cn(
                "transform rotate-3 scale-105",
                isDraggingMultiple && "relative"
              )}>
                <EnhancedKanbanCard
                  project={activeProject}
                  isDragging
                  isSelected={selectedRecordIds.includes(activeProject.id)}
                />
                {isDraggingMultiple && selectedRecordIds.length > 1 && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                    {selectedRecordIds.length}
                  </div>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}