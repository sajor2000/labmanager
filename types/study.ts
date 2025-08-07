// Study/Project related types
export interface StudyAssignee {
  id: string;
  userId: string;
  projectId: string;
  assignedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    initials: string | null;
    avatar: string | null;
  };
}

export interface Study {
  id: string;
  name: string;
  oraNumber: string | null;
  status: StudyStatus;
  priority: Priority;
  studyType: string | null;
  fundingSource: string | null;
  externalCollaborators: string | null;
  bucketId: string | null;
  labId: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  assignees?: StudyAssignee[];
  bucket?: {
    id: string;
    name: string;
    color: string;
  };
  lab?: {
    id: string;
    name: string;
    shortName: string;
  };
  _count?: {
    tasks: number;
    assignees: number;
  };
}

export type StudyStatus = 
  | 'Planning'
  | 'IRB Submission'
  | 'IRB Approved'
  | 'Data Collection'
  | 'Analysis'
  | 'Manuscript'
  | 'Under Review'
  | 'Published'
  | 'On Hold'
  | 'Cancelled';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface CreateStudyPayload {
  name: string;
  oraNumber?: string;
  status?: StudyStatus;
  priority?: Priority;
  studyType?: string;
  fundingSource?: string;
  externalCollaborators?: string;
  bucketId?: string;
  labId: string;
  dueDate?: string;
  notes?: string;
}

export interface UpdateStudyPayload extends Partial<CreateStudyPayload> {
  isActive?: boolean;
}

export interface StudyFilters {
  status?: StudyStatus;
  priority?: Priority;
  bucketId?: string;
  labId?: string;
  searchTerm?: string;
  hasDeadline?: boolean;
}