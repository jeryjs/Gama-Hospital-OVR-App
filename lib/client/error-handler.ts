import { ApiError } from '@/lib/types';

/**
 * Handles API errors and returns user-friendly error messages
 * Maps field-specific errors to their display names
 */

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
  personInvolved: 'Person Involved',
  isSentinelEvent: 'Sentinel Event',
  sentinelEventDetails: 'Sentinel Event Details',

  // Witness
  witnessName: 'Witness Name',
  witnessAccount: 'Witness Account',
  witnessDepartment: 'Witness Department',
  witnessPosition: 'Witness Position',
  witnessEmployeeId: 'Witness Employee ID',

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

export interface ParsedError {
  title: string;
  message: string;
  fieldErrors: Array<{
    field: string;
    displayName: string;
    message: string;
  }>;
}

/**
 * Parse API error response and extract field-specific errors
 */
export function parseApiError(error: ApiError): ParsedError {
  const result: ParsedError = {
    title: error.error || 'An error occurred',
    message: '',
    fieldErrors: [],
  };

  // Handle validation errors with field details
  if (error.code === 'VALIDATION_ERROR' && error.details) {
    result.message = 'Please check the following fields:';
    result.fieldErrors = error.details.map((detail) => ({
      field: detail.path,
      displayName: FIELD_DISPLAY_NAMES[detail.path] || detail.path,
      message: detail.message,
    }));
  } else {
    // Generic error without field details
    result.message = error.error;
  }

  return result;
}

/**
 * Format error for display in a toast/alert
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
 * Get error message for a specific field (for inline field errors)
 */
export function getFieldError(parsedError: ParsedError, fieldName: string): string | null {
  const error = parsedError.fieldErrors.find((err) => err.field === fieldName);
  return error ? error.message : null;
}

/**
 * Handles fetch errors and returns structured error object
 */
export async function handleFetchError(response: Response): Promise<ParsedError> {
  try {
    const errorData: ApiError = await response.json();
    return parseApiError(errorData);
  } catch {
    // If parsing JSON fails, return generic error
    return {
      title: `Error ${response.status}`,
      message: response.statusText || 'An unexpected error occurred',
      fieldErrors: [],
    };
  }
}

/**
 * Helper to make API calls with proper error handling
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
    return {
      error: {
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        fieldErrors: [],
      },
    };
  }
}
