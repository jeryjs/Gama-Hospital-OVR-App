'use client';

import useSWR from 'swr';
import { apiCall } from '@/lib/client/error-handler';

// Types
export interface DateRange {
    start: Date;
    end: Date;
}

export interface ReportFilters {
    locations: number[];
    departments: number[];
    statuses: string[];
    categories: string[];
}

export interface TrendDataPoint {
    date: string;
    count: number;
    label: string;
}

export interface StatusDistribution {
    status: string;
    count: number;
    percentage: number;
}

export interface LocationStats {
    locationId: number;
    locationName: string;
    incidentCount: number;
    avgSeverity: number;
}

export interface DepartmentStats {
    department: string;
    incidentCount: number;
    qiCompletionRate: number;
    avgInvestigationTime: number;
}

export interface ReportData {
    summary: {
        totalIncidents: number;
        previousPeriodTotal: number;
        avgResolutionTime: number;
        previousResolutionTime: number;
        closureRate: number;
        previousClosureRate: number;
        highSeverityCount: number;
    };
    trends: TrendDataPoint[];
    statusDistribution: StatusDistribution[];
    locationStats: LocationStats[];
    departmentStats: DepartmentStats[];
    alerts: {
        type: string;
        severity: 'info' | 'warning' | 'error';
        message: string;
        value?: number;
    }[];
}

interface UseReportDataParams {
    dateRange: DateRange;
    filters?: ReportFilters;
}

interface UseReportDataReturn {
    data: ReportData | null;
    isLoading: boolean;
    error: string | null;
    mutate: () => void;
}

// Build query string from params
function buildQueryString(params: UseReportDataParams): string {
    const searchParams = new URLSearchParams();

    searchParams.set('startDate', params.dateRange.start.toISOString());
    searchParams.set('endDate', params.dateRange.end.toISOString());

    if (params.filters) {
        if (params.filters.locations.length > 0) {
            searchParams.set('locations', params.filters.locations.join(','));
        }
        if (params.filters.departments.length > 0) {
            searchParams.set('departments', params.filters.departments.join(','));
        }
        if (params.filters.statuses.length > 0) {
            searchParams.set('statuses', params.filters.statuses.join(','));
        }
        if (params.filters.categories.length > 0) {
            searchParams.set('categories', params.filters.categories.join(','));
        }
    }

    return searchParams.toString();
}

// Fetcher function
const fetcher = async (url: string): Promise<ReportData> => {
    const { data, error } = await apiCall<ReportData>(url);
    if (error) throw new Error(typeof error === 'string' ? error : error.message || 'Request failed');
    if (!data) throw new Error('No data returned');
    return data;
};

/**
 * Hook for fetching comprehensive report data
 * Uses SWR for caching and revalidation
 */
export function useReportData({ dateRange, filters }: UseReportDataParams): UseReportDataReturn {
    const queryString = buildQueryString({ dateRange, filters });
    const url = `/api/stats/reports?${queryString}`;

    const { data, error, isLoading, mutate } = useSWR<ReportData>(
        url,
        fetcher,
        {
            // Cache for 5 minutes
            dedupingInterval: 5 * 60 * 1000,
            revalidateOnFocus: false,
            keepPreviousData: true,
            // Return placeholder data while loading
            fallbackData: undefined,
        }
    );

    return {
        data: data ?? null,
        isLoading,
        error: error?.message ?? null,
        mutate,
    };
}

/**
 * Hook for fetching trend data only
 */
export function useIncidentTrends({ dateRange, filters }: UseReportDataParams) {
    const queryString = buildQueryString({ dateRange, filters });
    const url = `/api/stats/reports/trends?${queryString}`;

    const { data, error, isLoading } = useSWR<TrendDataPoint[]>(
        url,
        fetcher as any,
        {
            dedupingInterval: 5 * 60 * 1000,
            revalidateOnFocus: false,
        }
    );

    return {
        trends: data ?? [],
        isLoading,
        error: error?.message ?? null,
    };
}

/**
 * Hook for fetching location comparison data
 */
export function useLocationComparison({ dateRange, filters }: UseReportDataParams) {
    const queryString = buildQueryString({ dateRange, filters });
    const url = `/api/stats/reports/locations?${queryString}`;

    const { data, error, isLoading } = useSWR<LocationStats[]>(
        url,
        fetcher as any,
        {
            dedupingInterval: 5 * 60 * 1000,
            revalidateOnFocus: false,
        }
    );

    return {
        locations: data ?? [],
        isLoading,
        error: error?.message ?? null,
    };
}
