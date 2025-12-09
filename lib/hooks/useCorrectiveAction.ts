/**
 * @fileoverview Corrective Action Hook - Token-Based Access Support
 * 
 * Similar to useInvestigation, supports token-based access for action handlers
 */

import { apiCall, type ParsedError } from '@/lib/client/error-handler';
import useSWR from 'swr';
import type { UpdateCorrectiveActionInput } from '@/lib/api/schemas';

export interface CorrectiveAction {
    id: number;
    ovrReportId: string;
    title: string;
    description: string;
    dueDate: Date;
    status: 'open' | 'closed';
    assignedTo: string | null; // CSV format
    accessToken: string | null;
    tokenExpiresAt: Date | null;
    checklist: string | null; // JSON string
    actionTaken: string | null;
    evidenceFiles: string | null; // JSON string
    createdBy: number | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    closedBy: number | null;
    closedAt: Date | null;
}

export interface UseCorrectiveActionReturn {
    action: CorrectiveAction | null;
    isLoading: boolean;
    error: ParsedError | undefined;
    mutate: () => Promise<void>;
    update: (data: UpdateCorrectiveActionInput) => Promise<void>;
    close: () => Promise<void>;
}

/**
 * Hook to fetch and manage corrective action
 * Supports token-based access for external action handlers
 * 
 * @param id - Action ID
 * @param token - Optional access token for non-authenticated access
 * 
 * @example
 * // Authenticated QI user
 * const { action, close } = useCorrectiveAction(123);
 * 
 * @example
 * // External handler with token
 * const { action, update } = useCorrectiveAction(123, token);
 */
export function useCorrectiveAction(
    id: number | null | undefined,
    token?: string | null
): UseCorrectiveActionReturn {
    // Build URL with token if provided
    const url = id
        ? `/api/corrective-actions/${id}${token ? `?token=${token}` : ''}`
        : null;

    // Fetcher function
    const fetcher = async (url: string) => {
        const { data, error } = await apiCall<CorrectiveAction>(url);

        if (error) {
            throw error;
        }

        return data!;
    };

    const { data, error, mutate, isLoading } = useSWR(url, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
    });

    /**
     * Update action (checklist, actionTaken, evidenceFiles)
     */
    const update = async (updateData: UpdateCorrectiveActionInput) => {
        if (!id) throw new Error('Action ID is required');

        const updateUrl = token
            ? `/api/corrective-actions/${id}?token=${token}`
            : `/api/corrective-actions/${id}`;

        const { error } = await apiCall(updateUrl, {
            method: 'PATCH',
            body: updateData,
        });

        if (error) {
            throw error;
        }

        // Revalidate data
        await mutate();
    };

    /**
     * Close action (QI only)
     */
    const close = async () => {
        if (!id) throw new Error('Action ID is required');

        const { error } = await apiCall(`/api/corrective-actions/${id}/close`, {
            method: 'POST',
        });

        if (error) {
            throw error;
        }

        // Revalidate data
        await mutate();
    };

    return {
        action: data || null,
        isLoading,
        error,
        mutate,
        update,
        close,
    };
}
