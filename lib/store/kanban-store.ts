import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Bucket, User } from '@/types';

// Export Task type
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  dueDate?: Date | string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 
  | 'PLANNING'
  | 'IRB_SUBMISSION'
  | 'IRB_APPROVED'
  | 'DATA_COLLECTION'
  | 'ANALYSIS'
  | 'MANUSCRIPT'
  | 'UNDER_REVIEW'
  | 'PUBLISHED'
  | 'ON_HOLD'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface ProjectWithTasks {
  id: string;
  name: string;
  title?: string; // For backwards compatibility
  description?: string;
  oraNumber?: string;
  status: string;
  priority?: string;
  bucketId?: string;
  bucket?: Bucket;
  assigneeIds?: string[];
  assignees?: User[];
  dueDate?: Date | string | null;
  notes?: string;
  tasks: Task[];
  createdAt: Date | string;
  updatedAt: Date | string;
  isExpanded?: boolean;
}

export interface KanbanColumn {
  status: ProjectStatus;
  title: string;
  color: string;
  icon?: string;
  description: string;
  projects: ProjectWithTasks[];
}

export interface KanbanFilters {
  bucketId?: string;
  assigneeId?: string;
  priority?: string[];
  status?: string[];
  search?: string;
  searchQuery?: string;
  dateRange?: { start: string; end: string };
  hideCompleted: boolean;
}

export type KanbanViewMode = 'standard' | 'swimlane' | 'compact' | 'comfortable' | 'expanded' | 'timeline';

interface KanbanState {
  // Data
  columns: Map<ProjectStatus, ProjectWithTasks[]>;
  buckets: Bucket[];
  allProjects: ProjectWithTasks[];
  projects: ProjectWithTasks[];
  
  // UI State
  viewMode: KanbanViewMode;
  filters: KanbanFilters;
  expandedProjects: Set<string>;
  selectedProjectId: string | null;
  isDragging: boolean;
  
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Actions
  setProjects: (projects: ProjectWithTasks[]) => void;
  setBuckets: (buckets: Bucket[]) => void;
  loadProjects: () => Promise<void>;
  loadBuckets: () => Promise<void>;
  moveProject: (projectId: string, newStatus: ProjectStatus) => Promise<void>;
  moveTask: (taskId: string, fromProjectId: string, toProjectId: string) => Promise<void>;
  toggleProjectExpanded: (projectId: string) => void;
  setViewMode: (mode: KanbanViewMode) => void;
  setFilters: (filters: Partial<KanbanFilters>) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  setSelectedProject: (projectId: string | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  refreshData: () => Promise<void>;
}

const defaultFilters: KanbanFilters = {
  searchQuery: '',
  hideCompleted: false,
};

// Define column configuration
export const KANBAN_COLUMNS: Omit<KanbanColumn, 'projects'>[] = [
  {
    status: 'PLANNING',
    title: 'Planning',
    color: '#6366F1',
    icon: 'clipboard-list',
    description: 'Studies in initial planning phase',
  },
  {
    status: 'IRB_SUBMISSION',
    title: 'IRB Submission',
    color: '#F59E0B',
    icon: 'file-text',
    description: 'Pending IRB submission',
  },
  {
    status: 'IRB_APPROVED',
    title: 'IRB Approved',
    color: '#10B981',
    icon: 'check-circle',
    description: 'IRB approval received',
  },
  {
    status: 'DATA_COLLECTION',
    title: 'Data Collection',
    color: '#3B82F6',
    icon: 'database',
    description: 'Actively collecting data',
  },
  {
    status: 'ANALYSIS',
    title: 'Analysis',
    color: '#8B5CF6',
    icon: 'bar-chart',
    description: 'Data analysis phase',
  },
  {
    status: 'MANUSCRIPT',
    title: 'Manuscript',
    color: '#EC4899',
    icon: 'edit',
    description: 'Writing manuscript',
  },
  {
    status: 'UNDER_REVIEW',
    title: 'Under Review',
    color: '#F97316',
    icon: 'eye',
    description: 'Submitted for review',
  },
  {
    status: 'PUBLISHED',
    title: 'Published',
    color: '#059669',
    icon: 'book-open',
    description: 'Published studies',
  },
];

export const useKanbanStore = create<KanbanState>()(
  devtools((set, get) => ({
    // Initial state
    columns: new Map(),
    buckets: [],
    allProjects: [],
    projects: [],
    viewMode: 'standard',
    filters: defaultFilters,
    expandedProjects: new Set(),
    selectedProjectId: null,
    isDragging: false,
    isLoading: false,
    isUpdating: false,
    error: null,

    // Actions
    setProjects: (projects) => {
      const columns = new Map<ProjectStatus, ProjectWithTasks[]>();
      
      // Initialize all columns
      KANBAN_COLUMNS.forEach(col => {
        columns.set(col.status, []);
      });
      
      // Group projects by status
      projects.forEach(project => {
        const status = project.status as ProjectStatus;
        const columnProjects = columns.get(status) || [];
        columnProjects.push(project);
        columns.set(status, columnProjects);
      });
      
      set({ columns, allProjects: projects, isLoading: false });
    },

    setBuckets: (buckets) => set({ buckets }),

    loadProjects: async () => {
      set({ isLoading: true, error: null });
      try {
        const params = new URLSearchParams();
        const filters = get().filters;
        
        if (filters.bucketId) {
          params.append('bucketId', filters.bucketId);
        }
        if (filters.assigneeId) {
          params.append('assigneeId', filters.assigneeId);
        }
        if (filters.priority) {
          params.append('priority', filters.priority);
        }

        const response = await fetch(`/api/kanban/projects?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        const projects = await response.json();
        set({ projects, isLoading: false });
        get().setProjects(projects);
      } catch (error) {
        set({ error: 'Failed to load projects', isLoading: false });
        console.error('Error loading projects:', error);
      }
    },

    loadBuckets: async () => {
      try {
        const response = await fetch('/api/kanban/buckets');
        if (!response.ok) throw new Error('Failed to fetch buckets');
        
        const buckets = await response.json();
        set({ buckets });
      } catch (error) {
        console.error('Failed to load buckets:', error);
      }
    },

    moveProject: async (projectId, newStatus) => {
      set({ isUpdating: true, error: null });
      
      try {
        // Optimistic update
        const { columns, allProjects } = get();
        const newColumns = new Map(columns);
        let movedProject: ProjectWithTasks | undefined;
        
        // Find and remove project from current column
        for (const [status, projects] of newColumns) {
          const index = projects.findIndex(p => p.id === projectId);
          if (index !== -1) {
            [movedProject] = projects.splice(index, 1);
            newColumns.set(status, [...projects]);
            break;
          }
        }
        
        // Add to new column
        if (movedProject) {
          movedProject.status = newStatus;
          const targetProjects = newColumns.get(newStatus) || [];
          targetProjects.push(movedProject);
          newColumns.set(newStatus, targetProjects);
        }
        
        set({ columns: newColumns });
        
        // API call
        const response = await fetch(`/api/projects/${projectId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update project status');
        }
        
        set({ isUpdating: false });
      } catch (error) {
        // Revert on error
        set({ 
          error: error instanceof Error ? error.message : 'Failed to move project',
          isUpdating: false 
        });
        
        // Refresh data to get correct state
        await get().refreshData();
      }
    },

    moveTask: async (taskId, fromProjectId, toProjectId) => {
      set({ isUpdating: true, error: null });
      
      try {
        // Optimistic update
        const { allProjects } = get();
        const updatedProjects = allProjects.map(project => {
          if (project.id === fromProjectId) {
            return {
              ...project,
              tasks: project.tasks.filter(t => t.id !== taskId),
            };
          }
          if (project.id === toProjectId) {
            const task = allProjects
              .find(p => p.id === fromProjectId)
              ?.tasks.find(t => t.id === taskId);
            if (task) {
              return {
                ...project,
                tasks: [...project.tasks, { ...task, projectId: toProjectId }],
              };
            }
          }
          return project;
        });
        
        get().setProjects(updatedProjects);
        
        // API call
        const response = await fetch(`/api/tasks/${taskId}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: toProjectId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to move task');
        }
        
        set({ isUpdating: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to move task',
          isUpdating: false 
        });
        
        // Refresh data to get correct state
        await get().refreshData();
      }
    },

    toggleProjectExpanded: (projectId) => {
      const { expandedProjects } = get();
      const newExpanded = new Set(expandedProjects);
      
      if (newExpanded.has(projectId)) {
        newExpanded.delete(projectId);
      } else {
        newExpanded.add(projectId);
      }
      
      set({ expandedProjects: newExpanded });
    },

    setViewMode: (mode) => set({ viewMode: mode }),

    setFilters: (filters) => set((state) => ({
      filters: { ...state.filters, ...filters }
    })),

    clearFilters: () => set({ filters: defaultFilters }),

    resetFilters: () => set({ filters: defaultFilters }),

    setSelectedProject: (projectId) => set({ selectedProjectId: projectId }),

    setIsDragging: (isDragging) => set({ isDragging }),

    refreshData: async () => {
      await Promise.all([
        get().loadProjects(),
        get().loadBuckets(),
      ]);
    },
  }))
);