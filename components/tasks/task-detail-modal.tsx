'use client';

import { useState } from 'react';
import { X, Calendar, User, Flag, FileText, Clock, Save } from 'lucide-react';
import type { Task, TaskStatus } from '@/types';
import { useTaskStore } from '@/lib/store/task-store';
import { useStudyStore } from '@/lib/store/study-store';
import { showToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const { updateTask } = useTaskStore();
  const { studies } = useStudyStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    studyId: task.studyId || '',
    dueDate: task.dueDate 
      ? new Date(task.dueDate).toISOString().split('T')[0] 
      : '',
  });

  const handleSave = async () => {
    try {
      await updateTask(task.id, {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      });
      showToast({
        type: 'success',
        title: 'Task updated',
        message: 'Your changes have been saved',
      });
      setIsEditing(false);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to update task',
        message: 'Please try again',
      });
    }
  };

  const statusColors = {
    TODO: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    REVIEW: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  const priorityColors = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-gray-400',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-900 shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Task Details
            </h2>
            <Badge className={cn(statusColors[formData.status as TaskStatus])}>
              {formData.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      title: task.title,
                      description: task.description || '',
                      status: task.status,
                      priority: task.priority,
                      studyId: task.studyId || '',
                      dueDate: task.dueDate 
                        ? new Date(task.dueDate).toISOString().split('T')[0] 
                        : '',
                    });
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                Edit Task
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              Task Title
            </Label>
            {isEditing ? (
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title..."
              />
            ) : (
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {formData.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              Description
            </Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description..."
                rows={4}
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                {formData.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                Status
              </Label>
              {isEditing ? (
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={cn('w-fit', statusColors[formData.status as TaskStatus])}>
                  {formData.status.replace('_', ' ')}
                </Badge>
              )}
            </div>

            <div>
              <Label htmlFor="priority" className="flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4" />
                Priority
              </Label>
              {isEditing ? (
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', priorityColors[formData.priority])} />
                  <span className="text-gray-700 dark:text-gray-300">
                    {formData.priority}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Study and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="study" className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Associated Study
              </Label>
              {isEditing ? (
                <Select
                  value={formData.studyId}
                  onValueChange={(value) => setFormData({ ...formData, studyId: value })}
                >
                  <SelectTrigger id="study">
                    <SelectValue placeholder="Select a study..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No study</SelectItem>
                    {studies.map((study) => (
                      <SelectItem key={study.id} value={study.id}>
                        {study.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  {formData.studyId 
                    ? studies.find(s => s.id === formData.studyId)?.title || 'Unknown study'
                    : 'No associated study'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dueDate" className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </Label>
              {isEditing ? (
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  {formData.dueDate 
                    ? new Date(formData.dueDate).toLocaleDateString()
                    : 'No due date'}
                </p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t dark:border-gray-800">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {new Date(task.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{' '}
                {new Date(task.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}