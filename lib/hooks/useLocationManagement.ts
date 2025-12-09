'use client';

import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { apiCall } from '@/lib/client/error-handler';
import type { Location, LocationCreate, LocationUpdate } from '@/lib/api/schemas';

interface UseLocationManagementReturn {
    locations: Location[];
    isLoading: boolean;
    error: string | null;
    createLocation: (input: LocationCreate) => Promise<Location>;
    updateLocation: (id: number, input: LocationUpdate) => Promise<Location>;
    deleteLocation: (id: number) => Promise<void>;
    mutate: () => void;
}

const fetcher = async (url: string): Promise<Location[]> => {
    const { data, error } = await apiCall<Location[]>(url);
    if (error) throw new Error(error.message);
    return data!;
};

/**
 * Hook for managing locations with full CRUD operations
 * Includes optimistic updates for better UX
 * @example
 * const { locations, createLocation, updateLocation, deleteLocation } = useLocationManagement();
 */
export function useLocationManagement(): UseLocationManagementReturn {
    const { data, error, isLoading, mutate } = useSWR<Location[]>(
        '/api/locations',
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000, // 1 minute
            keepPreviousData: true,
        }
    );

    const createLocation = useCallback(
        async (input: LocationCreate): Promise<Location> => {
            const { data: newLocation, error } = await apiCall<Location>('/api/locations', {
                method: 'POST',
                body: JSON.stringify(input),
            });

            if (error) throw new Error(error.message);

            // Optimistic update: add new location to the list
            mutate(
                (current) => {
                    if (!current) return [newLocation!];
                    return [...current, newLocation!].sort((a, b) => a.name.localeCompare(b.name));
                },
                { revalidate: true }
            );

            return newLocation!;
        },
        [mutate]
    );

    const updateLocation = useCallback(
        async (id: number, input: LocationUpdate): Promise<Location> => {
            const { data: updatedLocation, error } = await apiCall<Location>(
                `/api/locations?id=${id}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(input),
                }
            );

            if (error) throw new Error(error.message);

            // Optimistic update: replace the updated location in the list
            mutate(
                (current) => {
                    if (!current) return current;
                    return current
                        .map((loc) => (loc.id === id ? { ...loc, ...updatedLocation } : loc))
                        .sort((a, b) => a.name.localeCompare(b.name));
                },
                { revalidate: true }
            );

            return updatedLocation!;
        },
        [mutate]
    );

    const deleteLocation = useCallback(
        async (id: number): Promise<void> => {
            const { error } = await apiCall<{ success: boolean }>(`/api/locations?id=${id}`, {
                method: 'DELETE',
            });

            if (error) throw new Error(error.message);

            // Optimistic update: remove the deleted location from the list
            mutate(
                (current) => {
                    if (!current) return current;
                    return current.filter((loc) => loc.id !== id);
                },
                { revalidate: true }
            );
        },
        [mutate]
    );

    return {
        locations: data || [],
        isLoading,
        error: error?.message || null,
        createLocation,
        updateLocation,
        deleteLocation,
        mutate: () => mutate(),
    };
}
