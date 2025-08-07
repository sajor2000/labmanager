'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { TaskCreationForm } from '@/components/tasks/task-creation-form';
import { showToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignees: any[];
}

interface Study {
  id: string;
  name: string;
  oraNumber?: string;
  status: string;
  priority: string;
  projectType: string;
  studyType?: string;
  fundingSource?: string;
  externalCollaborators?: string;
  notes?: string;
  bucket: {
    id: string;
    name: string;
    color: string;
  };
  tasks: Task[];
  members: any[];
}

const taskStatusColors: Record<string, string> = {
  "TODO": "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  "IN_PROGRESS": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "REVIEW": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  "COMPLETED": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "BLOCKED": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const taskPriorityColors: Record<string, string> = {
  "LOW": "text-gray-500",
  "MEDIUM": "text-yellow-500",
  "HIGH": "text-orange-500",
  "CRITICAL": "text-red-500",
};

export default function StudyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studyId = params.studyId as string;
  
  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  useEffect(() => {
    fetchStudy();
  }, [studyId]);
  
  const fetchStudy = async () => {
    try {
      const response = await fetch(`/api/studies/${studyId}`);
      if (!response.ok) throw new Error('Failed to fetch study');
      const data = await response.json();
      setStudy(data);
    } catch (error) {
      console.error('Error fetching study:', error);
      showToast({
        type: 'error',
        title: 'Failed to load study',
        message: 'Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete task');
      
      showToast({
        type: 'success',
        title: 'Task deleted',
        message: 'The task has been removed successfully.',
      });
      
      // Refresh the study data
      fetchStudy();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to delete task',
        message: 'Please try again later.',
      });
    }
  };
  
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) throw new Error('Failed to update task');
      
      showToast({
        type: 'success',
        title: 'Task updated',
        message: 'Task status has been updated.',
      });
      
      // Refresh the study data
      fetchStudy();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to update task',
        message: 'Please try again later.',
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading study details...</p>
        </div>
      </div>
    );
  }
  
  if (!study) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Study not found</h2>
          <button
            onClick={() => router.back()}
            className="mt-4 flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-950 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {study.name}
              </h1>
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                {study.oraNumber && <span>ORA: {study.oraNumber}</span>}
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: study.bucket.color + '20', color: study.bucket.color }}
                >
                  {study.bucket.name}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push(`/studies/${studyId}/edit`)}
              className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Study</span>
            </button>
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Study Details */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-4">Study Details</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{study.status}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{study.priority}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{study.projectType || study.studyType}</dd>
                </div>
                {study.fundingSource && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Funding</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{study.fundingSource}</dd>
                  </div>
                )}
                {study.externalCollaborators && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">External Collaborators</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{study.externalCollaborators}</dd>
                  </div>
                )}
                {study.notes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{study.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          
          {/* Tasks */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-4">Tasks ({study.tasks.length})</h2>
              
              {study.tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No tasks yet</p>
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="mt-4 text-blue-600 hover:text-blue-500"
                  >
                    Create your first task
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {study.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {task.title}
                            </h3>
                            <span className={cn("h-2 w-2 rounded-full", taskPriorityColors[task.priority])} />
                          </div>
                          {task.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {task.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center space-x-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              taskStatusColors[task.status]
                            )}>
                              {task.status}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {task.assignees.length > 0 && (
                              <div className="flex -space-x-2">
                                {task.assignees.slice(0, 3).map((assignee, idx) => (
                                  <div
                                    key={idx}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-[10px] font-medium text-white ring-2 ring-white dark:ring-gray-800"
                                    title={assignee.user.name}
                                  >
                                    {assignee.user.initials}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Review</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="BLOCKED">Blocked</option>
                          </select>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Task Creation Form */}
      <TaskCreationForm
        isOpen={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          fetchStudy(); // Refresh after adding task
        }}
        defaultStudyId={studyId}
      />
    </div>
  );
}