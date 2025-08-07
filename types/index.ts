// Core type definitions for LabManage Research Hub

import { LucideIcon } from "lucide-react";

// User types
export type UserRole = 
  | "Principal Investigator"
  | "Co-Principal Investigator"
  | "Research Member"
  | "Lab Administrator"
  | "External Collaborator";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  avatarUrl?: string | null;
  avatarImage?: Buffer | null;
  initials: string;
  labIds: string[];
  expertise?: string[];
  capacity?: number; // Hours per week capacity
  createdAt: Date;
  updatedAt: Date;
}

// Lab types
export interface Lab {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  memberCount: number;
  activeStudies: number;
  totalStudies: number;
  createdAt: Date;
  updatedAt: Date;
  adminIds: string[];
}

// Study types
export type StudyStatus = 
  | "PLANNING"
  | "IRB_SUBMISSION"
  | "IRB_APPROVED"
  | "DATA_COLLECTION"
  | "ANALYSIS"
  | "MANUSCRIPT"
  | "UNDER_REVIEW"
  | "PUBLISHED"
  | "ON_HOLD"
  | "CANCELLED";

export type StudyPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FundingSource = 
  | "NIH"
  | "NSF"
  | "INDUSTRY_SPONSORED"
  | "INTERNAL"
  | "FOUNDATION"
  | "OTHER";

export interface Study {
  id: string;
  title: string;
  oraNumber?: string;
  status: StudyStatus;
  priority: StudyPriority;
  studyType: string;
  bucketId: string;
  fundingSource?: FundingSource;
  fundingDetails?: string;
  assigneeIds: string[];
  externalCollaborators?: string;
  dueDate?: Date;
  notes?: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  labId: string;
}

// Bucket types
export interface Bucket {
  id: string;
  title: string;
  description?: string;
  color: string;
  studyIds: string[];
  labId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Project type (for Kanban)
export interface Project {
  id: string;
  name: string;
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
  tasks?: Task[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Task types
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "REVIEW";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: StudyPriority;
  studyId?: string;
  projectId?: string; // Backend uses projectId, frontend uses studyId
  assigneeIds: string[];
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}

// Idea types
export type IdeaStatus = "Draft" | "Under Review" | "Approved" | "Rejected" | "Converted";

export interface Idea {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  votes: number;
  voterIds: string[];
  feasibilityScore?: number;
  impactScore?: number;
  createdById: string;
  labId: string;
  convertedToStudyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Standup types
export interface Standup {
  id: string;
  date: Date;
  participants: string[];
  audioUrl?: string;
  transcript?: string;
  actionItems: ActionItem[];
  blockers: string[];
  decisions: string[];
  labId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionItem {
  id: string;
  description: string;
  assigneeId?: string;
  studyId?: string;
  completed: boolean;
  dueDate?: Date;
}

// Navigation types
export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

// Dashboard types
export interface MetricData {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "amber";
  progress?: number;
}

export interface ActivityItem {
  id: string;
  type: "study" | "task" | "team" | "alert" | "deadline";
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
  iconColor: string;
}

// Form types
export interface StudyFormData {
  studyName: string;
  oraNumber: string;
  status: StudyStatus;
  priority: StudyPriority;
  bucket: string;
  fundingSource: string;
  studyType: string;
  dueDate: string;
  externalCollaborators: string;
  notes: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Filter types
export interface StudyFilters {
  status?: StudyStatus[];
  priority?: StudyPriority[];
  bucketIds?: string[];
  assigneeIds?: string[];
  fundingSources?: FundingSource[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

// Sort types
export type SortDirection = "asc" | "desc";

export interface SortOptions {
  field: string;
  direction: SortDirection;
}

// Permission types
export interface Permissions {
  studies: {
    create: UserRole[];
    edit: UserRole[];
    delete: UserRole[];
    view: UserRole[];
  };
  tasks: {
    create: UserRole[];
    edit: UserRole[];
    delete: UserRole[];
    view: UserRole[];
  };
  labs: {
    create: UserRole[];
    edit: UserRole[];
    delete: UserRole[];
    view: UserRole[];
  };
  team: {
    invite: UserRole[];
    remove: UserRole[];
    changeRole: UserRole[];
  };
}

// Theme types
export type Theme = "light" | "dark" | "system";

// ========================================
// AIRTABLE/MONDAY.COM-LIKE FEATURE TYPES
// ========================================

// Comment types
export interface ProjectComment {
  id: string;
  content: string;
  projectId: string;
  userId: string;
  parentId?: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  user?: User;
  replies?: ProjectComment[];
}

export interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  parentId?: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  user?: User;
  replies?: TaskComment[];
}

// Attachment types
export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  entityType: string;
  entityId: string;
  uploadedById: string;
  uploadedAt: Date;
  uploadedBy?: User;
}

// Custom field types
export type CustomFieldType = 
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "MULTI_SELECT"
  | "CHECKBOX"
  | "URL"
  | "EMAIL"
  | "PHONE"
  | "FORMULA"
  | "LOOKUP"
  | "ROLLUP";

export interface CustomField {
  id: string;
  name: string;
  fieldType: CustomFieldType;
  entityType: string;
  labId: string;
  options?: any;
  defaultValue?: any;
  isRequired: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  values?: CustomFieldValue[];
}

export interface CustomFieldValue {
  id: string;
  fieldId: string;
  entityId: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
  field?: CustomField;
}

// View configuration types
export type ViewType = 
  | "KANBAN"
  | "TABLE"
  | "TIMELINE"
  | "CALENDAR"
  | "GANTT"
  | "FORM"
  | "GALLERY"
  | "MAP";

export interface ViewConfiguration {
  id: string;
  name: string;
  viewType: ViewType;
  entityType: string;
  userId: string;
  labId: string;
  config: any;
  isDefault: boolean;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  lab?: Lab;
}

// Automation types
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  labId: string;
  triggerType: string;
  triggerConfig: any;
  actionType: string;
  actionConfig: any;
  conditions?: any;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  lab?: Lab;
  createdBy?: User;
}

// Enhanced notification types
export type NotificationType = 
  | "MENTION"
  | "ASSIGNMENT"
  | "COMMENT"
  | "STATUS_CHANGE"
  | "DUE_DATE_REMINDER"
  | "DEADLINE_APPROACHING"
  | "TASK_COMPLETED"
  | "PROJECT_UPDATE"
  | "SYSTEM_ALERT";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  user?: User;
}

// User presence types
export interface UserPresence {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  lastSeenAt: Date;
  user?: User;
}