'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ProjectCard } from './project-card';
import { type ProjectWithTasks, type ProjectStatus, type KanbanViewMode } from '@/lib/store/kanban-store';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  ClipboardList, 
  FileText, 
  CheckCircle, 
  Database, 
  BarChart3, 
  Edit3, 
  Eye, 
  BookOpen,
  MoreVertical,
  Plus
} from 'lucide-react';

const statusIcons: Record<string, any> = {
  'clipboard-list': ClipboardList,
  'file-text': FileText,
  'check-circle': CheckCircle,
  'database': Database,
  'bar-chart': BarChart3,
  'edit': Edit3,
  'eye': Eye,
  'book-open': BookOpen,
};

interface KanbanColumnProps {
  status: ProjectStatus;
  title: string;
  color: string;
  icon?: string;
  description: string;
  projects: ProjectWithTasks[];
  isActive?: boolean;
  viewMode: KanbanViewMode;
}

export function KanbanColumn({
  status,
  title,
  color,
  icon,
  description,
  projects,
  isActive = false,
  viewMode,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const Icon = icon ? statusIcons[icon] : ClipboardList;

  const columnClasses = cn(
    'flex flex-col h-full rounded-xl transition-all duration-200',
    'bg-white dark:bg-gray-900 border',
    isOver || isActive
      ? 'border-blue-400 dark:border-blue-500 shadow-lg ring-2 ring-blue-400/20'
      : 'border-gray-200 dark:border-gray-800 shadow-sm',
    viewMode === 'compact' && 'rounded-lg'
  );

  const headerClasses = cn(
    'px-4 py-3 border-b',
    'bg-gradient-to-r from-white to-gray-50',
    'dark:from-gray-900 dark:to-gray-800',
    'dark:border-gray-800'
  );

  const getTaskCount = () => {
    return projects.reduce((sum, project) => sum + (project.tasks?.length || 0), 0);
  };

  return (
    <div ref={setNodeRef} className={columnClasses}>
      {/* Column Header */}
      <div className={headerClasses}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <div 
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon 
                className="h-4 w-4" 
                style={{ color }}
              />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {projects.length}
            </span>
          </div>
          
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        
        {viewMode !== 'compact' && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        
        {/* Quick Stats */}
        <div className="flex items-center space-x-3 mt-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            {getTaskCount()} tasks
          </span>
          {projects.length > 0 && (
            <div className="flex -space-x-1">
              {Array.from(new Set(projects.flatMap(p => p.assigneeIds || [])))
                .slice(0, 3)
                .map((_, index) => (
                  <div
                    key={index}
                    className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-white dark:border-gray-900"
                  />
                ))}
              {Array.from(new Set(projects.flatMap(p => p.assigneeIds || []))).length > 3 && (
                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                  <span className="text-[8px] text-gray-600 dark:text-gray-400">
                    +{Array.from(new Set(projects.flatMap(p => p.assigneeIds || []))).length - 3}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projects Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <SortableContext
          items={projects.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-600">
              <div 
                className="p-3 rounded-full mb-3"
                style={{ backgroundColor: `${color}10` }}
              >
                <Icon 
                  className="h-6 w-6" 
                  style={{ color: `${color}50` }}
                />
              </div>
              <p className="text-sm font-medium">No projects</p>
              <p className="text-xs mt-1">in {title.toLowerCase()}</p>
            </div>
          ) : (
            projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.2, 
                  delay: index * 0.03 
                }}
              >
                <ProjectCard
                  project={project}
                  isExpanded={project.isExpanded || false}
                  viewMode={viewMode}
                />
              </motion.div>
            ))
          )}
        </SortableContext>
      </div>

      {/* Add Project Button */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <button className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-600 dark:text-gray-400">
          <Plus className="h-4 w-4" />
          <span>Add Project</span>
        </button>
      </div>
    </div>
  );
}