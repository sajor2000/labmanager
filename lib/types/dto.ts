/**
 * Data Transfer Objects (DTOs) for mapping between database models and frontend interfaces
 * These types represent the actual structure of data returned from Prisma queries
 */

import type { 
  ProjectStatus, 
  Priority, 
  FundingSource,
  MemberRole,
  UserRole,
  TaskStatus
} from '@prisma/client';

/**
 * Project with all its relations as returned from Prisma
 * This matches the structure when using include in Prisma queries
 */
export interface ProjectWithRelations {
  id: string;
  parentId: string | null;
  name: string; // Maps to frontend 'title'
  oraNumber: string | null;
  status: ProjectStatus;
  priority: Priority;
  projectType: string; // Maps to frontend 'studyType'
  studyType: string | null;
  fundingSource: FundingSource | null;
  fundingDetails: string | null;
  externalCollaborators: string | null;
  startDate: Date | string | null;
  dueDate: Date | string | null;
  completedDate: Date | string | null;
  notes: string | null;
  protocolLink: string | null;
  dataLink: string | null;
  progress: number;
  position?: number; // Optional, may not be selected
  isActive?: boolean; // Optional, may not be selected
  metadata?: any | null; // Optional, may not be selected
  createdAt: Date | string;
  updatedAt: Date | string;
  labId: string;
  bucketId: string;
  createdById: string;
  
  // Relations (optional, depending on include)
  parent?: ProjectWithRelations | null;
  children?: ProjectWithRelations[];
  lab?: {
    id: string;
    name: string;
    description: string | null;
  };
  bucket?: BucketWithRelations;
  createdBy?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  members?: ProjectMemberWithUser[];
  tasks?: TaskWithRelations[] | { id: string; status: any }[]; // Can be partial selection
  _count?: {
    tasks?: number;
    members?: number;
    children?: number;
  };
}

/**
 * Project member with user information
 */
export interface ProjectMemberWithUser {
  id: string;
  projectId: string;
  userId: string;
  role: MemberRole;
  allocation: number;
  isActive: boolean;
  joinedAt: Date | string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    initials: string;
    avatar: string | null;
  };
}

/**
 * Bucket with all its relations as returned from Prisma
 */
export interface BucketWithRelations {
  id: string;
  name: string; // Maps to frontend 'title'
  description: string | null;
  color: string;
  position: number; // Maps to frontend 'order'
  isActive?: boolean; // Optional, may not be selected
  metadata?: any | null; // Optional, may not be selected
  createdAt: Date | string;
  updatedAt: Date | string;
  labId: string;
  
  // Relations (optional, depending on include)
  lab?: {
    id: string;
    name: string;
    description: string | null;
  };
  projects?: ProjectWithRelations[];
  _count?: {
    projects: number;
  };
}

/**
 * Task with all its relations as returned from Prisma
 */
export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  bucketId: string | null;
  dueDate: Date | string | null;
  completedDate: Date | string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  position: number;
  isActive: boolean;
  metadata: any | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdById: string;
  
  // Relations (optional, depending on include)
  project?: ProjectWithRelations;
  bucket?: BucketWithRelations;
  createdBy?: {
    id: string;
    email: string;
    name: string;
  };
  assignees?: TaskAssigneeWithUser[];
  dependencies?: TaskDependency[];
  dependents?: TaskDependency[];
}

/**
 * Task assignee with user information
 */
export interface TaskAssigneeWithUser {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: Date | string;
  user?: {
    id: string;
    email: string;
    name: string;
    initials: string;
    avatar: string | null;
  };
}

/**
 * Task dependency information
 */
export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  task?: TaskWithRelations;
  dependsOn?: TaskWithRelations;
}

/**
 * Input types for creating/updating entities
 * These match what the server actions expect
 */
export interface CreateProjectInput {
  name: string; // From frontend 'title'
  oraNumber?: string;
  status?: ProjectStatus;
  priority?: Priority;
  projectType: string; // From frontend 'studyType'
  studyType?: string;
  bucketId: string;
  labId: string;
  fundingSource?: FundingSource;
  fundingDetails?: string;
  externalCollaborators?: string;
  dueDate?: string; // ISO string
  notes?: string;
  createdById: string;
  memberIds?: string[]; // From frontend 'assigneeIds'
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}

export interface CreateBucketInput {
  name: string; // From frontend 'title'
  description?: string;
  color: string;
  labId: string;
  position?: number;
}

export interface UpdateBucketInput extends Partial<CreateBucketInput> {
  id: string;
}

// Dashboard stats type
export interface DashboardStats {
  totalLabs: {
    count: number;
    names: string;
    label: string;
  };
  activeProjects: {
    active: number;
    total: number;
    label: string;
    progress: number;
  };
  projectBuckets: {
    count: number;
    label: string;
  };
  tasksProgress: {
    completed: number;
    total: number;
    label: string;
    progress: number;
  };
  recentProjects?: ProjectWithRelations[];
  recentActivities?: any[];
}

// Team workload type
export interface TeamWorkload {
  id: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  initials: string;
  role: UserRole;
  activeStudies: number;
  activeTasks: number;
  workloadScore: number;
  // Legacy fields for backward compatibility
  userId?: string;
  currentProjects?: number;
  completedTasks?: number;
  pendingTasks?: number;
  capacity?: number;
  allocation?: number;
  workloadPercentage?: number;
}

// Deadline type
export interface DeadlineWithRelations {
  id: string;
  title: string | any;
  description?: string;
  dueDate: Date | string | null;
  isCompleted?: boolean;
  type?: string;
  status?: ProjectStatus | TaskStatus;
  priority?: Priority | any;
  parentTitle?: string | null;
  projectId?: string;
  project?: ProjectWithRelations;
  assignees?: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      initials: string;
      avatar?: string;
    };
  }>;
}

// User capacity type
export interface UserCapacity {
  userId?: string;
  totalCapacity?: number;
  currentAllocation?: number;
  availableCapacity?: number;
  projects?: Array<{
    projectId: string;
    projectName: string;
    allocation: number;
    role: string;
  }>;
  // New structure support
  user?: {
    id: string;
    name: string;
    initials: string;
    role: any;
  };
  capacity?: {
    total: number;
    allocated: number;
    available: number;
    utilizationPercentage: number;
  };
  assignments?: {
    studies: any[];
    tasks: any[];
  };
}

// Team member creation result
export interface TeamMemberResult {
  id: string;
  email?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: any;
  avatar?: string | null;
  avatarUrl?: string | null;
  initials: string;
  avatarColor?: string;
  capacity?: number;
  expertise?: string[];
  isActive?: boolean;
  isAdmin?: boolean;
  activeStudies?: number;
  activeTasks?: number;
  createdStudies?: number;
  createdTasks?: number;
  workload?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  labs?: Array<{
    id: string;
    labId: string;
    lab: {
      id: string;
      name: string;
      shortName: string;
    };
  }>;
  projectMembers?: Array<{
    id: string;
    projectId: string;
    project: ProjectWithRelations;
  }>;
}

// Bucket with projects for Kanban view  
export interface BucketWithProjects {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  position: number;
  isActive?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  labId: string;
  projects: Array<ProjectWithRelations & {
    progress?: number;
  }>;
  _count?: {
    projects: number;
  };
}

// Bulk operation result
export interface BulkOperationResult<T> {
  successful: T[];
  failed: Array<{
    item: any;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

// Task with all relations
export interface TaskWithFullRelations {
  id: string;
  title: string;
  description?: string;
  status: any; // TaskStatus
  priority: any; // Priority
  projectId: string;
  bucketId?: string;
  dueDate?: Date | string;
  completedDate?: Date | string;
  estimatedHours?: number;
  actualHours?: number;
  position: number;
  isActive: boolean;
  metadata?: any;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdById: string;
  project?: ProjectWithRelations;
  bucket?: BucketWithRelations;
  createdBy?: {
    id: string;
    email: string;
    name: string;
    initials: string;
  };
  assignees?: Array<{
    id: string;
    taskId: string;
    userId: string;
    assignedAt: Date | string;
    user: {
      id: string;
      email: string;
      name: string;
      initials: string;
      avatar?: string;
    };
  }>;
}