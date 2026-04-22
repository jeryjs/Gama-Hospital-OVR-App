/**
 * @fileoverview Investigations List Hook
 * 
 * Fetches multiple investigations with filtering support
 * QI-only access (no token support for list views)
 */

import { apiCall, type ParsedError } from '@/lib/client/error-handler';
import useSWR from 'swr';
import type { Investigation } from './useInvestigation';
import type { PaginationMeta } from '@/lib/types';

/**
 * Extended investigation list item with relations
 * Extends base Investigation type - no redeclaration
 */
export interface InvestigationListItem extends Omit<Investigation, 'rcaAnalysis' | 'fishboneAnalysis'> {
    incident?: {
        id: string;
        occurrenceCategory?: string;
    };
    investigatorCount: number;
}

export interface UseInvestigationsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'pending' | 'completed' | 'all';
    ovrReportId?: string;
}

export interface UseInvestigationsReturn {
    investigations: InvestigationListItem[] | undefined;
    pagination: PaginationMeta | null;
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
    queryParams.set('page', String(params?.page ?? 1));
    queryParams.set('limit', String(params?.limit ?? 10));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
    if (params?.ovrReportId) queryParams.set('ovrReportId', params.ovrReportId);

    const queryString = queryParams.toString();
    const url = `/api/investigations${queryString ? `?${queryString}` : ''}`;

    // Fetcher function
    const fetcher = async (url: string) => {
        const { data, error } = await apiCall<{
            data: InvestigationListItem[];
            pagination: PaginationMeta;
        }>(url);

        if (error) throw error;
        return data;
    };

    // SWR hook
    const { data, error, mutate, isLoading } = useSWR<{ data: InvestigationListItem[]; pagination: PaginationMeta } | undefined, ParsedError>(
        url,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            suspense: false,
        }
    );

    return {
        investigations: data?.data,
        pagination: data?.pagination || null,
        isLoading,
        error,
        mutate: async () => {
            await mutate();
        },
    };
}
