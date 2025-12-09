/**
 * @fileoverview Investigation Hook - Token-Based Access Support
 * 
 * Supports both authenticated and token-based access for investigators
 * Token is passed via URL param: ?token=abc123
 */

import { apiCall, type ParsedError } from '@/lib/client/error-handler';
import useSWR from 'swr';
import type { UpdateInvestigationInput, SubmitInvestigationInput } from '@/lib/api/schemas';

export interface Investigation {
    id: number;
    ovrReportId: string;
    investigators: string | null; // CSV format
    accessToken: string | null;
    tokenExpiresAt: Date | null;
    findings: string | null;
    problemsIdentified: string | null;
    causeClassification: string | null;
    causeDetails: string | null;
    correctiveActionPlan: string | null;
    rcaAnalysis: string | null;
    fishboneAnalysis: string | null;
    createdBy: number | null;
    createdAt: Date;
    updatedAt: Date;
    submittedAt: Date | null;
}

export interface SharedAccessInfo {
    id: number;
    email: string;
    userId: number | null;
    role: 'investigator' | 'action_handler' | 'viewer';
    status: 'pending' | 'accepted' | 'revoked';
    accessToken: string | null;
    invitedAt: Date;
    lastAccessedAt: Date | null;
}

export interface UseInvestigationReturn {
    investigation: Investigation | null;
    sharedAccess: SharedAccessInfo[];
    isLoading: boolean;
    error: ParsedError | undefined;
    mutate: () => Promise<void>;
    update: (data: UpdateInvestigationInput) => Promise<void>;
    submit: (data: SubmitInvestigationInput) => Promise<void>;
}

/**
 * Hook to fetch and manage investigation
 * Supports token-based access for external investigators
 * 
 * @param id - Investigation ID
 * @param token - Optional access token for non-authenticated access
 * 
 * @example
 * // Authenticated QI user
 * const { investigation, update } = useInvestigation(123);
 * 
 * @example
 * // External investigator with token
 * const { investigation, submit } = useInvestigation(123, token);
 */
export function useInvestigation(
    id: number | null | undefined,
    token?: string | null
): UseInvestigationReturn {
    // Build URL with token if provided
    const url = id
        ? `/api/investigations/${id}${token ? `?token=${token}` : ''}`
        : null;

    // Fetcher function
    const fetcher = async (url: string) => {
        const { data, error } = await apiCall<{
            investigation: Investigation;
            sharedAccess: SharedAccessInfo[];
        }>(url);

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
     * Update investigation (partial updates)
     */
    const update = async (updateData: UpdateInvestigationInput) => {
        if (!id) throw new Error('Investigation ID is required');

        const updateUrl = token
            ? `/api/investigations/${id}?token=${token}`
            : `/api/investigations/${id}`;

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
     * Submit investigation (final submission with validation)
     */
    const submit = async (submitData: SubmitInvestigationInput) => {
        if (!id) throw new Error('Investigation ID is required');

        const submitUrl = token
            ? `/api/investigations/${id}/submit?token=${token}`
            : `/api/investigations/${id}/submit`;

        const { error } = await apiCall(submitUrl, {
            method: 'POST',
            body: submitData,
        });

        if (error) {
            throw error;
        }

        // Revalidate data
        await mutate();
    };

    return {
        investigation: data?.investigation || null,
        sharedAccess: data?.sharedAccess || [],
        isLoading,
        error,
        mutate,
        update,
        submit,
    };
}
