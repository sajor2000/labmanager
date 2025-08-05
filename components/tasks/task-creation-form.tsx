"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, Calendar, Flag, User } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { TaskCreationSchema, type TaskCreationInput } from "@/lib/validations/task";
import { useTaskStore } from "@/lib/store/task-store";
import { useStudyStore } from "@/lib/store/study-store";
import { z } from "zod";
import type { Task } from "@/types";
import { showToast } from "@/components/ui/toast";
import { LoadingButton } from "@/components/ui/loading-button";

interface TaskCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudyId?: string;
  defaultStatus?: TaskCreationInput['status'];
}

export function TaskCreationForm({ isOpen, onClose, defaultStudyId, defaultStatus = "TODO" }: TaskCreationFormProps) {
  const { addTask } = useTaskStore();
  const { studies } = useStudyStore();
  const { user } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<TaskCreationInput>({
    title: "",
    description: "",
    status: defaultStatus,
    priority: "MEDIUM",
    projectId: defaultStudyId || "", // Map studyId to projectId for backend
    assigneeIds: [],
    dueDate: "",
  });
  const [errors, setErrors] = useState<z.ZodFormattedError<TaskCreationInput> | null>(null);
  
  // Reset form with defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        status: defaultStatus,
        priority: "MEDIUM",
        projectId: defaultStudyId || "",
        assigneeIds: [],
        dueDate: "",
      });
      setErrors(null);
    }
  }, [isOpen, defaultStatus, defaultStudyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const result = TaskCreationSchema.safeParse(formData);
    
    if (!result.success) {
      setErrors(result.error.format());
      return;
    }
    
    setErrors(null);
    setIsSubmitting(true);
    
    try {
      // Prepare task data for API
      const taskData = {
        title: result.data.title,
        description: result.data.description,
        status: result.data.status,
        priority: result.data.priority,
        projectId: result.data.projectId, // Backend expects projectId
        assigneeIds: result.data.assigneeIds,
        dueDate: result.data.dueDate,
        createdById: user?.id || "system",
      };
      
      // Call addTask with the proper format
      await addTask(taskData);
      
      // Show success notification
      showToast({
        type: "success",
        title: "Task created successfully",
        message: `"${result.data.title}" has been added to your task list.`
      });
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        projectId: "",
        assigneeIds: [],
        dueDate: "",
      });
      
      onClose();
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to create task",
        message: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          Create New Task
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title..."
              required
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
                errors?.title 
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-600"
              }`}
            />
            {errors?.title && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.title._errors[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the task..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Row with Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Flag className="inline h-3 w-3 mr-1" />
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* Study Association and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Associated Study
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">No project association</option>
                {studies.map((study) => (
                  <option key={study.id} value={study.id}>
                    {study.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="inline h-3 w-3 mr-1" />
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Priority Indicator */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Priority level:</span>
            <div className="flex space-x-1">
              {formData.priority === "LOW" && (
                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  Low
                </span>
              )}
              {formData.priority === "MEDIUM" && (
                <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                  Medium
                </span>
              )}
              {formData.priority === "HIGH" && (
                <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                  High
                </span>
              )}
              {formData.priority === "CRITICAL" && (
                <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  Critical
                </span>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              loadingText="Creating..."
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create Task
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}