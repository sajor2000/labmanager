"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { StudyCreationSchema, type StudyCreationInput } from "@/lib/validations/study";
import { z } from "zod";
import { showToast } from "@/components/ui/toast";

interface StudyCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudyCreationInput) => void;
  defaultBucketId?: string;
}

export function StudyCreationForm({ isOpen, onClose, onSubmit, defaultBucketId }: StudyCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Map bucket IDs to titles for the form
  const getBucketTitle = (bucketId?: string) => {
    if (!bucketId) return "";
    const bucketMap: Record<string, string> = {
      'rhedas-core': 'RHEDAS - Core Research',
      'rhedas-community': 'RHEDAS - Community Projects',
      'riccc-trials': 'RICCC - Critical Care Trials',
      'riccc-data': 'RICCC - Data Science',
      'nih-r01': 'NIH R01 Grant',
    };
    return bucketMap[bucketId] || "";
  };
  
  const [formData, setFormData] = useState<StudyCreationInput>({
    studyName: "",
    oraNumber: "",
    status: "PLANNING",
    priority: "MEDIUM",
    bucket: getBucketTitle(defaultBucketId),
    fundingSource: "",
    studyType: "",
    dueDate: "",
    externalCollaborators: "",
    notes: "",
  });
  const [errors, setErrors] = useState<z.ZodFormattedError<StudyCreationInput> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const result = StudyCreationSchema.safeParse(formData);
    
    if (!result.success) {
      setErrors(result.error.format());
      return;
    }
    
    setErrors(null);
    setIsSubmitting(true);
    
    try {
      await onSubmit(result.data);
      
      // Show success notification
      showToast({
        type: "success",
      title: "Study created successfully",
      message: `"${result.data.studyName}" has been added to your research pipeline.`
    });
    
      // Reset form
      setFormData({
        studyName: "",
        oraNumber: "",
        status: "PLANNING",
        priority: "MEDIUM",
        bucket: "",
        fundingSource: "",
        studyType: "",
        dueDate: "",
        externalCollaborators: "",
        notes: "",
      });
      onClose();
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to create study",
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
      <div className="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          Add a new research study to your lab
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Study Name *
              </label>
              <input
                type="text"
                name="studyName"
                value={formData.studyName}
                onChange={handleChange}
                placeholder="Enter study name..."
                required
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
                  errors?.studyName 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-600"
                }`}
              />
              {errors?.studyName && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.studyName._errors[0]}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ORA Number
              </label>
              <input
                type="text"
                name="oraNumber"
                value={formData.oraNumber}
                onChange={handleChange}
                placeholder="e.g., ORA-2024-001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="PLANNING">Planning</option>
                <option value="IRB_SUBMISSION">IRB Submission</option>
                <option value="IRB_APPROVED">IRB Approved</option>
                <option value="DATA_COLLECTION">Data Collection</option>
                <option value="ANALYSIS">Analysis</option>
                <option value="MANUSCRIPT">Manuscript</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="PUBLISHED">Published</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
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

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bucket
              </label>
              <select
                name="bucket"
                value={formData.bucket}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select bucket</option>
                <option>RHEDAS - Core Research</option>
                <option>RHEDAS - Community Projects</option>
                <option>RICCC - Critical Care Trials</option>
                <option>RICCC - Data Science</option>
                <option>NIH R01 Grant</option>
                <option>Rush Internal Funding</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Funding Source
              </label>
              <select
                name="fundingSource"
                value={formData.fundingSource}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select funding source</option>
                <option value="NIH">NIH</option>
                <option value="NSF">NSF</option>
                <option value="INDUSTRY_SPONSORED">Industry Sponsored</option>
                <option value="INTERNAL">Internal</option>
                <option value="FOUNDATION">Foundation</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Study Type
              </label>
              <input
                type="text"
                name="studyType"
                value={formData.studyType}
                onChange={handleChange}
                placeholder="e.g., Retrospective, Prospective..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

          {/* Row 5 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              External Collaborators
            </label>
            <textarea
              name="externalCollaborators"
              value={formData.externalCollaborators}
              onChange={handleChange}
              placeholder="List external collaborators..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Row 6 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes about the study..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Study"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}