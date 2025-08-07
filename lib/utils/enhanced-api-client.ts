// Enhanced API client with robust error handling, timeouts, and retries

import type { FetchConfig, FetchResult, ApiResponse, ApiError } from '@/types/api';

class EnhancedApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor(baseUrl = '', defaultTimeout = 10000, defaultRetries = 3) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
    this.defaultRetries = defaultRetries;
  }

  /**
   * Enhanced fetch with timeout, retries, and proper error handling
   */
  async fetch<T = any>(url: string, config: FetchConfig = {}): Promise<FetchResult<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = 1000,
    } = config;

    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    // Set up timeout
    if (timeout > 0) {
      timeoutId = setTimeout(() => controller.abort(), timeout);
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
      body: body ? JSON.stringify(body) : undefined,
    };

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const startTime = performance.now();
        const response = await fetch(this.baseUrl + url, fetchOptions);
        const endTime = performance.now();

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const responseTime = endTime - startTime;

        // Parse response
        let data: T | null = null;
        let errorMessage: string | null = null;

        try {
          const responseText = await response.text();
          if (responseText) {
            const parsed = JSON.parse(responseText);
            if (response.ok) {
              data = parsed;
            } else {
              // Handle API error response
              errorMessage = parsed.error || parsed.message || `HTTP ${response.status}: ${response.statusText}`;
            }
          }
        } catch (parseError) {
          if (response.ok) {
            // Response was OK but not JSON
            data = null;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        }

        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`API ${method} ${url}: ${responseTime.toFixed(2)}ms`);
        }

        return {
          data,
          error: errorMessage,
          status: response.status,
          ok: response.ok,
        };

      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        lastError = error as Error;

        // Don't retry on abort (timeout) or network errors on the last attempt
        if (attempt === retries) {
          break;
        }

        // Handle different types of errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new Error(`Request timeout after ${timeout}ms`);
            break; // Don't retry timeouts
          }
          
          if (error.message.includes('fetch')) {
            // Network error - wait and retry
            await this.delay(retryDelay * Math.pow(2, attempt));
          } else {
            break; // Don't retry other errors
          }
        }

        attempt++;
      }
    }

    // All retries failed
    const errorMessage = lastError 
      ? lastError.message 
      : 'Unknown error occurred';

    return {
      data: null,
      error: errorMessage,
      status: 0,
      ok: false,
    };
  }

  /**
   * GET request with proper typing
   */
  async get<T = any>(url: string, config: Omit<FetchConfig, 'method' | 'body'> = {}): Promise<FetchResult<T>> {
    return this.fetch<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request with proper typing
   */
  async post<T = any>(url: string, body?: any, config: Omit<FetchConfig, 'method' | 'body'> = {}): Promise<FetchResult<T>> {
    return this.fetch<T>(url, { ...config, method: 'POST', body });
  }

  /**
   * PUT request with proper typing
   */
  async put<T = any>(url: string, body?: any, config: Omit<FetchConfig, 'method' | 'body'> = {}): Promise<FetchResult<T>> {
    return this.fetch<T>(url, { ...config, method: 'PUT', body });
  }

  /**
   * DELETE request with proper typing
   */
  async delete<T = any>(url: string, config: Omit<FetchConfig, 'method' | 'body'> = {}): Promise<FetchResult<T>> {
    return this.fetch<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH request with proper typing
   */
  async patch<T = any>(url: string, body?: any, config: Omit<FetchConfig, 'method' | 'body'> = {}): Promise<FetchResult<T>> {
    return this.fetch<T>(url, { ...config, method: 'PATCH', body });
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<FetchResult<{ healthy: boolean; message: string; responseTime: number }>> {
    const startTime = performance.now();
    const result = await this.get('/api/health');
    const endTime = performance.now();
    
    if (result.ok && result.data) {
      result.data.responseTime = endTime - startTime;
    }
    
    return result;
  }
}

// Create singleton instance
export const apiClient = new EnhancedApiClient();

// Export type-safe API methods
export const api = {
  // Projects/Studies
  getProjects: (labId: string) => 
    apiClient.get<import('@/types').Project[]>(`/api/projects?labId=${labId}`),
  
  createProject: (project: Partial<import('@/types').Project>) => 
    apiClient.post<import('@/types').Project>('/api/projects', project),
  
  updateProject: (id: string, project: Partial<import('@/types').Project>) => 
    apiClient.put<import('@/types').Project>('/api/projects', { id, ...project }),
  
  deleteProject: (id: string) => 
    apiClient.delete<{ success: boolean }>(`/api/projects?id=${id}`),

  // Tasks
  getTasks: (projectId?: string) => 
    apiClient.get<import('@/types').Task[]>(`/api/tasks${projectId ? `?projectId=${projectId}` : ''}`),
  
  createTask: (task: Partial<import('@/types').Task>) => 
    apiClient.post<import('@/types').Task>('/api/tasks', task),
  
  updateTask: (task: Partial<import('@/types').Task>) => 
    apiClient.put<import('@/types').Task>('/api/tasks', task),
  
  deleteTask: (id: string) => 
    apiClient.delete<{ success: boolean }>(`/api/tasks?id=${id}`),

  // Users
  getUsers: () => 
    apiClient.get<import('@/types').User[]>('/api/users'),
  
  createUser: (user: Partial<import('@/types').User>) => 
    apiClient.post<import('@/types').User>('/api/users', user),
  
  updateUser: (id: string, user: Partial<import('@/types').User>) => 
    apiClient.put<import('@/types').User>(`/api/users/${id}`, user),
  
  deleteUser: (id: string) => 
    apiClient.delete<{ success: boolean }>(`/api/users/${id}`),

  // Team - Enhanced with metrics
  getTeamMembers: (labId: string) => 
    apiClient.get<Array<import('@/types').User & {
      taskCount: number;
      completedTasks: number;
      activeProjects: number;
      workload: number;
      upcomingDeadlines: number;
    }>>(`/api/team?labId=${labId}`),

  // Buckets
  getBuckets: (labId: string) => 
    apiClient.get<import('@/types').Bucket[]>(`/api/buckets?labId=${labId}`),

  // Ideas
  getIdeas: (labId: string) => 
    apiClient.get<import('@/types/ideas').IdeaWithFullRelations[]>(`/api/ideas?labId=${labId}`),

  // Dashboard metrics
  getDashboardMetrics: (userId: string) => 
    apiClient.get<MetricResponse>(`/api/dashboard/metrics?userId=${userId}`),

  // Standups
  getStandups: (labId: string) => 
    apiClient.get<import('@/lib/services/standup.service').StandupWithRelations[]>(`/api/standups?labId=${labId}`),

  // Health check
  healthCheck: () => 
    apiClient.healthCheck(),
};