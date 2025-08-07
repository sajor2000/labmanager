'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TaskEditForm } from './task-edit-form';
import { showToast } from '@/components/ui/toast';
import { useTaskStore } from '@/lib/store/task-store';

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any; // Existing task for editing
  projectId?: string; // Required for new tasks
  onSuccess?: () => void; // Callback after successful save
}

export function TaskEditDialog({ 
  open, 
  onOpenChange, 
  task,
  projectId,
  onSuccess 
}: TaskEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);

  // Fetch available users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const users = await response.json();
          setAvailableUsers(users);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (task) {
        // Update existing task using the task store
        const { updateTask } = useTaskStore.getState();
        await updateTask(task.id, data);
      } else {
        // Create new task
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            projectId: projectId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create task');
        }

        const savedTask = await response.json();
        
        // Add to task store
        const { setTasks, tasks } = useTaskStore.getState();
        const newTask = {
          ...savedTask,
          assignees: savedTask.assignees || [],
          studyId: savedTask.projectId,
        };
        setTasks([...tasks, newTask]);
        
        showToast({
          type: 'success',
          title: 'Task Created',
          message: `${savedTask.title} has been created successfully.`,
        });
      }

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save task',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription>
            {task 
              ? 'Update the task details, assignees, and timeline below.'
              : 'Fill in the task information, assign team members, and set deadlines.'}
          </DialogDescription>
        </DialogHeader>
        
        <TaskEditForm
          task={task}
          projectId={projectId || task?.projectId}
          availableUsers={availableUsers}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}