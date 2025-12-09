'use client';

import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { apiCall } from '@/lib/client/error-handler';
import type {
    Department,
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentWithLocations,
    PaginationMeta,
} from '@/lib/api/schemas';

interface UseDepartmentManagementParams {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: 'name' | 'code' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    includeLocations?: boolean;
}

interface DepartmentListResponse {
    data: DepartmentWithLocations[];
    pagination: PaginationMeta;
}

interface UseDepartmentManagementReturn {
    departments: DepartmentWithLocations[];
    pagination: PaginationMeta;
    isLoading: boolean;
    error: string | null;
    createDepartment: (input: DepartmentCreate) => Promise<Department>;
    updateDepartment: (id: number, input: DepartmentUpdate) => Promise<Department>;
    deleteDepartment: (id: number) => Promise<void>;
    mutate: () => void;
}

const fetcher = async (url: string): Promise<DepartmentListResponse> => {
    const { data, error } = await apiCall<DepartmentListResponse>(url);
    if (error) throw new Error(error.message);
    return data!;
};

/**
 * Hook for managing departments with full CRUD operations and pagination
 * Includes optimistic updates for better UX
 * @example
 * const { departments, pagination, createDepartment, updateDepartment, deleteDepartment } = useDepartmentManagement({ page: 1 });
 */
export function useDepartmentManagement(
    params: UseDepartmentManagementParams = {}
): UseDepartmentManagementReturn {
    const {
        page = 1,
        pageSize = 10,
        search = '',
        isActive,
        sortBy = 'name',
        sortOrder = 'asc',
        includeLocations = true,
    } = params;

    // Build query string
    const queryParams = useMemo(() => {
        const searchParams = new URLSearchParams();
        searchParams.set('page', page.toString());
        searchParams.set('pageSize', pageSize.toString());
        if (search) searchParams.set('search', search);
        if (isActive !== undefined) searchParams.set('isActive', String(isActive));
        searchParams.set('sortBy', sortBy);
        searchParams.set('sortOrder', sortOrder);
        if (includeLocations) searchParams.set('includeLocations', 'true');
        return searchParams.toString();
    }, [page, pageSize, search, isActive, sortBy, sortOrder, includeLocations]);

    const { data, error, isLoading, mutate } = useSWR<DepartmentListResponse>(
        `/api/departments?${queryParams}`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 5000,
            keepPreviousData: true,
        }
    );

    const createDepartment = useCallback(
        async (input: DepartmentCreate): Promise<Department> => {
            const { data: newDepartment, error } = await apiCall<Department>('/api/departments', {
                method: 'POST',
                body: JSON.stringify(input),
            });

            if (error) throw new Error(error.message);

            // Optimistic update: add new department to the list
            mutate(
                (current) => {
                    if (!current) return current;
                    const newItem: DepartmentWithLocations = {
                        ...newDepartment!,
                        locations: [],
                    };
                    return {
                        ...current,
                        data: [...current.data, newItem].sort((a, b) => a.name.localeCompare(b.name)),
                        pagination: {
                            ...current.pagination,
                            total: current.pagination.total + 1,
                        },
                    };
                },
                { revalidate: true }
            );

            return newDepartment!;
        },
        [mutate]
    );

    const updateDepartment = useCallback(
        async (id: number, input: DepartmentUpdate): Promise<Department> => {
            const { data: updatedDepartment, error } = await apiCall<Department>(
                `/api/departments?id=${id}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(input),
                }
            );

            if (error) throw new Error(error.message);

            // Optimistic update: replace the updated department in the list
            mutate(
                (current) => {
                    if (!current) return current;
                    return {
                        ...current,
                        data: current.data
                            .map((dept) =>
                                dept.id === id ? { ...dept, ...updatedDepartment } : dept
                            )
                            .sort((a, b) => a.name.localeCompare(b.name)),
                    };
                },
                { revalidate: true }
            );

            return updatedDepartment!;
        },
        [mutate]
    );

    const deleteDepartment = useCallback(
        async (id: number): Promise<void> => {
            const { error } = await apiCall<{ success: boolean }>(`/api/departments?id=${id}`, {
                method: 'DELETE',
            });

            if (error) throw new Error(error.message);

            // Optimistic update: remove the deleted department from the list
            mutate(
                (current) => {
                    if (!current) return current;
                    return {
                        ...current,
                        data: current.data.filter((dept) => dept.id !== id),
                        pagination: {
                            ...current.pagination,
                            total: Math.max(0, current.pagination.total - 1),
                        },
                    };
                },
                { revalidate: true }
            );
        },
        [mutate]
    );

    return {
        departments: data?.data || [],
        pagination: data?.pagination || {
            page: 1,
            limit: pageSize,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
        },
        isLoading,
        error: error?.message || null,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        mutate: () => mutate(),
    };
}
