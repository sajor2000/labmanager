"use client";

import { memo, useState, useRef, useEffect } from "react";
import { MoreVertical, GripVertical, CheckSquare, Edit, Trash2, ListTodo, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCreationForm } from "@/components/tasks/task-creation-form";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/toast";

export interface StudyData {
  id: string;
  title: string;
  status: string;
  studyType: string;
  assignees: string[];
  funding: string;
  collaborators: string;
  bucketColor: string;
}

interface StudyCardProps {
  study: StudyData;
  isDragging?: boolean;
}

const statusColors: Record<string, string> = {
  "PLANNING": "bg-status-planning text-white",
  "IRB_SUBMISSION": "bg-status-irb-submission text-white",
  "IRB_APPROVED": "bg-status-irb-approved text-white",
  "DATA_COLLECTION": "bg-status-data-collection text-white",
  "ANALYSIS": "bg-status-analysis text-white",
  "MANUSCRIPT": "bg-status-manuscript text-white",
  "UNDER_REVIEW": "bg-status-under-review text-white",
  "PUBLISHED": "bg-status-published text-white",
  "ON_HOLD": "bg-status-on-hold text-white",
  "CANCELLED": "bg-status-cancelled text-white",
};

export const StudyCard = memo(function StudyCard({ study, isDragging }: StudyCardProps) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);
  
  const handleEdit = () => {
    setShowDropdown(false);
    // Navigate to study edit page or open edit modal
    router.push(`/studies/${study.id}/edit`);
  };
  
  const handleDelete = async () => {
    setShowDropdown(false);
    if (!confirm('Are you sure you want to delete this study? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/studies/${study.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete study');
      
      showToast({
        type: 'success',
        title: 'Study deleted',
        message: 'The study has been removed successfully.',
      });
      
      // Refresh the page or update the state
      window.location.reload();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to delete study',
        message: 'Please try again later.',
      });
    }
  };
  
  const handleViewTasks = () => {
    setShowDropdown(false);
    router.push(`/tasks?studyId=${study.id}`);
  };
  
  const handleViewDetails = () => {
    setShowDropdown(false);
    router.push(`/studies/${study.id}`);
  };
  
  return (
    <>
    <div
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all cursor-move",
        isDragging && "opacity-50 rotate-2 scale-105"
      )}
      style={{
        borderLeftColor: study.bucketColor,
        borderLeftWidth: "4px",
      }}
      role="article"
      aria-label={`Study: ${study.title}, Status: ${study.status}`}
      tabIndex={0}
    >
      {/* Drag Handle */}
      <div 
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Drag handle"
      >
        <GripVertical className="h-4 w-4 text-gray-400" aria-hidden="true" />
      </div>

      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white pr-2 line-clamp-2">
          {study.title}
        </h3>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={showDropdown}
          >
            <MoreVertical className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-hidden="true" />
          </button>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-1 w-48 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="py-1">
                <button
                  onClick={handleViewDetails}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
                <button
                  onClick={handleEdit}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Study
                </button>
                <button
                  onClick={handleViewTasks}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ListTodo className="h-4 w-4 mr-2" />
                  View Tasks
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowTaskForm(true);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Add Task
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Study
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Fields */}
      <div className="space-y-2.5">
        {/* Status */}
        <div className="flex items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Status:</span>
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            statusColors[study.status] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          )}>
            {study.status}
          </span>
        </div>

        {/* Study Type */}
        <div className="flex items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Study type:</span>
          <span className="text-xs text-gray-700 dark:text-gray-300">{study.studyType}</span>
        </div>

        {/* Assignees */}
        <div className="flex items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Assignee:</span>
          <div className="flex -space-x-2">
            {study.assignees.slice(0, 3).map((assignee, idx) => (
              <div
                key={idx}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-[10px] font-medium text-white ring-2 ring-white dark:ring-gray-800"
                title={assignee}
              >
                {assignee.split(" ").map(n => n[0]).join("")}
              </div>
            ))}
            {study.assignees.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600 text-[10px] font-medium text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-800">
                +{study.assignees.length - 3}
              </div>
            )}
          </div>
        </div>

        {/* Funding */}
        {study.funding && (
          <div className="flex items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Funding:</span>
            <span className="text-xs text-gray-700 dark:text-gray-300">{study.funding}</span>
          </div>
        )}

        {/* External Collaborators */}
        {study.collaborators && (
          <div className="flex items-start">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">External Collaborators:</span>
            <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">{study.collaborators}</span>
          </div>
        )}
      </div>
      
      {/* Quick Actions - shown on hover */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowTaskForm(true);
          }}
          className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
          title="Add Task"
        >
          <CheckSquare className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
    
    {/* Task Creation Form */}
    <TaskCreationForm
      isOpen={showTaskForm}
      onClose={() => setShowTaskForm(false)}
      defaultStudyId={study.id}
    />
    </>
  );
});