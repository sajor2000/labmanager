"use client";

import { useState } from "react";
import { X, Calendar, AlertCircle, Clock, FileText, Users } from "lucide-react";
import { z } from "zod";
import { showToast } from "@/components/ui/toast";
import { format } from "date-fns";

const DeadlineSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["IRB_RENEWAL", "GRANT_SUBMISSION", "PAPER_DEADLINE", "MILESTONE", "MEETING", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  dueDate: z.string().min(1, "Due date is required"),
  dueTime: z.string().optional(),
  projectId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  reminderDays: z.number().min(0).max(30).optional(),
  recurring: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  tags: z.array(z.string()).optional(),
});

type DeadlineInput = z.infer<typeof DeadlineSchema>;

interface DeadlineCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DeadlineInput) => Promise<void>;
  projects?: { id: string; name: string }[];
  users?: { id: string; name: string; initials: string }[];
}

const deadlineTypes = [
  { value: "IRB_RENEWAL", label: "IRB Renewal", icon: FileText, color: "text-blue-600" },
  { value: "GRANT_SUBMISSION", label: "Grant Submission", icon: FileText, color: "text-green-600" },
  { value: "PAPER_DEADLINE", label: "Paper Deadline", icon: FileText, color: "text-purple-600" },
  { value: "MILESTONE", label: "Project Milestone", icon: Clock, color: "text-orange-600" },
  { value: "MEETING", label: "Meeting", icon: Users, color: "text-indigo-600" },
  { value: "OTHER", label: "Other", icon: Calendar, color: "text-gray-600" },
];

const priorityColors = {
  LOW: "text-gray-500 bg-gray-100 dark:bg-gray-800",
  MEDIUM: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20",
  HIGH: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
  CRITICAL: "text-red-600 bg-red-100 dark:bg-red-900/20",
};

export function DeadlineCreationForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  projects = [], 
  users = [] 
}: DeadlineCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DeadlineInput>({
    title: "",
    description: "",
    type: "OTHER",
    priority: "MEDIUM",
    dueDate: "",
    dueTime: "",
    projectId: "",
    assigneeIds: [],
    reminderDays: 7,
    recurring: "NONE",
    tags: [],
  });
  const [errors, setErrors] = useState<z.ZodFormattedError<DeadlineInput> | null>(null);
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = DeadlineSchema.safeParse(formData);
    
    if (!result.success) {
      setErrors(result.error.format());
      return;
    }
    
    setErrors(null);
    setIsSubmitting(true);
    
    try {
      await onSubmit(result.data);
      
      showToast({
        type: "success",
        title: "Deadline created",
        message: `"${result.data.title}" has been added to your calendar.`
      });
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "OTHER",
        priority: "MEDIUM",
        dueDate: "",
        dueTime: "",
        projectId: "",
        assigneeIds: [],
        reminderDays: 7,
        recurring: "NONE",
        tags: [],
      });
      onClose();
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to create deadline",
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

  const toggleAssignee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds?.includes(userId) 
        ? prev.assigneeIds.filter(id => id !== userId)
        : [...(prev.assigneeIds || []), userId]
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag)
    }));
  };

  if (!isOpen) return null;

  const selectedType = deadlineTypes.find(t => t.value === formData.type);
  const TypeIcon = selectedType?.icon || Calendar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <TypeIcon className={`h-6 w-6 ${selectedType?.color}`} />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Deadline
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., IRB Annual Renewal - Study #2024-001"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
            {errors?.title && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.title._errors[0]}
              </p>
            )}
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                {deadlineTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              {errors?.dueDate && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.dueDate._errors[0]}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time (optional)
              </label>
              <input
                type="time"
                name="dueTime"
                value={formData.dueTime}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Project Association */}
          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Associated Study (optional)
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">None</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Add any additional details or requirements..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Reminder and Recurring */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reminder (days before)
              </label>
              <input
                type="number"
                name="reminderDays"
                value={formData.reminderDays}
                onChange={handleChange}
                min="0"
                max="30"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recurring
              </label>
              <select
                name="recurring"
                value={formData.recurring}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="NONE">None</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          {/* Assignees */}
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign To
              </label>
              <div className="flex flex-wrap gap-2">
                {users.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleAssignee(user.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      formData.assigneeIds?.includes(user.id)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-medium">
                      {user.initials}
                    </div>
                    <span>{user.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags?.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1.5 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              {isSubmitting ? "Creating..." : "Create Deadline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}