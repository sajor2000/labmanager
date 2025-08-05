'use client';

import { useState } from 'react';
import { MoreVertical, Calendar, User, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';
import { TaskDetailModal } from '@/components/tasks/task-detail-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTaskStore } from '@/lib/store/task-store';
import { showToast } from '@/components/ui/toast';
import { LoadingButton } from '@/components/ui/loading-button';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityConfig = {
  CRITICAL: { color: 'bg-red-500', label: 'Critical' },
  HIGH: { color: 'bg-orange-500', label: 'High' },
  MEDIUM: { color: 'bg-yellow-500', label: 'Medium' },
  LOW: { color: 'bg-gray-400', label: 'Low' },
};

const statusIcons = {
  TODO: Clock,
  IN_PROGRESS: Clock,
  REVIEW: AlertCircle,
  COMPLETED: CheckCircle,
  BLOCKED: AlertCircle,
};

export function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { updateTaskStatus, deleteTask } = useTaskStore();
  const { confirm, ConfirmationDialog } = useConfirmationDialog();
  
  const priority = priorityConfig[task.priority];
  const StatusIcon = statusIcons[task.status];
  
  // Calculate days until due
  const daysUntilDue = task.dueDate
    ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

  const handleQuickStatusChange = async (newStatus: Task['status']) => {
    try {
      await updateTaskStatus(task.id, newStatus);
      showToast({
        type: 'success',
        title: 'Task updated',
        message: `Status changed to ${newStatus.toLowerCase().replace('_', ' ')}`,
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to update task',
        message: 'Please try again',
      });
    }
  };

  const handleDelete = async () => {
    await confirm({
      title: 'Delete Task',
      description: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        await deleteTask(task.id);
      },
    });
  };

  return (
    <>
      <div
        className={cn(
          "group bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 dark:border-gray-700",
          isDragging && "opacity-50 rotate-2 scale-105",
          task.status === 'BLOCKED' && "border-red-500 dark:border-red-500"
        )}
        onClick={() => setShowDetailModal(true)}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">
              {task.title}
            </h4>
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
                setShowDetailModal(true);
              }}>
                <FileText className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickStatusChange('COMPLETED');
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Complete
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickStatusChange('BLOCKED');
                }}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Mark as Blocked
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="text-red-600 dark:text-red-400"
              >
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Priority Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Badge 
            variant="outline" 
            className={cn("border-0 text-white", priority.color)}
          >
            {priority.label}
          </Badge>
          {task.studyId && (
            <Badge variant="outline" className="text-xs">
              Project linked
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          {/* Due Date */}
          {task.dueDate && (
            <div className={cn(
              "flex items-center gap-1",
              isOverdue && "text-red-600 dark:text-red-400",
              isDueSoon && "text-orange-600 dark:text-orange-400",
              !isOverdue && !isDueSoon && "text-gray-500 dark:text-gray-400"
            )}>
              <Calendar className="h-3 w-3" />
              {isOverdue ? (
                <span>Overdue by {Math.abs(daysUntilDue)} days</span>
              ) : isDueSoon ? (
                <span>Due in {daysUntilDue} days</span>
              ) : (
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              )}
            </div>
          )}

          {/* Assignees */}
          {task.assigneeIds && task.assigneeIds.length > 0 && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <User className="h-3 w-3" />
              <span>{task.assigneeIds.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {showDetailModal && (
        <TaskDetailModal
          task={task}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </>
  );
}