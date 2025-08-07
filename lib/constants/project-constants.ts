/**
 * Project-related constants that match the database schema
 * These should be kept in sync with the Prisma schema enums
 */

// Project Status enum - matches ProjectStatus in schema.prisma
export const PROJECT_STATUS = {
  PLANNING: { value: 'PLANNING', label: 'Planning', color: '#6366F1' },
  IRB_SUBMISSION: { value: 'IRB_SUBMISSION', label: 'IRB Submission', color: '#F59E0B' },
  IRB_APPROVED: { value: 'IRB_APPROVED', label: 'IRB Approved', color: '#10B981' },
  DATA_COLLECTION: { value: 'DATA_COLLECTION', label: 'Data Collection', color: '#3B82F6' },
  ANALYSIS: { value: 'ANALYSIS', label: 'Analysis', color: '#10B981' },
  MANUSCRIPT: { value: 'MANUSCRIPT', label: 'Manuscript', color: '#8B5CF6' },
  UNDER_REVIEW: { value: 'UNDER_REVIEW', label: 'Under Review', color: '#F59E0B' },
  PUBLISHED: { value: 'PUBLISHED', label: 'Published', color: '#059669' },
  ON_HOLD: { value: 'ON_HOLD', label: 'On Hold', color: '#6B7280' },
  CANCELLED: { value: 'CANCELLED', label: 'Cancelled', color: '#EF4444' },
  ARCHIVED: { value: 'ARCHIVED', label: 'Archived', color: '#374151' },
} as const;

export type ProjectStatusType = keyof typeof PROJECT_STATUS;

// Priority enum - matches Priority in schema.prisma
export const PRIORITY = {
  LOW: { value: 'LOW', label: 'Low', color: '#10B981', icon: '🟢' },
  MEDIUM: { value: 'MEDIUM', label: 'Medium', color: '#F59E0B', icon: '🟡' },
  HIGH: { value: 'HIGH', label: 'High', color: '#F97316', icon: '🟠' },
  CRITICAL: { value: 'CRITICAL', label: 'Critical', color: '#EF4444', icon: '🔴' },
} as const;

export type PriorityType = keyof typeof PRIORITY;

// Funding Source enum - matches FundingSource in schema.prisma
export const FUNDING_SOURCE = {
  NIH: { value: 'NIH', label: 'NIH', description: 'National Institutes of Health' },
  NSF: { value: 'NSF', label: 'NSF', description: 'National Science Foundation' },
  INDUSTRY_SPONSORED: { value: 'INDUSTRY_SPONSORED', label: 'Industry Sponsored', description: 'Private sector funding' },
  INTERNAL: { value: 'INTERNAL', label: 'Internal', description: 'Institutional funding' },
  FOUNDATION: { value: 'FOUNDATION', label: 'Foundation', description: 'Foundation grants' },
  OTHER: { value: 'OTHER', label: 'Other', description: 'Other funding sources' },
} as const;

export type FundingSourceType = keyof typeof FUNDING_SOURCE;

// Task Status enum - matches TaskStatus in schema.prisma
export const TASK_STATUS = {
  TODO: { value: 'TODO', label: 'To Do', color: '#6B7280' },
  IN_PROGRESS: { value: 'IN_PROGRESS', label: 'In Progress', color: '#3B82F6' },
  REVIEW: { value: 'REVIEW', label: 'Review', color: '#F59E0B' },
  COMPLETED: { value: 'COMPLETED', label: 'Completed', color: '#10B981' },
  BLOCKED: { value: 'BLOCKED', label: 'Blocked', color: '#EF4444' },
} as const;

export type TaskStatusType = keyof typeof TASK_STATUS;

// Member Role enum - matches MemberRole in schema.prisma
export const MEMBER_ROLE = {
  RESPONSIBLE: { value: 'RESPONSIBLE', label: 'Responsible', description: 'Does the work' },
  ACCOUNTABLE: { value: 'ACCOUNTABLE', label: 'Accountable', description: 'Ultimately answerable' },
  CONSULTED: { value: 'CONSULTED', label: 'Consulted', description: 'Two-way communication' },
  INFORMED: { value: 'INFORMED', label: 'Informed', description: 'One-way communication' },
  CONTRIBUTOR: { value: 'CONTRIBUTOR', label: 'Contributor', description: 'General contributor' },
} as const;

export type MemberRoleType = keyof typeof MEMBER_ROLE;

// Idea Category enum - matches IdeaCategory in schema.prisma
export const IDEA_CATEGORY = {
  RESEARCH_QUESTION: { value: 'RESEARCH_QUESTION', label: 'Research Question' },
  METHOD_IMPROVEMENT: { value: 'METHOD_IMPROVEMENT', label: 'Method Improvement' },
  COLLABORATION: { value: 'COLLABORATION', label: 'Collaboration' },
  GRANT_OPPORTUNITY: { value: 'GRANT_OPPORTUNITY', label: 'Grant Opportunity' },
  TECHNOLOGY: { value: 'TECHNOLOGY', label: 'Technology' },
  OTHER: { value: 'OTHER', label: 'Other' },
} as const;

export type IdeaCategoryType = keyof typeof IDEA_CATEGORY;

// Idea Stage enum - matches IdeaStage in schema.prisma
export const IDEA_STAGE = {
  CONCEPT: { value: 'CONCEPT', label: 'Concept', color: '#6B7280' },
  EVALUATION: { value: 'EVALUATION', label: 'Evaluation', color: '#F59E0B' },
  PLANNING: { value: 'PLANNING', label: 'Planning', color: '#3B82F6' },
  APPROVED: { value: 'APPROVED', label: 'Approved', color: '#10B981' },
  IN_PROGRESS: { value: 'IN_PROGRESS', label: 'In Progress', color: '#8B5CF6' },
  COMPLETED: { value: 'COMPLETED', label: 'Completed', color: '#059669' },
} as const;

export type IdeaStageType = keyof typeof IDEA_STAGE;

// Deadline Type enum - matches DeadlineType in schema.prisma
export const DEADLINE_TYPE = {
  IRB_RENEWAL: { value: 'IRB_RENEWAL', label: 'IRB Renewal', icon: '📋' },
  GRANT_SUBMISSION: { value: 'GRANT_SUBMISSION', label: 'Grant Submission', icon: '💰' },
  PAPER_DEADLINE: { value: 'PAPER_DEADLINE', label: 'Paper Deadline', icon: '📄' },
  CONFERENCE_ABSTRACT: { value: 'CONFERENCE_ABSTRACT', label: 'Conference Abstract', icon: '🎯' },
  MILESTONE: { value: 'MILESTONE', label: 'Milestone', icon: '🏁' },
  MEETING: { value: 'MEETING', label: 'Meeting', icon: '👥' },
  OTHER: { value: 'OTHER', label: 'Other', icon: '📌' },
} as const;

export type DeadlineTypeType = keyof typeof DEADLINE_TYPE;

// Helper functions to get arrays for dropdowns
export const getProjectStatusOptions = () => Object.values(PROJECT_STATUS);
export const getPriorityOptions = () => Object.values(PRIORITY);
export const getFundingSourceOptions = () => Object.values(FUNDING_SOURCE);
export const getTaskStatusOptions = () => Object.values(TASK_STATUS);
export const getMemberRoleOptions = () => Object.values(MEMBER_ROLE);
export const getIdeaCategoryOptions = () => Object.values(IDEA_CATEGORY);
export const getIdeaStageOptions = () => Object.values(IDEA_STAGE);
export const getDeadlineTypeOptions = () => Object.values(DEADLINE_TYPE);

// Helper function to get label by value
export function getStatusLabel(status: string): string {
  return PROJECT_STATUS[status as ProjectStatusType]?.label || status;
}

export function getPriorityLabel(priority: string): string {
  return PRIORITY[priority as PriorityType]?.label || priority;
}

export function getFundingSourceLabel(source: string): string {
  return FUNDING_SOURCE[source as FundingSourceType]?.label || source;
}