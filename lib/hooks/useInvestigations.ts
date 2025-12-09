/**
 * @fileoverview Investigations List Hook
 * 
 * Fetches multiple investigations with filtering support
 * QI-only access (no token support for list views)
 */

import { apiCall, type ParsedError } from '@/lib/client/error-handler';
import useSWR from 'swr';
import type { Investigation } from './useInvestigation';

/**
 * Extended investigation list item with relations
 * Extends base Investigation type - no redeclaration
 */
export interface InvestigationListItem extends Omit<Investigation, 'rcaAnalysis' | 'fishboneAnalysis'> {
    incident?: {
        id: string;
        refNo?: string;
        occurrenceCategory?: string;
    };
    investigatorCount: number;
}

export interface UseInvestigationsParams {
    search?: string;
    status?: 'pending' | 'completed' | 'all';
    ovrReportId?: string;
}

export interface UseInvestigationsReturn {
    investigations: InvestigationListItem[] | undefined;
    isLoading: boolean;
    error: ParsedError | undefined;
    mutate: () => Promise<void>;
}

/**
 * Hook to fetch investigations list
 * QI staff only - requires authentication
 * 
 * @param params - Filter parameters
 * 
 * @example
 * const { investigations, isLoading } = useInvestigations({
 *     search: 'fall',
 *     status: 'pending'
 * });
 */
export function useInvestigations(
    params?: UseInvestigationsParams
): UseInvestigationsReturn {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
    if (params?.ovrReportId) queryParams.set('ovrReportId', params.ovrReportId);

    const queryString = queryParams.toString();
    const url = `/api/investigations${queryString ? `?${queryString}` : ''}`;

    // Fetcher function
    const fetcher = async (url: string) => {
        const { data, error } = await apiCall<{
            investigations: InvestigationListItem[];
        }>(url);

        if (error) throw error;
        return data?.investigations || [];
    };

    // SWR hook
    const { data, error, mutate, isLoading } = useSWR<InvestigationListItem[], ParsedError>(
        url,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            suspense: false,
        }
    );

    return {
        investigations: data,
        isLoading,
        error,
        mutate: async () => {
            await mutate();
        },
    };
}
