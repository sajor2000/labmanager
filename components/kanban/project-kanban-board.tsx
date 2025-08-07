'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { ProjectCard } from './project-card';
import { useKanbanStore, KANBAN_COLUMNS, type ProjectStatus } from '@/lib/store/kanban-store';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ProjectKanbanBoard() {
  const {
    columns,
    viewMode,
    filters,
    expandedProjects,
    isDragging,
    setIsDragging,
    moveProject,
  } = useKanbanStore();

  const [activeProject, setActiveProject] = useState<any>(null);
  const [activeOverColumn, setActiveOverColumn] = useState<ProjectStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // Find the project being dragged
    for (const [status, projects] of columns) {
      const project = projects.find(p => p.id === active.id);
      if (project) {
        setActiveProject(project);
        setIsDragging(true);
        break;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    
    if (over) {
      // Check if over a column
      const columnStatus = KANBAN_COLUMNS.find(col => col.status === over.id)?.status;
      setActiveOverColumn(columnStatus || null);
    } else {
      setActiveOverColumn(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveProject(null);
    setActiveOverColumn(null);
    setIsDragging(false);
    
    if (!over) return;
    
    // Check if dropped on a column
    const targetStatus = KANBAN_COLUMNS.find(col => col.status === over.id)?.status;
    if (targetStatus && active.id !== targetStatus) {
      await moveProject(active.id as string, targetStatus);
    }
  };

  const handleDragCancel = () => {
    setActiveProject(null);
    setActiveOverColumn(null);
    setIsDragging(false);
  };

  // Filter projects based on active filters
  const getFilteredProjects = (projects: any[]) => {
    return projects.filter(project => {
      // Filter by bucket
      if (filters.bucketIds.length > 0 && !filters.bucketIds.includes(project.bucketId)) {
        return false;
      }
      
      // Filter by assignees
      if (filters.assigneeIds.length > 0) {
        const hasAssignee = project.assigneeIds?.some((id: string) => 
          filters.assigneeIds.includes(id)
        );
        if (!hasAssignee) return false;
      }
      
      // Filter by priority
      if (filters.priority.length > 0 && !filters.priority.includes(project.priority)) {
        return false;
      }
      
      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          project.name?.toLowerCase().includes(query) ||
          project.oraNumber?.toLowerCase().includes(query) ||
          project.notes?.toLowerCase().includes(query)
        );
      }
      
      // Hide completed if filter is active
      if (filters.hideCompleted && project.status === 'PUBLISHED') {
        return false;
      }
      
      return true;
    });
  };

  const containerClasses = cn(
    'flex h-full',
    viewMode === 'compact' ? 'gap-3 p-3' : 'gap-6 p-6',
    'overflow-x-auto overflow-y-hidden'
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={containerClasses}>
        <AnimatePresence mode="popLayout">
          {KANBAN_COLUMNS.map((column, index) => {
            const columnProjects = getFilteredProjects(
              columns.get(column.status) || []
            );
            
            return (
              <motion.div
                key={column.status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  ease: 'easeOut'
                }}
                className="flex-shrink-0"
                style={{
                  width: viewMode === 'compact' ? '280px' : '350px',
                }}
              >
                <KanbanColumn
                  status={column.status}
                  title={column.title}
                  color={column.color}
                  icon={column.icon}
                  description={column.description}
                  projects={columnProjects}
                  isActive={activeOverColumn === column.status}
                  viewMode={viewMode}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeProject && (
          <div className="opacity-90">
            <ProjectCard
              project={activeProject}
              isExpanded={false}
              viewMode={viewMode}
              isDragging={true}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}