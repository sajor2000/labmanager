/**
 * Transformation utilities for converting between database models and frontend interfaces
 * These functions handle the mapping between different field names and structures
 */

import type { 
  Study, 
  Bucket, 
  Task,
  StudyStatus, 
  StudyPriority, 
  FundingSource,
  TaskStatus 
} from '@/types';
import type { 
  ProjectWithRelations, 
  BucketWithRelations,
  TaskWithRelations,
  CreateProjectInput,
  UpdateProjectInput,
  CreateBucketInput,
  UpdateBucketInput
} from '@/lib/types/dto';

/**
 * Convert a Project from the database to a Study for the frontend
 */
export function projectToStudy(project: ProjectWithRelations): Study {
  return {
    id: project.id,
    title: project.name, // Map name -> title
    oraNumber: project.oraNumber || undefined,
    status: project.status as StudyStatus,
    priority: project.priority as StudyPriority,
    studyType: project.projectType, // Map projectType -> studyType
    bucketId: project.bucketId,
    fundingSource: project.fundingSource as FundingSource | undefined,
    fundingDetails: project.fundingDetails || undefined,
    assigneeIds: project.members?.map(m => m.userId) || [], // Map members -> assigneeIds
    externalCollaborators: project.externalCollaborators || undefined,
    dueDate: project.dueDate ? new Date(project.dueDate) : undefined,
    notes: project.notes || undefined,
    progress: project.progress || 0,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
    createdById: project.createdById,
    labId: project.labId
  };
}

/**
 * Convert an array of Projects to Studies
 */
export function projectsToStudies(projects: ProjectWithRelations[]): Study[] {
  return projects.map(projectToStudy);
}

/**
 * Convert a Study from the frontend to Project input for the database
 * Used when creating or updating projects
 */
export function studyToProjectInput(study: Partial<Study> & { assigneeIds?: string[] }): Partial<CreateProjectInput> {
  const input: Partial<CreateProjectInput> = {};
  
  // Map fields with different names
  if (study.title !== undefined) input.name = study.title;
  if (study.studyType !== undefined) {
    input.projectType = study.studyType;
    input.studyType = study.studyType; // Keep both for backward compatibility
  }
  if (study.assigneeIds !== undefined) input.memberIds = study.assigneeIds;
  
  // Copy fields with same names
  if (study.oraNumber !== undefined) input.oraNumber = study.oraNumber;
  if (study.status !== undefined) input.status = study.status as any;
  if (study.priority !== undefined) input.priority = study.priority as any;
  if (study.bucketId !== undefined) input.bucketId = study.bucketId;
  if (study.labId !== undefined) input.labId = study.labId;
  if (study.fundingSource !== undefined) input.fundingSource = study.fundingSource as any;
  if (study.fundingDetails !== undefined) input.fundingDetails = study.fundingDetails;
  if (study.externalCollaborators !== undefined) input.externalCollaborators = study.externalCollaborators;
  if (study.notes !== undefined) input.notes = study.notes;
  if (study.createdById !== undefined) input.createdById = study.createdById;
  
  // Handle date conversion
  if (study.dueDate !== undefined) {
    input.dueDate = study.dueDate ? study.dueDate.toISOString() : undefined;
  }
  
  return input;
}

/**
 * Convert a Bucket from the database to the frontend format
 */
export function bucketToBucketUI(bucket: BucketWithRelations): Bucket {
  return {
    id: bucket.id,
    title: bucket.name, // Map name -> title
    description: bucket.description || undefined,
    color: bucket.color,
    studyIds: bucket.projects?.map(p => p.id) || [], // Extract project IDs
    labId: bucket.labId,
    order: bucket.position, // Map position -> order
    createdAt: new Date(bucket.createdAt),
    updatedAt: new Date(bucket.updatedAt)
  };
}

/**
 * Convert an array of Buckets to frontend format
 */
export function bucketsToBucketsUI(buckets: BucketWithRelations[]): Bucket[] {
  return buckets.map(bucketToBucketUI);
}

/**
 * Convert a Bucket from the frontend to Bucket input for the database
 */
export function bucketUIToBucketInput(bucket: Partial<Bucket>): Partial<CreateBucketInput> {
  const input: Partial<CreateBucketInput> = {};
  
  // Map fields with different names
  if (bucket.title !== undefined) input.name = bucket.title;
  if (bucket.order !== undefined) input.position = bucket.order;
  
  // Copy fields with same names
  if (bucket.description !== undefined) input.description = bucket.description;
  if (bucket.color !== undefined) input.color = bucket.color;
  if (bucket.labId !== undefined) input.labId = bucket.labId;
  
  return input;
}

/**
 * Convert a Task from the database to the frontend format
 */
export function taskToTaskUI(task: TaskWithRelations): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    status: task.status as TaskStatus,
    priority: task.priority as StudyPriority,
    studyId: task.projectId, // Map projectId -> studyId for backward compatibility
    assigneeIds: task.assignees?.map(a => a.userId) || [],
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    completedAt: task.completedDate ? new Date(task.completedDate) : undefined,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
    createdById: task.createdById
  };
}

/**
 * Convert an array of Tasks to frontend format
 */
export function tasksToTasksUI(tasks: TaskWithRelations[]): Task[] {
  return tasks.map(taskToTaskUI);
}

/**
 * Helper to prepare Study data for create/update operations
 * Removes undefined values and converts to proper input format
 */
export function prepareStudyForAction(study: Partial<Study> & { assigneeIds?: string[] }): CreateProjectInput | UpdateProjectInput {
  const input = studyToProjectInput(study);
  
  // Remove undefined values
  const cleanInput = Object.entries(input).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof typeof input] = value;
    }
    return acc;
  }, {} as any);
  
  return cleanInput;
}

/**
 * Helper to prepare Bucket data for create/update operations
 */
export function prepareBucketForAction(bucket: Partial<Bucket>): CreateBucketInput | UpdateBucketInput {
  const input = bucketUIToBucketInput(bucket);
  
  // Remove undefined values
  const cleanInput = Object.entries(input).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof typeof input] = value;
    }
    return acc;
  }, {} as any);
  
  return cleanInput;
}

/**
 * Type assertion helpers for action inputs
 * These ensure the data matches what the Zod schemas expect
 */
export function assertStudyActionInput(data: any): any {
  // This is a type assertion helper
  // The actual validation happens in the action itself
  return data;
}

export function assertBucketActionInput(data: any): any {
  // This is a type assertion helper
  // The actual validation happens in the action itself
  return data;
}