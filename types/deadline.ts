// Deadline related types
export interface Deadline {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  type: DeadlineType;
  priority: DeadlinePriority;
  status: DeadlineStatus;
  projectId: string | null;
  taskId: string | null;
  labId: string;
  reminderDate: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  project?: {
    id: string;
    name: string;
    status: string;
  };
  task?: {
    id: string;
    title: string;
    status: string;
  };
  lab?: {
    id: string;
    name: string;
    shortName: string;
  };
  assignees?: DeadlineAssignee[];
}

export interface DeadlineAssignee {
  id: string;
  deadlineId: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    initials: string | null;
    avatar: string | null;
  };
}

export type DeadlineType = 
  | 'IRB Renewal'
  | 'Grant Submission'
  | 'Paper Submission'
  | 'Conference Abstract'
  | 'Progress Report'
  | 'Data Collection'
  | 'Analysis'
  | 'Meeting'
  | 'Other';

export type DeadlinePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type DeadlineStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';

export interface CreateDeadlinePayload {
  title: string;
  description?: string;
  dueDate: string;
  type: DeadlineType;
  priority?: DeadlinePriority;
  projectId?: string;
  taskId?: string;
  labId: string;
  reminderDate?: string;
  assigneeIds?: string[];
}

export interface UpdateDeadlinePayload extends Partial<CreateDeadlinePayload> {
  status?: DeadlineStatus;
  isActive?: boolean;
}

export interface DeadlineFilters {
  type?: DeadlineType;
  priority?: DeadlinePriority;
  status?: DeadlineStatus;
  labId?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  overdue?: boolean;
  upcoming?: boolean;
  searchTerm?: string;
}

export interface DeadlineStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  dueThisMonth: number;
  byType: Record<DeadlineType, number>;
  byPriority: Record<DeadlinePriority, number>;
}

export interface DeadlineCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  deadline: Deadline;
}