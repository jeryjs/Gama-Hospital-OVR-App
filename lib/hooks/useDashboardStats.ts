import { apiCall } from '@/lib/client/error-handler';
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
}

export interface UseDashboardStatsReturn {
    stats: DashboardStats;
    isError: boolean;
    error: any;
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

    const { data, error, mutate } = useSWR(url, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 30000, // 30 seconds - stats don't change often
        suspense: true,
    });

    return {
        stats: data || {
            total: 0,
            drafts: 0,
            submitted: 0,
            resolved: 0,
            byStatus: {
                draft: 0,
                submitted: 0,
                supervisor_approved: 0,
                hod_assigned: 0,
                qi_final_review: 0,
                closed: 0,
            },
            byDepartment: [],
            recentIncidents: [],
            activeUsers: 0,
            avgResolutionTime: 0,
        },
        isError: !!error,
        error,
        mutate,
    };
}
