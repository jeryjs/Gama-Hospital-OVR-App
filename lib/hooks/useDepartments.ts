'use client';

import useSWR from 'swr';
import { apiCall } from '@/lib/client/error-handler';
import type { DepartmentWithLocations, LocationForDepartment, LocationCreate, LocationUpdate } from '@/lib/api/schemas';
import { useCallback } from 'react';

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
    // Location CRUD operations
    createLocation: (departmentId: number, data: Omit<LocationCreate, 'departmentId'>) => Promise<LocationForDepartment>;
    updateLocation: (departmentId: number, locationId: number, data: LocationUpdate) => Promise<LocationForDepartment>;
    deleteLocation: (departmentId: number, locationId: number) => Promise<void>;
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
 * Includes CRUD operations for locations within departments
 * @example
 * const { departments, createLocation, updateLocation, deleteLocation } = useDepartmentsWithLocations();
 */
export function useDepartmentsWithLocations(): UseDepartmentsWithLocationsReturn {
    const { data, error, isLoading, mutate } = useSWR<{ data: DepartmentWithLocations[] }>(
        '/api/departments?includeLocations=true&pageSize=100',
        fullFetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000, // 1 minute for management views
            keepPreviousData: true,
        }
    );

    const createLocation = useCallback(
        async (departmentId: number, locationData: Omit<LocationCreate, 'departmentId'>): Promise<LocationForDepartment> => {
            const { data: newLocation, error } = await apiCall<LocationForDepartment>(
                `/api/departments/${departmentId}/locations`,
                {
                    method: 'POST',
                    body: JSON.stringify(locationData),
                }
            );

            if (error) throw new Error(error.message);

            // Optimistic update
            mutate(
                (current) => {
                    if (!current) return current;
                    return {
                        ...current,
                        data: current.data.map(dept =>
                            dept.id === departmentId
                                ? {
                                    ...dept,
                                    locations: [...(dept.locations || []), newLocation!].sort((a, b) =>
                                        (a.displayOrder ?? 999) - (b.displayOrder ?? 999)
                                    ),
                                }
                                : dept
                        ),
                    };
                },
                { revalidate: true }
            );

            return newLocation!;
        },
        [mutate]
    );

    const updateLocation = useCallback(
        async (departmentId: number, locationId: number, updateData: LocationUpdate): Promise<LocationForDepartment> => {
            const { data: updatedLocation, error } = await apiCall<LocationForDepartment>(
                `/api/departments/${departmentId}/locations`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ locationId, ...updateData }),
                }
            );

            if (error) throw new Error(error.message);

            // Optimistic update
            mutate(
                (current) => {
                    if (!current) return current;
                    return {
                        ...current,
                        data: current.data.map(dept =>
                            dept.id === departmentId
                                ? {
                                    ...dept,
                                    locations: (dept.locations || [])
                                        .map(loc => loc.id === locationId ? { ...loc, ...updatedLocation } : loc)
                                        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)),
                                }
                                : dept
                        ),
                    };
                },
                { revalidate: true }
            );

            return updatedLocation!;
        },
        [mutate]
    );

    const deleteLocation = useCallback(
        async (departmentId: number, locationId: number): Promise<void> => {
            const { error } = await apiCall<{ success: boolean }>(
                `/api/departments/${departmentId}/locations?locationId=${locationId}`,
                {
                    method: 'DELETE',
                }
            );

            if (error) throw new Error(error.message);

            // Optimistic update
            mutate(
                (current) => {
                    if (!current) return current;
                    return {
                        ...current,
                        data: current.data.map(dept =>
                            dept.id === departmentId
                                ? {
                                    ...dept,
                                    locations: (dept.locations || []).filter(loc => loc.id !== locationId),
                                }
                                : dept
                        ),
                    };
                },
                { revalidate: true }
            );
        },
        [mutate]
    );

    return {
        departments: data?.data || [],
        isLoading,
        error: error?.message || null,
        mutate: () => mutate(),
        createLocation,
        updateLocation,
        deleteLocation,
    };
}
