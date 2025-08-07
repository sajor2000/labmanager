// Task related types
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: string | null;
  assigneeId: string | null;
  createdById: string;
  labId: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  project?: {
    id: string;
    name: string;
    status: string;
  };
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    initials: string | null;
    avatar: string | null;
  };
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  };
  lab?: {
    id: string;
    name: string;
    shortName: string;
  };
}

export type TaskStatus = 'Todo' | 'In Progress' | 'Done' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  projectId?: string;
  assigneeId?: string;
  labId: string;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  completedAt?: string;
  isActive?: boolean;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  labId?: string;
  overdue?: boolean;
  searchTerm?: string;
}

export interface TaskStatistics {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}