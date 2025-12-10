/**
 * @fileoverview People Search Hook
 * 
 * Debounced user search for People Picker component
 * Uses SWR for caching and automatic revalidation
 */

import { apiCall } from '@/lib/client/error-handler';
import type { UserSearchResult } from '@/lib/api/schemas';
import useSWR from 'swr';
import { useMemo, useState, useEffect, useRef } from 'react';

export interface UsePeopleSearchOptions {
    /** Search query string */
    query: string;
    /** Filter by specific roles (e.g., ['qi', 'admin']) */
    filterByRoles?: string[];
    /** Maximum results to return (default: 10) */
    limit?: number;
    /** Debounce delay in ms (default: 300) */
    debounceMs?: number;
    /** Minimum characters before searching (default: 1) */
    minChars?: number;
}

export interface UsePeopleSearchReturn {
    /** Search results */
    users: UserSearchResult[];
    /** Loading state */
    isLoading: boolean;
    /** Error if any */
    error: Error | null;
    /** Debounced query that's currently being searched */
    debouncedQuery: string;
}

/**
 * Hook for searching users with debouncing
 * Optimized for People Picker autocomplete
 * 
 * @example
 * const { users, isLoading } = usePeopleSearch({
 *   query: inputValue,
 *   filterByRoles: ['qi', 'admin'],
 *   limit: 10,
 * });
 */
export function usePeopleSearch(options: UsePeopleSearchOptions): UsePeopleSearchReturn {
    const {
        query,
        filterByRoles,
        limit = 10,
        debounceMs = 300,
        minChars = 1,
    } = options;

    // Debounced query state
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Handle debouncing
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedQuery(query);
        }, debounceMs);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [query, debounceMs]);

    // Build URL with query params
    const url = useMemo(() => {
        // Don't search if query is too short
        if (!debouncedQuery || debouncedQuery.trim().length < minChars) {
            return null;
        }

        const params = new URLSearchParams();
        params.append('q', debouncedQuery.trim());
        params.append('limit', String(limit));

        if (filterByRoles && filterByRoles.length > 0) {
            params.append('roles', filterByRoles.join(','));
        }

        return `/api/users/search?${params.toString()}`;
    }, [debouncedQuery, filterByRoles, limit, minChars]);

    // Fetcher function
    const fetcher = async (url: string): Promise<UserSearchResult[]> => {
        const { data, error } = await apiCall<UserSearchResult[]>(url);

        if (error) {
            throw error;
        }

        return data || [];
    };

    // SWR hook with caching
    const { data, error, isLoading, isValidating } = useSWR(
        url,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000, // 1 minute deduping
            keepPreviousData: true, // Keep showing previous results while loading new
            suspense: false,
        }
    );

    return {
        users: data || [],
        isLoading: isLoading || isValidating,
        error: error || null,
        debouncedQuery,
    };
}
