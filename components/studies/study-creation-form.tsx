"use client";

import { useState, useEffect, useRef } from "react";
import { X, AlertCircle, ChevronDown, Search } from "lucide-react";
import { StudyCreationSchema, type StudyCreationInput } from "@/lib/validations/study";
import { z } from "zod";
import { showToast } from "@/components/ui/toast";
import type { ProjectTypeCategory } from "@/lib/constants/project-types";
import { 
  getProjectStatusOptions, 
  getPriorityOptions, 
  getFundingSourceOptions 
} from "@/lib/constants/project-constants";

interface StudyCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudyCreationInput) => void;
  defaultBucketId?: string;
}

interface Bucket {
  id: string;
  name: string;
  color?: string;
}

export function StudyCreationForm({ isOpen, onClose, onSubmit, defaultBucketId }: StudyCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectTypeCategories, setProjectTypeCategories] = useState<ProjectTypeCategory[]>([]);
  const [projectTypeDropdownOpen, setProjectTypeDropdownOpen] = useState(false);
  const [projectTypeSearch, setProjectTypeSearch] = useState("");
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  const projectTypeDropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<StudyCreationInput>({
    studyName: "",
    oraNumber: "",
    status: "PLANNING",
    priority: "MEDIUM",
    bucket: defaultBucketId || "",
    fundingSource: "",
    studyType: "",
    dueDate: "",
    externalCollaborators: "",
    notes: "",
  });
  const [errors, setErrors] = useState<z.ZodFormattedError<StudyCreationInput> | null>(null);

  // Fetch project types from API
  useEffect(() => {
    const fetchProjectTypes = async () => {
      try {
        const response = await fetch('/api/project-types');
        const result = await response.json();
        if (result.success) {
          setProjectTypeCategories(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch project types:', error);
      }
    };
    
    if (isOpen) {
      fetchProjectTypes();
    }
  }, [isOpen]);

  // Fetch buckets from API
  useEffect(() => {
    const fetchBuckets = async () => {
      setLoadingBuckets(true);
      try {
        const response = await fetch('/api/buckets');
        if (response.ok) {
          const data = await response.json();
          setBuckets(data);
        }
      } catch (error) {
        console.error('Failed to fetch buckets:', error);
      } finally {
        setLoadingBuckets(false);
      }
    };
    
    if (isOpen) {
      fetchBuckets();
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectTypeDropdownRef.current && !projectTypeDropdownRef.current.contains(event.target as Node)) {
        setProjectTypeDropdownOpen(false);
      }
    };

    if (projectTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [projectTypeDropdownOpen]);

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
                {getProjectStatusOptions().map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {getPriorityOptions().map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bucket *
              </label>
              <select
                name="bucket"
                value={formData.bucket}
                onChange={handleChange}
                disabled={loadingBuckets}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingBuckets ? "Loading buckets..." : "Select bucket"}
                </option>
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.name}
                  </option>
                ))}
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
                {getFundingSourceOptions().map((source) => (
                  <option key={source.value} value={source.value} title={source.description}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative" ref={projectTypeDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Type *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProjectTypeDropdownOpen(!projectTypeDropdownOpen)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-left flex items-center justify-between focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <span className={formData.studyType ? "text-gray-900 dark:text-white" : "text-gray-500"}>
                    {formData.studyType ? 
                      projectTypeCategories.flatMap(c => c.types).find(t => t.value === formData.studyType)?.label || formData.studyType
                      : "Select project type..."}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${projectTypeDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {projectTypeDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={projectTypeSearch}
                          onChange={(e) => setProjectTypeSearch(e.target.value)}
                          placeholder="Search project types..."
                          className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                      {projectTypeCategories.map((category) => {
                        const filteredTypes = category.types.filter(type => 
                          type.label.toLowerCase().includes(projectTypeSearch.toLowerCase()) ||
                          type.description?.toLowerCase().includes(projectTypeSearch.toLowerCase())
                        );
                        
                        if (filteredTypes.length === 0) return null;
                        
                        return (
                          <div key={category.name} className="mb-2">
                            <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                              {category.name}
                            </div>
                            {filteredTypes.map((type) => (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, studyType: type.value }));
                                  setProjectTypeDropdownOpen(false);
                                  setProjectTypeSearch("");
                                }}
                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-start space-x-2"
                              >
                                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: type.color }} />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
                                  {type.description && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{type.description}</div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                      {projectTypeCategories.every(category => 
                        category.types.every(type => 
                          !type.label.toLowerCase().includes(projectTypeSearch.toLowerCase()) &&
                          !type.description?.toLowerCase().includes(projectTypeSearch.toLowerCase())
                        )
                      ) && (
                        <div className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                          No project types found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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