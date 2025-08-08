/**
 * Mappers to transform between backend Project model and frontend Study interface
 * This provides compatibility during the migration from Study to Project terminology
 */

import type { 
  Project, 
  ProjectStatus, 
  Priority, 
  FundingSource,
  ProjectMember,
  MemberRole 
} from '@prisma/client';
import type { Study, StudyStatus, StudyAssignee } from '@/types/study';

/**
 * Map backend ProjectStatus enum to frontend StudyStatus string
 */
export function mapProjectStatus(status: ProjectStatus): StudyStatus {
  const statusMap: Record<ProjectStatus, StudyStatus> = {
    PLANNING: 'Planning',
    IRB_SUBMISSION: 'IRB Submission',
    IRB_APPROVED: 'IRB Approved',
    DATA_COLLECTION: 'Data Collection',
    ANALYSIS: 'Analysis',
    MANUSCRIPT: 'Manuscript',
    UNDER_REVIEW: 'Under Review',
    PUBLISHED: 'Published',
    ON_HOLD: 'On Hold',
    CANCELLED: 'Cancelled',
    ARCHIVED: 'Cancelled', // Map ARCHIVED to Cancelled for now
  };
  return statusMap[status];
}

/**
 * Map frontend StudyStatus string to backend ProjectStatus enum
 */
export function mapStudyStatus(status: StudyStatus): ProjectStatus {
  const statusMap: Record<StudyStatus, ProjectStatus> = {
    'Planning': 'PLANNING',
    'IRB Submission': 'IRB_SUBMISSION',
    'IRB Approved': 'IRB_APPROVED',
    'Data Collection': 'DATA_COLLECTION',
    'Analysis': 'ANALYSIS',
    'Manuscript': 'MANUSCRIPT',
    'Under Review': 'UNDER_REVIEW',
    'Published': 'PUBLISHED',
    'On Hold': 'ON_HOLD',
    'Cancelled': 'CANCELLED',
  };
  return statusMap[status];
}

/**
 * Map backend Priority enum to frontend string
 */
export function mapPriority(priority: Priority): 'Low' | 'Medium' | 'High' | 'Critical' {
  const priorityMap: Record<Priority, 'Low' | 'Medium' | 'High' | 'Critical'> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
  };
  return priorityMap[priority];
}

/**
 * Map frontend Priority string to backend enum
 */
export function mapPriorityToEnum(priority: 'Low' | 'Medium' | 'High' | 'Critical'): Priority {
  const priorityMap: Record<string, Priority> = {
    'Low': 'LOW',
    'Medium': 'MEDIUM',
    'High': 'HIGH',
    'Critical': 'CRITICAL',
  };
  return priorityMap[priority];
}

/**
 * Map FundingSource enum to string
 */
export function mapFundingSource(source: FundingSource | null): string | null {
  if (!source) return null;
  
  const fundingMap: Record<FundingSource, string> = {
    NIH: 'NIH',
    NSF: 'NSF',
    INDUSTRY_SPONSORED: 'Industry Sponsored',
    INTERNAL: 'Internal',
    FOUNDATION: 'Foundation',
    OTHER: 'Other',
  };
  return fundingMap[source];
}

/**
 * Map ProjectMember to StudyAssignee
 */
export function memberToAssignee(member: any): StudyAssignee {
  return {
    id: member.id,
    userId: member.userId,
    projectId: member.projectId,
    assignedAt: member.joinedAt?.toString() || new Date().toISOString(),
    user: member.user ? {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      initials: member.user.initials,
      avatar: member.user.avatar,
    } : undefined,
  };
}

/**
 * Transform backend Project to frontend Study format
 */
export function projectToStudy(project: any): Study {
  return {
    id: project.id,
    name: project.name,
    oraNumber: project.oraNumber,
    status: mapProjectStatus(project.status),
    priority: mapPriority(project.priority),
    studyType: project.projectType || project.studyType, // Use projectType, fallback to studyType
    fundingSource: mapFundingSource(project.fundingSource),
    externalCollaborators: project.externalCollaborators,
    bucketId: project.bucketId,
    labId: project.labId,
    dueDate: project.dueDate?.toString() || null,
    notes: project.notes,
    createdAt: project.createdAt?.toString() || new Date().toISOString(),
    updatedAt: project.updatedAt?.toString() || new Date().toISOString(),
    isActive: project.isActive ?? true,
    assignees: project.members?.map(memberToAssignee) || [],
    bucket: project.bucket,
    lab: project.lab,
    _count: {
      tasks: project._count?.tasks || 0,
      assignees: project._count?.members || project.members?.length || 0,
    },
  };
}

/**
 * Transform frontend Study to backend Project format for creation/update
 */
export function studyToProject(study: any): any {
  return {
    name: study.name,
    oraNumber: study.oraNumber,
    status: study.status ? mapStudyStatus(study.status) : undefined,
    priority: study.priority ? mapPriorityToEnum(study.priority) : undefined,
    projectType: study.studyType || study.projectType,
    studyType: study.studyType, // Keep for backward compatibility
    fundingSource: study.fundingSource?.replace(' ', '_').toUpperCase() as FundingSource || undefined,
    externalCollaborators: study.externalCollaborators,
    bucketId: study.bucketId,
    labId: study.labId,
    dueDate: study.dueDate ? new Date(study.dueDate) : undefined,
    notes: study.notes,
    isActive: study.isActive,
  };
}

/**
 * Transform array of Projects to Studies
 */
export function projectsToStudies(projects: any[]): Study[] {
  return projects.map(projectToStudy);
}

/**
 * Map MemberRole enum for display
 */
export function mapMemberRole(role: MemberRole): string {
  const roleMap: Record<MemberRole, string> = {
    RESPONSIBLE: 'Responsible',
    ACCOUNTABLE: 'Accountable',
    CONSULTED: 'Consulted',
    INFORMED: 'Informed',
    CONTRIBUTOR: 'Contributor',
  };
  return roleMap[role];
}

/**
 * Get role description for tooltips
 */
export function getMemberRoleDescription(role: MemberRole): string {
  const descriptions: Record<MemberRole, string> = {
    RESPONSIBLE: 'Does the work to complete the task',
    ACCOUNTABLE: 'Ultimately answerable for correct completion',
    CONSULTED: 'Provides input based on expertise',
    INFORMED: 'Kept up-to-date on progress',
    CONTRIBUTOR: 'General contributor to the project',
  };
  return descriptions[role];
}