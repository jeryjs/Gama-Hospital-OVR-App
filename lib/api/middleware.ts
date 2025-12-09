import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hasAnyRole } from '../auth-helpers';
import type { AppRole } from '../constants';
import { PaginationMeta, PaginationParams } from './schemas';

// ============================================
// ERROR CLASSES
// ============================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

// ============================================
// STANDARD ERROR RESPONSE FORMAT
// ============================================

/**
 * Standard error response structure
 * ALL API errors must follow this format for consistent client handling
 */
export interface StandardErrorResponse {
  error: string; // User-friendly error message
  code: string; // Machine-readable error code
  message?: string; // Additional context
  details?: Array<{
    path: string; // Field path (e.g., "email", "nested.field")
    message: string; // Specific field error
  }>;
  timestamp?: string; // Error timestamp for debugging
}

// ============================================
// ERROR HANDLER
// ============================================

/**
 * Centralized API error handler
 * Converts various error types to STANDARD JSON responses
 * 
 * Security: Never expose stack traces or internal details in production
 * Consistency: Always return StandardErrorResponse format
 */
export function handleApiError(error: unknown): NextResponse {
  // Log the full error for debugging (server-side only)
  console.error('API Error:', error);

  const isDevelopment = process.env.NODE_ENV === 'development';
  const timestamp = new Date().toISOString();

  // Known API errors
  if (error instanceof ApiError) {
    const response: StandardErrorResponse = {
      error: error.message,
      code: error.code || 'API_ERROR',
      timestamp,
    };

    // Add details if provided
    if (error.details) {
      if (Array.isArray(error.details)) {
        response.details = error.details;
      } else {
        response.message = JSON.stringify(error.details);
      }
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Zod validation errors - format nicely for client
  if (error instanceof z.ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    const response: StandardErrorResponse = {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      message: `${details.length} validation error(s) found`,
      details,
      timestamp,
    };

    return NextResponse.json(response, { status: 400 });
  }

  // Database/Drizzle errors - extract useful info, hide internals
  if (error instanceof Error) {
    const message = error.message;

    // Column doesn't exist
    if (message.includes('column') && message.includes('does not exist')) {
      const columnMatch = message.match(/column "([^"]+)" does not exist/);
      return NextResponse.json(
        {
          error: 'Database schema error',
          code: 'DB_SCHEMA_ERROR',
          message: columnMatch
            ? `Database field "${columnMatch[1]}" not found. Please contact support.`
            : 'A database field is missing. Please contact support.',
          timestamp,
        } satisfies StandardErrorResponse,
        { status: 500 }
      );
    }

    // Table doesn't exist
    if (message.includes('relation') && message.includes('does not exist')) {
      return NextResponse.json(
        {
          error: 'Database table not found',
          code: 'DB_SCHEMA_ERROR',
          message: 'A required database table is missing. Please contact support.',
          timestamp,
        } satisfies StandardErrorResponse,
        { status: 500 }
      );
    }

    // Duplicate entry
    if (message.includes('duplicate key') || message.includes('unique constraint')) {
      return NextResponse.json(
        {
          error: 'Duplicate entry',
          code: 'DUPLICATE_ERROR',
          message: 'A record with this value already exists.',
          timestamp,
        } satisfies StandardErrorResponse,
        { status: 409 }
      );
    }

    // Foreign key constraint
    if (message.includes('foreign key constraint')) {
      return NextResponse.json(
        {
          error: 'Reference error',
          code: 'REFERENCE_ERROR',
          message: 'Cannot complete this action due to existing references.',
          timestamp,
        } satisfies StandardErrorResponse,
        { status: 400 }
      );
    }
  }

  // Unknown error - hide details in production
  const response: StandardErrorResponse = {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    message: error instanceof Error
      ? error.message
      : 'An unexpected error occurred. Please try again or contact support.',
    timestamp,
  };

  // Only include stack in development
  if (isDevelopment && error instanceof Error) {
    (response as any).stack = error.stack;
  }

  return NextResponse.json(response, { status: 500 });
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

export async function requireAuth(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new AuthenticationError();
  }

  return session;
}

/**
 * @deprecated Use ACCESS_CONTROL configuration instead
 * 
 * Require user to have ANY of the specified roles
 */
export async function requireAnyRole(req: NextRequest, roles: AppRole[]) {
  const session = await requireAuth(req);

  if (!hasAnyRole(session.user.roles, roles)) {
    throw new AuthorizationError(`This action requires one of the following roles: ${roles.join(', ')}`);
  }

  return session;
}

/**
 * @deprecated Legacy function - use requireAnyRole instead
 */
export async function requireRole(req: NextRequest, roles: string[]) {
  return requireAnyRole(req, roles as AppRole[]);
}

// ============================================
// PAGINATION HELPERS
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

// ============================================
// FIELD SELECTION HELPERS
// ============================================

export function parseFields(fields?: string | null): Record<string, boolean> | undefined {
  if (!fields) return undefined;

  const fieldArray = fields.split(',').map((f) => f.trim());
  return fieldArray.reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {} as Record<string, boolean>);
}

// ============================================
// VALIDATION HELPERS
// ============================================

export async function validateBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request body', error.issues);
    }
    throw new ValidationError('Failed to parse request body');
  }
}

export function validateParams<T>(
  params: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid parameters', error.issues);
    }
    throw new ValidationError('Failed to parse parameters');
  }
}
