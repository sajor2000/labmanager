import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Standardized API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  field?: string;
  timestamp: string;
  traceId?: string;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

// Error codes enum for consistency
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
}

// HTTP status mapping
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.TIMEOUT]: 504,
};

// Success response helper
export function successResponse<T>(
  data: T,
  meta?: ApiMeta,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  );
}

// Error response helper
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
  field?: string
): NextResponse<ApiResponse> {
  const status = ERROR_STATUS_MAP[code] || 500;
  const traceId = generateTraceId();
  
  // Log error for monitoring
  logError(code, message, details, traceId);
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
        field,
        timestamp: new Date().toISOString(),
        traceId,
      },
    },
    { status }
  );
}

// Handle different error types
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  // Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    return errorResponse(
      ErrorCode.VALIDATION_ERROR,
      `Validation failed: ${firstError.message}`,
      error.errors,
      firstError.path.join('.')
    );
  }
  
  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return errorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Invalid data provided',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
  
  // Custom application errors
  if (error instanceof AppError) {
    return errorResponse(
      error.code,
      error.message,
      error.details,
      error.field
    );
  }
  
  // Generic errors
  if (error instanceof Error) {
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      error.stack
    );
  }
  
  // Unknown errors
  return errorResponse(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    error
  );
}

// Handle Prisma-specific errors
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse<ApiResponse> {
  switch (error.code) {
    case 'P2002':
      return errorResponse(
        ErrorCode.CONFLICT,
        'A record with this value already exists',
        error.meta
      );
    case 'P2025':
      return errorResponse(
        ErrorCode.NOT_FOUND,
        'Record not found',
        error.meta
      );
    case 'P2003':
      return errorResponse(
        ErrorCode.BAD_REQUEST,
        'Foreign key constraint failed',
        error.meta
      );
    case 'P2023':
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Invalid data format',
        error.meta
      );
    default:
      return errorResponse(
        ErrorCode.DATABASE_ERROR,
        'Database operation failed',
        process.env.NODE_ENV === 'development' ? error.message : undefined
      );
  }
}

// Custom application error class
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
    public field?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Generate trace ID for error tracking
function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Log errors for monitoring
function logError(code: string, message: string, details: unknown, traceId: string): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    traceId,
    code,
    message,
    details,
    environment: process.env.NODE_ENV,
  };
  
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Datadog, CloudWatch, etc.)
    console.error(JSON.stringify(errorLog));
  } else {
    console.error('API Error:', errorLog);
  }
}

// Pagination helper
export function paginationMeta(
  page: number,
  limit: number,
  total: number
): ApiMeta {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}