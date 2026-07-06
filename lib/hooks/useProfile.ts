import { apiCall } from '@/lib/client/error-handler';
import { secureFetch } from '@/lib/client/csrf';
import { type WorkflowNotificationEvent } from '@/lib/utils/notifications';
import { type AppRole } from '@/lib/constants';
import useSWR from 'swr';

export interface NotificationPreference {
    event: WorkflowNotificationEvent;
    inApp: boolean;
    mail: boolean;
}

export interface ProfileUser {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string | null;
    roles: AppRole[];
    departmentId: number | null;
    unitId: number | null;
    position: string | null;
    emailVerifiedAt: string | null;
    isActive: boolean;
    department: { id: number; name: string } | null;
    unit: { id: number; name: string } | null;
}

export interface ProfileResponse {
    user: ProfileUser;
    notificationPreferences: NotificationPreference[];
}

export interface UseProfileReturn {
    user: ProfileUser | undefined;
    notificationPreferences: NotificationPreference[];
    isLoading: boolean;
    error: unknown;
    updatePreferences: (preferences: NotificationPreference[]) => Promise<void>;
}

const fetcher = async (url: string) => {
    const { data, error } = await apiCall<ProfileResponse>(url);
    if (error) throw error;
    return data!;
};

export function useProfile(): UseProfileReturn {
    const { data, error, isLoading, mutate } = useSWR('/api/me', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 30000,
    });

    const updatePreferences = async (preferences: NotificationPreference[]) => {
        // Optimistic update — revalidate: false prevents immediate re-fetch
        if (data) {
            const merged = [...data.notificationPreferences];
            for (const pref of preferences) {
                const idx = merged.findIndex((p) => p.event === pref.event);
                if (idx >= 0) merged[idx] = pref;
                else merged.push(pref);
            }
            await mutate({ ...data, notificationPreferences: merged }, { revalidate: false });
        }

        const response = await secureFetch('/api/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferences }),
        });

        if (!response.ok) {
            await mutate(); // revert on failure
            throw new Error('Failed to update notification preferences');
        }

        await mutate();
    };

    return {
        user: data?.user,
        notificationPreferences: data?.notificationPreferences ?? [],
        isLoading,
        error,
        updatePreferences,
    };
}
