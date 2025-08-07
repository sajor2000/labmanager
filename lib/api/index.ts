/**
 * Unified API service for all domains
 */

import { BaseApiClient, createCacheKeys, STALE_TIMES } from './base';
import type {
  // Studies
  Study,
  CreateStudyPayload,
  UpdateStudyPayload,
  StudyFilters,
  // Tasks
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
  // Ideas
  Idea,
  CreateIdeaPayload,
  UpdateIdeaPayload,
  IdeaFilters,
  VotePayload,
  // Standups
  Standup,
  CreateStandupPayload,
  UpdateStandupPayload,
  StandupFilters,
  // Buckets
  Bucket,
  CreateBucketPayload,
  UpdateBucketPayload,
  BucketFilters,
  MoveProjectPayload,
  // Deadlines
  Deadline,
  CreateDeadlinePayload,
  UpdateDeadlinePayload,
  DeadlineFilters,
  // Team
  TeamMember,
  CreateTeamMemberPayload,
  UpdateTeamMemberPayload,
  TeamFilters,
  // Dashboard
  DashboardMetrics,
} from '@/types';

class ApiClient extends BaseApiClient {
  // Studies/Projects
  studies = {
    getAll: (filters?: StudyFilters) => 
      this.get<Study[]>('/api/projects', filters),
    
    getById: (id: string) => 
      this.get<Study>(`/api/studies/${id}`),
    
    create: (data: CreateStudyPayload) => {
      // Transform status and priority to uppercase for API
      const transformedData = {
        ...data,
        status: data.status?.toUpperCase().replace(/ /g, '_'),
        priority: data.priority?.toUpperCase(),
        fundingSource: data.fundingSource?.toUpperCase().replace(/ /g, '_'),
        projectType: data.studyType || 'Research Study', // Map studyType to projectType
        memberIds: data.assignees || [], // Map assignees to memberIds
        createdById: 'user_placeholder', // TODO: Get from auth context
      };
      return this.post<Study>('/api/projects', transformedData);
    },
    
    update: (id: string, data: UpdateStudyPayload) => 
      this.put<Study>(`/api/studies/${id}`, data),
    
    delete: (id: string) => 
      this.delete<{ success: boolean }>(`/api/studies/${id}`),
    
    assignUsers: (studyId: string, userIds: string[]) =>
      this.post(`/api/studies/${studyId}/assign`, { userIds }),
  };

  // Tasks
  tasks = {
    getAll: (filters?: TaskFilters) => 
      this.get<Task[]>('/api/tasks', filters),
    
    getById: (id: string) => 
      this.get<Task>(`/api/tasks/${id}`),
    
    create: (data: CreateTaskPayload) => 
      this.post<Task>('/api/tasks', data),
    
    update: (id: string, data: UpdateTaskPayload) => 
      this.put<Task>(`/api/tasks/${id}`, data),
    
    delete: (id: string) => 
      this.delete<{ success: boolean }>(`/api/tasks/${id}`),
    
    complete: (id: string) =>
      this.patch<Task>(`/api/tasks/${id}`, { status: 'Done', completedAt: new Date() }),
  };

  // Ideas
  ideas = {
    getAll: (filters?: IdeaFilters) => 
      this.get<Idea[]>('/api/ideas', filters),
    
    getById: (id: string) => 
      this.get<Idea>(`/api/ideas/${id}`),
    
    create: (data: CreateIdeaPayload) => 
      this.post<Idea>('/api/ideas', data),
    
    update: (id: string, data: UpdateIdeaPayload) => 
      this.put<Idea>(`/api/ideas/${id}`, data),
    
    delete: (id: string) => 
      this.delete<{ success: boolean }>(`/api/ideas/${id}`),
    
    vote: (data: VotePayload) =>
      this.post('/api/ideas/vote', data),
  };

  // Standups
  standups = {
    getAll: (filters?: StandupFilters) => 
      this.get<Standup[]>('/api/standups', filters),
    
    getById: (id: string) => 
      this.get<Standup>(`/api/standups/${id}`),
    
    create: (data: CreateStandupPayload) => 
      this.post<Standup>('/api/standups', data),
    
    update: (id: string, data: UpdateStandupPayload) => 
      this.put<Standup>(`/api/standups/${id}`, data),
    
    delete: (id: string) => 
      this.delete<{ success: boolean }>(`/api/standups/${id}`),
    
    transcribe: (id: string, audioFile: File) => {
      const formData = new FormData();
      formData.append('audio', audioFile);
      return this.post(`/api/standups/${id}/transcribe`, formData);
    },
    
    process: (id: string) =>
      this.post(`/api/standups/${id}/process`, {}),
    
    getStats: () =>
      this.get('/api/standups/stats'),
  };

  // Buckets
  buckets = {
    getAll: (filters?: BucketFilters) => 
      this.get<Bucket[]>('/api/buckets', filters),
    
    getById: (id: string) => 
      this.get<Bucket>(`/api/buckets/${id}`),
    
    create: (data: CreateBucketPayload) => 
      this.post<Bucket>('/api/buckets', data),
    
    update: (id: string, data: UpdateBucketPayload) => 
      this.put<Bucket>(`/api/buckets/${id}`, data),
    
    delete: (id: string) => 
      this.delete<{ success: boolean }>(`/api/buckets/${id}`),
    
    moveProject: (data: MoveProjectPayload) =>
      this.post('/api/buckets/move-project', data),
    
    reorder: (buckets: Array<{ id: string; order: number }>) =>
      this.post('/api/buckets/reorder', { buckets }),
  };

  // Deadlines
  deadlines = {
    getAll: (filters?: DeadlineFilters) => 
      this.get<Deadline[]>('/api/deadlines', filters),
    
    getById: (id: string) => 
      this.get<Deadline>(`/api/deadlines/${id}`),
    
    create: (data: CreateDeadlinePayload) => 
      this.post<Deadline>('/api/deadlines', data),
    
    update: (id: string, data: UpdateDeadlinePayload) => 
      this.put<Deadline>(`/api/deadlines/${id}`, data),
    
    delete: (id: string) => 
      this.delete<{ success: boolean }>(`/api/deadlines/${id}`),
    
    getCalendarEvents: (start: Date, end: Date) =>
      this.get('/api/calendar/events', { start, end }),
  };

  // Team
  team = {
    getAll: (filters?: TeamFilters) => 
      this.get<TeamMember[]>('/api/team', filters),
    
    getById: (id: string) => 
      this.get<TeamMember>(`/api/team/${id}`),
    
    create: (data: CreateTeamMemberPayload) => 
      this.post<TeamMember>('/api/team', data),
    
    update: (id: string, data: UpdateTeamMemberPayload) => 
      this.put<TeamMember>(`/api/team/${id}`, data),
    
    delete: (id: string) => 
      this.delete<{ success: boolean }>(`/api/team/${id}`),
    
    uploadAvatar: (userId: string, file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return this.post(`/api/users/${userId}/avatar`, formData);
    },
  };

  // Dashboard
  dashboard = {
    getMetrics: () => 
      this.get<DashboardMetrics>('/api/dashboard/metrics'),
    
    getActivity: (limit?: number) =>
      this.get('/api/dashboard/activity', { limit }),
    
    getRecentStudies: (limit?: number) =>
      this.get<Study[]>('/api/dashboard/recent-studies', { limit }),
    
    getUpcomingDeadlines: (days?: number) =>
      this.get<Deadline[]>('/api/dashboard/upcoming-deadlines', { days }),
  };

  // Kanban specific
  kanban = {
    getBuckets: () =>
      this.get('/api/kanban/buckets'),
    
    getProjects: () =>
      this.get('/api/kanban/projects'),
    
    updateProject: (id: string, data: any) =>
      this.put(`/api/kanban/projects/${id}`, data),
  };
}

// Export singleton instance
export const api = new ApiClient();

// Export cache keys for each domain
export const cacheKeys = {
  labs: createCacheKeys('labs'),
  studies: createCacheKeys('studies'),
  tasks: createCacheKeys('tasks'),
  ideas: createCacheKeys('ideas'),
  standups: createCacheKeys('standups'),
  buckets: createCacheKeys('buckets'),
  deadlines: createCacheKeys('deadlines'),
  team: createCacheKeys('team'),
  dashboard: createCacheKeys('dashboard'),
  kanban: createCacheKeys('kanban'),
};

// Export stale times
export { STALE_TIMES };

// Re-export base utilities
export { ApiError, type ApiClient } from './base';