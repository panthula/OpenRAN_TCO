/**
 * Standardized API error handling utilities
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues
      },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return NextResponse.json(
    { error: message, code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

/**
 * Create common API errors
 */
export const ApiErrors = {
  notFound: (resource: string) =>
    new ApiError(404, `${resource} not found`, 'NOT_FOUND'),

  badRequest: (message: string, details?: unknown) =>
    new ApiError(400, message, 'BAD_REQUEST', details),

  unauthorized: () =>
    new ApiError(401, 'Unauthorized', 'UNAUTHORIZED'),

  forbidden: () =>
    new ApiError(403, 'Forbidden', 'FORBIDDEN'),

  internalError: (message: string = 'Internal server error') =>
    new ApiError(500, message, 'INTERNAL_ERROR'),
};
