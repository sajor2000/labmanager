'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Task } from '@/lib/store/kanban-store';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface TaskMiniCardProps {
  task: Task;
  projectId: string;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
}

export function TaskMiniCard({
  task,
  projectId,
  onEdit,
  onDelete,
  onToggleComplete
}: TaskMiniCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `${projectId}-${task.id}`,
    data: {
      type: 'task',
      task,
      projectId
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-2 p-2 bg-white rounded-md border hover:shadow-sm transition-all",
        isDragging && "opacity-50 shadow-lg",
        task.status === 'completed' && "opacity-60"
      )}
      {...attributes}
      {...listeners}
    >
      {/* Status Icon */}
      <button
        onClick={() => onToggleComplete?.(task.id)}
        className="mt-0.5 hover:scale-110 transition-transform"
      >
        {getStatusIcon()}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm",
          task.status === 'completed' && "line-through text-gray-500"
        )}>
          {task.title}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-3 mt-1">
          {task.priority && (
            <Badge 
              variant="secondary" 
              className={cn("text-xs px-1.5 py-0", getPriorityColor(task.priority))}
            >
              {task.priority}
            </Badge>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            </div>
          )}

          {task.assignee && (
            <Avatar className="h-5 w-5">
              <AvatarImage src={task.assignee.avatarUrl} />
              <AvatarFallback className="text-xs">
                {task.assignee.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit?.(task)}>
            Edit Task
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onDelete?.(task.id)}
            className="text-red-600"
          >
            Delete Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}