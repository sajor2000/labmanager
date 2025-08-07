// API Response types for consistent frontend-backend communication

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalPages: number;
}

export interface MetricResponse {
  completedTasks: number;
  totalStudies: number;
  activeProjects: number;
  upcomingDeadlines: number;
  [key: string]: number;
}

// Enhanced fetch wrapper with proper typing and error handling
export interface FetchConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: HeadersInit;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface FetchResult<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

// Connection health monitoring
export interface ConnectionHealth {
  healthy: boolean;
  message: string;
  responseTime?: number;
  timestamp: Date;
}

// Performance metrics
export interface PerformanceMetrics {
  queryTime: number;
  cacheHit: boolean;
  connectionPoolUsage: number;
  timestamp: Date;
}