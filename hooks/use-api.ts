/**
 * Comprehensive React Query hooks for all API domains
 */

import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, cacheKeys, STALE_TIMES } from '@/lib/api';
import type {
  Study,
  Task,
  Idea,
  Standup,
  Bucket,
  Deadline,
  TeamMember,
  DashboardMetrics,
  CreateStudyPayload,
  UpdateStudyPayload,
  CreateTaskPayload,
  UpdateTaskPayload,
  CreateIdeaPayload,
  UpdateIdeaPayload,
  CreateStandupPayload,
  UpdateStandupPayload,
  CreateBucketPayload,
  UpdateBucketPayload,
  CreateDeadlinePayload,
  UpdateDeadlinePayload,
  CreateTeamMemberPayload,
  UpdateTeamMemberPayload,
  StudyFilters,
  TaskFilters,
  IdeaFilters,
  StandupFilters,
  BucketFilters,
  DeadlineFilters,
  TeamFilters,
  VotePayload,
  MoveProjectPayload,
} from '@/types';

// ============================================
// STUDIES/PROJECTS HOOKS
// ============================================

export function useStudies(filters?: StudyFilters, options?: UseQueryOptions<Study[]>) {
  return useQuery({
    queryKey: cacheKeys.studies.list(filters),
    queryFn: () => api.studies.getAll(filters),
    staleTime: STALE_TIMES.medium,
    ...options,
  });
}

export function useStudy(id: string, options?: UseQueryOptions<Study>) {
  return useQuery({
    queryKey: cacheKeys.studies.detail(id),
    queryFn: () => api.studies.getById(id),
    staleTime: STALE_TIMES.short,
    enabled: !!id,
    ...options,
  });
}

export function useCreateStudy(options?: UseMutationOptions<Study, Error, CreateStudyPayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.studies.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.studies.all });
      toast.success('Study created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create study');
    },
    ...options,
  });
}

export function useUpdateStudy(id: string, options?: UseMutationOptions<Study, Error, UpdateStudyPayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateStudyPayload) => api.studies.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.studies.all });
      queryClient.invalidateQueries({ queryKey: cacheKeys.studies.detail(id) });
      toast.success('Study updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update study');
    },
    ...options,
  });
}

export function useDeleteStudy(options?: UseMutationOptions<{ success: boolean }, Error, string>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.studies.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.studies.all });
      toast.success('Study deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete study');
    },
    ...options,
  });
}

// ============================================
// TASKS HOOKS
// ============================================

export function useTasks(filters?: TaskFilters, options?: UseQueryOptions<Task[]>) {
  return useQuery({
    queryKey: cacheKeys.tasks.list(filters),
    queryFn: () => api.tasks.getAll(filters),
    staleTime: STALE_TIMES.short,
    ...options,
  });
}

export function useTask(id: string, options?: UseQueryOptions<Task>) {
  return useQuery({
    queryKey: cacheKeys.tasks.detail(id),
    queryFn: () => api.tasks.getById(id),
    staleTime: STALE_TIMES.short,
    enabled: !!id,
    ...options,
  });
}

export function useCreateTask(options?: UseMutationOptions<Task, Error, CreateTaskPayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.tasks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.all });
      toast.success('Task created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create task');
    },
    ...options,
  });
}

export function useUpdateTask(options?: UseMutationOptions<Task, Error, { id: string } & UpdateTaskPayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateTaskPayload) => api.tasks.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.detail(id) });
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update task');
    },
    ...options,
  });
}


export function useDeleteTask(options?: UseMutationOptions<{ success: boolean }, Error, string>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.tasks.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.all });
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete task');
    },
    ...options,
  });
}

export function useCompleteTask(options?: UseMutationOptions<Task, Error, string>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.tasks.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.tasks.all });
      toast.success('Task completed');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to complete task');
    },
    ...options,
  });
}

// ============================================
// IDEAS HOOKS
// ============================================

export function useIdeas(filters?: IdeaFilters, options?: UseQueryOptions<Idea[]>) {
  return useQuery({
    queryKey: cacheKeys.ideas.list(filters),
    queryFn: () => api.ideas.getAll(filters),
    staleTime: STALE_TIMES.medium,
    ...options,
  });
}

export function useIdea(id: string, options?: UseQueryOptions<Idea>) {
  return useQuery({
    queryKey: cacheKeys.ideas.detail(id),
    queryFn: () => api.ideas.getById(id),
    staleTime: STALE_TIMES.short,
    enabled: !!id,
    ...options,
  });
}

export function useCreateIdea(options?: UseMutationOptions<Idea, Error, CreateIdeaPayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.ideas.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.ideas.all });
      toast.success('Idea created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create idea');
    },
    ...options,
  });
}

export function useUpdateIdea(options?: UseMutationOptions<Idea, Error, { id: string } & UpdateIdeaPayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateIdeaPayload) => api.ideas.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.ideas.all });
      toast.success('Idea updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update idea');
    },
    ...options,
  });
}

export function useDeleteIdea(options?: UseMutationOptions<{ success: boolean }, Error, string>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.ideas.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.ideas.all });
      toast.success('Idea deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete idea');
    },
    ...options,
  });
}

export function useVoteIdea(options?: UseMutationOptions<void, Error, VotePayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.ideas.vote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.ideas.all });
      toast.success('Vote recorded');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to vote');
    },
    ...options,
  });
}

export function useCommentIdea(options?: UseMutationOptions<void, Error, { ideaId: string; content: string }>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ideaId, content }) => api.ideas.comment(ideaId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.ideas.all });
      toast.success('Comment added');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add comment');
    },
    ...options,
  });
}

// ============================================
// STANDUPS HOOKS
// ============================================

export function useStandups(filters?: StandupFilters, options?: UseQueryOptions<Standup[]>) {
  return useQuery({
    queryKey: cacheKeys.standups.list(filters),
    queryFn: () => api.standups.getAll(filters),
    staleTime: STALE_TIMES.medium,
    ...options,
  });
}

export function useStandup(id: string, options?: UseQueryOptions<Standup>) {
  return useQuery({
    queryKey: cacheKeys.standups.detail(id),
    queryFn: () => api.standups.getById(id),
    staleTime: STALE_TIMES.short,
    enabled: !!id,
    ...options,
  });
}

export function useCreateStandup(options?: UseMutationOptions<Standup, Error, CreateStandupPayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.standups.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.standups.all });
      toast.success('Standup created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create standup');
    },
    ...options,
  });
}

export function useTranscribeStandup(options?: UseMutationOptions<any, Error, { id: string; audioFile: File }>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, audioFile }) => api.standups.transcribe(id, audioFile),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.standups.detail(id) });
      toast.success('Transcription started');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to transcribe standup');
    },
    ...options,
  });
}

export function useStandupStats(options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: [...cacheKeys.standups.all, 'stats'],
    queryFn: api.standups.getStats,
    staleTime: STALE_TIMES.long,
    ...options,
  });
}

// ============================================
// BUCKETS HOOKS
// ============================================

export function useBuckets(filters?: BucketFilters, options?: UseQueryOptions<Bucket[]>) {
  return useQuery({
    queryKey: cacheKeys.buckets.list(filters),
    queryFn: () => api.buckets.getAll(filters),
    staleTime: STALE_TIMES.medium,
    ...options,
  });
}

export function useBucket(id: string, options?: UseQueryOptions<Bucket>) {
  return useQuery({
    queryKey: cacheKeys.buckets.detail(id),
    queryFn: () => api.buckets.getById(id),
    staleTime: STALE_TIMES.short,
    enabled: !!id,
    ...options,
  });
}

export function useCreateBucket(options?: UseMutationOptions<Bucket, Error, CreateBucketPayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.buckets.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.buckets.all });
      toast.success('Bucket created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create bucket');
    },
    ...options,
  });
}

export function useMoveProject(options?: UseMutationOptions<void, Error, MoveProjectPayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.buckets.moveProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.buckets.all });
      queryClient.invalidateQueries({ queryKey: cacheKeys.studies.all });
      toast.success('Project moved successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to move project');
    },
    ...options,
  });
}

// ============================================
// DEADLINES HOOKS
// ============================================

export function useDeadlines(filters?: DeadlineFilters, options?: UseQueryOptions<Deadline[]>) {
  return useQuery({
    queryKey: cacheKeys.deadlines.list(filters),
    queryFn: () => api.deadlines.getAll(filters),
    staleTime: STALE_TIMES.short,
    ...options,
  });
}

export function useDeadline(id: string, options?: UseQueryOptions<Deadline>) {
  return useQuery({
    queryKey: cacheKeys.deadlines.detail(id),
    queryFn: () => api.deadlines.getById(id),
    staleTime: STALE_TIMES.short,
    enabled: !!id,
    ...options,
  });
}

export function useCreateDeadline(options?: UseMutationOptions<Deadline, Error, CreateDeadlinePayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deadlines.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.deadlines.all });
      toast.success('Deadline created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create deadline');
    },
    ...options,
  });
}

export function useCalendarEvents(start: Date, end: Date, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: [...cacheKeys.deadlines.all, 'calendar', start, end],
    queryFn: () => api.deadlines.getCalendarEvents(start, end),
    staleTime: STALE_TIMES.short,
    ...options,
  });
}

// ============================================
// TEAM HOOKS
// ============================================

export function useTeamMembers(filters?: TeamFilters, options?: UseQueryOptions<TeamMember[]>) {
  return useQuery({
    queryKey: cacheKeys.team.list(filters),
    queryFn: () => api.team.getAll(filters),
    staleTime: STALE_TIMES.long,
    ...options,
  });
}

export function useTeamMember(id: string, options?: UseQueryOptions<TeamMember>) {
  return useQuery({
    queryKey: cacheKeys.team.detail(id),
    queryFn: () => api.team.getById(id),
    staleTime: STALE_TIMES.medium,
    enabled: !!id,
    ...options,
  });
}

export function useCreateTeamMember(options?: UseMutationOptions<TeamMember, Error, CreateTeamMemberPayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.team.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.team.all });
      toast.success('Team member added successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add team member');
    },
    ...options,
  });
}

export function useUpdateTeamMember(options?: UseMutationOptions<TeamMember, Error, { id: string } & UpdateTeamMemberPayload>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateTeamMemberPayload) => api.team.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.team.all });
      toast.success('Team member updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update team member');
    },
    ...options,
  });
}

export function useDeleteTeamMember(options?: UseMutationOptions<{ success: boolean }, Error, string>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.team.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.team.all });
      toast.success('Team member removed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove team member');
    },
    ...options,
  });
}

export function useTeamMetrics(labId?: string, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: [...cacheKeys.team.all, 'metrics', labId],
    queryFn: () => api.team.getMetrics(labId),
    staleTime: STALE_TIMES.medium,
    enabled: !!labId,
    ...options,
  });
}

export function useUploadAvatar(options?: UseMutationOptions<any, Error, { userId: string; file: File }>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, file }) => api.team.uploadAvatar(userId, file),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.team.detail(userId) });
      toast.success('Avatar uploaded successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload avatar');
    },
    ...options,
  });
}

// ============================================
// DASHBOARD HOOKS
// ============================================

export function useDashboardMetrics(options?: UseQueryOptions<DashboardMetrics>) {
  return useQuery({
    queryKey: [...cacheKeys.dashboard.all, 'metrics'],
    queryFn: api.dashboard.getMetrics,
    staleTime: STALE_TIMES.medium,
    ...options,
  });
}

export function useDashboardActivity(limit?: number, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: [...cacheKeys.dashboard.all, 'activity', limit],
    queryFn: () => api.dashboard.getActivity(limit),
    staleTime: STALE_TIMES.short,
    ...options,
  });
}

export function useRecentStudies(limit?: number, options?: UseQueryOptions<Study[]>) {
  return useQuery({
    queryKey: [...cacheKeys.dashboard.all, 'recent-studies', limit],
    queryFn: () => api.dashboard.getRecentStudies(limit),
    staleTime: STALE_TIMES.short,
    ...options,
  });
}

export function useUpcomingDeadlines(days?: number, options?: UseQueryOptions<Deadline[]>) {
  return useQuery({
    queryKey: [...cacheKeys.dashboard.all, 'upcoming-deadlines', days],
    queryFn: () => api.dashboard.getUpcomingDeadlines(days),
    staleTime: STALE_TIMES.short,
    ...options,
  });
}

// ============================================
// KANBAN HOOKS
// ============================================

export function useKanbanBuckets(options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: [...cacheKeys.kanban.all, 'buckets'],
    queryFn: api.kanban.getBuckets,
    staleTime: STALE_TIMES.medium,
    ...options,
  });
}

export function useKanbanProjects(options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: [...cacheKeys.kanban.all, 'projects'],
    queryFn: api.kanban.getProjects,
    staleTime: STALE_TIMES.short,
    ...options,
  });
}

export function useUpdateKanbanProject(options?: UseMutationOptions<any, Error, { id: string; data: any }>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => api.kanban.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.kanban.all });
      queryClient.invalidateQueries({ queryKey: cacheKeys.studies.all });
      toast.success('Project updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update project');
    },
    ...options,
  });
}