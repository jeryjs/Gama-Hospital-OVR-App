import { apiCall } from '@/lib/client/error-handler';
import type { OVRReportWithRelations } from '@/lib/types';
import { useState } from 'react';
import useSWR from 'swr';

export interface UseIncidentOptions {
  // SWR-specific options
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

export interface UseIncidentReturn {
  incident: OVRReportWithRelations | null;
  isError: boolean;
  error: any;
  mutate: () => void;
}

/**
 * Hook to fetch and cache a single incident by ID
 * @example
 * const { incident, isLoading } = useIncident(123);
 */
export function useIncident(
  id: number | string | null | undefined,
  options: UseIncidentOptions = {}
): UseIncidentReturn {
  const {
    revalidateOnFocus = false,
    revalidateOnReconnect = true,
    refreshInterval = 0,
  } = options;

  const url = id ? `/api/incidents/${id}` : null;

  // Fetcher function
  const fetcher = async (url: string) => {
    const { data, error } = await apiCall<OVRReportWithRelations>(url);

    if (error) {
      throw error;
    }

    return data!;
  };

  const { data, error, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus,
    revalidateOnReconnect,
    refreshInterval,
    dedupingInterval: 2000,
    suspense: true,
  });

  return {
    incident: data || null,
    isError: !!error,
    error,
    mutate,
  };
}

// ============================================
// INCIDENT ACTIONS HOOK
// Unified hook for all incident workflow actions
// ============================================

/**
 * Valid action types - derived from backend ACTION_SCHEMAS
 * Type-safe and auto-synced with backend
 */
export type IncidentActionType =
  | 'supervisor-approve'
  | 'qi-assign-hod'
  | 'qi-close'
  | 'assign-investigator'
  | 'submit-findings'
  | 'hod-submit';

/**
 * Action result with type-safe error handling
 */
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Hook return type for incident actions
 */
export interface UseIncidentActionsReturn {
  /**
   * Perform an action on the incident
   * @param action - Action type (type-safe enum)
   * @param data - Action-specific payload (validated by backend)
   * @returns Promise with success status and result/error
   */
  performAction: <T = any>(action: IncidentActionType, data: any) => Promise<ActionResult<T>>;

  /**
   * Loading state for current action
   */
  submitting: boolean;

  /**
   * Last error from action (null if no error)
   */
  error: string | null;

  /**
   * Clear error state
   */
  clearError: () => void;
}

/**
 * Hook for performing actions on an incident
 * Handles loading states, errors, and revalidation automatically
 * 
 * @param incidentId - ID of incident to perform action on
 * @param onSuccess - Optional callback after successful action
 * 
 * @example
 * const { performAction, submitting } = useIncidentActions(123, onUpdate);
 * 
 * // Supervisor approval
 * await performAction('supervisor-approve', { action: 'Approved' });
 * 
 * // QI assign HOD
 * await performAction('qi-assign-hod', { departmentHeadId: 456 });
 */
export function useIncidentActions(
  incidentId: number | string,
  onSuccess?: () => void
): UseIncidentActionsReturn {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAction = async <T = any>(
    action: IncidentActionType,
    data: any
  ): Promise<ActionResult<T>> => {
    setSubmitting(true);
    setError(null);

    try {
      const { data: result, error: err } = await apiCall<T>(
        `/api/incidents/${incidentId}/actions`,
        {
          method: 'POST',
          body: JSON.stringify({ action, data }),
        }
      );

      setSubmitting(false);

      if (err) {
        const errorMessage = err.message || 'Action failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Trigger success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      return { success: true, data: result };
    } catch (err: any) {
      setSubmitting(false);
      const errorMessage = err?.message || 'Unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => setError(null);

  return {
    performAction,
    submitting,
    error,
    clearError,
  };
}
