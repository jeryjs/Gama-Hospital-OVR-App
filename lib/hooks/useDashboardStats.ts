import { apiCall, ParsedError } from '@/lib/client/error-handler';
import useSWR from 'swr';

export interface DashboardStats {
    total: number;
    drafts: number;
    submitted: number;
    resolved: number;
    byStatus: {
        draft: number;
        submitted: number;
        supervisor_approved: number;
        hod_assigned: number;
        qi_final_review: number;
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
        needsInvestigator?: boolean;
        needsFindings?: boolean;
    }>;
    activeUsers: number;
    avgResolutionTime: number;
    closedThisMonth?: number;

    // HOD-specific fields
    assignedToMe?: number;
    myPendingInvestigations?: number;
    myActiveInvestigations?: number;
    myCompletedInvestigations?: number;
    myNeedingFindings?: number;
    myAssignedIncidents?: Array<{
        id: number;
        refNo: string;
        occurrenceCategory: string;
        status: string;
        createdAt: string;
        reporter: { firstName: string; lastName: string };
        needsInvestigator?: boolean;
        needsFindings?: boolean;
    }>;

    // Employee/Supervisor-specific fields
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

    // Supervisor-specific fields
    supervisorPending?: number;
    supervisorApproved?: number;
    teamReports?: number;
    supervisorPendingReports?: Array<{
        id: number;
        refNo: string;
        status: string;
        createdAt: string;
        reporter: { firstName: string; lastName: string };
    }>;
    supervisorApprovedReports?: Array<{
        id: number;
        refNo: string;
        status: string;
        createdAt: string;
        supervisorApprovedAt?: string;
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
