// User related types
export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  avatar: string | null;
  initials: string | null;
}

// Lab member types
export interface LabMember {
  id: string;
  isAdmin: boolean;
  joinedAt: string;
  user: User;
}

// Project/Study types
export interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
  type?: string;
  dueDate?: string | null;
  _count?: {
    tasks: number;
  };
}

// Idea types
export interface Idea {
  id: string;
  title: string;
  status: string;
  votes: number;
  createdAt: string;
  authorId: string;
}

// Standup types
export interface Standup {
  id: string;
  date: string;
  participants: string[];
  actionItems: string[];
}

// Bucket types
export interface Bucket {
  id: string;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
}

// Lab count statistics
export interface LabCounts {
  projects: number;
  members: number;
  buckets: number;
  ideas: number;
  standups: number;
}

// Main Lab type
export interface Lab {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  logo: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: LabMember[];
  projects: Project[];
  buckets?: Bucket[];
  ideas?: Idea[];
  standups?: Standup[];
  _count: LabCounts;
}

// Form data types
export interface LabFormData {
  name: string;
  shortName: string;
  description: string;
  logo?: string;
  icon?: string;
  color?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Lab creation/update payload
export interface CreateLabPayload {
  name: string;
  shortName: string;
  description?: string;
  logo?: string;
  icon?: string;
  color?: string;
}

export interface UpdateLabPayload extends Partial<CreateLabPayload> {
  isActive?: boolean;
}

// Member management types
export interface AddMemberPayload {
  email: string;
  isAdmin?: boolean;
}

export interface UpdateMemberPayload {
  userId: string;
  isAdmin?: boolean;
  isActive?: boolean;
}

// Filter and sort options
export interface LabFilters {
  isActive?: boolean;
  hasProjects?: boolean;
  searchTerm?: string;
}

export interface LabSortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'memberCount' | 'projectCount';
  direction: 'asc' | 'desc';
}