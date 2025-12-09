import { apiCall, type ParsedError } from '@/lib/client/error-handler';
import useSWR from 'swr';

/**
 * Dashboard Statistics Interface
 * Aligned with new QI-led workflow
 */
export interface DashboardStats {
    total: number;
    drafts: number;
    submitted: number;
    resolved: number;

    byStatus: {
        draft: number;
        submitted: number;
        qi_review: number;
        investigating: number;
        qi_final_actions: number;
        closed: number;
    };

    byDepartment: Array<{ department: string; count: number }>;

    recentIncidents: Array<{
        id: number;
        refNo: string;
        occurrenceCategory: string;
        status: string;
        createdAt: string;
        reporter: { firstName: string; lastName: string };
    }>;

    activeUsers: number;
    avgResolutionTime: number;
    closedThisMonth?: number;

    // Employee-specific fields
    myReports?: {
        total: number;
        drafts: number;
        inProgress: number;
        resolved: number;
    };

    myRecentReports?: Array<{
        id: number;
        refNo: string;
        occurrenceCategory: string;
        status: string;
        createdAt: string;
    }>;

    // Supervisor-specific fields (read-only, no approval)
    teamReports?: number;
    myTeamReports?: Array<{
        id: number;
        refNo: string;
        status: string;
        createdAt: string;
        reporter: { firstName: string; lastName: string };
    }>;
}

export interface UseDashboardStatsReturn {
    stats: DashboardStats;
    isLoading: boolean;
    error?: ParsedError;
    mutate: () => void;
}

/**
 * Hook to fetch dashboard statistics
 * Returns role-specific stats based on the authenticated user
 * @example
 * const { stats, isError } = useDashboardStats();
 */
export function useDashboardStats(): UseDashboardStatsReturn {
    const url = '/api/stats';

    // Fetcher function
    const fetcher = async (url: string) => {
        const { data, error } = await apiCall<DashboardStats>(url);

        if (error) {
            throw error;
        }

        return data!;
    };

    const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 30000, // 30 seconds - stats don't change often
        suspense: false
    });

    return {
        stats: data || {} as DashboardStats,
        isLoading,
        error,
        mutate,
    };
}
