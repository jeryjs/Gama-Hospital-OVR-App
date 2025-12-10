/**
 * @fileoverview Hook for fetching user's draft incidents
 * 
 * Drafts are ALWAYS private - this hook fetches only the current user's drafts.
 * This is the ONLY way to retrieve draft incidents on the client side.
 */

import { apiCall, type ParsedError } from '@/lib/client/error-handler';
import type { OVRReportListItem, PaginationMeta } from '@/lib/types';
import useSWR from 'swr';

export interface UseDraftsOptions {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'occurrenceDate' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    search?: string;
    // SWR options
    revalidateOnFocus?: boolean;
    refreshInterval?: number;
}

export interface UseDraftsReturn {
    drafts: OVRReportListItem[];
    pagination: PaginationMeta | null;
    isLoading: boolean;
    error: ParsedError | undefined;
    mutate: () => void;
    /** Convenience: total count of drafts */
    totalDrafts: number;
    /** Convenience: whether user has any drafts */
    hasDrafts: boolean;
}

/**
 * Hook to fetch current user's draft incidents
 * 
 * @example
 * const { drafts, hasDrafts, isLoading } = useDrafts();
 * 
 * @example with options
 * const { drafts, pagination } = useDrafts({
 *   page: 1,
 *   limit: 5,
 *   sortBy: 'updatedAt',
 * });
 */
export function useDrafts(options: UseDraftsOptions = {}): UseDraftsReturn {
    const {
        page = 1,
        limit = 10,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        search,
        revalidateOnFocus = true,
        refreshInterval = 0,
    } = options;

    // Build query string
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);

    if (search) params.append('search', search);

    const url = `/api/incidents/drafts?${params.toString()}`;

    // Fetcher function
    const fetcher = async (url: string) => {
        const { data, error } = await apiCall<{
            data: OVRReportListItem[];
            pagination: PaginationMeta;
        }>(url);

        if (error) {
            throw error;
        }

        return data!;
    };

    const { data, error, mutate, isLoading } = useSWR(url, fetcher, {
        revalidateOnFocus,
        refreshInterval,
        dedupingInterval: 2000,
        suspense: false,
    });

    const totalDrafts = data?.pagination?.total ?? 0;

    return {
        drafts: data?.data || [],
        pagination: data?.pagination || null,
        isLoading,
        error,
        mutate,
        totalDrafts,
        hasDrafts: totalDrafts > 0,
    };
}
