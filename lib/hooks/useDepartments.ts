'use client';

import useSWR from 'swr';
import { apiCall } from '@/lib/client/error-handler';
import type { DepartmentWithLocations } from '@/lib/api/schemas';

interface DepartmentSimple {
    id: number;
    name: string;
    code: string;
}

interface UseDepartmentsReturn {
    departments: DepartmentSimple[];
    isLoading: boolean;
    error: string | null;
    mutate: () => void;
}

interface UseDepartmentsWithLocationsReturn {
    departments: DepartmentWithLocations[];
    isLoading: boolean;
    error: string | null;
    mutate: () => void;
}

const simpleFetcher = async (url: string): Promise<DepartmentSimple[]> => {
    const { data, error } = await apiCall<DepartmentSimple[]>(url);
    if (error) throw new Error(error.message);
    return data!;
};

const fullFetcher = async (url: string): Promise<{ data: DepartmentWithLocations[] }> => {
    const { data, error } = await apiCall<{ data: DepartmentWithLocations[] }>(url);
    if (error) throw new Error(error.message);
    return data!;
};

/**
 * Simple hook to fetch departments for dropdowns
 * Returns minimal department data (id, name, code)
 * @example
 * const { departments, isLoading } = useDepartments();
 */
export function useDepartments(): UseDepartmentsReturn {
    const { data, error, isLoading, mutate } = useSWR<DepartmentSimple[]>(
        '/api/departments?simple=true',
        simpleFetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 300000, // 5 minutes - departments rarely change
            keepPreviousData: true,
        }
    );

    return {
        departments: data || [],
        isLoading,
        error: error?.message || null,
        mutate: () => mutate(),
    };
}

/**
 * Hook to fetch departments with their associated locations
 * Useful for hierarchical dropdowns or management views
 * @example
 * const { departments, isLoading } = useDepartmentsWithLocations();
 */
export function useDepartmentsWithLocations(): UseDepartmentsWithLocationsReturn {
    const { data, error, isLoading, mutate } = useSWR<{ data: DepartmentWithLocations[] }>(
        '/api/departments?includeLocations=true&pageSize=100',
        fullFetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 300000, // 5 minutes
            keepPreviousData: true,
        }
    );

    return {
        departments: data?.data || [],
        isLoading,
        error: error?.message || null,
        mutate: () => mutate(),
    };
}
