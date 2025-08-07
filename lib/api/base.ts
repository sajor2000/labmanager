/**
 * Base API configuration and utilities
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Helper function to handle API responses
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let error: any = { error: 'Unknown error' };
    try {
      error = await response.json();
    } catch {
      // Response might not be JSON
    }
    
    throw new ApiError(
      error.error || error.message || `Request failed with status ${response.status}`,
      response.status,
      error.code,
      error.details
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    // If not JSON, return as is
    return text as unknown as T;
  }
}

/**
 * Helper function to create fetch with timeout
 */
export async function fetchWithTimeout(
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
 * Helper to build query string from params
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else if (typeof value === 'object' && value instanceof Date) {
        searchParams.append(key, value.toISOString());
      } else if (typeof value === 'object') {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Base API client with common methods
 */
export class BaseApiClient {
  protected baseUrl: string;
  protected timeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetchWithTimeout(url, options, this.timeout);
    return handleResponse<T>(response);
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? buildQueryString(params) : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

/**
 * Cache key utilities for React Query
 */
export const createCacheKeys = (domain: string) => ({
  all: [domain] as const,
  lists: () => [...createCacheKeys(domain).all, 'list'] as const,
  list: (filters?: any) => [...createCacheKeys(domain).lists(), filters] as const,
  details: () => [...createCacheKeys(domain).all, 'detail'] as const,
  detail: (id: string) => [...createCacheKeys(domain).details(), id] as const,
  infinite: (filters?: any) => [...createCacheKeys(domain).all, 'infinite', filters] as const,
});

/**
 * Common stale times for React Query
 */
export const STALE_TIMES = {
  short: 30 * 1000,        // 30 seconds
  medium: 2 * 60 * 1000,    // 2 minutes
  long: 5 * 60 * 1000,      // 5 minutes
  extended: 15 * 60 * 1000, // 15 minutes
} as const;