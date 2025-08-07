import useSWR, { SWRConfiguration, mutate } from 'swr';
import useSWRMutation from 'swr/mutation';
import { useCallback } from 'react';
import { toast } from 'sonner';

// API fetcher with error handling
const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.error?.message || `API Error: ${response.status}`,
      response.status,
      error.error
    );
  }

  return response.json();
};

// Custom API error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base configuration for SWR
const baseConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  onError: (error) => {
    console.error('SWR Error:', error);
    if (error.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/auth';
    }
  },
};

// Generic data fetching hook
export function useApi<T = any>(
  url: string | null,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    url,
    fetcher,
    {
      ...baseConfig,
      ...config,
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    isError: !!error,
  };
}

// Mutation hook for POST/PUT/DELETE operations
export function useApiMutation<T = any>(
  url: string,
  options?: {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const {
    method = 'POST',
    onSuccess,
    onError,
    successMessage = 'Operation successful',
    errorMessage = 'Operation failed',
  } = options || {};

  const { trigger, isMutating, error } = useSWRMutation(
    url,
    async (url: string, { arg }: { arg?: any }) => {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: arg ? JSON.stringify(arg) : undefined,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          error.error?.message || errorMessage,
          response.status,
          error.error
        );
      }

      const data = await response.json();
      
      // Show success message
      toast.success(successMessage);
      
      // Call success callback
      onSuccess?.(data);
      
      return data;
    },
    {
      onError: (error) => {
        console.error('Mutation Error:', error);
        toast.error(error.message || errorMessage);
        onError?.(error);
      },
    }
  );

  return {
    trigger,
    isMutating,
    error,
  };
}

// Specific hooks for common entities

// Projects hook
export function useProjects(labId?: string) {
  const url = labId ? `/api/projects?labId=${labId}` : '/api/projects';
  return useApi<any[]>(url);
}

// Single project hook
export function useProject(projectId: string | null) {
  return useApi<any>(projectId ? `/api/projects/${projectId}` : null);
}

// Tasks hook
export function useTasks(projectId?: string) {
  const url = projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks';
  return useApi<any[]>(url);
}

// Team members hook
export function useTeamMembers(labId?: string) {
  const url = labId ? `/api/team?labId=${labId}` : '/api/team';
  return useApi<any[]>(url);
}

// Ideas hook with voting
export function useIdeas(labId?: string) {
  const url = labId ? `/api/ideas?labId=${labId}` : '/api/ideas';
  const { data, error, isLoading, mutate } = useApi<any[]>(url);

  const voteIdea = useCallback(
    async (ideaId: string, vote: 'up' | 'down') => {
      try {
        const response = await fetch('/api/ideas/vote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ideaId, vote }),
        });

        if (!response.ok) {
          throw new Error('Failed to vote');
        }

        // Revalidate ideas
        mutate();
        toast.success('Vote recorded');
      } catch (error) {
        console.error('Vote error:', error);
        toast.error('Failed to record vote');
      }
    },
    [mutate]
  );

  return {
    ideas: data,
    error,
    isLoading,
    mutate,
    voteIdea,
  };
}

// Deadlines hook
export function useDeadlines(filters?: {
  labId?: string;
  upcoming?: boolean;
  projectId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.labId) params.append('labId', filters.labId);
  if (filters?.upcoming) params.append('upcoming', 'true');
  if (filters?.projectId) params.append('projectId', filters.projectId);

  const url = `/api/deadlines${params.toString() ? `?${params}` : ''}`;
  return useApi<any[]>(url);
}

// Dashboard metrics hook
export function useDashboardMetrics(labId?: string) {
  const url = labId
    ? `/api/dashboard/metrics?labId=${labId}`
    : '/api/dashboard/metrics';
  return useApi<any>(url);
}

// Buckets hook
export function useBuckets(labId?: string) {
  const url = labId ? `/api/buckets?labId=${labId}` : '/api/buckets';
  return useApi<any[]>(url);
}

// Standups hook
export function useStandups(labId?: string, limit?: number) {
  const params = new URLSearchParams();
  if (labId) params.append('labId', labId);
  if (limit) params.append('limit', limit.toString());

  const url = `/api/standups${params.toString() ? `?${params}` : ''}`;
  return useApi<any[]>(url);
}

// Optimistic update helper
export function optimisticUpdate<T>(
  url: string,
  updater: (data: T) => T
) {
  mutate(
    url,
    async (data: T) => {
      return updater(data);
    },
    {
      revalidate: false,
      populateCache: true,
    }
  );
}

// Batch operations helper
export async function batchApiCalls(
  calls: Array<{
    url: string;
    method?: string;
    body?: any;
  }>
): Promise<any[]> {
  const promises = calls.map(async ({ url, method = 'GET', body }) => {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed: ${url}`,
        response.status,
        await response.json().catch(() => ({}))
      );
    }

    return response.json();
  });

  return Promise.all(promises);
}

// Polling hook for real-time updates
export function usePolling(
  url: string,
  interval: number = 5000,
  enabled: boolean = true
) {
  return useApi(url, {
    refreshInterval: enabled ? interval : 0,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });
}

// Infinite loading hook
export function useInfiniteApi<T = any>(
  getUrl: (pageIndex: number, previousPageData: T | null) => string | null,
  pageSize: number = 20
) {
  const { data, error, isLoading, size, setSize, isValidating } = useSWRInfinite(
    getUrl,
    fetcher,
    {
      ...baseConfig,
      revalidateFirstPage: false,
      persistSize: true,
    }
  );

  const items = data ? data.flat() : [];
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < pageSize);

  return {
    items,
    error,
    isLoading,
    isLoadingMore,
    size,
    setSize,
    isValidating,
    isReachingEnd,
    loadMore: () => setSize(size + 1),
  };
}

// Import for infinite loading
import useSWRInfinite from 'swr/infinite';

// Prefetch helper for better UX
export async function prefetchApi(url: string) {
  try {
    const data = await fetcher(url);
    mutate(url, data, false);
    return data;
  } catch (error) {
    console.error('Prefetch error:', error);
    return null;
  }
}

// Clear cache helper
export function clearApiCache(pattern?: string) {
  if (pattern) {
    // Clear specific pattern
    mutate(
      (key) => typeof key === 'string' && key.includes(pattern),
      undefined,
      { revalidate: true }
    );
  } else {
    // Clear all
    mutate(() => true, undefined, { revalidate: true });
  }
}