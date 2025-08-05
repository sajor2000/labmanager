import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export type ApiError = {
  message: string;
  code?: string;
  details?: any;
};

/**
 * Comprehensive error handler for API routes
 * Handles Prisma errors, Zod validation errors, and general errors
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return NextResponse.json(
          {
            error: 'A record with this value already exists',
            code: 'DUPLICATE_ENTRY',
            details: error.meta,
          },
          { status: 409 }
        );
      
      case 'P2003': // Foreign key constraint violation
        return NextResponse.json(
          {
            error: 'Referenced record does not exist',
            code: 'INVALID_REFERENCE',
            details: error.meta,
          },
          { status: 400 }
        );
      
      case 'P2025': // Record not found
        return NextResponse.json(
          {
            error: 'Record not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      
      case 'P2014': // Relation violation
        return NextResponse.json(
          {
            error: 'The change would violate a required relation',
            code: 'RELATION_VIOLATION',
            details: error.meta,
          },
          { status: 400 }
        );
      
      default:
        return NextResponse.json(
          {
            error: 'Database operation failed',
            code: 'DATABASE_ERROR',
            details: error.message,
          },
          { status: 500 }
        );
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: 'Invalid data provided',
        code: 'VALIDATION_ERROR',
        details: 'Please check your input data',
      },
      { status: 400 }
    );
  }

  // Handle Prisma initialization errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        error: 'Database connection failed',
        code: 'DATABASE_CONNECTION_ERROR',
      },
      { status: 503 }
    );
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    if (error.message.includes('forbidden') || error.message.includes('permission')) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Wrap an async API handler with error handling
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}