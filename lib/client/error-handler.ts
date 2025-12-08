import type { ApiError } from '@/lib/types';

/**
 * Client-side API error handling utilities
 * Provides user-friendly error messages and field-level error details
 */

// ============================================
// FIELD DISPLAY NAME MAPPING
// ============================================

const FIELD_DISPLAY_NAMES: Record<string, string> = {
  // Person Involved (unified)
  involvedPersonName: 'Person Name',
  involvedPersonAge: 'Age',
  involvedPersonSex: 'Sex',
  involvedPersonUnit: 'Unit / Department',
  involvedPersonMRN: 'Patient MRN',
  involvedPersonEmployeeId: 'Employee ID',
  involvedPersonPosition: 'Position',
  involvedPersonRelation: 'Relation to Patient',
  involvedPersonContact: 'Contact Information',

  // Occurrence
  occurrenceDate: 'Occurrence Date',
  occurrenceTime: 'Occurrence Time',
  locationId: 'Location',
  specificLocation: 'Specific Location',
  occurrenceCategory: 'Category',
  occurrenceSubcategory: 'Subcategory',
  description: 'Description',

  // Person Involved Type
  personInvolved: 'Person Involved Type',
  isSentinelEvent: 'Sentinel Event',
  sentinelEventDetails: 'Sentinel Event Details',

  // Medical
  assessment: 'Medical Assessment',
  diagnosis: 'Diagnosis',
  injuryOutcome: 'Injury Outcome',
  treatmentProvided: 'Treatment Provided',
  physicianName: 'Physician Name',
  physicianId: 'Physician ID',

  // Workflow
  action: 'Action/Comments',
  departmentHeadId: 'Department Head',
  investigatorId: 'Investigator',
  findings: 'Investigation Findings',
  investigationFindings: 'Investigation Findings',
  problemsIdentified: 'Problems Identified',
  causeClassification: 'Cause Classification',
  causeDetails: 'Cause Details',
  preventionRecommendation: 'Prevention Recommendation',
  feedback: 'QI Feedback',
  severityLevel: 'Severity Level',
  comment: 'Comment',
};

// ============================================
// ERROR TYPES
// ============================================

export interface FieldError {
  field: string;
  displayName: string;
  message: string;
}

export interface ParsedError {
  title: string;
  message: string;
  code?: string;
  fieldErrors: FieldError[];
  isValidationError: boolean;
  isNetworkError: boolean;
  isServerError: boolean;
}

// ============================================
// ERROR PARSING
// ============================================

/**
 * Parse API error response into a structured format
 */
export function parseApiError(error: ApiError): ParsedError {
  const result: ParsedError = {
    title: getErrorTitle(error.code),
    message: error.message || error.error || 'An error occurred',
    code: error.code,
    fieldErrors: [],
    isValidationError: error.code === 'VALIDATION_ERROR',
    isNetworkError: false,
    isServerError: error.code === 'INTERNAL_ERROR' || error.code === 'DB_SCHEMA_ERROR',
  };

  // Handle validation errors with field details
  if (error.code === 'VALIDATION_ERROR' && error.details?.length) {
    result.message = 'Please correct the following errors:';
    result.fieldErrors = error.details.map((detail) => ({
      field: detail.path,
      displayName: FIELD_DISPLAY_NAMES[detail.path] || formatFieldName(detail.path),
      message: detail.message,
    }));
  }

  return result;
}

/**
 * Get a user-friendly title based on error code
 */
function getErrorTitle(code?: string): string {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'Validation Error';
    case 'AUTHENTICATION_ERROR':
      return 'Authentication Required';
    case 'AUTHORIZATION_ERROR':
      return 'Access Denied';
    case 'NOT_FOUND':
      return 'Not Found';
    case 'DUPLICATE_ERROR':
      return 'Duplicate Entry';
    case 'REFERENCE_ERROR':
      return 'Reference Error';
    case 'DB_SCHEMA_ERROR':
      return 'Database Error';
    case 'INTERNAL_ERROR':
      return 'Server Error';
    default:
      return 'Error';
  }
}

/**
 * Format a camelCase field name to readable text
 */
function formatFieldName(fieldPath: string): string {
  // Take the last part of the path (e.g., "user.email" -> "email")
  const field = fieldPath.split('.').pop() || fieldPath;
  // Convert camelCase to Title Case
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// ============================================
// ERROR FORMATTING
// ============================================

/**
 * Format error for display in toast/snackbar (single line summary)
 */
export function formatErrorForToast(parsedError: ParsedError): string {
  if (parsedError.fieldErrors.length === 1) {
    return `${parsedError.fieldErrors[0].displayName}: ${parsedError.fieldErrors[0].message}`;
  }

  if (parsedError.fieldErrors.length > 1) {
    return `${parsedError.fieldErrors.length} validation errors. Please check the form.`;
  }

  return parsedError.message;
}

/**
 * Format error for display in alert/dialog (multi-line)
 */
export function formatErrorForAlert(parsedError: ParsedError): string {
  if (parsedError.fieldErrors.length === 0) {
    return parsedError.message;
  }

  const fieldMessages = parsedError.fieldErrors
    .map((err) => `• ${err.displayName}: ${err.message}`)
    .join('\n');

  return `${parsedError.message}\n\n${fieldMessages}`;
}

/**
 * Get error message for a specific field (for inline form errors)
 */
export function getFieldError(parsedError: ParsedError, fieldName: string): string | undefined {
  const error = parsedError.fieldErrors.find((err) => err.field === fieldName);
  return error?.message;
}

/**
 * Check if a field has an error
 */
export function hasFieldError(parsedError: ParsedError, fieldName: string): boolean {
  return parsedError.fieldErrors.some((err) => err.field === fieldName);
}

// ============================================
// FETCH UTILITIES
// ============================================

/**
 * Handle fetch response and extract error
 */
export async function handleFetchError(response: Response): Promise<ParsedError> {
  try {
    const errorData: ApiError = await response.json();
    return parseApiError(errorData);
  } catch {
    // If parsing JSON fails, create a generic error
    return {
      title: `Error ${response.status}`,
      message: response.statusText || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      fieldErrors: [],
      isValidationError: false,
      isNetworkError: false,
      isServerError: response.status >= 500,
    };
  }
}

/**
 * Create a network error
 */
function createNetworkError(): ParsedError {
  return {
    title: 'Network Error',
    message: 'Unable to connect to the server. Please check your internet connection.',
    code: 'NETWORK_ERROR',
    fieldErrors: [],
    isValidationError: false,
    isNetworkError: true,
    isServerError: false,
  };
}

/**
 * Helper to make API calls with proper error handling
 * Returns { data } on success or { error } on failure
 */
export async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: ParsedError }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await handleFetchError(response);
      return { error };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    // Network error (no response)
    console.error('API call failed:', error);
    return { error: createNetworkError() };
  }
}
