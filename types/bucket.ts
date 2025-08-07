// Bucket related types
export interface Bucket {
  id: string;
  name: string;
  description: string | null;
  color: string;
  order: number;
  labId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lab?: {
    id: string;
    name: string;
    shortName: string;
  };
  projects?: BucketProject[];
  _count?: {
    projects: number;
  };
}

export interface BucketProject {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignees?: Array<{
    user: {
      id: string;
      name: string | null;
      initials: string | null;
      avatar: string | null;
    };
  }>;
}

export interface CreateBucketPayload {
  name: string;
  description?: string;
  color: string;
  order?: number;
  labId: string;
}

export interface UpdateBucketPayload extends Partial<CreateBucketPayload> {
  isActive?: boolean;
}

export interface BucketFilters {
  labId?: string;
  isActive?: boolean;
  hasProjects?: boolean;
  searchTerm?: string;
}

export interface BucketStatistics {
  total: number;
  active: number;
  withProjects: number;
  averageProjectsPerBucket: number;
}

export interface MoveProjectPayload {
  projectId: string;
  fromBucketId: string | null;
  toBucketId: string;
}

export interface ReorderBucketsPayload {
  buckets: Array<{
    id: string;
    order: number;
  }>;
}