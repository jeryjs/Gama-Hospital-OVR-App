import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
import type { User, UserListQuery, UserListResponse, UserUpdate } from '@/lib/api/schemas';

const fetcher = async (url: string): Promise<UserListResponse> => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch users');
    }
    return res.json();
};

export function useUserManagement(params: Partial<UserListQuery> = {}) {
    const {
        page = 1,
        pageSize = 10,
        search = '',
        role = '',
        isActive,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = params;

    // Build query string
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('pageSize', pageSize.toString());
        if (search) params.set('search', search);
        if (role) params.set('role', role);
        if (isActive !== undefined) params.set('isActive', String(isActive));
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        return params.toString();
    }, [page, pageSize, search, role, isActive, sortBy, sortOrder]);

    const { data, error, isLoading, mutate } = useSWR<UserListResponse>(
        `/api/users?${queryParams}`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 5000,
            suspense: false,
            keepPreviousData: true,
        }
    );

    const updateUser = useCallback(
        async (userId: number, updates: UserUpdate) => {
            try {
                const res = await fetch('/api/users', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, updates }),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Failed to update user');
                }

                // Optimistic update
                mutate(
                    (current) => {
                        if (!current) return current;
                        return {
                            ...current,
                            data: current.data.map((u) =>
                                u.id === userId ? { ...u, ...updates } : u
                            ),
                        };
                    },
                    { revalidate: true }
                );

                return await res.json();
            } catch (error) {
                throw error;
            }
        },
        [mutate]
    );

    return {
        users: data?.data || [],
        pagination: data?.pagination || {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
        },
        isLoading,
        error,
        updateUser,
        refresh: mutate,
    };
}
