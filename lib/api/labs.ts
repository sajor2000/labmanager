import type { 
  Lab, 
  CreateLabPayload, 
  UpdateLabPayload, 
  AddMemberPayload, 
  UpdateMemberPayload,
  ApiResponse 
} from '@/types/lab';

/**
 * Base API configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
const API_TIMEOUT = 30000; // 30 seconds

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(
      error.error || error.message || `Request failed with status ${response.status}`,
      response.status,
      error.code
    );
  }

  const data = await response.json();
  return data;
}

/**
 * Helper function to create fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408, 'TIMEOUT');
    }
    throw error;
  }
}

/**
 * Labs API Service
 */
export const labsApi = {
  /**
   * Get all labs
   */
  async getAll(): Promise<Lab[]> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/labs`);
    return handleResponse<Lab[]>(response);
  },

  /**
   * Get a single lab by ID
   */
  async getById(labId: string): Promise<Lab> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/labs/${labId}`);
    return handleResponse<Lab>(response);
  },

  /**
   * Create a new lab
   */
  async create(payload: CreateLabPayload): Promise<Lab> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/labs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Lab>(response);
  },

  /**
   * Update an existing lab
   */
  async update(labId: string, payload: UpdateLabPayload): Promise<Lab> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/labs/${labId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Lab>(response);
  },

  /**
   * Delete a lab (soft delete)
   */
  async delete(labId: string): Promise<{ success: boolean }> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/labs/${labId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(response);
  },

  /**
   * Lab member management
   */
  members: {
    /**
     * Get all members of a lab
     */
    async getAll(labId: string): Promise<any[]> {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/labs/${labId}/members`);
      return handleResponse<any[]>(response);
    },

    /**
     * Add a member to a lab
     */
    async add(labId: string, payload: AddMemberPayload): Promise<any> {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/labs/${labId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return handleResponse<any>(response);
    },

    /**
     * Update a member's role or status
     */
    async update(labId: string, payload: UpdateMemberPayload): Promise<any> {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/labs/${labId}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return handleResponse<any>(response);
    },

    /**
     * Remove a member from a lab
     */
    async remove(labId: string, userId: string): Promise<{ success: boolean }> {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/labs/${labId}/members?userId=${userId}`,
        {
          method: 'DELETE',
        }
      );
      return handleResponse<{ success: boolean }>(response);
    },
  },
};

/**
 * Helper functions for optimistic updates
 */
export const optimisticHelpers = {
  /**
   * Create an optimistic lab object
   */
  createOptimisticLab(payload: CreateLabPayload): Lab {
    return {
      id: `temp-${Date.now()}`,
      name: payload.name,
      shortName: payload.shortName,
      description: payload.description || null,
      logo: payload.logo || null,
      icon: payload.icon || null,
      color: payload.color || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [],
      projects: [],
      _count: {
        projects: 0,
        members: 0,
        buckets: 0,
        ideas: 0,
        standups: 0,
      },
    };
  },

  /**
   * Update a lab optimistically
   */
  updateOptimisticLab(lab: Lab, payload: UpdateLabPayload): Lab {
    return {
      ...lab,
      ...payload,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Remove a lab optimistically
   */
  removeOptimisticLab(labs: Lab[], labId: string): Lab[] {
    return labs.filter(lab => lab.id !== labId);
  },
};

/**
 * Cache utilities
 */
export const cacheUtils = {
  /**
   * Cache key for React Query
   */
  keys: {
    all: ['labs'] as const,
    lists: () => [...cacheUtils.keys.all, 'list'] as const,
    list: (filters?: any) => [...cacheUtils.keys.lists(), filters] as const,
    details: () => [...cacheUtils.keys.all, 'detail'] as const,
    detail: (id: string) => [...cacheUtils.keys.details(), id] as const,
    members: (labId: string) => [...cacheUtils.keys.all, 'members', labId] as const,
  },

  /**
   * Stale time configuration
   */
  staleTime: {
    list: 5 * 60 * 1000, // 5 minutes
    detail: 2 * 60 * 1000, // 2 minutes
    members: 5 * 60 * 1000, // 5 minutes
  },
};