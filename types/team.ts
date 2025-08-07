// Team/User related types
export interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: UserRole | null;
  department: string | null;
  initials: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  labs?: LabMembership[];
  _count?: {
    assignedTasks: number;
    createdTasks: number;
    projects: number;
  };
}

export interface LabMembership {
  id: string;
  userId: string;
  labId: string;
  isAdmin: boolean;
  joinedAt: string;
  isActive: boolean;
  lab: {
    id: string;
    name: string;
    shortName: string;
  };
}

export type UserRole = 
  | 'Principal Investigator'
  | 'Co-Principal Investigator'
  | 'Research Coordinator'
  | 'Research Assistant'
  | 'Data Analyst'
  | 'Lab Manager'
  | 'Post-Doc'
  | 'Graduate Student'
  | 'Undergraduate Student'
  | 'Administrator'
  | 'External Collaborator';

export interface CreateTeamMemberPayload {
  name: string;
  email: string;
  role?: UserRole;
  department?: string;
  avatar?: string;
}

export interface UpdateTeamMemberPayload extends Partial<CreateTeamMemberPayload> {
  isActive?: boolean;
}

export interface TeamStatistics {
  totalMembers: number;
  activeMembers: number;
  byRole: Record<string, number>;
  byDepartment: Record<string, number>;
  averageTasksPerMember: number;
  averageProjectsPerMember: number;
}

export interface TeamFilters {
  role?: UserRole;
  department?: string;
  labId?: string;
  isActive?: boolean;
  searchTerm?: string;
}