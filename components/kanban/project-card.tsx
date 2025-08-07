'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { type ProjectWithTasks, type KanbanViewMode } from '@/lib/store/kanban-store';
import { TaskMiniCard } from './task-mini-card';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: ProjectWithTasks;
  viewMode: KanbanViewMode;
  onEdit?: (project: ProjectWithTasks) => void;
  onDelete?: (projectId: string) => void;
  onAddTask?: (projectId: string) => void;
}

export function ProjectCard({
  project,
  viewMode,
  onEdit,
  onDelete,
  onAddTask
}: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(viewMode === 'expanded');
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-50 border-red-200';
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-500 bg-green-50 border-green-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'on-hold': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-white rounded-lg border shadow-sm hover:shadow-md transition-all",
        isDragging && "opacity-50 shadow-xl",
        project.bucket && "border-l-4"
      )}
      style={{
        borderLeftColor: project.bucket?.color || '#3B82F6'
      }}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-move bg-transparent hover:bg-gray-300 transition-colors"
      />

      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-0.5 hover:bg-gray-100 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <h3 className="font-medium text-sm line-clamp-2">{project.name}</h3>
              {getStatusIcon(project.status)}
            </div>
            
            {project.oraNumber && (
              <p className="text-xs text-gray-500 ml-6">{project.oraNumber}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(project)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddTask?.(project.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(project.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          {project.priority && (
            <Badge 
              variant="outline" 
              className={cn("text-xs px-1.5 py-0", getPriorityColor(project.priority))}
            >
              {project.priority}
            </Badge>
          )}
          
          {project.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(project.dueDate), 'MMM d')}</span>
            </div>
          )}
          
          {project.assignees && project.assignees.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{project.assignees.length}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{completedTasks}/{totalTasks} tasks</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Assignees */}
        {project.assignees && project.assignees.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
              {project.assignees.slice(0, 3).map((assignee) => (
                <Avatar key={assignee.id} className="h-6 w-6 border-2 border-white">
                  <AvatarImage src={assignee.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {assignee.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.assignees.length > 3 && (
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 border-2 border-white">
                  <span className="text-xs text-gray-600">+{project.assignees.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Tasks Section */}
      <AnimatePresence>
        {isExpanded && project.tasks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t bg-gray-50"
          >
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {project.tasks.map((task) => (
                <TaskMiniCard 
                  key={task.id} 
                  task={task}
                  projectId={project.id}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}