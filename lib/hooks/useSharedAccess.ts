/**
 * @fileoverview Shared Access Management Hook
 * 
 * For QI staff to manage email-based invitations
 * Google Forms style sharing with token generation
 */

import { apiCall, type ParsedError } from '@/lib/client/error-handler';
import useSWR from 'swr';
import type {
    CreateSharedAccessInput,
    BulkCreateSharedAccessInput,
} from '@/lib/api/schemas';

export interface SharedAccessInvitation {
    id: number;
    resourceType: 'investigation' | 'corrective_action';
    resourceId: number;
    ovrReportId: string;
    email: string;
    userId: number | null;
    role: 'investigator' | 'action_handler' | 'viewer';
    status: 'pending' | 'accepted' | 'revoked';
    accessToken: string;
    tokenExpiresAt: Date | null;
    invitedBy: number;
    invitedAt: Date;
    acceptedAt: Date | null;
    revokedBy: number | null;
    revokedAt: Date | null;
    lastAccessedAt: Date | null;
}

export interface UseSharedAccessReturn {
    invitations: SharedAccessInvitation[];
    isLoading: boolean;
    error: ParsedError | undefined;
    mutate: () => Promise<void>;
    createInvitation: (data: CreateSharedAccessInput) => Promise<{
        invitation: SharedAccessInvitation;
        accessUrl: string;
    }>;
    createBulkInvitations: (data: BulkCreateSharedAccessInput) => Promise<{
        invitations: Array<SharedAccessInvitation & { accessUrl: string }>;
    }>;
    revokeAccess: (accessId: number) => Promise<void>;
}

/**
 * Hook to manage shared access for a resource
 * QI-only functionality for managing invitations
 * 
 * @param resourceType - Type of resource (investigation or corrective_action)
 * @param resourceId - ID of the resource
 * 
 * @example
 * const { createInvitation, invitations, revokeAccess } = useSharedAccess(
 *   'investigation',
 *   123
 * );
 * 
 * // Create single invitation
 * const { accessUrl } = await createInvitation({
 *   resourceType: 'investigation',
 *   resourceId: 123,
 *   ovrReportId: 'OVR-2025-01-001',
 *   email: 'investigator@example.com',
 *   role: 'investigator',
 * });
 * 
 * // Send URL to investigator via email (handled separately)
 */
export function useSharedAccess(
    resourceType: 'investigation' | 'corrective_action' | null,
    resourceId: number | null
): UseSharedAccessReturn {
    // Note: This hook doesn't fetch invitations automatically
    // They're fetched as part of useInvestigation/useCorrectiveAction
    // This is just for the mutation operations

    const { mutate } = useSWR(
        resourceType && resourceId
            ? `/api/shared-access?resourceType=${resourceType}&resourceId=${resourceId}`
            : null,
        null,
        { revalidateOnFocus: false }
    );

    /**
     * Create single invitation
     */
    const createInvitation = async (
        data: CreateSharedAccessInput
    ): Promise<{
        invitation: SharedAccessInvitation;
        accessUrl: string;
    }> => {
        const { data: result, error } = await apiCall<{
            invitation: SharedAccessInvitation;
            accessUrl: string;
        }>('/api/shared-access', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (error) {
            throw error;
        }

        await mutate();
        return result!;
    };

    /**
     * Create bulk invitations
     */
    const createBulkInvitations = async (
        data: BulkCreateSharedAccessInput
    ): Promise<{
        invitations: Array<SharedAccessInvitation & { accessUrl: string }>;
    }> => {
        const { data: result, error } = await apiCall<{
            invitations: Array<SharedAccessInvitation & { accessUrl: string }>;
        }>('/api/shared-access', {
            method: 'PUT',
            body: JSON.stringify(data),
        });

        if (error) {
            throw error;
        }

        await mutate();
        return result!;
    };

    /**
     * Revoke access
     */
    const revokeAccess = async (accessId: number): Promise<void> => {
        const { error } = await apiCall(
            `/api/shared-access?id=${accessId}`,
            {
                method: 'DELETE',
            }
        );

        if (error) {
            throw error;
        }

        await mutate();
    };

    return {
        invitations: [], // Not fetched here, use useInvestigation/useCorrectiveAction
        isLoading: false,
        error: undefined,
        mutate,
        createInvitation,
        createBulkInvitations,
        revokeAccess,
    };
}
