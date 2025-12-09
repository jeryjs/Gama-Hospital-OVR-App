/**
 * @fileoverview Corrective Actions List Hook
 * 
 * Fetches multiple corrective actions with filtering support
 * QI-only access (no token support for list views)
 */

import { apiCall, type ParsedError } from '@/lib/client/error-handler';
import useSWR from 'swr';

/**
 * Corrective Action List Item
 * Extended with relations - inferred from schema
 */
export interface CorrectiveActionListItem {
    id: number;
    ovrReportId: string;
    investigationId: number | null;
    title: string;
    description: string;
    dueDate: Date;
    assignedTo: string | null; // CSV format
    status: 'open' | 'closed';
    checklist: string | null; // JSON
    actionTaken: string | null;
    evidenceFiles: string | null; // JSON
    createdBy: number | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;

    // Relations
    incident?: {
        id: string;
        occurrenceCategory?: string;
    };
    handlerCount: number;
}

export interface UseCorrectiveActionsParams {
    search?: string;
    status?: 'open' | 'closed' | 'all';
    ovrReportId?: string;
    overdueOnly?: boolean;
}

export interface UseCorrectiveActionsReturn {
    actions: CorrectiveActionListItem[] | undefined;
    isLoading: boolean;
    error: ParsedError | undefined;
    mutate: () => Promise<void>;
}

/**
 * Hook to fetch corrective actions list
 * QI staff only - requires authentication
 * 
 * @param params - Filter parameters
 * 
 * @example
 * const { actions, isLoading } = useCorrectiveActions({
 *     search: 'training',
 *     status: 'open',
 *     overdueOnly: true
 * });
 */
export function useCorrectiveActions(
    params?: UseCorrectiveActionsParams
): UseCorrectiveActionsReturn {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.status && params?.status !== 'all') queryParams.set('status', params.status);
    if (params?.ovrReportId) queryParams.set('ovrReportId', params.ovrReportId);
    if (params?.overdueOnly) queryParams.set('overdueOnly', 'true');

    const queryString = queryParams.toString();
    const url = `/api/corrective-actions${queryString ? `?${queryString}` : ''}`;

    // Fetcher function
    const fetcher = async (url: string) => {
        const { data, error } = await apiCall<{
            actions: CorrectiveActionListItem[];
        }>(url);

        if (error) throw error;
        return data?.actions || [];
    };

    // SWR hook
    const { data, error, mutate, isLoading } = useSWR<CorrectiveActionListItem[], ParsedError>(
        url,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            suspense: false,
        }
    );

    return {
        actions: data,
        isLoading,
        error,
        mutate: async () => {
            await mutate();
        },
    };
}
