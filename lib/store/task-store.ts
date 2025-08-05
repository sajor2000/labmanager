import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Task, TaskStatus } from "@/types";
import { showToast } from "@/components/ui/toast";

interface TaskState {
  // State
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (taskData: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    projectId?: string;
    assigneeIds: string[];
    dueDate?: string;
    createdById: string;
  }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Status management
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  completeTask: (id: string) => void;
  
  // Filtering
  getTasksByStudy: (studyId: string) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByAssignee: (assigneeId: string) => Task[];
  
  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
        // Initial state
        tasks: [],
        isLoading: false,
        error: null,

        // Task actions
        setTasks: (tasks) => set({ tasks }),
        
        addTask: async (taskData) => {
          try {
            const response = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData),
            });
            
            if (!response.ok) throw new Error('Failed to create task');
            
            const backendTask = await response.json();
            
            // Transform backend response to frontend Task format
            const newTask: Task = {
              id: backendTask.id,
              title: backendTask.title,
              description: backendTask.description,
              status: backendTask.status,
              priority: backendTask.priority,
              studyId: backendTask.projectId, // Map projectId back to studyId for frontend
              assigneeIds: backendTask.assignees?.map((a: any) => a.userId) || [],
              dueDate: backendTask.dueDate ? new Date(backendTask.dueDate) : undefined,
              createdAt: new Date(backendTask.createdAt),
              updatedAt: new Date(backendTask.updatedAt),
              createdById: backendTask.createdById,
            };
            
            set((state) => ({
              tasks: [...state.tasks, newTask],
            }));
            
            showToast({
              type: 'success',
              title: 'Task created',
              message: `"${taskData.title}" has been added to your task list.`,
            });
          } catch (error) {
            showToast({
              type: 'error',
              title: 'Failed to create task',
              message: 'Please try again later.',
            });
          }
        },
        
        updateTask: async (id, updates) => {
          try {
            // Transform studyId to projectId if present
            const apiUpdates = { ...updates };
            if ('studyId' in apiUpdates) {
              (apiUpdates as any).projectId = apiUpdates.studyId;
              delete (apiUpdates as any).studyId;
            }
            
            const response = await fetch('/api/tasks', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, ...apiUpdates }),
            });
            
            if (!response.ok) throw new Error('Failed to update task');
            
            const backendTask = await response.json();
            
            // Transform backend response to frontend Task format
            const updatedTask: Task = {
              id: backendTask.id,
              title: backendTask.title,
              description: backendTask.description,
              status: backendTask.status,
              priority: backendTask.priority,
              studyId: backendTask.projectId, // Map projectId back to studyId
              assigneeIds: backendTask.assignees?.map((a: any) => a.userId) || [],
              dueDate: backendTask.dueDate ? new Date(backendTask.dueDate) : undefined,
              createdAt: new Date(backendTask.createdAt),
              updatedAt: new Date(backendTask.updatedAt),
              createdById: backendTask.createdById,
            };
            
            set((state) => ({
              tasks: state.tasks.map((task) =>
                task.id === id ? updatedTask : task
              ),
            }));
          } catch (error) {
            showToast({
              type: 'error',
              title: 'Failed to update task',
              message: 'Please try again later.',
            });
          }
        },
        
        deleteTask: async (id) => {
          try {
            const response = await fetch(`/api/tasks?id=${id}`, {
              method: 'DELETE',
            });
            
            if (!response.ok) throw new Error('Failed to delete task');
            
            set((state) => ({
              tasks: state.tasks.filter((task) => task.id !== id),
            }));
            
            showToast({
              type: 'success',
              title: 'Task deleted',
              message: 'The task has been deleted successfully.',
            });
          } catch (error) {
            showToast({
              type: 'error',
              title: 'Failed to delete task',
              message: 'Please try again later.',
            });
          }
        },
        
        // Status management
        updateTaskStatus: async (id, status) => {
          try {
            const response = await fetch('/api/tasks', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, status }),
            });
            
            if (!response.ok) throw new Error('Failed to update task status');
            
            const backendTask = await response.json();
            
            // Transform backend response to frontend Task format
            const updatedTask: Task = {
              id: backendTask.id,
              title: backendTask.title,
              description: backendTask.description,
              status: backendTask.status,
              priority: backendTask.priority,
              studyId: backendTask.projectId, // Map projectId back to studyId
              assigneeIds: backendTask.assignees?.map((a: any) => a.userId) || [],
              dueDate: backendTask.dueDate ? new Date(backendTask.dueDate) : undefined,
              createdAt: new Date(backendTask.createdAt),
              updatedAt: new Date(backendTask.updatedAt),
              createdById: backendTask.createdById,
            };
            
            set((state) => ({
              tasks: state.tasks.map((task) =>
                task.id === id ? updatedTask : task
              ),
            }));
            
            if (status === 'COMPLETED') {
              showToast({
                type: 'success',
                title: 'Task completed',
                message: 'Great job! Task marked as complete.',
              });
            }
          } catch (error) {
            showToast({
              type: 'error',
              title: 'Failed to update task status',
              message: 'Please try again later.',
            });
          }
        },
        
        completeTask: async (id) => {
          const task = get().tasks.find(t => t.id === id);
          if (task && task.status !== "COMPLETED") {
            await get().updateTaskStatus(id, "COMPLETED");
          }
        },
        
        // Filtering methods
        getTasksByStudy: (studyId) => {
          return get().tasks.filter(task => task.studyId === studyId);
        },
        
        getTasksByStatus: (status) => {
          return get().tasks.filter(task => task.status === status);
        },
        
        getTasksByAssignee: (assigneeId) => {
          return get().tasks.filter(task => task.assigneeIds.includes(assigneeId));
        },

        // UI state
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
      })
  )
);

// Selector hooks
export const useTasksByStudy = (studyId?: string) => {
  const tasks = useTaskStore((state) => state.tasks);
  if (!studyId) return [];
  return tasks.filter((task) => task.studyId === studyId);
};

export const useTasksByStatus = (status: TaskStatus) => {
  const tasks = useTaskStore((state) => state.tasks);
  return tasks.filter((task) => task.status === status);
};

export const useOverdueTasks = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const now = new Date();
  return tasks.filter((task) => {
    if (task.status === "COMPLETED") return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < now;
  });
};